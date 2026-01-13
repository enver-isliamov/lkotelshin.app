
export interface ClientData {
  [key: string]: string;
  'Chat ID': string;
  'Имя клиента': string;
  'Телефон': string;
  'Номер Авто': string;
  'Заказ - QR': string;
  'Бренд_Модель': string;
  'Цена за месяц': string;
  'Кол-во шин': string;
  'Наличие дисков': string;
  'Начало': string;
  'Срок': string;
  'Напомнить': string;
  'Окончание': string;
  'Склад хранения': string;
  'Ячейка': string;
  'Общая сумма': string;
  'Долг': string;
  'Договор': string;
  'Адрес клиента': string;
  'Статус сделки': string;
  'Источник трафика': string;
  'DOT CODE': string;
  'Размер шин': string;
  'Сезон': string;
}

export interface OrderHistory {
  [key: string]: string;
}

export interface MessageTemplate {
  title: string;
  text: string;
}
