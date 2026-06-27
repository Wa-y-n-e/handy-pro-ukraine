export type Lang = "ua" | "ru" | "en";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ua", label: "УКР", flag: "🇺🇦" },
  { code: "ru", label: "РУС", flag: "🌐" },
  { code: "en", label: "ENG", flag: "🇬🇧" },
];

type Dict = Record<string, { ua: string; ru: string; en: string }>;

export const t_dict: Dict = {
  appName: { ua: "Handy Pro", ru: "Handy Pro", en: "Handy Pro" },
  tagline: {
    ua: "Надійний майстер поруч",
    ru: "Надёжный мастер рядом",
    en: "Trusted handyman nearby",
  },
  client: { ua: "Клієнт", ru: "Клиент", en: "Client" },
  master: { ua: "Майстер", ru: "Мастер", en: "Master" },
  login: { ua: "Увійти", ru: "Войти", en: "Sign in" },
  register: { ua: "Реєстрація", ru: "Регистрация", en: "Register" },
  name: { ua: "Імʼя", ru: "Имя", en: "Name" },
  email: { ua: "Email", ru: "Email", en: "Email" },
  phone: { ua: "Телефон", ru: "Телефон", en: "Phone" },
  photo: { ua: "Фото майстра", ru: "Фото мастера", en: "Master photo" },
  uploadPhoto: { ua: "Завантажити фото", ru: "Загрузить фото", en: "Upload photo" },
  categories: { ua: "Категорії", ru: "Категории", en: "Categories" },
  pickCategories: {
    ua: "Оберіть свої спеціалізації",
    ru: "Выберите специализации",
    en: "Choose your specializations",
  },
  continue: { ua: "Продовжити", ru: "Продолжить", en: "Continue" },
  search: { ua: "Пошук майстрів та категорій...", ru: "Поиск мастеров и категорий...", en: "Search masters and categories..." },
  sos: { ua: "SOS — Терміновий виклик", ru: "SOS — Срочный вызов", en: "SOS — Emergency call" },
  sosHint: {
    ua: "Розсилка майстрам у радіусі 5 км",
    ru: "Рассылка мастерам в радиусе 5 км",
    en: "Broadcasting to masters within 5 km",
  },
  sosBroadcasting: {
    ua: "Шукаємо доступних майстрів...",
    ru: "Ищем доступных мастеров...",
    en: "Finding available masters...",
  },
  cancel: { ua: "Скасувати", ru: "Отмена", en: "Cancel" },
  availability: { ua: "Доступність", ru: "Доступность", en: "Availability" },
  online: { ua: "Готовий до замовлень", ru: "Готов к заказам", en: "Ready for jobs" },
  busy: { ua: "Зайнятий", ru: "Занят", en: "Busy" },
  offline: { ua: "Офлайн", ru: "Оффлайн", en: "Offline" },
  todaysJobs: { ua: "Активні замовлення", ru: "Активные заказы", en: "Active jobs" },
  earnings: { ua: "Заробіток сьогодні", ru: "Заработок сегодня", en: "Earnings today" },
  newOrder: { ua: "Нове термінове замовлення", ru: "Новый срочный заказ", en: "New urgent order" },
  accept: { ua: "Прийняти", ru: "Принять", en: "Accept" },
  decline: { ua: "Відхилити", ru: "Отклонить", en: "Decline" },
  map: { ua: "Карта", ru: "Карта", en: "Map" },
  manualPin: {
    ua: "Через перешкоди GPS використовуйте ручну прив'язку",
    ru: "Из-за помех GPS используйте ручную привязку",
    en: "Due to GPS jamming, please pin manually",
  },
  antiEW: { ua: "Анти-РЕБ режим", ru: "Анти-РЭБ режим", en: "Anti-Jamming mode" },
  address: { ua: "Адреса", ru: "Адрес", en: "Address" },
  confirmLocation: { ua: "Підтвердити локацію", ru: "Подтвердить локацию", en: "Confirm location" },
  chat: { ua: "Чат", ru: "Чат", en: "Chat" },
  typeMessage: { ua: "Введіть повідомлення...", ru: "Введите сообщение...", en: "Type a message..." },
  sendOffer: { ua: "Надіслати пропозицію", ru: "Отправить предложение", en: "Send price offer" },
  priceOffer: { ua: "Цінова пропозиція", ru: "Ценовое предложение", en: "Price offer" },
  acceptPay: { ua: "Прийняти і оплатити", ru: "Принять и оплатить", en: "Accept & Pay" },
  escrowHold: { ua: "Гроші заморожені (Escrow)", ru: "Деньги заморожены (Hold)", en: "Funds frozen safely (Escrow)" },
  escrowHint: {
    ua: "Кошти будуть передані майстру після завершення.",
    ru: "Средства будут переданы мастеру после завершения.",
    en: "Funds will be released after completion.",
  },
  cashPay: { ua: "Готівка", ru: "Наличные", en: "Cash" },
  cashConfirm: {
    ua: "Підтвердіть, що сплачуєте готівкою (двічі).",
    ru: "Подтвердите оплату наличными (дважды).",
    en: "Confirm cash payment (double confirm).",
  },
  pending: { ua: "Очікування", ru: "Ожидание", en: "Pending" },
  enroute: { ua: "В дорозі", ru: "В пути", en: "En route" },
  inProgress: { ua: "Виконується", ru: "В работе", en: "In progress" },
  completed: { ua: "Завершено", ru: "Завершено", en: "Completed" },
  dispute: { ua: "Арбітраж", ru: "Арбитраж", en: "Dispute" },
  openDispute: { ua: "Відкрити спір", ru: "Открыть спор", en: "Open dispute" },
  releaseFunds: { ua: "Підтвердити та сплатити", ru: "Подтвердить и оплатить", en: "Release funds" },
  profile: { ua: "Профіль", ru: "Профиль", en: "Profile" },
  wallet: { ua: "Гаманець", ru: "Кошелёк", en: "Wallet" },
  history: { ua: "Історія замовлень", ru: "История заказов", en: "Order history" },
  rating: { ua: "Рейтинг", ru: "Рейтинг", en: "Rating" },
  logout: { ua: "Вийти", ru: "Выйти", en: "Logout" },
  home: { ua: "Головна", ru: "Главная", en: "Home" },
  available: { ua: "доступних", ru: "доступных", en: "available" },
  jobs: { ua: "робіт", ru: "работ", en: "jobs" },
  km: { ua: "км", ru: "км", en: "km" },
  send: { ua: "Надіслати", ru: "Отправить", en: "Send" },
  close: { ua: "Закрити", ru: "Закрыть", en: "Close" },
  startChat: { ua: "Відкрити чат", ru: "Открыть чат", en: "Open chat" },
  switchRole: { ua: "Роль", ru: "Роль", en: "Role" },
  noPhotoYet: { ua: "Фото не додано", ru: "Фото не добавлено", en: "No photo yet" },
  emergencyIncoming: { ua: "ТЕРМІНОВО!", ru: "СРОЧНО!", en: "URGENT!" },
  detectingMasters: {
    ua: "Виявлено майстрів поруч",
    ru: "Обнаружены мастера рядом",
    en: "Masters detected nearby",
  },
};

export const CATEGORIES = [
  { id: "electric", ua: "Електрик", ru: "Электрик", en: "Electrician", icon: "⚡" },
  { id: "plumb", ua: "Сантехнік", ru: "Сантехник", en: "Plumber", icon: "🚿" },
  { id: "lock", ua: "Сюди слюсар", ru: "Слесарь", en: "Locksmith", icon: "🔑" },
  { id: "appliance", ua: "Ремонт техніки", ru: "Ремонт техники", en: "Appliance Repair", icon: "🔧" },
  { id: "carpenter", ua: "Тесля", ru: "Плотник", en: "Carpenter", icon: "🪚" },
  { id: "clean", ua: "Прибирання", ru: "Уборка", en: "Cleaning", icon: "🧽" },
  { id: "ac", ua: "Кондиціонери", ru: "Кондиционеры", en: "AC Repair", icon: "❄️" },
  { id: "windows", ua: "Вікна", ru: "Окна", en: "Windows", icon: "🪟" },
];

export function tr(key: keyof typeof t_dict, lang: Lang): string {
  return t_dict[key]?.[lang] ?? String(key);
}

export function catName(id: string, lang: Lang): string {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c[lang] : id;
}
