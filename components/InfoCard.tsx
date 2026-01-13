
import React, { useMemo } from 'react';
import { ClientData } from '../types';

interface InfoCardProps {
  clientData: ClientData | null;
  visibleFields: string[];
  isLoading: boolean;
}

// Utility to parse Russian date format DD.MM.YYYY
const parseDate = (dateString: string): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts.map(p => parseInt(p, 10));
    // JavaScript months are 0-indexed
    return new Date(year, month - 1, day);
  }
  return null;
};

// Clean Section Component (No background, just structure)
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = "" }) => (
  <div className={`mb-6 last:mb-0 ${className}`}>
    <div className="flex items-center mb-3 pl-0.5">
      <div className="mr-2 text-tg-link opacity-80 scale-90">{icon}</div>
      <h3 className="text-xs font-bold text-tg-hint uppercase tracking-wider">{title}</h3>
    </div>
    <div className="pl-0.5">{children}</div>
  </div>
);

const Divider = () => (
    <hr className="my-5 border-tg-hint/10" />
);

const InfoCardSkeleton: React.FC = () => (
  <div className="bg-tg-secondary-bg rounded-lg shadow-lg p-4 sm:p-6 animate-pulse">
     <div className="space-y-6">
        {/* Tire Section */}
        <div>
            <div className="flex items-center mb-3">
                 <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
                 <div className="w-32 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-xl mb-2"></div>
        </div>

        {/* Dates Section */}
        <div>
             <div className="flex items-center mb-3">
                 <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
                 <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-4"></div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="space-y-3">
                <div className="w-20 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
        </div>
     </div>
  </div>
);

const getStatusStyling = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'активен':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'завершен':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        case 'просрочен':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'ожидает обработки':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        default:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    }
};

const StatusBadge: React.FC<{ status?: string | null; isCompact?: boolean }> = ({ status, isCompact }) => {
    if (!status) return null;
    return (
        <span className={`inline-block font-medium rounded-md ${getStatusStyling(status)} px-2 py-0.5 text-xs`}>
            {status}
        </span>
    );
};

// --- TIRE LOGIC ---

interface TireSet {
  brand: string;
  model: string; 
  size: string;
  count: string;
  season: string;
  disks: string;
  dot: string;
}

