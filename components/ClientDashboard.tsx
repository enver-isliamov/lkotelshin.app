
import React, { useState, useMemo } from 'react';
import { ClientData, OrderHistory } from '../types';
import InfoCard from './InfoCard';
import HistoryTable from './HistoryTable';
import { BOT_USERNAME, SUPPORT_URL } from '../constants';

interface ClientDashboardProps {
  clientData: ClientData | null;
  orderHistory: OrderHistory[];
  visibleFields: string[];
  isLoading: boolean;
  isDemo?: boolean;
  onBack?: () => void;
}

const HeaderSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-4 mb-6">
        {/* Title and Badge */}
        <div className="flex justify-between items-start gap-4">
            <div className="h-7 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        </div>
        
        {/* Info Box */}
        <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-sm border border-tg-hint/10 space-y-3">
            <div className="flex justify-between items-center">
                 <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                 <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
            <div className="space-y-2 pt-1">
                 <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                 <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
        </div>
    </div>
);

const LicensePlateWidget: React.FC<{ value: string }> = ({ value }) => {
  // Normalize value: remove spaces, special chars, keep alphanumeric
  const cleanValue = value.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').toUpperCase();
  
  // Standard Russian format: X 000 XX 00(0)
  const regex = /^([A-ZА-Я])(\d{3})([A-ZА-Я]{2})(\d{2,3})$/;
  const match = cleanValue.match(regex);

  if (match) {
    const [_, char1, nums, char2, region] = match;
    return (
      <div className="inline-flex items-stretch bg-white text-black border border-black rounded-[4px] shadow-sm select-none overflow-hidden h-[24px] font-sans mx-1">
        {/* Left Section: Num & Letters */}
        <div className="flex items-baseline px-1.5 gap-0.5 self-center">
           <span className="text-[11px] font-bold leading-none">{char1}</span>
           <span className="text-[18px] font-bold leading-none tracking-widest">{nums}</span>
           <span className="text-[11px] font-bold leading-none">{char2}</span>
        </div>
        
        {/* Vertical Divider */}
        <div className="w-px bg-black h-full"></div>
        
        {/* Right Section: Region & Flag */}
        <div className="flex flex-col items-center justify-between w-8 py-[2px]">
             <span className="text-[10px] font-bold leading-none -mt-px">{region}</span>
             <div className="flex items-center gap-[1px] mt-auto">
                <span className="text-[6px] font-bold leading-none">RUS</span>
                {/* Flag - simplified for better small-scale rendering */}
                <div className="border border-gray-300 flex flex-col h-[5px] w-[9px]">
                    <div className="flex-1 bg-white"></div>
                    <div className="flex-1 bg-blue-700"></div>
                    <div className="flex-1 bg-red-600"></div>
                </div>
             </div>
        </div>
      </div>
    );
  }

  // Fallback for non-standard numbers
  return (
      <div className="inline-block px-2 py-0.5 bg-white border border-black rounded-[4px] text-black font-bold text-sm shadow-sm whitespace-nowrap">
        {value}
      </div>
  );
};

const CompactFooterButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    colorClass: string;
}> = ({ icon, label, onClick, colorClass }) => (
    <button
        onClick={onClick}
        className="bg-tg-secondary-bg p-3 rounded-xl shadow-sm border border-tg-hint/10 flex flex-col items-center justify-center gap-2 active:scale-[0.96] transition-all hover:bg-tg-bg min-h-[80px]"
    >
        <div className={`p-2 rounded-full bg-opacity-20 ${colorClass.split(' ')[0].replace('text-', 'bg-')} ${colorClass}`}>
            {icon}
        </div>
        <span className="font-semibold text-xs text-tg-text leading-tight">{label}</span>
    </button>
);


