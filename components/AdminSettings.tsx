
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ClientData, MessageTemplate } from '../types';
import { ADMIN_CHAT_ID, DEMO_CHAT_ID } from '../constants';
import { sendMessageFromBot, fetchAllSheetData } from '../services/googleSheetService';

interface AdminSettingsProps {
  allClients: ClientData[];
  webBaseColumns: string[];
  onClientSelect: (client: ClientData) => void;
  initialVisibleFields: string[];
  onConfigSave: (fields: string[]) => Promise<void>;
  isLoading: boolean;
}

const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'активен':
            return 'bg-green-500';
        case 'завершен':
            return 'bg-gray-400';
        case 'просрочен':
            return 'bg-red-500';
        default:
            return 'bg-yellow-400';
    }
}

// --- Icons ---
const PhoneIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);
const ChatIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
     </svg>
);
const SlidersIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5M3.75 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M16.5 12h2.25" />
    </svg>
);
const XMarkIcon: React.FC<{className?: string}> = ({className = "h-6 w-6"}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// --- Constants ---
const PREDEFINED_GROUPS: Record<string, string[]> = {
  "Контакты": ["Имя клиента", "Телефон", "Номер Авто", "Адрес клиента", "Chat ID"],
  "Заказ": ["Бренд_Модель", "Размер шин", "Кол-во шин", "Наличие дисков", "Сезон", "DOT CODE"],
  "Сроки": ["Начало", "Окончание", "Срок", "Напомнить"],
  "Хранение": ["Склад хранения", "Ячейка"],
  "Финансы": ["Цена за месяц", "Общая сумма", "Долг"],
  "Сделка": ["Договор", "Статус сделки", "Источник трафика"],
};

// --- Sub-components ---

const SendMessageModal: React.FC<{client: ClientData; templates: MessageTemplate[]; onClose: () => void}> = ({ client, templates, onClose }) => {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!text.trim()) return;
        setStatus('sending');
        setError('');
        try {
            await sendMessageFromBot(client['Chat ID'], text);
            setStatus('sent');
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (e) {
            setStatus('error');
            setError(e instanceof Error ? e.message : 'Неизвестная ошибка');
        }
    };

    const replacePlaceholders = (template: string, clientData: ClientData) => {
        return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            // Try to find the key in client data
            return clientData[trimmedKey] || match;
        });
    };

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIndex = e.target.selectedIndex;
        if (selectedIndex > 0) { // 0 is "Select template..."
            const template = templates[selectedIndex - 1];
            // Use 'text' key as per standardized interface
            const processedText = replacePlaceholders(template.text, client);
            setText(processedText);
        }
    };
    
    const getButtonText = () => {
        switch (status) {
            case 'sending': return 'Отправка...';
            case 'sent': return '✓ Отправлено!';
            case 'error': return 'Ошибка. Повторить';
            default: return 'Отправить';
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-tg-secondary-bg rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative transform transition-all scale-100 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <div>
                         <h3 className="text-lg font-bold">Сообщение</h3>
                         <p className="text-tg-hint text-sm truncate max-w-[200px] sm:max-w-md">Кому: <span className="text-tg-text font-medium">{client['Имя клиента']}</span></p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-tg-hint hover:text-tg-text transition-colors p-1"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="overflow-y-auto pr-1 custom-scrollbar">
                    {templates.length > 0 && (
                        <div className="mb-4">
                             <label className="block text-xs font-bold text-tg-hint uppercase mb-1.5">Шаблон</label>
                             <select
                                onChange={handleTemplateChange}
                                className="w-full p-2.5 text-sm border border-tg-hint/20 rounded-xl bg-tg-bg text-tg-text focus:outline-none focus:ring-2 focus:ring-tg-link appearance-none cursor-pointer"
                            >
                                <option value="">-- Выберите шаблон --</option>
                                {templates.map((tpl, index) => (
                                    <option key={index} value={tpl.title}>
                                        {tpl.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <label className="block text-xs font-bold text-tg-hint uppercase mb-1.5">Редактор (HTML)</label>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Введите текст сообщения или выберите шаблон..."
                            rows={6}
                            className="w-full p-3 border border-tg-hint/20 rounded-xl bg-tg-bg focus:outline-none focus:ring-2 focus:ring-tg-link text-sm font-mono leading-relaxed resize-none"
                            disabled={status === 'sending' || status === 'sent'}
                        />
                    </div>

                    {text && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-tg-hint uppercase mb-1.5">Предпросмотр</label>
                            <div 
                                className="p-4 border border-tg-hint/10 rounded-xl bg-tg-bg/50 text-tg-text text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert break-words"
                                // Safety: We are previewing what admin typed. Admin is trusted. 
                                // In production with untrusted input, sanitize this.
                                dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }}
                            />
                        </div>
                    )}
                
                    {error && <p className="text-red-500 text-xs mb-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
                </div>
                
                <div className="mt-4 pt-4 border-t border-tg-hint/10">
                    <button 
                        onClick={handleSend}
                        disabled={!text.trim() || status === 'sending' || status === 'sent'}
                        className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-300 disabled:opacity-60
                            ${status === 'sent' ? 'bg-green-500 text-white' : 'bg-tg-button text-tg-button-text hover:brightness-110 active:scale-[0.98]'}`}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
};

const FieldToggle: React.FC<{ field: string; isVisible: boolean; onToggle: (field: string) => void }> = ({ field, isVisible, onToggle }) => (
    <div
      onClick={() => onToggle(field)}
      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-tg-bg active:scale-[0.99] border border-transparent hover:border-tg-hint/10"
    >
      <span className="font-medium text-tg-text select-none text-sm">{field}</span>
      <div className={`w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out ${isVisible ? 'bg-tg-link' : 'bg-gray-200 dark:bg-gray-600'}`}>
         <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ease-in-out ${isVisible ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
    </div>
);


const AdminSettings: React.FC<AdminSettingsProps> = ({ allClients, webBaseColumns, onClientSelect, initialVisibleFields, onConfigSave, isLoading }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(initialVisibleFields));
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto-save logic states
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messagingClient, setMessagingClient] = useState<ClientData | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
        try {
            // Using 'Шаблоны сообщений' as per request, normalized in service
            const data = await fetchAllSheetData<MessageTemplate>('Шаблоны сообщений', ADMIN_CHAT_ID);
            const validTemplates = data.filter(t => t.title && t.text);
            setTemplates(validTemplates);
        } catch (e) {
            console.error("Failed to load message templates:", e);
        }
    };
    loadTemplates();
  }, []);

  // Discover all dynamic columns from actual data + hardcoded defaults
  const allAvailableColumns = useMemo(() => {
      const distinctFields = new Set<string>(webBaseColumns);
      // Scan the first few clients (or all) to find extra columns not in webBaseColumns
      allClients.forEach(client => {
          Object.keys(client).forEach(key => distinctFields.add(key));
      });
      return Array.from(distinctFields);
  }, [allClients, webBaseColumns]);

  // Group fields dynamically
  const groupedFields = useMemo(() => {
      const groups: Record<string, string[]> = JSON.parse(JSON.stringify(PREDEFINED_GROUPS));
      const usedFields = new Set<string>();
      
      // Mark predefined fields as used
      Object.values(groups).flat().forEach(f => usedFields.add(f));

      const leftoverFields = allAvailableColumns.filter(f => !usedFields.has(f));
      
      if (leftoverFields.length > 0) {
          groups["Дополнительно"] = leftoverFields;
      }
      
      // Remove empty groups
      return Object.entries(groups).filter(([_, fields]) => fields.some(f => allAvailableColumns.includes(f)));
  }, [allAvailableColumns]);


  useEffect(() => {
    setVisibleFields(new Set(initialVisibleFields));
  }, [initialVisibleFields]);

  const groupedAndFilteredClients = useMemo(() => {
    const filtered = allClients.filter(client => 
      client['Имя клиента'] && client['Имя клиента'].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped: { [key: string]: ClientData[] } = {};
    
    filtered
      .sort((a, b) => (a['Имя клиента'] || '').localeCompare(b['Имя клиента'] || ''))
      .forEach(client => {
        const firstLetter = (client['Имя клиента'] || '#')[0].toUpperCase();
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(client);
      });

    return grouped;
  }, [allClients, searchTerm]);

  const handleToggle = (field: string) => {
    // 1. Optimistic UI update
    const newSet = new Set(visibleFields);
    if (newSet.has(field)) {
      newSet.delete(field);
    } else {
      newSet.add(field);
    }
    setVisibleFields(newSet);
    
    // 2. Background Save with Debounce
    setIsSaving(true);
    
    if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
    }

    // Wait 1.5 seconds after the last click before sending to server
    saveTimeoutRef.current = setTimeout(async () => {
        try {
            await onConfigSave(Array.from(newSet));
        } catch (e) {
            console.error("Failed to auto-save config:", e);
        } finally {
            setIsSaving(false);
        }
    }, 1500);
  };
  
  const getInitials = (name: string = '') => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  const handleOpenMessageModal = (client: ClientData) => {
    if (!client['Chat ID'] || client['Chat ID'] === DEMO_CHAT_ID) {
      alert('Нет Chat ID.');
      return;
    }
    setMessagingClient(client);
  };

  const ListSkeleton = () => (
    <div className="animate-pulse space-y-4 pt-2">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
            </div>
        ))}
    </div>
  );

  return (
    <>
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
          {/* --- Minimalist Header --- */}
          <header className="flex-shrink-0 bg-tg-secondary-bg/80 backdrop-blur-md sticky top-0 z-20 border-b border-tg-hint/10 px-4 py-3">
              <div className="flex items-center gap-3">
                  {/* Counter Widget */}
                  <div className="flex flex-col items-start flex-shrink-0 min-w-[50px]">
                      <span className="text-[10px] font-bold text-tg-hint uppercase tracking-wider leading-tight">Клиентов</span>
                      <span className="text-xl font-bold text-tg-text leading-none">{!isLoading ? allClients.length : '-'}</span>
                  </div>

                  {/* Search Bar */}
                  <div className="relative flex-1">
                      <input
                          type="text"
                          placeholder="Поиск..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 text-sm border border-transparent bg-tg-bg rounded-xl focus:outline-none focus:ring-2 focus:ring-tg-link transition-shadow h-10"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-tg-hint">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                  </div>

                  {/* Settings Button */}
                  <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="flex-shrink-0 p-2 text-tg-hint hover:text-tg-text active:scale-95 transition-transform"
                      title="Настройки полей"
                  >
                      <SlidersIcon className="w-6 h-6" />
                  </button>
              </div>
          </header>
          
          {/* --- Client List --- */}
          <main className="flex-1 overflow-y-auto pb-10">
              {isLoading ? (
                  <ListSkeleton />
               ) : Object.keys(groupedAndFilteredClients).length > 0 ? (
                  <div className="pb-4">
                      {Object.keys(groupedAndFilteredClients).sort().map(letter => (
                          <div key={letter}>
                              <div className="sticky top-0 bg-tg-secondary-bg/95 backdrop-blur px-4 py-1.5 z-10 text-xs font-bold text-tg-hint/70 uppercase tracking-wide">
                                  {letter}
                              </div>
                              <ul className="divide-y divide-tg-hint/10">
                                  {groupedAndFilteredClients[letter].map(client => (
                                      <li key={client['Chat ID']} className="group flex items-center justify-between px-4 py-3 hover:bg-tg-bg/50 transition-colors cursor-pointer" onClick={() => onClientSelect(client)}>
                                          <div className="flex items-center gap-3 min-w-0">
                                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-tg-link to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                                  {getInitials(client['Имя клиента'])}
                                              </div>
                                              <div className="min-w-0">
                                                  <div className="flex items-center gap-1.5">
                                                      <p className="font-semibold text-tg-text truncate text-[15px]">{client['Имя клиента'] || 'Без имени'}</p>
                                                      {client['Статус сделки'] && (
                                                         <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(client['Статус сделки'])}`} />
                                                      )}
                                                  </div>
                                                  <p className="text-xs text-tg-hint truncate">{client['Телефон'] || `ID: ${client['Chat ID']}`}</p>
                                              </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-1">
                                              {client['Телефон'] && (
                                                  <a
                                                      href={`tel:${client['Телефон'].replace(/\D/g, '')}`}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="p-2 rounded-full text-tg-hint/70 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all"
                                                  >
                                                      <PhoneIcon />
                                                  </a>
                                              )}
                                              <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenMessageModal(client);
                                                  }}
                                                  className="p-2 rounded-full text-tg-hint/70 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                              >
                                                  <ChatIcon />
                                              </button>
                                          </div>
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      ))}
                  </div>
               ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                      <div className="bg-tg-bg p-4 rounded-full mb-3">
                        <svg className="w-8 h-8 text-tg-hint" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      </div>
                      <p className="text-tg-hint">Ничего не найдено</p>
                  </div>
               )}
          </main>
      </div>

      {/* --- Settings Modal (Slide-up / Overlay) --- */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
              {/* Backdrop */}
              <div 
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                  onClick={() => setIsSettingsOpen(false)}
              ></div>
              
              {/* Sheet */}
              <div className="relative bg-tg-secondary-bg w-full max-w-lg h-[80vh] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-tg-hint/10">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">Настройка полей</h2>
                        {isSaving && (
                            <div className="flex items-center gap-1.5 text-xs text-tg-link font-medium animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-tg-link"></div>
                                <span>Сохранение...</span>
                            </div>
                        )}
                      </div>
                      <button onClick={() => setIsSettingsOpen(false)} className="p-2 -mr-2 text-tg-hint hover:text-tg-text">
                          <XMarkIcon />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                       {groupedFields.map(([groupName, fields]) => (
                          <div key={groupName}>
                              <h4 className="text-xs font-bold text-tg-hint uppercase tracking-wider mb-2 ml-1">{groupName}</h4>
                              <div className="bg-tg-bg rounded-xl overflow-hidden border border-tg-hint/5 divide-y divide-tg-hint/5">
                                  {fields.map(field => (
                                      <FieldToggle 
                                        key={field}
                                        field={field} 
                                        isVisible={visibleFields.has(field)} 
                                        onToggle={handleToggle} 
                                      />
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {messagingClient && (
        <SendMessageModal 
          client={messagingClient}
          templates={templates}
          onClose={() => setMessagingClient(null)}
        />
      )}
    </>
  );
};

export default AdminSettings;