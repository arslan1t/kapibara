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
    ? Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };

export type Dictionary = Widen<typeof ru>;
