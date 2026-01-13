
/**
 * ПОЛУЧЕНИЕ КОНФИГУРАЦИИ ИЗ СВОЙСТВ СКРИПТА
 * 
 * ВАЖНО: В этом коде нет паролей и токенов.
 * Они хранятся в настройках проекта Google Apps Script.
 * 
 * Как настроить:
 * 1. В редакторе нажмите на шестеренку (Настройки проекта) слева.
 * 2. Прокрутите вниз до раздела "Свойства скрипта".
 * 3. Нажмите "Добавить свойство скрипта" и добавьте три ключа:
 *    - SPREADSHEET_ID
 *    - BOT_TOKEN
 *    - ADMIN_CHAT_ID
 */

const scriptProperties = PropertiesService.getScriptProperties();

// Считывание значений, установленных через меню настроек
const SPREADSHEET_ID = scriptProperties.getProperty('SPREADSHEET_ID');
const BOT_TOKEN = scriptProperties.getProperty('BOT_TOKEN');
const ADMIN_CHAT_ID = scriptProperties.getProperty('ADMIN_CHAT_ID');


/**
 * Helper function to send a message via Telegram Bot API.
 * @param {string} chatId - The chat ID to send the message to.
 * @param {string} text - The message text.
 */
function sendMessage(chatId, text) {
  if (!BOT_TOKEN || BOT_TOKEN.includes('ВАШ_')) {
    console.log('Bot token is not configured in Script Properties. Skipping message send.');
    return; // Don't try to send if token is not set
  }
  const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
  const payload = {
    chat_id: String(chatId),
    text: text,
    parse_mode: 'HTML' // Use HTML for bold text
  };
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  try {
    UrlFetchApp.fetch(url, options);
  } catch (e) {
    // Log the error but don't crash the main function
    console.error('Telegram API error: ' + e.toString());
  }
}


/**
 * Helper function to create a JSON response with correct headers.
 * @param {Object} data - The data to be stringified.
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads the 'Config' sheet and returns settings as a key-value object.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The spreadsheet instance.
 */
function getConfig(ss) {
  const configSheet = ss.getSheetByName('Config');
  if (!configSheet) {
    // If no config sheet, return empty object so the app can use defaults.
    return {}; 
  }
  const range = configSheet.getDataRange();
  const values = range.getValues();
  
  const config = {};
  // Start from row 1 to skip headers
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const key = row[0];
    const value = row[1];
    if (key) {
      try {
        // Try to parse value as JSON (for arrays, etc.)
        config[key] = JSON.parse(value);
      } catch (e) {
        // If not JSON, use as plain string
        config[key] = value;
      }
    }
  }
  return config;
}


/**
 * Handles HTTP GET requests to the web app.
 * @param {Object} e - The event parameter containing request details.
 */
function doGet(e) {
  try {
    if (!SPREADSHEET_ID) {
       return createJsonResponse({ error: 'SPREADSHEET_ID не настроен в свойствах скрипта (Настройки проекта -> Свойства скрипта).' });
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Handle config requests (publicly accessible for app functionality)
    if (e.parameter.action === 'getConfig') {
      const config = getConfig(ss);
      return createJsonResponse(config);
    }

    // SECURITY CHECK: Require chatId for any data access
    const reqChatId = e.parameter.chatId;
    if (!reqChatId) {
      return createJsonResponse({ error: 'Access Denied. Chat ID required.' });
    }

    const sheetName = e.parameter.sheet || 'WebBase';
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return createJsonResponse({ error: `Sheet with name "${sheetName}" not found.` });
    }

    const range = sheet.getDataRange();
    const values = range.getDisplayValues(); 

    if (values.length < 2) {
      return createJsonResponse([]);
    }

    // Trim headers to prevent issues with leading/trailing whitespace.
    const headers = values.shift().map(h => h.trim());
    const chatIdColumnIndex = headers.indexOf('Chat ID');
    
    const data = values.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        if (header) {
          // CRITICAL FIX: Trim every cell value to handle data entry errors (extra spaces).
          obj[header] = row[index] ? row[index].trim() : '';
        }
      });
      return obj;
    });

    // SECURITY LOGIC:
    // 1. If the requested Chat ID matches the ADMIN_CHAT_ID (from Script Properties), return EVERYTHING.
    // 2. Otherwise, return ONLY the data matching the requested Chat ID.
    
    if (ADMIN_CHAT_ID && String(reqChatId) === String(ADMIN_CHAT_ID)) {
       // Admin access: Return all data
       return createJsonResponse(data);
    } else {
       // User access: Filter by their ID
       if (chatIdColumnIndex !== -1) {
         const filteredData = data.filter(row => String(row['Chat ID']) === String(reqChatId));
         return createJsonResponse(filteredData);
       } else {
         // Should not happen if sheet structure is correct, but fail safe.
         return createJsonResponse([]);
       }
    }

  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Handles HTTP POST requests to the web app.
 * @param {Object} e - The event parameter containing request details.
 */
