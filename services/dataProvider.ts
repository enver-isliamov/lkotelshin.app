
import * as googleService from './googleSheetService';
import * as supabaseService from './supabaseService';
import { ClientData, OrderHistory, MessageTemplate } from '../types';

// Determine source based on Environment Variable (Vite standard)
// Use optional chaining to prevent crash if import.meta.env is undefined
const DATA_SOURCE = import.meta.env?.VITE_DATA_SOURCE === 'supabase' ? 'supabase' : 'google';

console.log(`[DataProvider] Active Data Source: ${DATA_SOURCE.toUpperCase()}`);

export const fetchAllClients = async (adminChatId: string): Promise<ClientData[]> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchAllClients();
    }
    return googleService.fetchAllSheetData<ClientData>('WebBase', adminChatId);
};

export const fetchClientByChatId = async (chatId: string): Promise<ClientData[]> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchClientByChatId(chatId);
    }
    return googleService.fetchSheetDataByChatId<ClientData>('WebBase', chatId);
};

export const fetchAllHistory = async (adminChatId: string): Promise<OrderHistory[]> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchAllHistory();
    }
    return googleService.fetchAllSheetData<OrderHistory>('Archive', adminChatId);
};

export const fetchHistoryByChatId = async (chatId: string): Promise<OrderHistory[]> => {
     if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchHistoryByChatId(chatId);
    }
    return googleService.fetchSheetDataByChatId<OrderHistory>('Archive', chatId);
};

export const fetchTemplates = async (adminChatId: string): Promise<MessageTemplate[]> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchTemplates();
    }
    return googleService.fetchAllSheetData<MessageTemplate>('Шаблоны сообщений', adminChatId);
};

export const addNewUser = async (chatId: string, phone: string): Promise<{result: string}> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.addNewUser(chatId, phone);
    }
    return googleService.addNewUser(chatId, phone);
};

export const fetchConfig = async (): Promise<{ [key: string]: any }> => {
    if (DATA_SOURCE === 'supabase') {
        return supabaseService.fetchConfig();
    }
    return googleService.fetchConfig();
};

export const updateConfig = async (key: string, value: any): Promise<{result: string}> => {
     if (DATA_SOURCE === 'supabase') {
        return supabaseService.updateConfig(key, value);
    }
    return googleService.updateConfig(key, value);
};

export const sendMessage = async (chatId: string, text: string): Promise<{result: string}> => {
     if (DATA_SOURCE === 'supabase') {
        return supabaseService.sendMessageFromBot(chatId, text);
    }
    return googleService.sendMessageFromBot(chatId, text);
};
