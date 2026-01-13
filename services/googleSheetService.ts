
import { APPS_SCRIPT_URL } from '../constants';
import { ClientData, OrderHistory, MessageTemplate } from '../types';

/**
 * Normalizes client data keys to ensure compatibility with the app.
 * Specifically handles variation in the "DOT CODE" column name (e.g., "DOT-код").
 */
function normalizeClientData(data: any[]): ClientData[] {
  return data.map(row => {
    const normalizedRow: any = { ...row };
    
    // Fix for DOT CODE: Map various header styles to the standard "DOT CODE" key
    // The Google Sheet might have "DOT-код" (Russian/Hyphen) or "DOT код", etc.
    if (!normalizedRow['DOT CODE']) {
      normalizedRow['DOT CODE'] = 
        normalizedRow['DOT-код'] || 
        normalizedRow['DOT код'] || 
        normalizedRow['DOT_CODE'] || 
        normalizedRow['DotCode'] || 
        '';
    }
    
    return normalizedRow as ClientData;
  });
}

/**
 * Normalizes message templates to standard keys.
 * Maps 'Название шаблона' -> 'title' and 'Содержимое (HTML)' -> 'text'.
 */
function normalizeTemplates(data: any[]): MessageTemplate[] {
  return data.map(row => ({
    title: row['Название шаблона'] || row['Название'] || '',
    text: row['Содержимое (HTML)'] || row['Содержимое'] || row['Текст'] || ''
  }));
}

/**
 * A generic error handler and response parser for fetch requests to the Apps Script.
 * This function is now robust and guarantees that the return value is always an array.
 * @param promise The fetch promise to process.
 * @param context A string describing the context of the request for better error logging.
 */
async function handleApiResponse<T>(promise: Promise<Response>, context: string): Promise<T[]> {
  try {
    const response = await promise;
    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (data.error) {
      // Pass the specific error from Apps Script
      throw new Error(data.error);
    }

    // CRITICAL FIX: The API should ALWAYS return an array. If it returns a single
    // object or something else, it's a sign of a server-side or deployment error.
    if (Array.isArray(data)) {
      return data;
    }

    console.error(`API returned unexpected non-array data for "${context}":`, data);
    throw new Error(`API вернуло некорректные данные. Ожидался массив, но был получен другой тип. Это может быть проблемой с развертыванием скрипта. Пожалуйста, переопубликуйте скрипт с доступом "Все".`);

  } catch (error) {
    console.error(`Ошибка во время "${context}":`, error);
    if (error instanceof Error) {
      throw new Error(`Не удалось получить данные из таблицы. Проверьте правильность URL скрипта, его настройки доступа ("Кто имеет доступ: Все") и ваше интернет-соединение. (Ошибка: ${error.message})`);
    }
    throw new Error(`Не удалось получить данные из таблицы. Проверьте правильность URL скрипта, его настройки доступа ("Кто имеет доступ: Все") и ваше интернет-соединение.`);
  }
}

/**
 * Fetches all data from a given sheet. Used for fetching all clients or all history records.
 * Requires adminChatId to verify authority to fetch full database.
 * @param sheetName The name of the sheet to fetch ('WebBase', 'Archive', or 'Шаблоны сообщений').
 * @param adminChatId The Chat ID of the admin requesting the data.
 * @returns A promise that resolves to an array of objects representing the sheet rows.
 */
export async function fetchAllSheetData<T>(sheetName: 'WebBase' | 'Archive' | 'Шаблоны сообщений', adminChatId: string): Promise<T[]> {
  const url = `${APPS_SCRIPT_URL}?sheet=${sheetName}&chatId=${adminChatId}&_=${new Date().getTime()}`;
  const data = await handleApiResponse<T>(fetch(url, { method: 'GET', redirect: 'follow' }), `получение всех данных с листа ${sheetName}`);
  
  // Apply normalization based on sheet name
  if (sheetName === 'WebBase') {
    return normalizeClientData(data) as unknown as T[];
  }
  
  if (sheetName === 'Шаблоны сообщений') {
    return normalizeTemplates(data) as unknown as T[];
  }
  
  return data;
}


