import type { Dictionary } from "./ru";

/**
 * Uzbek, Latin script — the script in official use and the one children are
 * taught in.
 *
 * Typed against the Russian dictionary, so a key added there and forgotten
 * here is a compile error rather than a Russian sentence appearing on an
 * Uzbek page.
 *
 * The letters oʻ and gʻ are written with U+02BB (ʻ), not an apostrophe. It is
 * the correct character, it sorts and searches properly, and a straight quote
 * is the single most obvious tell of a machine translation.
 */
export const uz: Dictionary = {
  common: {
    brand: "Kapibara",
    loading: "Yuklanmoqda…",
    save: "Saqlash",
    cancel: "Bekor qilish",
    back: "Orqaga",
    close: "Yopish",
    continue: "Davom etish",
    retry: "Qayta urinib koʻring",
    remove: "Oʻchirish",
    edit: "Oʻzgartirish",
    yes: "Ha",
    no: "Yoʻq",
    required: "majburiy maydon",
    optional: "ixtiyoriy",
    priceOnRequest: "Narx aniqlanmoqda",
    notSoldHere: "Hozircha sizning mamlakatingizda sotilmaydi",
    pagesAndCover: "{pages} bet · qattiq muqova",
    ageRange: "{range}",
    somethingWentWrong: "Nimadir xato ketdi. Qayta urinib koʻring",
  },

  nav: {
    catalog: "Katalog",
    howItWorks: "Bu qanday ishlaydi",
    reviews: "Sharhlar",
    about: "Biz haqimizda",
    delivery: "Yetkazib berish",
    faq: "Koʻp beriladigan savollar",
    contact: "Aloqa",
    home: "Bosh sahifa",
  },

  header: {
    logoAria: "Kapibara — bosh sahifaga",
    mainNavAria: "Asosiy navigatsiya",
    mobileNavAria: "Mobil navigatsiya",
    cart: "Savat",
    cartWithCount: "Savat, mahsulotlar: {count}",
    openMenu: "Menyuni ochish",
    closeMenu: "Menyuni yopish",
    signIn: "Kirish",
    createAccount: "Hisob yaratish",
    account: "Shaxsiy kabinet",
    myOrders: "Mening buyurtmalarim",
    adminPanel: "Boshqaruv paneli",
    signOut: "Chiqish",
  },

  footer: {
    tagline:
      "Farzandingiz bosh qahramonga aylanadigan shaxsiy kitoblar.",
    booksHeading: "Kitoblar",
    infoHeading: "Maʼlumot",
    accountHeading: "Kabinet",
    legalHeading: "Hujjatlar",
    privacy: "Maxfiylik siyosati",
    personalDataPolicy: "Shaxsiy maʼlumotlarni qayta ishlash siyosati",
    terms: "Foydalanuvchi shartnomasi",
    offer: "Ommaviy oferta",
    cookies: "Cookie fayllardan foydalanish",
    rights: "© {year} {brand}. Barcha huquqlar himoyalangan.",
    sellerHeading: "Sotuvchi",
  },

  switcher: {
    label: "Mamlakat va til",
    country: "Mamlakat",
    language: "Til",
    russia: "Rossiya",
    uzbekistan: "Oʻzbekiston",
    change: "Oʻzgartirish",
    note: "Narx, yetkazib berish va hujjatlar mamlakatga bogʻliq.",
  },
};