const parseTireData = (clientData: ClientData): TireSet[] => {
    const split = (str: string) => str ? str.split('\n').map(s => s.trim()).filter(s => s !== '') : [];

    const rawBrands = split(clientData['Бренд_Модель']);
    const rawSizes = split(clientData['Размер шин']);
    const rawCounts = split(clientData['Кол-во шин']);
    
    // Clean DOT codes: Remove enumeration prefixes like "#1", "№1", "1.", "1)"
    const rawDots = split(clientData['DOT CODE']).map(dot => {
         return dot.replace(/^(?:[#№]\d+|\d+[\.\)])\s*/, '');
    });

    const rawSeasons = split(clientData['Сезон']);
    const rawDisks = split(clientData['Наличие дисков']);

    const maxSets = Math.max(rawBrands.length, rawSizes.length);
    const effectiveSets = maxSets > 0 ? maxSets : 1;

    const sets: TireSet[] = [];

    const parsePrefix = (str: string) => {
        const match = str.match(/^(\d+)\s*(?:x|х|шт|\*)\s+(.*)$/i);
        if (match) {
            return { count: match[1], text: match[2] };
        }
        return { count: null, text: str };
    };

    for (let i = 0; i < effectiveSets; i++) {
        let brandStr = rawBrands[i] || rawBrands[0] || '';
        let sizeStr = rawSizes[i] || rawSizes[0] || '';
        let seasonStr = rawSeasons[i] || rawSeasons[0] || '';
        let diskStr = rawDisks[i] || rawDisks[0] || '';

        const brandParsed = parsePrefix(brandStr);
        const sizeParsed = parsePrefix(sizeStr);

        let count = '0';
        if (brandParsed.count) {
            count = brandParsed.count;
        } else if (sizeParsed.count) {
            count = sizeParsed.count;
        } else if (rawCounts[i]) {
             count = rawCounts[i];
        } else if (rawCounts.length === 1 && !isNaN(parseInt(rawCounts[0]))) {
             const total = parseInt(rawCounts[0]);
             count = String(Math.floor(total / effectiveSets));
        } else {
             count = rawCounts[0] || '?';
        }

        let dotStr = '';
        if (rawDots.length > 0) {
            if (effectiveSets === 1) {
                dotStr = rawDots.join(', ');
            } else {
                const dotsPerSet = Math.ceil(rawDots.length / effectiveSets);
                const startIdx = i * dotsPerSet;
                const endIdx = startIdx + dotsPerSet;
                dotStr = rawDots.slice(startIdx, endIdx).join(', ');
            }
        }

        sets.push({
            brand: brandParsed.text,
            model: '',
            size: sizeParsed.text,
            count: count.replace(/\D/g, ''),
            season: seasonStr,
            disks: diskStr,
            dot: dotStr,
        });
    }
    return sets;
};

// Redesigned TireCard to sit on white background
const TireCard: React.FC<{ data: TireSet }> = ({ data }) => {
    const hasDisks = data.disks && (data.disks.toLowerCase().includes('с дисками') || data.disks.toLowerCase().includes('да') || data.disks.toLowerCase().includes('есть'));
    
    return (
        <div className="group relative bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl p-3 mb-3 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
            {/* Top Row: Count | Size | Badges */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                <div className="flex items-baseline text-tg-text">
                    <span className="font-bold text-lg">{data.count || '-'}</span>
                    <span className="text-xs font-medium ml-0.5 text-tg-hint">шт</span>
                </div>
                
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-lg text-tg-link tracking-tight">{data.size || 'Размер не указан'}</span>
                    
                    <div className="flex gap-1.5">
                        {data.season && (
                            <span className="px-1.5 py-[2px] rounded-md bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-[10px] font-bold uppercase tracking-wide">
                                {data.season}
                            </span>
                        )}
                        
                        {hasDisks && (
                            <span className="px-1.5 py-[2px] rounded-md bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide">
                                Диски
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Row: Brand */}
            <div className="mb-2">
                <span className="font-medium text-tg-text text-[15px] leading-snug block">
                    {data.brand || 'Модель не указана'}
                </span>
            </div>

            {/* Bottom Row: DOT */}
            {data.dot && (
                <div className="text-xs text-tg-hint font-mono mt-1 pt-2 border-t border-gray-100 dark:border-gray-700/30 break-words flex items-center">
                    <span className="opacity-50 mr-1">DOT:</span> {data.dot}
                </div>
            )}
        </div>
    );
};


const InfoCard: React.FC<InfoCardProps> = ({ clientData, visibleFields, isLoading }) => {
  if (isLoading) {
    return <InfoCardSkeleton />;
  }

  if (!clientData) {
    return null; 
  }
  
  const visibleSet = new Set(visibleFields);
  const isFieldVisible = (field: string) => visibleSet.has(field);

  const tireSets = useMemo(() => parseTireData(clientData), [clientData]);

  const isMainInfoVisible = isFieldVisible('Бренд_Модель') || isFieldVisible('Кол-во шин') || isFieldVisible('Наличие дисков') || isFieldVisible('Размер шин') || isFieldVisible('DOT CODE');
  const isTimingVisible = (isFieldVisible('Начало') && isFieldVisible('Окончание')) || isFieldVisible('Напомнить') || isFieldVisible('Срок');
  const isFinanceVisible = isFieldVisible('Общая сумма') || isFieldVisible('Долг') || isFieldVisible('Цена за месяц');
  const isStorageOrDetailsVisible = isFieldVisible('Склад хранения') || isFieldVisible('Ячейка') || isFieldVisible('Договор') || isFieldVisible('Статус сделки') || isFieldVisible('Источник трафика');


  // Clean text item without box
  const InfoItem: React.FC<{ label: string; fieldKey?: string; value?: string | null }> = ({ label, fieldKey, value }) => {
    const keyToCheck = fieldKey || label;
    if (!value || !isFieldVisible(keyToCheck)) return null;

    return (
      <div className="mb-3 last:mb-0">
        <p className="text-xs text-tg-hint mb-0.5 leading-none">{label}</p>
        <p className="text-sm font-medium text-tg-text leading-tight">{value}</p>
      </div>
    );
  };
  
  const FinancialItem: React.FC<{ label: string; fieldKey?: string; value?: string | null; isDebt?: boolean }> = ({ label, fieldKey, value, isDebt = false }) => {
      const keyToCheck = fieldKey || label;
      if (!value || !isFieldVisible(keyToCheck)) return null;
      
      const isValuePositive = parseFloat(value.replace(/\s/g, '')) > 0;
      const valueClass = isDebt && isValuePositive ? `text-red-500 font-bold` : `text-tg-text`;

      return (
          <div className="mb-3 last:mb-0">
              <p className="text-xs text-tg-hint mb-0.5 leading-none">{label}</p>
              <p className={`text-base font-medium leading-tight ${valueClass}`}>{value}</p>
          </div>
      )
  }

  const ProgressBar: React.FC<{ start?: string; end?: string }> = ({ start, end }) => {
    if (!start || !end || !isFieldVisible('Начало') || !isFieldVisible('Окончание')) return null;

    const startDate = parseDate(start);
    const endDate = parseDate(end);
    const today = new Date();
    
    if (!startDate || !endDate || endDate < startDate) return null;

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();
    
    let progress = (elapsedDuration / totalDuration) * 100;
    progress = Math.max(0, Math.min(100, progress));

    return (
      <div className="mb-4">
        <div className="flex justify-between text-xs text-tg-hint mb-1.5 font-medium">
          <span>{start}</span>
          <span>{end}</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-full h-1.5">
          <div className="bg-tg-link h-1.5 rounded-full shadow-sm" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-tg-secondary-bg rounded-xl shadow-sm border border-tg-hint/10 p-5 sm:p-6">
      
        {isMainInfoVisible && (
            <Section title="Комплект шин" icon={<CarIcon />}>
                <div className="pt-1">
                   {tireSets.map((set, index) => (
                       <TireCard key={index} data={set} />
                   ))}
                </div>
            </Section>
        )}

        {(isMainInfoVisible && isTimingVisible) && <Divider />}
        
        {isTimingVisible && (
            <Section title="Сроки хранения" icon={<CalendarIcon />}>
                <ProgressBar start={clientData['Начало']} end={clientData['Окончание']} />
                <div className="flex gap-8">
                    <InfoItem label="Срок" value={clientData['Срок']} />
                    <InfoItem label="Напомнить" value={clientData['Напомнить']} />
                </div>
            </Section>
        )}

        {(isFinanceVisible || isStorageOrDetailsVisible) && <Divider />}

        {/* Bottom Grid: Finance | Storage */}
        <div className="grid grid-cols-2 gap-6">
            
            {isFinanceVisible && (
                <div>
                     <div className="flex items-center mb-3 pl-0.5">
                        <div className="mr-2 text-tg-link opacity-80 scale-90"><WalletIcon /></div>
                        <h3 className="text-xs font-bold text-tg-hint uppercase tracking-wider">Финансы</h3>
                    </div>
                    <div className="pl-0.5 space-y-3">
                        <FinancialItem label="Общая сумма" value={clientData['Общая сумма']} />
                        <FinancialItem label="В месяц" fieldKey="Цена за месяц" value={clientData['Цена за месяц']} />
                        <FinancialItem label="Долг" value={clientData['Долг']} isDebt />
                    </div>
                </div>
            )}

            {isStorageOrDetailsVisible && (
                <div>
                    <div className="flex items-center mb-3 pl-0.5">
                        <div className="mr-2 text-tg-link opacity-80 scale-90"><LocationIcon /></div>
                        <h3 className="text-xs font-bold text-tg-hint uppercase tracking-wider">Хранение</h3>
                    </div>
                    <div className="pl-0.5 space-y-3">
                         {isFieldVisible('Статус сделки') && clientData['Статус сделки'] && (
                             <div className="mb-3">
                                 <p className="text-xs text-tg-hint mb-1 leading-none">Статус</p>
                                 <StatusBadge status={clientData['Статус сделки']} />
                             </div>
                         )}
                         <InfoItem label="Склад" fieldKey="Склад хранения" value={clientData['Склад хранения']} />
                         <InfoItem label="Ячейка" value={clientData['Ячейка']} />
                         <InfoItem label="Договор" value={clientData['Договор']} />
                         <InfoItem label="Трафик" fieldKey="Источник трафика" value={clientData['Источник трафика']} />
                    </div>
                </div>
            )}
        </div>
        
    </div>
  );
};

// SVG Icons
const CarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17H6.516a1 1 0 01-.985-.826l-1.6-6.4a1 1 0 01.986-1.174h13.168a1 1 0 01.986 1.174l-1.6 6.4a1 1 0 01-.986.826H13m-2-5h2m-2-4h2" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);
const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default InfoCard;
