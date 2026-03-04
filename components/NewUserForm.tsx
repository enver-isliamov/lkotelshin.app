
import React, { useState, useEffect } from 'react';
import { AsYouType, isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

interface NewUserFormProps {
  chatId: string;
  onSubmit: (phone: string) => Promise<void>;
}

const ROTATING_BENEFITS = [
    {
        title: "Ваша квартира — не склад",
        text: "Квадратный метр жилья стоит сотни тысяч. Хранить на нем грязную резину — экономически невыгодно. Освободите место для жизни."
    },
    {
        title: "Один бизнес-ланч в месяц",
        text: "Вы не заметите эту сумму в расходах, но семья точно оценит отсутствие запаха резины и грязи дома."
    },
    {
        title: "Вы покупаете свободное время",
        text: "Никаких поездок в гараж и погрузок. Приехали на переобувку и уехали за 15 минут. Ваше время стоит дороже."
    },
    {
        title: "Всего ~23 рубля в день",
        text: "Это меньше стоимости пакета в супермаркете. Смешная плата за то, чтобы забыть о проблеме колес."
    }
];

const NewUserForm: React.FC<NewUserFormProps> = ({ chatId, onSubmit }) => {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  // State for rotating benefits
  const [benefitIndex, setBenefitIndex] = useState(0);
  const [isBenefitVisible, setIsBenefitVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
        setIsBenefitVisible(false); // Fade out
        setTimeout(() => {
            setBenefitIndex((prev) => (prev + 1) % ROTATING_BENEFITS.length);
            setIsBenefitVisible(true); // Fade in
        }, 300); // Duration of fade-out transition
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPhoneNumber(phone, 'RU')) {
      setError('Пожалуйста, введите корректный номер телефона');
      return;
    }

    const phoneNumber = parsePhoneNumber(phone, 'RU');
    const e164Phone = phoneNumber.format('E.164');

    setError('');
    setStatus('submitting');
    try {
      await onSubmit(e164Phone);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Ошибка связи. Попробуйте позже.');
    }
  };
  
  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-fade-in bg-tg-bg">
        <div className="w-24 h-24 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-green-500/30">
          <CheckIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4 text-tg-text">Заявка принята!</h2>
        <p className="text-tg-hint text-lg leading-relaxed max-w-xs">
          Ваш персональный менеджер уже получил уведомление. Мы свяжемся с вами в ближайшее время для открытия доступа.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-tg-bg overflow-hidden font-sans">
      
      {/* --- SCROLLABLE CONTENT --- */}
      {/* Увеличен padding-bottom до 400px, чтобы контент прокручивался над шторкой */}
      <div className="flex-1 overflow-y-auto pb-[400px] scrollbar-hide">
        
        {/* Hero Section */}
        <div className="relative pt-12 pb-6 px-6 text-center">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent rounded-b-[50px] pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
                <h1 className="text-3xl font-extrabold text-tg-text mb-2 leading-tight mt-4">
                    Отель Шин
                </h1>
                <p className="text-lg font-bold text-tg-link mb-3">
                    Ваш балкон для отдыха, а не для шин.
                </p>
                <p className="text-tg-hint text-base leading-snug max-w-[300px]">
                   Заберем сегодня — заменим перед сезоном.
                </p>
            </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="px-5 space-y-4">
            <FeatureCard 
                icon={<TruckIcon />}
                title="Заберем бесплатно"
                text="Бережем вашу спину и чистоту салона. Сами приедем, погрузим и увезем тяжелые колеса. Это наш стандарт сервиса."
            />
            <FeatureCard 
                icon={<SunIcon />}
                title="Продлим жизнь шин"
                text="В гараже резина сохнет и стареет. Наш склад защищает шины от внешней среды, экономя ваш бюджет на покупке новых."
            />
            <FeatureCard 
                icon={<ShieldIcon />}
                title="Закрытая территория"
                text="Частный склад с ограниченным доступом. Посторонним вход воспрещен. Работаем прозрачно по оферте на сайте."
            />
        </div>

        {/* How We Work Steps */}
        <div className="mt-8 px-6">
            <h3 className="text-lg font-bold text-tg-text mb-4 text-center">Процесс прост</h3>
            <div className="flex justify-between items-start text-center relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-10 right-10 h-0.5 bg-tg-hint/10 -z-10"></div>

                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-tg-bg border-2 border-tg-link text-tg-link flex items-center justify-center font-bold text-sm z-10">1</div>
                    <p className="text-xs font-medium text-tg-text">Приём и<br/>фотоотчет</p>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-tg-bg border-2 border-tg-link text-tg-link flex items-center justify-center font-bold text-sm z-10">2</div>
                    <p className="text-xs font-medium text-tg-text">Маркировка<br/>и склад</p>
                </div>
                <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full bg-tg-bg border-2 border-tg-link text-tg-link flex items-center justify-center font-bold text-sm z-10">3</div>
                    <p className="text-xs font-medium text-tg-text">Выдача за<br/>15 минут</p>
                </div>
            </div>
            
             {/* Objection Handler / Value add */}
             <div className="mt-5 flex items-start justify-center gap-3 text-left bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800/20 mx-2">
                <div className="mt-0.5 text-green-600 dark:text-green-400">
                    <CheckCircleIcon />
                </div>
                <div>
                     <p className="text-xs font-bold text-tg-text mb-0.5">Честная цена</p>
                     <p className="text-[11px] text-tg-hint leading-tight">
                        Стоимость фиксируется в день сдачи. Никаких скрытых доплат при получении.
                    </p>
                </div>
            </div>
        </div>

        {/* What's inside the app */}
        <div className="mt-10 px-6 mb-6">
            <div className="text-center mb-6">
                 <h3 className="text-xl font-bold text-tg-text">Ваш Личный Кабинет</h3>
                 <p className="text-sm text-tg-hint mt-1">Полная прозрачность и управление в один клик</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                <MiniBenefit icon={<CameraIcon />} label="Фотофиксация" />
                <MiniBenefit icon={<BellIcon />} label="Напоминания" />
                <MiniBenefit icon={<WrenchIcon />} label="Запись на шиномоннтаж" />
                <MiniBenefit icon={<FileIcon />} label="История заказов" />
            </div>
        </div>

        {/* Value Statement Carousel */}
        <div className="px-6 mb-2 text-center h-[140px] flex items-center justify-center">
            <div 
                className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/30 shadow-sm w-full transition-opacity duration-300 ease-in-out ${isBenefitVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <p className="text-base font-bold text-tg-text mb-2 transition-all">
                    {ROTATING_BENEFITS[benefitIndex].title}
                </p>
                <p className="text-xs text-tg-hint leading-relaxed transition-all">
                    {ROTATING_BENEFITS[benefitIndex].text}
                </p>
                {/* Dots Indicator */}
                <div className="flex justify-center gap-1.5 mt-3">
                    {ROTATING_BENEFITS.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`h-1 rounded-full transition-all duration-300 ${idx === benefitIndex ? 'w-4 bg-tg-link' : 'w-1 bg-tg-hint/30'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>
       

      {/* --- BOTTOM SHEET FORM (Fixed) --- */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
          {/* Gradient Fade to connect content */}
          <div className="h-12 bg-gradient-to-b from-transparent to-tg-bg/50 pointer-events-none"></div>
          
          <div className="bg-tg-secondary-bg rounded-t-[30px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 pb-8 border-t border-tg-hint/10">
             <div className="max-w-md mx-auto">
               <div className="text-center px-1">
                        <p className="text-[11px] text-tg-hint font-medium leading-tight">
                            Пока вы читали, мы создали для Вас Личный кабинет
                        </p>
                    </div>
                <div className="text-center mb-4">
                    <p className="text-sm font-medium text-tg-text">Введите номер телефона</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                             <span className="text-tg-hint group-focus-within:text-tg-link transition-colors text-xl">🇷🇺</span>
                        </div>
                        <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                            const formatter = new AsYouType('RU');
                            setPhone(formatter.input(e.target.value));
                        }}
                        placeholder="+7 999 000 00 00"
                        className={`w-full pl-12 pr-4 py-4 bg-tg-bg border-2 rounded-2xl text-xl font-bold tracking-wide text-tg-text placeholder-tg-hint/30 focus:outline-none transition-all
                            ${error 
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                            : 'border-transparent focus:border-tg-link focus:ring-4 focus:ring-tg-link/10'
                            }`}
                        inputMode="tel"
                        />
                    </div>

                    {error && (
                        <div className="text-center text-red-500 text-sm font-medium animate-pulse">
                            {error}
                        </div>
                    )}
                    
                   

                    <button 
                        type="submit" 
                        disabled={status === 'submitting' || phone.length < 11}
                        className="w-full bg-tg-button text-tg-button-text font-bold text-lg py-4 rounded-2xl shadow-lg shadow-tg-button/30 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {status === 'submitting' ? 'Входим...' : 'Войти'}
                    </button>
                    
                    <p className="text-[10px] text-center text-tg-hint/50 leading-tight px-4 pt-1">
                        Нажимая кнопку, вы принимаете условия публичной оферты сервиса OtelShin
                    </p>
                </form>
             </div>
          </div>
      </div>

    </div>
  );
};

// --- Sub-components ---

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
    <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-tg-hint/5 shadow-sm">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-tg-link flex items-center justify-center">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-tg-text text-[15px] mb-1">{title}</h3>
            <p className="text-xs text-tg-hint leading-relaxed">{text}</p>
        </div>
    </div>
);

const MiniBenefit: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex flex-col items-center justify-center p-3 bg-tg-bg rounded-xl border border-tg-hint/5 shadow-sm">
        <div className="text-tg-link mb-2 opacity-80">{icon}</div>
        <span className="text-[11px] font-bold text-tg-text text-center leading-none">{label}</span>
    </div>
);


// --- Icons ---

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const TruckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
);

const ShieldIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const BellIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
);

const WrenchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default NewUserForm;