const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientData, orderHistory, isDemo, onBack, visibleFields, isLoading }) => {
  const [showArchive, setShowArchive] = useState(false);
  const visibleSet = useMemo(() => new Set(visibleFields), [visibleFields]);

  const isHeaderInfoVisible = useMemo(() => {
    if (!clientData) return false;
    const fieldsToCheck = ['Телефон', 'Номер Авто', 'Адрес клиента', 'Chat ID'];
    const hasVisibleFields = fieldsToCheck.some(field => visibleSet.has(field) && clientData[field]);
    const hasPendingStatus = clientData['Статус сделки'] === 'Ожидает обработки';
    return hasVisibleFields || hasPendingStatus;
  }, [clientData, visibleSet]);
  
  const handleInvite = () => {
    // Generates a deep link to the bot with a referral parameter
    const botLink = `https://t.me/${BOT_USERNAME}?start=ref`;
    const text = "Рекомендую Отель Шин! Удобное хранение шин и запись на шиномонтаж.";
    // t.me/share/url allows the user to pick a friend to forward this message to
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botLink)}&text=${encodeURIComponent(text)}`;
    
    const tg = window.Telegram?.WebApp;
    if (tg && tg.openTelegramLink) {
        tg.openTelegramLink(shareUrl);
    } else {
        window.open(shareUrl, '_blank');
    }
  };

  const handleOpenSupport = () => {
      const tg = window.Telegram?.WebApp;
      if (tg && tg.openTelegramLink) {
          tg.openTelegramLink(SUPPORT_URL);
      } else {
          window.open(SUPPORT_URL, '_blank');
      }
  };

  if (!isLoading && !clientData) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-center">
        <div className="bg-tg-secondary-bg p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-bold mb-2">Добро пожаловать!</h2>
          <p className="text-tg-hint">Ваши данные не найдены. Если вы уверены, что являетесь клиентом, пожалуйста, свяжитесь с поддержкой.</p>
        </div>
      </div>
    );
  }

  // Back handler: Close archive if open, otherwise trigger parent onBack (for Admin view)
  const handleBack = () => {
      if (showArchive) {
          setShowArchive(false);
      } else if (onBack) {
          onBack();
      }
  };

  const showBackButton = showArchive || onBack;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-8">
        {/* Navigation Bar */}
        {showBackButton && (
         <button onClick={handleBack} className="flex items-center text-tg-link font-semibold transition-opacity hover:opacity-80 -mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {showArchive ? 'Назад к заказу' : 'Назад к списку'}
        </button>
      )}

      {/* Header Info (Always visible unless in Archive mode and explicit design choice, but here we keep it) */}
      {isLoading ? <HeaderSkeleton /> : clientData && !showArchive && (
          <>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 pt-1">
                    <h1 className="text-2xl font-bold break-words leading-tight">{clientData['Имя клиента']}</h1>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                    {isDemo && (
                        <div className="bg-tg-secondary-bg border border-tg-hint/20 px-2 py-1 rounded-md flex items-center text-xs text-tg-hint font-medium" role="alert">
                          <span>Демо режим</span>
                        </div>
                    )}
                </div>
            </div>

            {isHeaderInfoVisible && (
              <div className="bg-tg-secondary-bg p-4 rounded-xl shadow-sm border border-tg-hint/10 flex flex-col gap-3">
                  {/* Top Row: Phone and Plate */}
                  <div className="flex flex-wrap justify-between items-center gap-2">
                      {visibleSet.has('Телефон') && clientData['Телефон'] ? (
                          <a href={`tel:${clientData['Телефон'].replace(/[^\d+]/g, '')}`} className="flex items-center gap-3 text-tg-text hover:text-tg-link transition-colors group">
                                <div className="p-2 bg-tg-button/10 rounded-full text-tg-button group-hover:scale-110 transition-transform">
                                    <PhoneIcon className="w-4 h-4" />
                                </div>
                                <span className="font-bold text-lg leading-none">{clientData['Телефон']}</span>
                          </a>
                      ) : (
                          <div></div> // Spacer if phone is hidden
                      )}

                      {visibleSet.has('Номер Авто') && clientData['Номер Авто'] && (
                          <LicensePlateWidget value={clientData['Номер Авто']} />
                      )}
                  </div>
                  
                  {/* Bottom Row: Address, Status, Chat ID */}
                  {(visibleSet.has('Адрес клиента') || visibleSet.has('Chat ID') || clientData['Статус сделки'] === 'Ожидает обработки') && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-tg-hint/10">
                           {visibleSet.has('Адрес клиента') && clientData['Адрес клиента'] && (
                                <div className="flex items-start gap-2 text-tg-hint text-sm">
                                    <HomeIcon className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-70" />
                                    <span className="leading-snug">{clientData['Адрес клиента']}</span>
                                </div>
                           )}

                           {visibleSet.has('Chat ID') && clientData['Chat ID'] && (
                                <div className="flex items-center gap-2 text-tg-hint text-xs font-mono opacity-70" title="Telegram Chat ID">
                                    <span className="bg-tg-hint/10 px-1.5 py-0.5 rounded">ID: {clientData['Chat ID']}</span>
                                </div>
                           )}
                           
                           {clientData['Статус сделки'] === 'Ожидает обработки' && (
                                <div className="flex items-center gap-2 text-xs self-start bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-md dark:bg-yellow-900/50 dark:text-yellow-200 mt-1">
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    <span className="font-medium">Ожидает обработки</span>
                                </div>
                           )}
                      </div>
                  )}
              </div>
            )}
        </>
      )}

      <main className="min-h-[200px]">
        {showArchive ? (
             <div className="animate-fade-in">
                 <h2 className="text-xl font-bold mb-4 px-1">История заказов</h2>
                 <HistoryTable history={orderHistory} isLoading={isLoading} />
             </div>
        ) : (
            <div className="animate-fade-in">
                <InfoCard clientData={clientData} visibleFields={visibleFields} isLoading={isLoading} />
            </div>
        )}
      </main>

       {/* Footer Actions */}
       {!isLoading && clientData && !showArchive && (
        <div className="pt-4 space-y-3">
             {/* Unified Row for History and Invite */}
             <div className="grid grid-cols-2 gap-3">
                 <CompactFooterButton 
                    label="История"
                    icon={<ClockIcon className="w-6 h-6" />}
                    onClick={() => setShowArchive(true)}
                    colorClass="text-purple-600 dark:text-purple-400"
                 />
                 <CompactFooterButton 
                    label="Пригласить"
                    icon={<ShareIcon className="w-6 h-6" />}
                    onClick={handleInvite}
                    colorClass="text-green-600 dark:text-green-400"
                 />
             </div>

             {/* Care Service - Large styled button */}
             <button 
                onClick={handleOpenSupport}
                className="w-full bg-tg-secondary-bg p-3 rounded-xl shadow-sm border border-tg-hint/10 flex items-center gap-4 active:scale-[0.98] transition-transform hover:bg-tg-bg"
             >
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-full dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
                    <HeadsetIcon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <span className="font-bold text-tg-text text-sm">Служба заботы</span>
                    <span className="text-xs text-tg-hint truncate w-full">Написать в чат поддержки</span>
                </div>
                 <div className="text-tg-hint/30 pr-1">
                    <ChevronRightIcon className="w-5 h-5" />
                 </div>
             </button>
        </div>
       )}
    </div>
  );
};

// Validated Icons
const PhoneIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
);
const HomeIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
);
const StatusIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const HeadsetIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.25 2.25h3.5a8.25 8.25 0 018.25 8.25v2.25a6 6 0 01-6 6v-4.5a2.25 2.25 0 00-2.25-2.25H12a2.25 2.25 0 00-2.25 2.25v4.5a6 6 0 01-6-6v-2.25a8.25 8.25 0 018.25-8.25zM12.75 14.25v6.75m-1.5-6.75v6.75" />
    </svg>
);
const ShareIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
);
const ClockIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const ChevronRightIcon = ({className = "w-6 h-6"}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
);


export default ClientDashboard;