/**
 * Fetches data from a sheet for a specific Chat ID.
 * @param sheetName The name of the sheet to fetch from.
 * @param chatId The Chat ID to filter by.
 * @returns A promise that resolves to an array of records matching the Chat ID.
 */
export async function fetchSheetDataByChatId<T>(sheetName: 'WebBase' | 'Archive', chatId: string): Promise<T[]> {
  const url = `${APPS_SCRIPT_URL}?sheet=${sheetName}&chatId=${chatId}&_=${new Date().getTime()}`;
  const data = await handleApiResponse<T>(fetch(url, { method: 'GET', redirect: 'follow' }), `получение данных по chatId с листа ${sheetName}`);

  // Apply normalization only for Client Data (WebBase)
  if (sheetName === 'WebBase') {
    return normalizeClientData(data) as unknown as T[];
  }

  return data;
}


/**
 * Fetches the application configuration from the 'Config' sheet.
 * @returns A promise that resolves to a configuration object.
 */
export async function fetchConfig(): Promise<{ [key: string]: any }> {
  if ((APPS_SCRIPT_URL as string) === 'ВАШ_URL_СКРИПТА' || !APPS_SCRIPT_URL) {
    console.warn('URL-адрес Google Apps Script не настроен, используется конфигурация по умолчанию.');
    return {};
  }
  const url = `${APPS_SCRIPT_URL}?action=getConfig&_=${new Date().getTime()}`;
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'follow' });
    if (!response.ok) return {};
    const data = await response.json();
    return data.error ? {} : data;
  } catch (error) {
    console.error('Не удалось загрузить конфигурацию:', error);
    return {}; // Return empty object on error to allow fallback to defaults
  }
}

/**
 * Updates the application configuration in the 'Config' sheet.
 * @param key The configuration key to update.
 * @param value The new value for the key.
 */
export async function updateConfig(key: string, value: any): Promise<{result: string}> {
  if ((APPS_SCRIPT_URL as string) === 'ВАШ_URL_СКРИПТА' || !APPS_SCRIPT_URL) {
    throw new Error('URL-адрес Google Apps Script не настроен.');
  }
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'updateConfig', key, value })
    });
    if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
    console.error('Ошибка при обновлении конфигурации:', error);
    if (error instanceof Error) throw new Error(`Не удалось сохранить настройки: ${error.message}`);
    throw new Error('Не удалось сохранить настройки.');
  }
}

/**
 * Adds a new user to the 'WebBase' sheet.
 * @param chatId The user's Telegram Chat ID.
 * @param phone The user's phone number.
 * @returns A promise that resolves to the result of the operation.
 */
export async function addNewUser(chatId: string, phone: string): Promise<{result: string}> {
   if ((APPS_SCRIPT_URL as string) === 'ВАШ_URL_СКРИПТА' || !APPS_SCRIPT_URL) {
    throw new Error('URL-адрес Google Apps Script не настроен.');
  }
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'addUser', chatId, phone })
    });
    if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
      console.error('Ошибка при добавлении нового пользователя:', error);
      if (error instanceof Error) throw new Error(`Не удалось зарегистрировать: ${error.message}`);
      throw new Error('Не удалось зарегистрировать нового пользователя.');
  }
}

/**
 * Sends a message to a client from the bot.
 * @param chatId The client's Telegram Chat ID.
 * @param text The message text to send.
 * @returns A promise that resolves to the result of the operation.
 */
export async function sendMessageFromBot(chatId: string, text: string): Promise<{result: string}> {
   if ((APPS_SCRIPT_URL as string) === 'ВАШ_URL_СКРИПТА' || !APPS_SCRIPT_URL) {
    throw new Error('URL-адрес Google Apps Script не настроен.');
  }
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'sendMessageFromBot', chatId, text })
    });
    if (!response.ok) throw new Error(`Ошибка сети: ${response.statusText}`);
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result;
  } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      if (error instanceof Error) throw new Error(`Не удалось отправить сообщение: ${error.message}`);
      throw new Error('Не удалось отправить сообщение.');
  }
}
