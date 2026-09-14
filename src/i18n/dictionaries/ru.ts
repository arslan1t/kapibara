/**
 * Russian — the language the shop was written in, and the reference every
 * other dictionary is typed against.
 *
 * Shared by two markets: Russia reads it at /ru and a large part of Uzbekistan
 * reads it at /ru-uz. Nothing here may therefore assume a country. Anything
 * that differs between markets — the seller, the currency, the delivery, the
 * law — belongs in the region config or the legal module, not in a sentence.
 *
 * Placeholders are {braces} rather than template literals, so a translator can
 * move them to wherever their grammar puts them.
 */
export const ru = {
  // ─── Shared vocabulary ──────────────────────────────────────────────────────
  common: {
    brand: "Капибара",
    loading: "Загрузка…",
    save: "Сохранить",
    cancel: "Отмена",
    back: "Назад",
    close: "Закрыть",
    continue: "Продолжить",
    retry: "Попробовать ещё раз",
    remove: "Удалить",
    edit: "Изменить",
    yes: "Да",
    no: "Нет",
    required: "обязательное поле",
    optional: "необязательно",
    priceOnRequest: "Цена уточняется",
    notSoldHere: "Пока не продаётся в вашей стране",
    pagesAndCover: "{pages} страниц · твёрдая обложка",
    ageRange: "{range}",
    somethingWentWrong: "Что-то пошло не так. Попробуйте ещё раз",
  },

  // ─── Header and footer ──────────────────────────────────────────────────────
  nav: {
    catalog: "Каталог",
    howItWorks: "Как это работает",
    reviews: "Отзывы",
    about: "О нас",
    delivery: "Доставка",
    faq: "Частые вопросы",
    contact: "Контакты",
    home: "Главная",
  },

  header: {
    logoAria: "Капибара — на главную",
    mainNavAria: "Основная навигация",
    mobileNavAria: "Мобильная навигация",
    cart: "Корзина",
    cartWithCount: "Корзина, товаров: {count}",
    openMenu: "Открыть меню",
    closeMenu: "Закрыть меню",
    signIn: "Войти",
    createAccount: "Создать аккаунт",
    account: "Личный кабинет",
    myOrders: "Мои заказы",
    adminPanel: "Панель управления",
    signOut: "Выйти",
  },

  footer: {
    tagline:
      "Персональные книги, в которых главным героем становится ваш ребёнок.",
    booksHeading: "Книги",
    infoHeading: "Информация",
    accountHeading: "Кабинет",
    legalHeading: "Документы",
    privacy: "Политика конфиденциальности",
    personalDataPolicy: "Политика обработки персональных данных",
    terms: "Пользовательское соглашение",
    offer: "Публичная оферта",
    cookies: "Использование cookie",
    rights: "© {year} {brand}. Все права защищены.",
    sellerHeading: "Продавец",
    sellerPending:
      "Продавец для этого рынка ещё регистрируется. Реквизиты будут указаны здесь до начала продаж — до этого момента заказ носит предварительный характер.",
  },

  // ─── Region and language switcher ───────────────────────────────────────────
  switcher: {
    label: "Страна и язык",
    country: "Страна",
    language: "Язык",
    russia: "Россия",
    uzbekistan: "Узбекистан",
    change: "Изменить",
    note: "От страны зависят цена, доставка и документы.",
  },

  // ─── Home ───────────────────────────────────────────────────────────────────
  home: {
    heroEyebrow: "Персональная сказка о вашем ребёнке",
    heroTitleLead: "Ваш ребёнок становится",
    heroTitleAccent: "героем настоящей книги",
    heroLead:
      "Добавьте имя и фотографию — мы создадим волшебную историю с вашим ребёнком на каждой странице.",
    heroCtaPrimary: "Создать свою книгу",
    heroCtaSecondary: "Посмотреть книги",
    heroSpec: "Персональная обложка · {pages} иллюстрированных страниц · твёрдый переплёт",
    videoLabel:
      "Фотография ребёнка превращается в иллюстрацию, а затем в напечатанную книгу",

    trustName: "Имя ребёнка в истории",
    trustPhoto: "Фото в иллюстрациях",
    trustPaper: "Плотная бумага, твёрдый переплёт",
    trustPages: "{pages} иллюстрированных страниц",

    booksEyebrow: "Выберите приключение",
    booksHeading: "История, в которой главный герой — ваш ребёнок",

    howEyebrow: "Как это работает",
    howHeading: "Четыре шага до вашей книги",
    howNote:
      "После загрузки фотографии вы увидите предварительный макет и сможете проверить данные перед заказом.",

    step1Title: "Выберите историю",
    step1Text:
      "Истории про машинки, животных и чудеса — отдельно для мальчика и для девочки, от 2 до 9 лет.",
    step2Title: "Добавьте имя и фотографию",
    step2Text: "Имя войдёт в текст, а лицо ребёнка — в иллюстрации.",
    step3Title: "Проверьте превью",
    step3Text: "Покажем предварительный макет — вы всё проверите до заказа.",
    step4Title: "Получите книгу",
    step4Text: "Печатаем и отправляем настоящую книгу в твёрдой обложке.",

    receiveEyebrow: "Что вы получите",
    receiveHeading: "Настоящая книга, а не файл",
    receiveLead:
      "Мы печатаем и переплетаем каждый экземпляр отдельно — это книга, которую можно поставить на полку и перечитывать годами.",

    reviewsEyebrow: "Отзывы",
    reviewsHeading: "Что говорят родители",
    reviewsLead: "Отзывы покупателей, получивших книгу.",
    reviewsAll: "Все отзывы",

    faqEyebrow: "Вопросы",
    faqHeading: "Частые вопросы",
    faqAll: "Все вопросы",

    ctaHeading: "Подарите ребёнку историю, которую он запомнит",
    ctaButton: "Создать персональную книгу",

    emptyHeading: "Каталог скоро откроется",
    emptyLead: "Мы готовим наши истории к публикации. Загляните чуть позже.",
    emptyCta: "Связаться с нами",
  },

  // ─── How it works ───────────────────────────────────────────────────────────
  howItWorks: {
    metaTitle: "Как это работает",
    metaDescription:
      "Четыре шага: выберите историю, добавьте имя и фотографию, проверьте предварительный макет и получите напечатанную книгу.",
    eyebrow: "Как это работает",
    heading: "От фотографии до книги на полке",
    lead:
      "Показываем весь путь: как обычный снимок превращается в иллюстрацию, а история — в настоящую напечатанную книгу.",

    step1Title: "Выберите историю",
    step1Text:
      "Истории про машинки, животных и чудеса — отдельно для мальчика и для девочки, от 2 до 9 лет. Все книги одинаковой длины и качества печати.",
    step2Title: "Добавьте имя и фотографию",
    step2Text:
      "Имя ребёнка войдёт в текст истории, а фотография станет основой для иллюстраций, где он будет главным героем.",
    step3Title: "Проверьте превью",
    step3Text:
      "После загрузки фотографии вы увидите предварительный макет и сможете проверить все данные перед оформлением заказа.",
    step4Title: "Получите книгу",
    step4Text:
      "Мы печатаем книгу под ваш заказ и отправляем её вам. Стоимость и срок доставки рассчитываются при оформлении.",

    photoHeading: "Какое фото подойдёт",
    photoLead:
      "Чем чётче снимок, тем точнее художник нарисует ребёнка в иллюстрациях.",
    photoPrivacy:
      "Фотография используется только для создания вашей книги. Мы не публикуем её и не передаём для рекламы.",

    receiveHeading: "Что вы получите",
    receiveLead:
      "{pages} иллюстрированных страниц в твёрдой обложке — книга, которую можно поставить на полку.",
    receiveCta: "Выбрать историю",
  },

  /** What makes a photograph the illustrator can actually work from. */
  photoTips: [
    "Лицо крупным планом",
    "Хорошее естественное освещение",
    "Светлый однотонный фон",
    "Ребёнок смотрит в камеру",
    "Без солнцезащитных очков",
    "Не групповое фото",
  ],

  // ─── About ──────────────────────────────────────────────────────────────────
  about: {
    metaTitle: "О нас",
    metaDescription:
      "Капибара печатает персональные книги, где главным героем становится ваш ребёнок. Рассказываем, как мы их создаём и как бережно обращаемся с фотографиями.",
    eyebrow: "О нас",
    heading: "Мы делаем книги, в которых ребёнок узнаёт себя",
    lead:
      "Капибара — небольшая студия. Мы пишем, рисуем и печатаем истории, где главным героем становится конкретный ребёнок: с его именем в тексте и лицом в иллюстрациях.",

    whyHeading: "Почему персональные книги",
    whyFirst:
      "Дети читают охотнее, когда история про них. Собственное имя на странице превращает чтение в игру и повод возвращаться к книге снова и снова.",
    whySecond:
      "Мы начали с одной истории про автомобильчика Колёсика — в двух версиях, для мальчика и для девочки. Сегодня в каталоге {count} историй для детей от 2 до 9 лет, и серия продолжает расти.",

    valuesHeading: "Что для нас важно",
    value1Title: "Истории, а не шаблоны",
    value1Text:
      "Каждая книга написана и нарисована так, чтобы ребёнку хотелось вернуться к ней снова.",
    value2Title: "Честная печать",
    value2Text:
      "Плотная бумага, твёрдая обложка, аккуратный переплёт. Книга должна пережить много прочтений.",
    value3Title: "Бережно с фотографиями",
    value3Text:
      "Фото используется только для вашей книги. Мы не публикуем его и не передаём для рекламы.",

    ctaHeading: "Создайте книгу для своего ребёнка",
    ctaButton: "Выбрать историю",
  },

  // ─── Delivery and payment ───────────────────────────────────────────────────
  delivery: {
    metaTitle: "Доставка и оплата",
    metaDescription:
      "Как мы печатаем и доставляем персональные книги Капибара, какие есть способы оплаты и что делать при браке.",
    eyebrow: "Доставка",
    heading: "Доставка и оплата",

    printTitle: "Печать",
    printText:
      "Каждая книга печатается отдельно под ваш заказ: {pages} иллюстрированных страниц, твёрдая обложка, квадратный формат. Мы сообщим срок изготовления при подтверждении заказа.",

    deliveryTitle: "Доставка",

    paymentTitle: "Оплата",
    /** Shown only when an online payment provider is actually connected. */
    paymentOnline:
      "Банковской картой онлайн при оформлении заказа. Способ оплаты подтверждается вместе с заказом.",
    /**
     * The honest default. Online payment is not connected, and saying that a
     * card is accepted when the site cannot take one is the kind of promise
     * that turns into a complaint.
     */
    paymentOnConfirmation:
      "Онлайн-оплата на сайте пока не подключена. Вы оформляете заказ, менеджер связывается с вами, подтверждает стоимость вместе с доставкой и присылает реквизиты для оплаты.",

    defectTitle: "Если что-то не так",
    defectText:
      "Если книга придёт повреждённой или с браком печати — напишите нам с фотографиями, и мы бесплатно перепечатаем экземпляр.",

    questionsLead: "Остались вопросы о доставке?",
    questionsLink: "Напишите нам",
    questionsTail: "— ответим и поможем.",

    /** What differs between the two markets, in the reader's language. */
    regions: {
      RU: {
        lead: "Мы печатаем книги под заказ и отправляем их по всей России.",
        delivery:
          "Отправляем по всей России: курьером, в пункт выдачи или Почтой России. Стоимость и срок рассчитываются при оформлении заказа — они зависят от вашего города и выбранной службы.",
      },
      UZ: {
        lead: "Мы печатаем книги под заказ и отправляем их по всему Узбекистану.",
        delivery:
          "Курьером по Ташкенту и почтой в другие регионы Узбекистана. Стоимость и срок рассчитываются при оформлении заказа — менеджер подтвердит их вместе с заказом.",
      },
    },
  },

  // ─── FAQ, contact, reviews ──────────────────────────────────────────────────
  faqPage: {
    metaTitle: "Частые вопросы",
    metaDescription:
      "Ответы на частые вопросы о персонализации, изготовлении, доставке и оплате книг Капибара.",
    heading: "Частые вопросы",
    lead: "Ответы на самые популярные вопросы о наших книгах",
    notFoundHeading: "Не нашли ответ?",
    notFoundLead: "Напишите нам — мы ответим на почту или по телефону",
    notFoundCta: "Написать нам",
  },

  contact: {
    metaTitle: "Контакты",
    metaDescription:
      "Как связаться с Капибарой: электронная почта и телефон продавца.",
    heading: "Свяжитесь с нами",
    lead: "Напишите или позвоните — поможем с выбором истории, заказом и доставкой.",
    emailTitle: "Электронная почта",
    emailNote: "Самый надёжный способ: письмо не потеряется.",
    phoneTitle: "Телефон",
    phoneNote: "Звонок или сообщение.",
    addressTitle: "Адрес",
    addressNote: "Юридический адрес продавца. Заказы принимаем только онлайн.",
    /**
     * Shown in the Uzbek market while the local entity is still being
     * registered: the contacts are real and the same team answers them, and
     * saying which entity they belong to is more honest than presenting a
     * Russian address as a local one.
     */
    uzNote:
      "Локальное юридическое лицо в Узбекистане сейчас регистрируется. До этого момента на вопросы отвечает та же команда по контактам выше.",
  },

  reviewsPage: {
    metaTitle: "Отзывы",
    metaDescription: "Отзывы родителей о персональных книгах Капибара.",
    eyebrow: "Отзывы",
    heading: "Что говорят родители",
    verified: "Каждый отзыв здесь оставлен человеком, который получил книгу.",
    emptyHeading: "Отзывов пока нет",
    emptyLead:
      "Мы публикуем только отзывы покупателей, которые действительно получили книгу. Как только появятся первые — они будут здесь.",
    policy:
      "Мы не публикуем придуманные отзывы и не покупаем их. Оставить отзыв может только покупатель после доставки заказа.",
    cta: "Создать свою книгу",
  },

  // ─── Site metadata ──────────────────────────────────────────────────────────
  meta: {
    siteName: "Капибара",
    titleDefault: "Капибара — персональные детские книги",
    titleTemplate: "%s | Капибара",
    description:
      "Создайте книгу, в которой главным героем станет ваш ребёнок: его имя в тексте и его лицо в иллюстрациях.",
    ogTitle: "Капибара — персональные детские книги",
    ogDescription: "Книга, где главный герой — ваш ребёнок.",
    keyword1: "персонализированные книги",
    keyword2: "детские книги с именем",
    keyword3: "книга с фото ребёнка",
    keyword4: "подарок ребёнку",
    keyword5: "именная книга",
    notFoundTitle: "Страница не найдена",
  },

  // ─── Messages the server sends back ─────────────────────────────────────────
  //
  // Server actions look these up with the locale the caller passed, so a
  // failure explains itself in the language the customer is reading.
  errors: {
    recipientName: "Укажите имя получателя",
    email: "Введите корректный адрес электронной почты",
    phone: "Введите корректный номер телефона",
    deliveryMethod: "Выберите способ доставки",
    deliveryAddress: "Укажите адрес доставки",
    cartEmpty: "Корзина пуста",
    productGone: "Один из товаров больше недоступен",
    productUnavailable: "«{title}» пока нельзя заказать",
    productNotSoldHere: "«{title}» пока не продаётся в вашей стране",
    childNameCyrillic: "Имя ребёнка должно быть написано кириллицей",
    childNameCyrillicLatin:
      "Имя ребёнка должно быть написано кириллицей или латиницей",
    orderFailed: "Не удалось оформить заказ. Попробуйте ещё раз",

    generationUnavailable: "Генерация иллюстраций пока недоступна",
    bookUnavailable: "Эта книга сейчас недоступна",
    bookNotPersonalizable: "Эта книга не персонализируется",
    photoAgain: "Загрузите фотографию ещё раз",

    rateLimitMinute: "Слишком много попыток. Попробуйте через минуту",
    rateLimitMinutes: "Слишком много попыток. Попробуйте через {count} мин.",
    rateLimitHours: "Слишком много попыток. Попробуйте через {count} ч.",
  },

  // ─── Personalization flow ───────────────────────────────────────────────────
  personalize: {
    metaTitle: "Создание книги",
    stepBook: "Книга",
    stepChild: "Ребёнок",
    stepPhoto: "Фото",
    stepPreview: "Превью",
    heading: "Создание книги",

    summaryHero: "Главный герой",
    summaryPages: "Страниц",
    summaryCover: "Обложка",
    summaryCoverValue: "Твёрдая",
    summaryPhoto: "Фото",
    summaryPhotoDone: "Загружено",
    summaryPhotoNone: "Не добавлено",
    summaryPrice: "Цена",

    chosenHeading: "Вы выбрали историю",
    chosenLead: "Проверьте книгу и продолжайте — дальше добавим имя и фото.",
    chosenContinue: "Продолжить",

    childHeading: "Расскажите о ребёнке",
    childLead: "Имя появится в тексте истории.",
    nameLabel: "Имя ребёнка",
    namePlaceholder: "Например: Максим",
    nameHintCyrillic: "Введите имя кириллицей",
    nameHintCyrillicLatin: "Имя можно ввести латиницей или кириллицей",
    nameErrorScriptCyrillic: "Используйте только кириллицу",
    nameErrorScriptCyrillicLatin: "Используйте только буквы",
    nameErrorShort: "Введите имя — минимум 2 буквы",
    ageLabel: "Возраст",
    dedicationLabel: "Посвящение",
    dedicationOptional: "(необязательно)",
    dedicationPlaceholder: "Дорогой Максим! Эта книга для тебя…",
    dedicationHint: "Напечатаем на первой странице",
    back: "Назад",
    next: "Далее",

    photoHeading: "Добавьте фотографию",
    photoLead:
      "По этому снимку художник нарисует героя книги. Имя уже сохранили: {name}.",
    photoPrivacy:
      "Фотография используется только для создания вашей книги. Мы не публикуем её и не передаём для рекламы.",
    skip: "Пропустить",

    reviewHeading: "Всё готово",
    reviewLead: "Проверьте данные — дальше покажем предварительный макет.",
    reviewBook: "Книга",
    reviewName: "Имя",
    reviewAge: "Возраст",
    reviewPhoto: "Фото",
    reviewPhotoNone: "Без фото",
    reviewDedication: "Посвящение",
    reviewDedicationAdded: "Добавлено",
    reviewDedicationNone: "—",
    reviewCover: "Обложка",
    reviewTotal: "К оплате",
    showPreview: "Показать превью",
  },

  /** Short photo hints shown beside the upload box. */
  photoTipsShort: [
    "Лицо крупным планом",
    "Хорошее освещение",
    "Светлый однотонный фон",
    "Ребёнок смотрит в камеру",
  ],

  upload: {
    alt: "Фото ребёнка",
    uploading: "Загружаем…",
    remove: "Удалить фото",
    drop: "Отпустите фото",
    choose: "Загрузите фото",
    hint: "Перетащите или нажмите, чтобы выбрать.",
    limits: "JPG, PNG · до 8 МБ",
  },

  generation: {
    manualHeading: "Иллюстрации создаются вручную",
    manualBody:
      "Автоматическая генерация ещё не подключена. Наш художник вставит лицо вашего ребёнка в иллюстрации после подтверждения заказа, и мы пришлём готовый макет на согласование.",
    needPhoto:
      "Загрузите фотографию ребёнка, чтобы увидеть, как он будет выглядеть в иллюстрациях.",
    inviteHeading: "Посмотрите иллюстрации с вашим ребёнком",
    inviteBody:
      "Мы создадим несколько разворотов, чтобы вы увидели книгу до заказа. Это займёт около минуты.",
    starting: "Запускаем…",
    start: "Создать иллюстрации",
    failedHeading: "Не удалось создать иллюстрации",
    failedBody:
      "Попробуйте другую фотографию: лицо должно быть крупным, в фокусе и при хорошем освещении. Заказ можно оформить и без предпросмотра — мы согласуем макет с вами до печати.",
    retry: "Попробовать ещё раз",
    doneHeading: "Обложка с {name} готова",
    doneBody:
      "Так {name} будет выглядеть на страницах книги. Окончательный макет мы согласуем с вами до печати.",
    working:
      "Рисуем {name} в сценах книги. Обычно это занимает одну–три минуты, а с крупной фотографией — дольше. Страницу можно закрыть — работа продолжится, и результат сохранится.",
    slow:
      "Создание иллюстраций занимает дольше обычного. Работа продолжается в фоне — можно закрыть страницу, мы пришлём готовый макет.",
  },

  preview: {
    notFoundTitle: "Превью не найдено",
    notFoundBody:
      "Похоже, ссылка устарела. Создайте книгу заново — это займёт пару минут.",
    notFoundCta: "Выбрать книгу",
    back: "Назад",
    savedHeading: "Данные сохранены — можно оформлять заказ",
    heroLead: "Главный герой —",
    specPages: "Страниц",
    specCover: "Обложка",
    specCoverValue: "Твёрдая",
    specAge: "Возраст",
    specFormat: "Формат",
    specFormatValue: "Квадратный",
    deliveryNote:
      "Стоимость и срок доставки рассчитываются при оформлении заказа.",
    checkout: "Оформить заказ",
    added: "Добавлено в корзину",
    addToCart: "Добавить в корзину",
    assuranceName: "Имя и фото ребёнка внутри книги",
    assuranceDeliveryRU: "Печатаем и отправляем по России",
    assuranceDeliveryUZ: "Печатаем и отправляем по Узбекистану",
    assurancePrivacy: "Фотография используется только для вашей книги",
    moreAbout: "Подробнее о книге",
    personalizationHeading: "Персонализация",
    inSceneCaption: "{name} в сцене из книги",
    drawing: "Рисуем {name}",
    drawingNote: "Обычно одна–три минуты. Готовая иллюстрация появится прямо здесь.",
    photoAlt: "Фотография: {name}",
    noPhoto: "нет фото",
    heroAge: "{age} лет · главный герой",
    heroRole: "Главный герой истории",
    seriesCoverNote:
      "Это обложка серии. Иллюстрация с вашим ребёнком создаётся ниже — окончательный макет мы согласуем с вами до печати.",
  },

  // ─── Cart and checkout ──────────────────────────────────────────────────────
  cart: {
    metaTitle: "Корзина",
    emptyTitle: "Корзина пуста",
    emptyBody: "Выберите историю и создайте книгу с именем вашего ребёнка.",
    emptyCta: "Выбрать книгу",
    toCatalog: "В каталог",
    heading: "Корзина",
    goToCheckout: "Перейти к оформлению",
    hero: "Главный герой:",
    decrease: "Уменьшить количество",
    quantity: "Количество: {count}",
    increase: "Увеличить количество",
    removeItem: "Удалить «{title}» из корзины",
  },

  checkout: {
    metaTitle: "Оформление заказа",
    heading: "Оформление заказа",
    lead: "Заполните данные получателя — это займёт минуту.",
    addressHeading: "Адрес доставки",
    fullName: "Имя и фамилия",
    fullNamePlaceholder: "Иван Иванов",
    phone: "Телефон",
    email: "Электронная почта",
    emailHint: "Отправим на неё подтверждение заказа",
    city: "Город",
    cityPlaceholder: "Москва",
    postalCode: "Почтовый индекс",
    street: "Улица и дом",
    streetPlaceholder: "ул. Пушкина, д. 10",
    apartment: "Квартира",
    required: "Обязательное поле",
    emailInvalid: "Введите корректный адрес",
    deliveryNote:
      "Стоимость и срок доставки рассчитываются после оформления — мы свяжемся с вами для подтверждения.",

    paymentHeading: "Способ оплаты",
    paymentOnlineTitle: "Онлайн-оплата картой",
    paymentManualTitle: "Оплата после подтверждения",
    paymentOnlineBody:
      "После оформления вы перейдёте на защищённую страницу оплаты. Заказ подтвердится автоматически, как только платёж пройдёт.",
    paymentManualBody:
      "Мы свяжемся с вами, уточним детали и сумму доставки, а затем договоримся об оплате. Деньги сейчас не списываются.",
    paymentOnlineNote:
      "Данные карты вводятся на стороне платёжного провайдера — мы их не получаем и не храним.",
    paymentManualNote: "Мы не просим данные карты на сайте и не храним их.",

    summaryHeading: "Ваш заказ",
    summaryHero: "герой: {name}",
    summaryBooks: "Книги",
    summaryDelivery: "Доставка",
    summaryDeliveryValue: "рассчитывается при оформлении",
    summaryTotal: "Итого",
    submit: "Оформить заказ",
    submitting: "Оформляем…",
    secure: "Безопасное оформление заказа",
    termsLead: "Нажимая «{action}», вы соглашаетесь с",
    termsLink: "условиями",
  },

  orderSuccess: {
    metaTitle: "Заказ оформлен",
    headingPaid: "Заказ оформлен",
    headingAwaiting: "Заказ создан, ждём оплату",
    orderNumber: "Номер заказа",
    thanks: "Спасибо за заказ. Детали доступны в личном кабинете.",
    paymentHeading: "Оплата",
    paymentPaid: "Оплата получена.",
    paymentPending:
      "Оплата ещё не поступила. Если вы её отменили, свяжитесь с нами — мы поможем оплатить заказ.",
    paymentManual:
      "Оплата после подтверждения заказа — мы свяжемся с вами по телефону.",
    nextHeading: "Что дальше",
    nextBody:
      "Мы подтвердим заказ, добавим имя и фотографию в иллюстрации и отправим книгу в печать. Статус виден в личном кабинете.",
    mailHeading: "Письмо",
    mailSent: "Мы отправили подтверждение{recipient}.",
    mailNotConfigured:
      "Отправка писем ещё не настроена — следите за статусом в личном кабинете.",
    keptNote:
      "Заказ сохранён и не потеряется. Мы придержим его и свяжемся с вами, если оплата не поступит.",
    myOrders: "Мои заказы",
    keepShopping: "Продолжить покупки",
  },

  // ─── Sign-in, registration and password recovery ────────────────────────────
  auth: {
    loginTitle: "Вход",
    loginLead: "Рады видеть вас снова",
    email: "Электронная почта",
    emailRequired: "Введите электронную почту",
    password: "Пароль",
    passwordPlaceholder: "Введите пароль",
    passwordRequired: "Введите пароль",
    forgotPassword: "Забыли пароль?",
    signingIn: "Входим…",
    signIn: "Войти",
    noAccount: "Нет аккаунта?",
    register: "Зарегистрироваться",

    registerTitle: "Создать аккаунт",
    registerLead: "Чтобы сохранять книги и следить за заказами",
    name: "Имя",
    namePlaceholder: "Как к вам обращаться",
    passwordMinPlaceholder: "Минимум {min} символов",
    passwordHint: "Не менее {min} символов, минимум одна буква и одна цифра",
    passwordRepeat: "Повторите пароль",
    passwordRepeatPlaceholder: "Введите пароль ещё раз",
    consentsLegend: "Обязательные согласия",
    consentPersonalData:
      "Я даю согласие на обработку моих персональных данных в соответствии с",
    consentPersonalDataLink: "Политикой в отношении обработки персональных данных",
    consentTermsLead: "Я прочитал и принимаю условия",
    consentTermsLink: "Пользовательского соглашения",
    consentTermsAnd: "и",
    consentTermsPolicyLink: "обработки персональных данных",
    creating: "Создаём аккаунт…",
    createAccount: "Создать аккаунт",
    haveAccount: "Уже есть аккаунт?",
    accountCreated: "Аккаунт создан",
    accountCreatedLead:
      "Добро пожаловать в Капибару! Теперь вы можете оформлять заказы и следить за ними в личном кабинете.",
    toAccount: "Перейти в личный кабинет",

    forgotTitle: "Восстановление пароля",
    forgotLead:
      "Введите адрес, на который зарегистрирован аккаунт — мы пришлём ссылку для смены пароля.",
    forgotSentTitle: "Проверьте почту",
    forgotSentLead:
      "Если этот адрес зарегистрирован, мы отправили на него ссылку для смены пароля.",
    forgotSentNote: "Ссылка действует один час и сработает только один раз.",
    backToLogin: "Вернуться ко входу",
    emailInvalid: "Введите корректный адрес электронной почты",
    sending: "Отправляем…",
    sendLink: "Отправить ссылку",
    rememberedPassword: "Вспомнили пароль?",

    resetTitle: "Новый пароль",
    resetLead: "Придумайте пароль, который вы ещё нигде не использовали.",
    resetLinkBroken: "Ссылка не работает",
    requestNewLink: "Запросить новую ссылку",
    newPassword: "Новый пароль",
    newPasswordRequired: "Введите новый пароль",
    passwordTooShort: "Пароль должен содержать не менее {min} символов",
    passwordNeedsLetterAndDigit:
      "Пароль должен содержать хотя бы одну букву и одну цифру",
    passwordRepeatRequired: "Повторите пароль",
    passwordMismatch: "Пароли не совпадают",
    saving: "Сохраняем…",
    savePassword: "Сохранить пароль",
    passwordChanged: "Пароль изменён",

    verifyTitle: "Подтверждение адреса",
    verifyFailed: "Не удалось подтвердить адрес",
    verifyFailedLead:
      "Войдите в аккаунт — в личном кабинете можно запросить новое письмо.",
    verifiedTitle: "Адрес подтверждён",
    verifiedLead: "{email} — теперь мы сможем присылать вам письма о заказах.",
    toAccountShort: "В личный кабинет",
  },

  authErrors: {
    emailInvalid: "Введите корректный адрес электронной почты",
    emailTaken: "Этот адрес уже зарегистрирован",
    passwordShort: "Пароль должен содержать не менее {min} символов",
    passwordWeak: "Пароль должен содержать хотя бы одну букву и одну цифру",
    passwordMismatch: "Пароли не совпадают",
    nameRequired: "Введите имя",
    consentsRequired: "Для регистрации необходимо принять обязательные условия",
    generic: "Не удалось создать аккаунт. Попробуйте ещё раз",
    invalidCredentials: "Неверная почта или пароль",
    // Worded so they never reveal whether an address is registered — that
    // would turn the reset form into an account-enumeration tool.
    linkInvalid: "Ссылка недействительна. Запросите новую",
    linkExpired: "Срок действия ссылки истёк. Запросите новую",
    linkUsed: "Ссылка уже использована. Запросите новую",
    resetFailed: "Не удалось сменить пароль. Попробуйте ещё раз",
    verifyFailed: "Не удалось подтвердить адрес. Попробуйте ещё раз",
    alreadyVerified: "Адрес уже подтверждён",
  },

  // ─── Order, payment and delivery vocabulary ─────────────────────────────────
  //
  // The database stores these as codes; this is what a customer reads. The back
  // office has its own Russian labels in constants.ts and does not use these.
  orderStatus: {
    new: "Новый",
    awaiting_confirmation: "Ожидает подтверждения",
    in_progress: "В работе",
    personalization: "На персонализации",
    sent_to_print: "Отправлен в печать",
    ready_to_ship: "Готов к отправке",
    in_delivery: "Передан в доставку",
    completed: "Завершён",
    cancelled: "Отменён",
  },
  paymentStatus: {
    unpaid: "Не оплачен",
    pay_on_confirmation: "Оплата при подтверждении",
    paid: "Оплачен",
    refunded: "Возврат",
  },
  deliveryMethod: {
    courier: "Курьером",
    pickup_point: "В пункт выдачи",
    post: "Почтой",
  },

  // ─── Personal account ───────────────────────────────────────────────────────
  account: {
    metaTitle: "Личный кабинет",
    greeting: "Здравствуйте, {name}!",
    ordersTotal: "Всего заказов",
    createBook: "Создать новую книгу",
    toCatalog: "В каталог",
    recentOrders: "Последние заказы",
    allOrders: "Все заказы",
    noOrders: "У вас пока нет заказов",
    noOrdersLead:
      "Создайте первую персональную книгу — имя и фотография вашего ребёнка станут частью истории.",
    chooseBook: "Выбрать книгу",

    ordersTitle: "Мои заказы",
    reviewInviteOne: "Расскажите о своей книге",
    reviewInviteMany: "Расскажите о своих книгах",
    reviewInviteLead:
      "Ваш заказ доставлен — поделитесь впечатлением. Отзыв появится на сайте после проверки.",
    noOrdersYet: "У вас пока нет заказов",
    noOrdersYetLead:
      "Как только вы оформите первый заказ, он появится здесь вместе со статусом изготовления.",
    orderedOn: "от {date}",

    orderTitle: "Заказ",
    orderContents: "Состав заказа",
    childName: "Имя ребёнка:",
    childAge: "Возраст:",
    photo: "Фотография:",
    photoUploaded: "Загружена",
    photoMissing: "Не добавлена",
    dedication: "Посвящение:",
    goods: "Товары",
    delivery: "Доставка",
    deliveryPending: "рассчитывается",
    total: "Итого",
    payment: "Оплата",
    deliveryHeading: "Доставка",
    recipient: "Получатель",
    history: "История заказа",

    profileTitle: "Профиль",
    profileLead: "Эти данные мы используем при оформлении заказа.",
    securityTitle: "Безопасность",
    securityLead: "Смена пароля для входа в личный кабинет.",

    navOverview: "Обзор",
    navProfile: "Профиль",
    navOrders: "Мои заказы",
    navSecurity: "Безопасность",
    navAria: "Разделы личного кабинета",

    name: "Имя",
    email: "Электронная почта",
    emailHint: "Адрес используется для входа и изменить его пока нельзя",
    phone: "Телефон",
    saved: "Изменения сохранены",
    saving: "Сохраняем…",
    save: "Сохранить",

    currentPassword: "Текущий пароль",
    newPassword: "Новый пароль",
    passwordHint: "Не менее {min} символов, минимум одна буква и одна цифра",
    repeatNewPassword: "Повторите новый пароль",
    passwordUpdated: "Пароль обновлён",
    changePassword: "Изменить пароль",

    verifyHeading: "Подтвердите адрес почты",
    verifyLead:
      "Мы отправили письмо на {email}. Без подтверждения письма о заказах могут не дойти.",
    verifySending: "Отправляем…",
    verifyResend: "Отправить ещё раз",
  },

  review: {
    thanks:
      "Спасибо! Отзыв отправлен на проверку и появится на сайте после модерации.",
    heading: "Оцените книгу «{title}»",
    childLine: "Имя ребёнка: {name}",
    ratingLegend: "Оценка от 1 до 5",
    ratingValue: "{value} из 5",
    textLabel: "Ваш отзыв",
    textPlaceholder: "Что понравилось вам и ребёнку? Как выглядит книга вживую?",
    charsLeft: "Ещё {count} символов",
    sending: "Отправляем…",
    submit: "Отправить отзыв",
    note:
      "Отзыв появится на сайте после проверки. Мы публикуем его под именем и первой буквой фамилии.",
  },

  // ─── Odds and ends ──────────────────────────────────────────────────────────
  misc: {
    notFoundHeading: "Эта страница потерялась в волшебном лесу",
    notFoundLead:
      "Возможно, страница переехала или ссылка устарела — но ваша книга точно никуда не делась.",
    toHome: "На главную",
    toCatalog: "В каталог",
    toFaq: "Частые вопросы",

    noAccessTitle: "Нет доступа",
    noAccessHeading: "Недостаточно прав",
    noAccessLead:
      "Этот раздел доступен только администраторам. Если вам нужен доступ, обратитесь к владельцу магазина.",
    toAccount: "В личный кабинет",

    coverAlt: "Обложка книги «{title}»",
    previewMetaTitle: "Превью книги",
    storyNotFound: "История не найдена",
    personalizationMetaTitle: "Персонализация — {title}",
    personalizationMetaDescription:
      "Добавьте имя и фотографию ребёнка в книгу «{title}».",
    notOrderable: "«{title}» пока нельзя заказать",
    notOrderableLead:
      "Эта история ещё готовится к выпуску. Мы сообщим, когда её можно будет персонализировать.",

    cookieAria: "Использование файлов cookie",
    cookieBody:
      "Мы используем файлы cookie, чтобы работали вход в аккаунт и корзина. Аналитические — только с вашего согласия.",
    cookieMore: "Подробнее",
    cookieAcceptAll: "Принять все",
    cookieEssentialOnly: "Только необходимые",
    cookieSettings: "Настройки cookie",

    galleryRole: "карусель",
    galleryAria: "Фотографии книги",
    slideRole: "слайд",
    slideOf: "{index} из {total}",
    prevPhoto: "Предыдущая фотография",
    nextPhoto: "Следующая фотография",
    openFullscreen: "Открыть фотографию во весь экран",
    goToPhoto: "Перейти к фотографии {index}",
    showPhoto: "Показать фотографию {index}: {alt}",
    viewingPhoto: "Просмотр фотографии",

    ratingAria: "Оценка {rating} из 5",
    aboutBook: "О книге:",
    demoReview: "Демонстрационный отзыв",
    verifiedPurchase: "Подтверждённая покупка",

    pauseVideo: "Поставить видео на паузу",
    resumeVideo: "Продолжить видео",
    hidePassword: "Скрыть пароль",
    showPassword: "Показать пароль",
  },

  // ─── Catalogue ──────────────────────────────────────────────────────────────
  catalog: {
    metaTitle: "Каталог персональных книг",
    metaDescription:
      "Истории, где главным героем становится ваш ребёнок: его имя в тексте и его лицо в иллюстрациях. Для детей от 2 до 9 лет.",
    eyebrow: "Каталог",
    heading: "Каталог персональных книг",
    subheading:
      "Каждая книга печатается специально для вашего ребёнка — с его именем в тексте и фотографией в иллюстрациях.",
    upcomingHeading: "Новые истории уже создаются",
    upcomingLead: "Мы рисуем и пишем продолжение серии. Вот над чем идёт работа:",
  },

  /** Stories we are working on but do not sell yet. */
  upcomingStories: [
    "История о морском путешествии",
    "История о полёте к звёздам",
    "История о первом дне в школе",
  ],

  // ─── Book card and product page ─────────────────────────────────────────────
  book: {
    create: "Создать эту книгу",
    createShort: "Создать книгу",
    moreAbout: "Подробнее о книге «{title}»",
    breadcrumbAria: "Хлебные крошки",
    deliveryNote:
      "Стоимость и срок доставки рассчитываются при оформлении заказа.",
    galleryCaption: "Настоящие фотографии напечатанной книги",
    coverCaption: "Настоящая обложка книги — именно её вы получите",
    includesHeading: "Что входит в книгу",
    storyHeading: "Об истории",
    personalizationHeading: "Как книга становится персональной",
    personalizationLead:
      "После загрузки фотографии вы увидите предварительный макет и сможете проверить данные перед заказом.",
    personalizationName: "Имя ребёнка встречается в тексте истории",
    personalizationFace: "Лицо ребёнка появляется в иллюстрациях",
    personalizationDedication: "Персональное посвящение на первой странице",
    printHeading: "Печать и доставка",
    printBody:
      "Каждая книга печатается отдельно под ваш заказ. Стоимость и срок доставки рассчитываются при оформлении заказа — они зависят от вашего города.",
    reviewsHeading: "Отзывы о книге",
    reviewCount: {
      one: "{count} отзыв",
      few: "{count} отзыва",
      many: "{count} отзывов",
      other: "{count} отзыва",
    },
    faqHeading: "Частые вопросы",
    otherStoriesHeading: "Другие истории",
  },

  /** What every copy includes — one shared spec, since there is one product. */
  bookIncludes: [
    "Имя ребёнка в тексте истории",
    "Фотография ребёнка в иллюстрациях",
    "Персональное посвящение на первой странице",
    "{pages} иллюстрированных страниц",
    "Твёрдая обложка, квадратный формат",
    "Плотная бумага с матовым покрытием",
  ],

  // ─── Frequently asked questions ─────────────────────────────────────────────
  faq: [
    {
      question: "Как создаётся персональная книга?",
      answer:
        "Вы выбираете историю, вводите имя ребёнка и загружаете его фотографию. После загрузки вы увидите предварительный макет и сможете проверить все данные перед оформлением заказа.",
    },
    {
      question: "Что входит в книгу?",
      answer:
        "Твёрдая обложка квадратного формата, 40 иллюстрированных страниц, имя ребёнка в тексте истории, его фотография в иллюстрациях и персональное посвящение на первой странице.",
    },
    {
      question: "Какое фото лучше загрузить?",
      answer:
        "Подойдёт чёткая фотография лица крупным планом при хорошем освещении, желательно на светлом фоне. Не используйте групповые снимки и фотографии в тёмных очках.",
    },
    {
      // Deliberately does not promise automatic deletion or that the photo
      // stays with us alone: neither is true. Retention is not implemented, and
      // the illustration provider necessarily receives the image. Saying
      // otherwise would be a false claim about a child's data.
      question: "Что происходит с фотографией ребёнка?",
      answer:
        "Фотография хранится в закрытом хранилище и используется только для создания вашей книги: её видят сотрудники, работающие над заказом, и сервис, который создаёт иллюстрации. Мы не публикуем её и не передаём для рекламы. Чтобы удалить фотографию, напишите нам — мы удалим её по вашему запросу.",
    },
    {
      question: "Сколько стоит доставка?",
      answer:
        "Стоимость и срок доставки рассчитываются при оформлении заказа — они зависят от вашего города и выбранной службы.",
    },
    {
      question: "Можно ли заказать книгу в подарок?",
      answer:
        "Да. При оформлении заказа укажите адрес получателя, а в поле посвящения — тёплые слова, которые мы напечатаем на первой странице.",
    },
    {
      question: "Когда появятся новые истории?",
      answer:
        "Каталог пополняется: сейчас в нём истории про машинки, животных, зиму и волшебство — для детей от 2 до 9 лет, отдельно для мальчика и для девочки. О новых книгах рассказываем в наших соцсетях.",
    },
  ],
} as const;

/**
 * The Russian dictionary's shape, with every literal widened.
 *
 * `as const` above is what makes the keys exhaustive; without the widening
 * here, a translation would have to repeat the Russian text verbatim to
 * typecheck. Recursive, so a section may nest or hold a list.
 */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ru>;
