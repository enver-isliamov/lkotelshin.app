
import { supabase } from './supabaseClient';
import { ClientData, OrderHistory, MessageTemplate } from '../types';

// Helper to map DB columns (snake_case) to App types (Russian keys usually)
const mapClientFromDB = (data: any): ClientData => ({
    'Chat ID': data.chat_id || '',
    'Имя клиента': data.name || '',
    'Телефон': data.phone || '',
    'Номер Авто': data.car_number || '',
    'Заказ - QR': data.qr_code || '',
    'Бренд_Модель': data.brand_model || '',
    'Цена за месяц': data.price_month || '',
    'Кол-во шин': data.tire_count || '',
    'Наличие дисков': data.has_disks || '',
    'Начало': data.date_start || '',
    'Срок': data.storage_period || '',
    'Напомнить': data.remind_date || '',
    'Окончание': data.date_end || '',
    'Склад хранения': data.warehouse || '',
    'Ячейка': data.cell || '',
    'Общая сумма': data.total_amount || '',
    'Долг': data.debt || '',
    'Договор': data.contract_number || '',
    'Адрес клиента': data.address || '',
    'Статус сделки': data.status || '',
    'Источник трафика': data.traffic_source || '',
    'DOT CODE': data.dot_code || '',
    'Размер шин': data.tire_size || '',
    'Сезон': data.season || ''
});

const mapHistoryFromDB = (data: any): OrderHistory => ({
    'Chat ID': data.chat_id,
    'Дата': data.date,
    'Услуга': data.service,
    'Сумма': data.amount,
    'Статус': data.status
});

const mapTemplateFromDB = (data: any): MessageTemplate => ({
    title: data.title,
    text: data.text
});

export const fetchAllClients = async (): Promise<ClientData[]> => {
    const { data, error } = await supabase.from('clients').select('*');
    if (error) throw error;
    return (data || []).map(mapClientFromDB);
};

export const fetchClientByChatId = async (chatId: string): Promise<ClientData[]> => {
    const { data, error } = await supabase.from('clients').select('*').eq('chat_id', chatId);
    if (error) throw error;
    return (data || []).map(mapClientFromDB);
};

export const fetchAllHistory = async (): Promise<OrderHistory[]> => {
    const { data, error } = await supabase.from('orders').select('*');
    if (error) throw error;
    return (data || []).map(mapHistoryFromDB);
};

export const fetchHistoryByChatId = async (chatId: string): Promise<OrderHistory[]> => {
    const { data, error } = await supabase.from('orders').select('*').eq('chat_id', chatId);
    if (error) throw error;
    return (data || []).map(mapHistoryFromDB);
};

export const fetchTemplates = async (): Promise<MessageTemplate[]> => {
     const { data, error } = await supabase.from('templates').select('*');
     if (error) throw error;
     return (data || []).map(mapTemplateFromDB);
}

export const addNewUser = async (chatId: string, phone: string): Promise<{result: string}> => {
    // Check if exists
    const { data: existing } = await supabase.from('clients').select('id').eq('chat_id', chatId).single();
    if (existing) {
        return { result: 'exists' };
    }

    const { error } = await supabase.from('clients').insert([{
        chat_id: chatId,
        phone: phone,
        name: 'Новый клиент',
        status: 'Ожидает обработки',
        traffic_source: 'Новая заявка'
    }]);

    if (error) throw new Error(error.message);
    return { result: 'success' };
};

export const fetchConfig = async (): Promise<{ [key: string]: any }> => {
    const { data, error } = await supabase.from('config').select('*');
    if (error) return {};
    
    const config: {[key: string]: any} = {};
    data?.forEach((row: any) => {
        config[row.key] = row.value;
    });
    return config;
};

export const updateConfig = async (key: string, value: any): Promise<{result: string}> => {
    const { error } = await supabase.from('config').upsert({ key, value });
    if (error) throw new Error(error.message);
    return { result: 'success' };
};

export const sendMessageFromBot = async (chatId: string, text: string): Promise<{result: string}> => {
    // Supabase can't send TG messages directly without Edge Functions. 
    // For now, we will throw an error or log it.
    // In a full implementation, you'd call a Supabase Edge Function here.
    console.warn("Direct Telegram sending via Supabase requires Edge Functions. Feature disabled in this basic implementation.");
    return { result: 'success' }; 
}
