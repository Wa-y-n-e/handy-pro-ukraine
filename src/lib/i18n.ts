export type Lang = "ua" | "ru" | "en";

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ua", label: "УКР", flag: "🇺🇦" },
  { code: "ru", label: "РУС", flag: "🌐" },
  { code: "en", label: "ENG", flag: "🇬🇧" },
];

export type ViewMode = "client" | "senior" | "master" | "admin";

export const VIEW_MODES: { id: ViewMode; ua: string; ru: string; en: string; icon: string }[] = [
  { id: "client", ua: "Клієнт (стандарт)", ru: "Клиент (стандарт)", en: "Standard Client", icon: "👤" },
  { id: "senior", ua: "Режим «Бабуся»", ru: "Режим «Бабушка»", en: "Senior / Grandma mode", icon: "👵" },
  { id: "master", ua: "Майстер «Дядя Толя»", ru: "Мастер «Дядя Толя»", en: "Uncle Tolya master", icon: "🧰" },
  { id: "admin", ua: "Адмін / Підтримка", ru: "Админ / Поддержка", en: "Admin / Support", icon: "🛡️" },
];

type Dict = Record<string, { ua: string; ru: string; en: string }>;

export const t_dict: Dict = {
  appName: { ua: "Handy Pro", ru: "Handy Pro", en: "Handy Pro" },
  tagline: { ua: "Майстер поруч.", ru: "Мастер рядом.", en: "Handyman nearby." },
  testingMode: { ua: "Тестовий режим", ru: "Тестовый режим", en: "Testing mode" },

  // auth
  signInTitle: { ua: "Увійдіть за номером", ru: "Войдите по номеру", en: "Sign in with phone" },
  phonePlaceholder: { ua: "+380 __ ___ __ __", ru: "+380 __ ___ __ __", en: "+380 __ ___ __ __" },
  sendCode: { ua: "Отримати код", ru: "Получить код", en: "Send code" },
  smsHint: { ua: "Ми надішлемо SMS-код на ваш номер.", ru: "Мы отправим SMS-код на ваш номер.", en: "We'll send a 6-digit SMS code." },
  legalAgree: { ua: "Я погоджуюсь з Користувацькою угодою", ru: "Я согласен с Пользовательским соглашением", en: "I agree to the User Agreement" },
  legalSummary: {
    ua: "Платформа — лише інформаційний посередник (ст. 3, 17 ЗУ «Про електронну комерцію»). Ми не несемо відповідальності за фізичну безпеку, здоровʼя, майно чи будь-які реальні події.",
    ru: "Платформа — лишь информационный посредник (ст. 3, 17 ЗУ «Об электронной коммерции»). Мы не несём ответственности за физическую безопасность, здоровье, имущество и любые реальные события.",
    en: "Platform is solely an informational intermediary (Law of Ukraine on E-commerce, Art. 3, 17). It bears ZERO liability for safety, health, property or any real-world events.",
  },
  enterCode: { ua: "Введіть 6-значний код", ru: "Введите 6-значный код", en: "Enter 6-digit code" },
  codeResend: { ua: "Надіслати знову через", ru: "Отправить снова через", en: "Resend in" },
  verify: { ua: "Підтвердити", ru: "Подтвердить", en: "Verify" },
  back: { ua: "Назад", ru: "Назад", en: "Back" },

  // grandma
  emergencyHelp: { ua: "ТЕРМІНОВА ДОПОМОГА", ru: "СРОЧНАЯ ПОМОЩЬ", en: "EMERGENCY HELP" },
  emergencyHelpSub: { ua: "Залило, іскрить, прорив", ru: "Залило, искрит, прорыв", en: "Flood, sparks, burst" },
  regularRepair: { ua: "ЗВИЧАЙНИЙ РЕМОНТ", ru: "ОБЫЧНЫЙ РЕМОНТ", en: "REGULAR REPAIR" },
  regularRepairSub: { ua: "Двері, замки, дрібниці", ru: "Двери, замки, мелочи", en: "Doors, locks, small jobs" },
  callOperator: { ua: "ПОЗВОНИТИ ОПЕРАТОРУ", ru: "ПОЗВОНИТЬ ОПЕРАТОРУ", en: "CALL OPERATOR" },
  callOperatorSub: { ua: "Жива людина допоможе", ru: "Живой человек поможет", en: "A real person will help" },
  voiceMessage: { ua: "Натисніть і розкажіть голосом", ru: "Нажмите и расскажите голосом", en: "Tap and speak the issue" },
  voiceRecording: { ua: "Записуємо... говоріть", ru: "Записываем... говорите", en: "Recording... speak" },
  voiceSaved: { ua: "Голосове повідомлення збережено ✓", ru: "Голосовое сообщение сохранено ✓", en: "Voice message saved ✓" },
  moneySafe: { ua: "Гроші в безпеці у банку", ru: "Деньги в безопасности в банке", en: "Money safely guarded by bank" },
  getHelp: { ua: "Допомога", ru: "Помощь", en: "Get help" },
  allGood: { ua: "Все відмінно", ru: "Всё отлично", en: "Everything was good" },
  hadProblems: { ua: "Були проблеми", ru: "Были проблемы", en: "Had problems" },

  // master uncle tolya
  lookingForWork: { ua: "ЧЕКАЮ ЗАМОВЛЕННЯ", ru: "ЖДУ ЗАКАЗЫ", en: "LOOKING FOR WORK" },
  resting: { ua: "ВІДПОЧИВАЮ", ru: "ОТДЫХАЮ", en: "RESTING" },
  todayIncoming: { ua: "Сьогодні прийшло", ru: "Сегодня поступило", en: "Today incoming" },
  paymentGuaranteed: { ua: "Оплата перевірена та гарантована банком", ru: "Оплата проверена и гарантирована банком", en: "Payment verified & guaranteed by bank" },
  myWorks: { ua: "Фото моїх робіт", ru: "Фото моих работ", en: "Photos of my works" },
  addWorkPhoto: { ua: "Додати фото роботи", ru: "Добавить фото работы", en: "Add work photo" },
  pickTrade: { ua: "Оберіть фах", ru: "Выберите ремесло", en: "Pick your trade" },
  tradeWater: { ua: "Сантехніка", ru: "Сантехника", en: "Water / Plumbing" },
  tradeElectric: { ua: "Електрика", ru: "Электрика", en: "Electricity" },
  tradeHome: { ua: "Дрібний ремонт", ru: "Мелкий ремонт", en: "Home repair" },
  tradeHeavy: { ua: "Важка робота", ru: "Тяжёлая работа", en: "Heavy labour" },

  // map / anti-EW
  mapTitle: { ua: "Карта виклику", ru: "Карта вызова", en: "Service map" },
  searchAddress: { ua: "Введіть вулицю та номер", ru: "Введите улицу и номер", en: "Type street and number" },
  antiEW: { ua: "СБІЙ GPS (АНТИ-РЕБ)", ru: "СБОЙ GPS (АНТИ-РЭБ)", en: "GPS INTERFERENCE (ANTI-EW)" },
  antiEWOn: { ua: "Ручний режим активний — перетягніть пін", ru: "Ручной режим активен — перетащите пин", en: "Manual mode active — drag the pin" },
  confirmLocation: { ua: "Підтвердити локацію", ru: "Подтвердить локацию", en: "Confirm location" },
  gsmFallback: { ua: "Звичайний дзвінок (без інтернету)", ru: "Обычный звонок (без интернета)", en: "Call via Regular Network" },

  // chat / escrow
  chatTitle: { ua: "Чат з майстром", ru: "Чат с мастером", en: "Chat with master" },
  typeMessage: { ua: "Введіть повідомлення...", ru: "Введите сообщение...", en: "Type a message..." },
  attach: { ua: "Фото / відео", ru: "Фото / видео", en: "Photo / video" },
  proposePrice: { ua: "Назвати ціну", ru: "Назвать цену", en: "Propose price" },
  priceOffer: { ua: "Цінова пропозиція", ru: "Ценовое предложение", en: "Price offer" },
  acceptOffer: { ua: "Прийняти пропозицію", ru: "Принять предложение", en: "Accept offer" },
  payGoogle: { ua: "Сплатити через Google Pay", ru: "Оплатить через Google Pay", en: "Pay with Google Pay" },
  paySheetTitle: { ua: "Підтвердження оплати", ru: "Подтверждение оплаты", en: "Confirm payment" },
  paySheetHint: { ua: "Картка **** 8841 · Google Pay", ru: "Карта **** 8841 · Google Pay", en: "Card **** 8841 · Google Pay" },
  payConfirm: { ua: "Підтвердити", ru: "Подтвердить", en: "Confirm" },
  fundsFrozen: { ua: "Кошти заморожені", ru: "Средства заморожены", en: "Funds Frozen" },
  enroute: { ua: "Майстер їде", ru: "Мастер в пути", en: "Master en route" },
  inProgress: { ua: "Робота йде", ru: "Работа идёт", en: "Work in progress" },
  completed: { ua: "Виконано", ru: "Выполнен", en: "Completed" },
  openDispute: { ua: "Поскаржитися", ru: "Пожаловаться", en: "Open dispute" },
  jobMedia: { ua: "Фото поломки", ru: "Фото поломки", en: "Job media" },

  // rating
  ratingTitle: { ua: "Оцініть роботу", ru: "Оцените работу", en: "Rate the job" },
  ratingMasterTitle: { ua: "Оцініть клієнта", ru: "Оцените клиента", en: "Rate the client" },
  badgeFast: { ua: "Швидко", ru: "Быстро", en: "Fast" },
  badgePolite: { ua: "Ввічливий", ru: "Вежливый", en: "Polite" },
  badgeClean: { ua: "Чисто", ru: "Чистота", en: "Clean" },
  badgeFair: { ua: "Чесна ціна", ru: "Честная цена", en: "Fair price" },
  badgeGoodClient: { ua: "Хороший замовник", ru: "Хороший заказчик", en: "Good client" },
  badgePaidFast: { ua: "Одразу сплатив", ru: "Сразу оплатил", en: "Paid instantly" },
  badgeAdequate: { ua: "Адекватний", ru: "Адекватный", en: "Adequate" },
  leaveReview: { ua: "Залишити відгук", ru: "Оставить отзыв", en: "Leave review" },

  // support
  support: { ua: "Підтримка", ru: "Поддержка", en: "Support" },
  supportChat: { ua: "Чат підтримки", ru: "Чат поддержки", en: "Support chat" },
  telegram: { ua: "Telegram-бот", ru: "Telegram-бот", en: "Telegram bot" },
  viber: { ua: "Viber-канал", ru: "Viber-канал", en: "Viber channel" },
  hotline: { ua: "Гаряча лінія", ru: "Горячая линия", en: "Phone hotline" },
  legalDocs: { ua: "Договір та застереження", ru: "Договор и оговорки", en: "User Agreement & Waivers" },

  // admin
  adminTitle: { ua: "Адмін-панель", ru: "Админ-панель", en: "Admin panel" },
  liveJobs: { ua: "Активні замовлення", ru: "Активные заказы", en: "Live jobs" },
  operatorsOnline: { ua: "Майстри онлайн", ru: "Мастера онлайн", en: "Verified operators online" },
  cashVolume: { ua: "Обіг готівки сьогодні", ru: "Оборот наличных сегодня", en: "Active cash volumes" },
  registrationQueue: { ua: "Черга реєстрації майстрів", ru: "Очередь регистрации мастеров", en: "Master registration queue" },
  approve: { ua: "Підтвердити", ru: "Подтвердить", en: "Approve" },
  reject: { ua: "Відхилити", ru: "Отклонить", en: "Reject" },
  disputeDesk: { ua: "Арбітражний стіл", ru: "Арбитражный стол", en: "Live arbitrage desk" },
  releaseToMaster: { ua: "Видати майстру", ru: "Выдать мастеру", en: "Release to master" },
  refundClient: { ua: "Повернути клієнту", ru: "Вернуть клиенту", en: "Refund client" },
  openCase: { ua: "Відкрити справу", ru: "Открыть дело", en: "Open case" },
  pciNotice: { ua: "PCI-DSS · картки токенізуються Stripe / WayForPay", ru: "PCI-DSS · карты токенизируются Stripe / WayForPay", en: "PCI-DSS — cards tokenised via Stripe / WayForPay" },

  // misc
  cancel: { ua: "Скасувати", ru: "Отмена", en: "Cancel" },
  close: { ua: "Закрити", ru: "Закрыть", en: "Close" },
  send: { ua: "Надіслати", ru: "Отправить", en: "Send" },
  save: { ua: "Зберегти", ru: "Сохранить", en: "Save" },
  status: { ua: "Статус", ru: "Статус", en: "Status" },
};

export const CATEGORIES = [
  { id: "electric", ua: "Електрик", ru: "Электрик", en: "Electrician", icon: "⚡" },
  { id: "plumb", ua: "Сантехнік", ru: "Сантехник", en: "Plumber", icon: "🚿" },
  { id: "lock", ua: "Слюсар", ru: "Слесарь", en: "Locksmith", icon: "🔑" },
  { id: "appliance", ua: "Ремонт техніки", ru: "Ремонт техники", en: "Appliance Repair", icon: "🔧" },
];

export function tr(key: keyof typeof t_dict, lang: Lang): string {
  return t_dict[key]?.[lang] ?? String(key);
}