function doPost(e) {
  try {
    if (!SPREADSHEET_ID) {
       return createJsonResponse({ error: 'SPREADSHEET_ID не настроен в свойствах скрипта.' });
    }

    const requestData = JSON.parse(e.postData.contents);
    
    if (requestData.action === 'addUser') {
      const { chatId, phone } = requestData;
      
      if (!chatId || !phone) {
        return createJsonResponse({ error: 'Требуется Chat ID и номер телефона.' });
      }
      
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName('WebBase');
      
      if (!sheet) {
        return createJsonResponse({ error: 'Лист "WebBase" не найден.' });
      }
      
      // Trim headers to ensure indexOf works correctly.
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => h.trim());
      const chatIdColIndex = headers.indexOf('Chat ID');
      const phoneColIndex = headers.indexOf('Телефон');
      
      if (chatIdColIndex === -1 || phoneColIndex === -1) {
        return createJsonResponse({ error: 'Не найдены обязательные колонки "Chat ID" или "Телефон" в листе "WebBase".' });
      }
      
      // Check if user already exists
      const data = sheet.getDataRange().getValues();
      const existingUser = data.find(row => row[chatIdColIndex] == chatId);
      if(existingUser) {
        return createJsonResponse({ result: 'exists', message: 'Пользователь с таким Chat ID уже существует.' });
      }

      const newRow = Array(headers.length).fill('');
      newRow[chatIdColIndex] = chatId;
      newRow[phoneColIndex] = phone;
      newRow[headers.indexOf('Имя клиента')] = 'Новый клиент';
      newRow[headers.indexOf('Статус сделки')] = 'Ожидает обработки';
      
      sheet.appendRow(newRow);

      // Send notification to admin
      if (ADMIN_CHAT_ID) {
        const notificationText = `<b>Новая заявка!</b>\n\nПользователь оставил заявку в боте.\n<b>Телефон:</b> ${phone}\n<b>Chat ID:</b> ${chatId}`;
        sendMessage(ADMIN_CHAT_ID, notificationText);
      }
      
      return createJsonResponse({ result: 'success', message: 'Пользователь успешно добавлен.' });
    }

    if (requestData.action === 'sendMessageFromBot') {
      const { chatId, text } = requestData;
      if (!chatId || !text) {
        return createJsonResponse({ error: 'Требуется Chat ID и текст сообщения.' });
      }
      sendMessage(chatId, text);
      return createJsonResponse({ result: 'success', message: 'Сообщение отправлено.' });
    }


    if (requestData.action === 'updateConfig') {
      const { key, value } = requestData;
      if (!key || value === undefined) {
        return createJsonResponse({ error: 'Требуется "key" и "value" для обновления конфигурации.' });
      }

      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      let sheet = ss.getSheetByName('Config');
      if (!sheet) {
        sheet = ss.insertSheet('Config');
        sheet.appendRow(['Key', 'Value']); // Add headers
      }

      const data = sheet.getDataRange().getValues();
      let keyFound = false;
      for (let i = 0; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(JSON.stringify(value, null, 2));
          keyFound = true;
          break;
        }
      }

      if (!keyFound) {
        sheet.appendRow([key, JSON.stringify(value, null, 2)]);
      }
      
      return createJsonResponse({ result: 'success', message: 'Конфигурация обновлена.' });
    }
    
    return createJsonResponse({ error: 'Неверное действие.' });

  } catch (error) {
    // Log the error for debugging
    console.error('doPost Error: ' + error.toString());
    return createJsonResponse({ error: error.message });
  }
}
