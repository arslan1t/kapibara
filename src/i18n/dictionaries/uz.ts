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
    sellerPending:
      "Ushbu bozor uchun sotuvchi hali roʻyxatdan oʻtkazilmoqda. Rekvizitlar sotuv boshlanishidan oldin shu yerda koʻrsatiladi — shu paytgacha buyurtma dastlabki xarakterga ega.",
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

  home: {
    heroEyebrow: "Farzandingiz haqidagi shaxsiy ertak",
    heroTitleLead: "Farzandingiz",
    heroTitleAccent: "haqiqiy kitobning qahramoniga aylanadi",
    heroLead:
      "Ism va fotosuratni qoʻshing — biz har bir sahifasida farzandingiz boʻlgan sehrli hikoya yaratamiz.",
    heroCtaPrimary: "Oʻz kitobingizni yarating",
    heroCtaSecondary: "Kitoblarni koʻrish",
    heroSpec: "Shaxsiy muqova · {pages} ta rasmli sahifa · qattiq muqova",
    videoLabel:
      "Bolaning fotosurati avval rasmga, soʻng chop etilgan kitobga aylanadi",

    trustName: "Bolaning ismi hikoyada",
    trustPhoto: "Fotosurat rasmlarda",
    trustPaper: "Zich qogʻoz, qattiq muqova",
    trustPages: "{pages} ta rasmli sahifa",

    booksEyebrow: "Sarguzashtni tanlang",
    booksHeading: "Bosh qahramoni farzandingiz boʻlgan hikoya",

    howEyebrow: "Bu qanday ishlaydi",
    howHeading: "Kitobingizgacha toʻrt qadam",
    howNote:
      "Fotosuratni yuklaganingizdan soʻng dastlabki maketni koʻrasiz va buyurtmadan oldin maʼlumotlarni tekshirib olasiz.",

    step1Title: "Hikoyani tanlang",
    step1Text:
      "Mashinalar, hayvonlar va moʻjizalar haqidagi hikoyalar — oʻgʻil bola va qiz bola uchun alohida, 2 yoshdan 9 yoshgacha.",
    step2Title: "Ism va fotosuratni qoʻshing",
    step2Text: "Ism matnga, bolaning yuzi esa rasmlarga kiradi.",
    step3Title: "Dastlabki maketni tekshiring",
    step3Text:
      "Dastlabki maketni koʻrsatamiz — buyurtmadan oldin hammasini tekshirasiz.",
    step4Title: "Kitobni qoʻlingizga oling",
    step4Text: "Qattiq muqovali haqiqiy kitobni chop etib joʻnatamiz.",

    receiveEyebrow: "Siz nima olasiz",
    receiveHeading: "Fayl emas, haqiqiy kitob",
    receiveLead:
      "Har bir nusxani alohida chop etamiz va muqovalaymiz — bu javonga qoʻyib, yillar davomida qayta oʻqiladigan kitob.",

    reviewsEyebrow: "Sharhlar",
    reviewsHeading: "Ota-onalar nima deydi",
    reviewsLead: "Kitobni qoʻlga olgan xaridorlarning sharhlari.",
    reviewsAll: "Barcha sharhlar",

    faqEyebrow: "Savollar",
    faqHeading: "Koʻp beriladigan savollar",
    faqAll: "Barcha savollar",

    ctaHeading: "Farzandingizga u eslab qoladigan hikoyani sovgʻa qiling",
    ctaButton: "Shaxsiy kitob yaratish",

    emptyHeading: "Katalog tez orada ochiladi",
    emptyLead: "Hikoyalarimizni nashrga tayyorlamoqdamiz. Birozdan soʻng kiring.",
    emptyCta: "Biz bilan bogʻlanish",
  },

  howItWorks: {
    metaTitle: "Bu qanday ishlaydi",
    metaDescription:
      "Toʻrt qadam: hikoyani tanlang, ism va fotosuratni qoʻshing, dastlabki maketni tekshiring va chop etilgan kitobni oling.",
    eyebrow: "Bu qanday ishlaydi",
    heading: "Fotosuratdan javondagi kitobgacha",
    lead:
      "Butun yoʻlni koʻrsatamiz: oddiy surat qanday qilib rasmga, hikoya esa haqiqiy chop etilgan kitobga aylanadi.",

    step1Title: "Hikoyani tanlang",
    step1Text:
      "Mashinalar, hayvonlar va moʻjizalar haqidagi hikoyalar — oʻgʻil bola va qiz bola uchun alohida, 2 yoshdan 9 yoshgacha. Barcha kitoblar bir xil hajmda va bir xil sifatda chop etiladi.",
    step2Title: "Ism va fotosuratni qoʻshing",
    step2Text:
      "Bolaning ismi hikoya matniga kiradi, fotosurat esa u bosh qahramon boʻlgan rasmlar uchun asos boʻladi.",
    step3Title: "Dastlabki maketni tekshiring",
    step3Text:
      "Fotosuratni yuklaganingizdan soʻng dastlabki maketni koʻrasiz va buyurtmani rasmiylashtirishdan oldin barcha maʼlumotlarni tekshirib olasiz.",
    step4Title: "Kitobni qoʻlingizga oling",
    step4Text:
      "Kitobni buyurtmangiz boʻyicha chop etamiz va sizga joʻnatamiz. Yetkazib berish narxi va muddati rasmiylashtirishda hisoblanadi.",

    photoHeading: "Qanday fotosurat mos keladi",
    photoLead:
      "Surat qanchalik aniq boʻlsa, rassom bolani rasmlarda shunchalik oʻxshatib chizadi.",
    photoPrivacy:
      "Fotosurat faqat sizning kitobingizni yaratish uchun ishlatiladi. Biz uni eʼlon qilmaymiz va reklama uchun bermaymiz.",

    receiveHeading: "Siz nima olasiz",
    receiveLead:
      "Qattiq muqovada {pages} ta rasmli sahifa — javonga qoʻyish mumkin boʻlgan kitob.",
    receiveCta: "Hikoyani tanlash",
  },

  photoTips: [
    "Yuz yaqindan koʻringan",
    "Yaxshi tabiiy yoritilgan",
    "Och rangli bir tusli fon",
    "Bola kameraga qarab turgan",
    "Quyoshdan saqlovchi koʻzoynaksiz",
    "Guruh surati emas",
  ],

  about: {
    metaTitle: "Biz haqimizda",
    metaDescription:
      "Kapibara farzandingiz bosh qahramonga aylanadigan shaxsiy kitoblarni chop etadi. Ularni qanday yaratishimiz va fotosuratlarga qanday ehtiyot boʻlishimiz haqida.",
    eyebrow: "Biz haqimizda",
    heading: "Biz bola oʻzini taniydigan kitoblar yaratamiz",
    lead:
      "Kapibara — kichik studiya. Biz bosh qahramoni aniq bir bola boʻlgan hikoyalarni yozamiz, chizamiz va chop etamiz: uning ismi matnda, yuzi esa rasmlarda.",

    whyHeading: "Nega shaxsiy kitoblar",
    whyFirst:
      "Bolalar hikoya oʻzlari haqida boʻlsa, koʻproq oʻqiydi. Sahifadagi oʻz ismi oʻqishni oʻyinga aylantiradi va kitobga qayta-qayta qaytishga sabab boʻladi.",
    whySecond:
      "Biz Koʻlyosik ismli mashinacha haqidagi bitta hikoyadan boshladik — oʻgʻil bola va qiz bola uchun ikki variantda. Bugun katalogda 2 yoshdan 9 yoshgacha boʻlgan bolalar uchun {count} ta hikoya bor va turkum kengayib bormoqda.",

    valuesHeading: "Biz uchun nima muhim",
    value1Title: "Shablon emas, hikoya",
    value1Text:
      "Har bir kitob bola unga yana qaytgisi keladigan tarzda yozilgan va chizilgan.",
    value2Title: "Halol chop etish",
    value2Text:
      "Zich qogʻoz, qattiq muqova, ozoda muqovalash. Kitob koʻp marta oʻqilishga chidashi kerak.",
    value3Title: "Fotosuratlarga ehtiyotkorlik bilan",
    value3Text:
      "Fotosurat faqat sizning kitobingiz uchun ishlatiladi. Biz uni eʼlon qilmaymiz va reklama uchun bermaymiz.",

    ctaHeading: "Farzandingiz uchun kitob yarating",
    ctaButton: "Hikoyani tanlash",
  },

  delivery: {
    metaTitle: "Yetkazib berish va toʻlov",
    metaDescription:
      "Kapibara shaxsiy kitoblarini qanday chop etamiz va yetkazamiz, qanday toʻlov usullari bor va nuqson boʻlsa nima qilish kerak.",
    eyebrow: "Yetkazib berish",
    heading: "Yetkazib berish va toʻlov",

    printTitle: "Chop etish",
    printText:
      "Har bir kitob aynan sizning buyurtmangiz uchun alohida chop etiladi: {pages} ta rasmli sahifa, qattiq muqova, kvadrat format. Tayyorlash muddatini buyurtmani tasdiqlashda aytamiz.",

    deliveryTitle: "Yetkazib berish",

    paymentTitle: "Toʻlov",
    paymentOnline:
      "Buyurtma rasmiylashtirilayotganda bank kartasi orqali onlayn. Toʻlov usuli buyurtma bilan birga tasdiqlanadi.",
    paymentOnConfirmation:
      "Saytda onlayn toʻlov hozircha ulanmagan. Siz buyurtma berasiz, menejer siz bilan bogʻlanadi, yetkazib berish bilan birga umumiy narxni tasdiqlaydi va toʻlov rekvizitlarini yuboradi.",

    defectTitle: "Agar nimadir notoʻgʻri boʻlsa",
    defectText:
      "Agar kitob shikastlangan yoki chop etishda nuqson bilan yetib kelsa — fotosuratlar bilan bizga yozing, nusxani bepul qayta chop etamiz.",

    questionsLead: "Yetkazib berish boʻyicha savollaringiz bormi?",
    questionsLink: "Bizga yozing",
    questionsTail: "— javob beramiz va yordam qilamiz.",

    regions: {
      RU: {
        lead: "Kitoblarni buyurtma boʻyicha chop etamiz va butun Rossiya boʻylab joʻnatamiz.",
        delivery:
          "Butun Rossiya boʻylab joʻnatamiz: kuryer orqali, topshirish punktiga yoki Rossiya pochtasi orqali. Narx va muddat buyurtma rasmiylashtirilayotganda hisoblanadi — ular shahringiz va tanlangan xizmatga bogʻliq.",
      },
      UZ: {
        lead: "Kitoblarni buyurtma boʻyicha chop etamiz va butun Oʻzbekiston boʻylab joʻnatamiz.",
        delivery:
          "Toshkent boʻylab kuryer orqali, Oʻzbekistonning boshqa hududlariga pochta orqali. Narx va muddat buyurtma rasmiylashtirilayotganda hisoblanadi — menejer ularni buyurtma bilan birga tasdiqlaydi.",
      },
    },
  },

  faqPage: {
    metaTitle: "Koʻp beriladigan savollar",
    metaDescription:
      "Kapibara kitoblarini shaxsiylashtirish, tayyorlash, yetkazib berish va toʻlash boʻyicha koʻp beriladigan savollarga javoblar.",
    heading: "Koʻp beriladigan savollar",
    lead: "Kitoblarimiz haqidagi eng koʻp beriladigan savollarga javoblar",
    notFoundHeading: "Javob topmadingizmi?",
    notFoundLead: "Bizga yozing — pochta orqali yoki telefon orqali javob beramiz",
    notFoundCta: "Bizga yozish",
  },

  contact: {
    metaTitle: "Aloqa",
    metaDescription:
      "Kapibara bilan qanday bogʻlanish: sotuvchining elektron pochtasi va telefoni.",
    heading: "Biz bilan bogʻlaning",
    lead:
      "Yozing yoki qoʻngʻiroq qiling — hikoya tanlashda, buyurtmada va yetkazib berishda yordam beramiz.",
    emailTitle: "Elektron pochta",
    emailNote: "Eng ishonchli usul: xat yoʻqolmaydi.",
    phoneTitle: "Telefon",
    phoneNote: "Qoʻngʻiroq yoki xabar.",
    addressTitle: "Manzil",
    addressNote:
      "Sotuvchining yuridik manzili. Buyurtmalarni faqat onlayn qabul qilamiz.",
    uzNote:
      "Oʻzbekistondagi mahalliy yuridik shaxs hozir roʻyxatdan oʻtkazilmoqda. Shu paytgacha savollarga yuqoridagi kontaktlar boʻyicha oʻsha jamoa javob beradi.",
  },

  reviewsPage: {
    metaTitle: "Sharhlar",
    metaDescription: "Ota-onalarning Kapibara shaxsiy kitoblari haqidagi sharhlari.",
    eyebrow: "Sharhlar",
    heading: "Ota-onalar nima deydi",
    verified: "Bu yerdagi har bir sharh kitobni qoʻlga olgan odam tomonidan yozilgan.",
    emptyHeading: "Hozircha sharhlar yoʻq",
    emptyLead:
      "Biz faqat kitobni haqiqatan olgan xaridorlarning sharhlarini eʼlon qilamiz. Birinchilari paydo boʻlishi bilan shu yerda koʻrinadi.",
    policy:
      "Biz oʻylab topilgan sharhlarni eʼlon qilmaymiz va ularni sotib olmaymiz. Sharh qoldirishni faqat buyurtma yetkazilgandan keyin xaridor qila oladi.",
    cta: "Oʻz kitobingizni yarating",
  },

  meta: {
    siteName: "Kapibara",
    titleDefault: "Kapibara — bolalar uchun shaxsiy kitoblar",
    titleTemplate: "%s | Kapibara",
    description:
      "Farzandingiz bosh qahramonga aylanadigan kitob yarating: uning ismi matnda, yuzi esa rasmlarda.",
    ogTitle: "Kapibara — bolalar uchun shaxsiy kitoblar",
    ogDescription: "Bosh qahramoni farzandingiz boʻlgan kitob.",
    keyword1: "shaxsiy kitoblar",
    keyword2: "ismli bolalar kitobi",
    keyword3: "bola fotosurati bilan kitob",
    keyword4: "bolaga sovgʻa",
    keyword5: "nomli kitob",
    notFoundTitle: "Sahifa topilmadi",
  },

  errors: {
    recipientName: "Qabul qiluvchining ismini koʻrsating",
    email: "Toʻgʻri elektron pochta manzilini kiriting",
    phone: "Toʻgʻri telefon raqamini kiriting",
    deliveryMethod: "Yetkazib berish usulini tanlang",
    deliveryAddress: "Yetkazib berish manzilini koʻrsating",
    cartEmpty: "Savat boʻsh",
    productGone: "Mahsulotlardan biri endi mavjud emas",
    productUnavailable: "«{title}» hozircha buyurtma qilib boʻlmaydi",
    productNotSoldHere: "«{title}» hozircha sizning mamlakatingizda sotilmaydi",
    childNameCyrillic: "Bolaning ismi kirill alifbosida yozilishi kerak",
    childNameCyrillicLatin:
      "Bolaning ismi lotin yoki kirill alifbosida yozilishi kerak",
    orderFailed: "Buyurtmani rasmiylashtirib boʻlmadi. Qayta urinib koʻring",

    generationUnavailable: "Rasm yaratish hozircha mavjud emas",
    bookUnavailable: "Bu kitob hozir mavjud emas",
    bookNotPersonalizable: "Bu kitob shaxsiylashtirilmaydi",
    photoAgain: "Fotosuratni qayta yuklang",

    rateLimitMinute: "Juda koʻp urinish. Bir daqiqadan soʻng urinib koʻring",
    rateLimitMinutes: "Juda koʻp urinish. {count} daqiqadan soʻng urinib koʻring",
    rateLimitHours: "Juda koʻp urinish. {count} soatdan soʻng urinib koʻring",
  },

  personalize: {
    metaTitle: "Kitob yaratish",
    stepBook: "Kitob",
    stepChild: "Bola",
    stepPhoto: "Foto",
    stepPreview: "Maket",
    heading: "Kitob yaratish",

    summaryHero: "Bosh qahramon",
    summaryPages: "Sahifalar",
    summaryCover: "Muqova",
    summaryCoverValue: "Qattiq",
    summaryPhoto: "Foto",
    summaryPhotoDone: "Yuklandi",
    summaryPhotoNone: "Qoʻshilmagan",
    summaryPrice: "Narx",

    chosenHeading: "Siz hikoyani tanladingiz",
    chosenLead:
      "Kitobni tekshiring va davom eting — keyingi qadamda ism va fotosuratni qoʻshamiz.",
    chosenContinue: "Davom etish",

    childHeading: "Bola haqida ayting",
    childLead: "Ism hikoya matnida paydo boʻladi.",
    nameLabel: "Bolaning ismi",
    namePlaceholder: "Masalan: Aziz",
    nameHintCyrillic: "Ismni kirill alifbosida kiriting",
    nameHintCyrillicLatin: "Ismni lotin yoki kirill alifbosida kiritish mumkin",
    nameErrorScriptCyrillic: "Faqat kirill alifbosidan foydalaning",
    nameErrorScriptCyrillicLatin: "Faqat harflardan foydalaning",
    nameErrorShort: "Ismni kiriting — kamida 2 ta harf",
    ageLabel: "Yosh",
    dedicationLabel: "Bagʻishlov",
    dedicationOptional: "(ixtiyoriy)",
    dedicationPlaceholder: "Aziz, bu kitob sen uchun…",
    dedicationHint: "Birinchi sahifada chop etamiz",
    back: "Orqaga",
    next: "Keyingisi",

    photoHeading: "Fotosurat qoʻshing",
    photoLead:
      "Shu surat asosida rassom kitob qahramonini chizadi. Ismni saqlab qoʻydik: {name}.",
    photoPrivacy:
      "Fotosurat faqat sizning kitobingizni yaratish uchun ishlatiladi. Biz uni eʼlon qilmaymiz va reklama uchun bermaymiz.",
    skip: "Oʻtkazib yuborish",

    reviewHeading: "Hammasi tayyor",
    reviewLead: "Maʼlumotlarni tekshiring — keyin dastlabki maketni koʻrsatamiz.",
    reviewBook: "Kitob",
    reviewName: "Ism",
    reviewAge: "Yosh",
    reviewPhoto: "Foto",
    reviewPhotoNone: "Fotosuratsiz",
    reviewDedication: "Bagʻishlov",
    reviewDedicationAdded: "Qoʻshildi",
    reviewDedicationNone: "—",
    reviewCover: "Muqova",
    reviewTotal: "Toʻlovga",
    showPreview: "Maketni koʻrsatish",
  },

  photoTipsShort: [
    "Yuz yaqindan",
    "Yaxshi yoritilgan",
    "Och rangli bir tusli fon",
    "Bola kameraga qarab turgan",
  ],

  upload: {
    alt: "Bolaning fotosurati",
    uploading: "Yuklanmoqda…",
    remove: "Fotosuratni oʻchirish",
    drop: "Fotosuratni qoʻyib yuboring",
    choose: "Fotosurat yuklang",
    hint: "Torting yoki tanlash uchun bosing.",
    limits: "JPG, PNG · 8 MB gacha",
  },

  generation: {
    manualHeading: "Rasmlar qoʻlda yaratiladi",
    manualBody:
      "Avtomatik yaratish hali ulanmagan. Rassomimiz buyurtma tasdiqlangandan soʻng farzandingizning yuzini rasmlarga joylaydi va tayyor maketni kelishish uchun yuboradi.",
    needPhoto:
      "U rasmlarda qanday koʻrinishini koʻrish uchun bolaning fotosuratini yuklang.",
    inviteHeading: "Farzandingiz bilan rasmlarni koʻring",
    inviteBody:
      "Buyurtmadan oldin kitobni koʻrishingiz uchun bir nechta sahifa yaratamiz. Bu taxminan bir daqiqa vaqt oladi.",
    starting: "Boshlanmoqda…",
    start: "Rasmlarni yaratish",
    failedHeading: "Rasmlarni yaratib boʻlmadi",
    failedBody:
      "Boshqa fotosuratni sinab koʻring: yuz yirik, fokusda va yaxshi yoritilgan boʻlishi kerak. Buyurtmani dastlabki koʻrikdan oʻtkazmasdan ham berish mumkin — maketni chop etishdan oldin siz bilan kelishamiz.",
    retry: "Qayta urinib koʻrish",
    doneHeading: "{name} bilan muqova tayyor",
    doneBody:
      "{name} kitob sahifalarida shunday koʻrinadi. Yakuniy maketni chop etishdan oldin siz bilan kelishamiz.",
    working:
      "{name}ni kitob sahnalarida chizmoqdamiz. Odatda bir-uch daqiqa, katta fotosurat bilan esa koʻproq vaqt ketadi. Sahifani yopsangiz ham boʻladi — ish davom etadi va natija saqlanadi.",
    slow:
      "Rasmlarni yaratish odatdagidan koʻproq vaqt olmoqda. Ish fonda davom etmoqda — sahifani yopishingiz mumkin, tayyor maketni yuboramiz.",
  },

  preview: {
    notFoundTitle: "Maket topilmadi",
    notFoundBody:
      "Havola eskirganga oʻxshaydi. Kitobni qaytadan yarating — bu bir necha daqiqa vaqt oladi.",
    notFoundCta: "Kitob tanlash",
    back: "Orqaga",
    savedHeading: "Maʼlumotlar saqlandi — buyurtma berish mumkin",
    heroLead: "Bosh qahramon —",
    specPages: "Sahifalar",
    specCover: "Muqova",
    specCoverValue: "Qattiq",
    specAge: "Yosh",
    specFormat: "Format",
    specFormatValue: "Kvadrat",
    deliveryNote:
      "Yetkazib berish narxi va muddati buyurtma rasmiylashtirilayotganda hisoblanadi.",
    checkout: "Buyurtma berish",
    added: "Savatga qoʻshildi",
    addToCart: "Savatga qoʻshish",
    assuranceName: "Bolaning ismi va fotosurati kitob ichida",
    assuranceDeliveryRU: "Rossiya boʻylab chop etamiz va joʻnatamiz",
    assuranceDeliveryUZ: "Oʻzbekiston boʻylab chop etamiz va joʻnatamiz",
    assurancePrivacy: "Fotosurat faqat sizning kitobingiz uchun ishlatiladi",
    moreAbout: "Kitob haqida batafsil",
    personalizationHeading: "Shaxsiylashtirish",
    inSceneCaption: "{name} kitobdagi sahnada",
    drawing: "{name}ni chizmoqdamiz",
    drawingNote: "Odatda bir-uch daqiqa. Tayyor rasm aynan shu yerda paydo boʻladi.",
    photoAlt: "Fotosurat: {name}",
    noPhoto: "fotosurat yoʻq",
    heroAge: "{age} yosh · bosh qahramon",
    heroRole: "Hikoyaning bosh qahramoni",
    seriesCoverNote:
      "Bu turkum muqovasi. Farzandingiz bilan rasm quyida yaratilmoqda — yakuniy maketni chop etishdan oldin siz bilan kelishamiz.",
  },

  cart: {
    metaTitle: "Savat",
    emptyTitle: "Savat boʻsh",
    emptyBody: "Hikoyani tanlang va farzandingiz ismi bilan kitob yarating.",
    emptyCta: "Kitob tanlash",
    toCatalog: "Katalogga",
    heading: "Savat",
    goToCheckout: "Rasmiylashtirishga oʻtish",
    hero: "Bosh qahramon:",
    decrease: "Sonini kamaytirish",
    quantity: "Soni: {count}",
    increase: "Sonini koʻpaytirish",
    removeItem: "«{title}» ni savatdan oʻchirish",
  },

  checkout: {
    metaTitle: "Buyurtmani rasmiylashtirish",
    heading: "Buyurtmani rasmiylashtirish",
    lead: "Qabul qiluvchi maʼlumotlarini toʻldiring — bu bir daqiqa vaqt oladi.",
    addressHeading: "Yetkazib berish manzili",
    fullName: "Ism va familiya",
    fullNamePlaceholder: "Aziz Karimov",
    phone: "Telefon",
    email: "Elektron pochta",
    emailHint: "Buyurtma tasdigʻini shu manzilga yuboramiz",
    city: "Shahar",
    cityPlaceholder: "Toshkent",
    postalCode: "Pochta indeksi",
    street: "Koʻcha va uy",
    streetPlaceholder: "Amir Temur koʻchasi, 10-uy",
    apartment: "Xonadon",
    required: "Majburiy maydon",
    emailInvalid: "Toʻgʻri manzilni kiriting",
    deliveryNote:
      "Yetkazib berish narxi va muddati rasmiylashtirilgandan soʻng hisoblanadi — tasdiqlash uchun siz bilan bogʻlanamiz.",

    paymentHeading: "Toʻlov usuli",
    paymentOnlineTitle: "Karta orqali onlayn toʻlov",
    paymentManualTitle: "Tasdiqlangandan soʻng toʻlov",
    paymentOnlineBody:
      "Rasmiylashtirgandan soʻng himoyalangan toʻlov sahifasiga oʻtasiz. Toʻlov oʻtishi bilan buyurtma avtomatik tasdiqlanadi.",
    paymentManualBody:
      "Siz bilan bogʻlanamiz, tafsilotlar va yetkazib berish summasini aniqlaymiz, soʻng toʻlov haqida kelishamiz. Hozir pul yechilmaydi.",
    paymentOnlineNote:
      "Karta maʼlumotlari toʻlov provayderi tomonida kiritiladi — biz ularni olmaymiz va saqlamaymiz.",
    paymentManualNote:
      "Biz saytda karta maʼlumotlarini soʻramaymiz va ularni saqlamaymiz.",

    summaryHeading: "Sizning buyurtmangiz",
    summaryHero: "qahramon: {name}",
    summaryBooks: "Kitoblar",
    summaryDelivery: "Yetkazib berish",
    summaryDeliveryValue: "rasmiylashtirishda hisoblanadi",
    summaryTotal: "Jami",
    submit: "Buyurtma berish",
    submitting: "Rasmiylashtirilmoqda…",
    secure: "Buyurtmani xavfsiz rasmiylashtirish",
    termsLead: "«{action}» tugmasini bosish orqali siz",
    termsLink: "shartlarga",
  },

  orderSuccess: {
    metaTitle: "Buyurtma rasmiylashtirildi",
    headingPaid: "Buyurtma rasmiylashtirildi",
    headingAwaiting: "Buyurtma yaratildi, toʻlovni kutmoqdamiz",
    orderNumber: "Buyurtma raqami",
    thanks: "Buyurtmangiz uchun rahmat. Tafsilotlar shaxsiy kabinetda.",
    paymentHeading: "Toʻlov",
    paymentPaid: "Toʻlov qabul qilindi.",
    paymentPending:
      "Toʻlov hali kelib tushmadi. Agar uni bekor qilgan boʻlsangiz, biz bilan bogʻlaning — buyurtmani toʻlashga yordam beramiz.",
    paymentManual:
      "Toʻlov buyurtma tasdiqlangandan soʻng — telefon orqali siz bilan bogʻlanamiz.",
    nextHeading: "Keyin nima boʻladi",
    nextBody:
      "Buyurtmani tasdiqlaymiz, ism va fotosuratni rasmlarga qoʻshamiz va kitobni chop etishga yuboramiz. Holatni shaxsiy kabinetda koʻrish mumkin.",
    mailHeading: "Xat",
    mailSent: "Tasdiqni yubordik{recipient}.",
    mailNotConfigured:
      "Xat yuborish hali sozlanmagan — holatni shaxsiy kabinetda kuzating.",
    keptNote:
      "Buyurtma saqlandi va yoʻqolmaydi. Uni ushlab turamiz va toʻlov kelmasa, siz bilan bogʻlanamiz.",
    myOrders: "Mening buyurtmalarim",
    keepShopping: "Xaridni davom ettirish",
  },

  auth: {
    loginTitle: "Kirish",
    loginLead: "Sizni yana koʻrganimizdan xursandmiz",
    email: "Elektron pochta",
    emailRequired: "Elektron pochtani kiriting",
    password: "Parol",
    passwordPlaceholder: "Parolni kiriting",
    passwordRequired: "Parolni kiriting",
    forgotPassword: "Parolni unutdingizmi?",
    signingIn: "Kirilmoqda…",
    signIn: "Kirish",
    noAccount: "Hisobingiz yoʻqmi?",
    register: "Roʻyxatdan oʻtish",

    registerTitle: "Hisob yaratish",
    registerLead: "Kitoblarni saqlash va buyurtmalarni kuzatish uchun",
    name: "Ism",
    namePlaceholder: "Sizga qanday murojaat qilaylik",
    passwordMinPlaceholder: "Kamida {min} ta belgi",
    passwordHint: "Kamida {min} ta belgi, hech boʻlmaganda bitta harf va bitta raqam",
    passwordRepeat: "Parolni takrorlang",
    passwordRepeatPlaceholder: "Parolni yana kiriting",
    consentsLegend: "Majburiy roziliklar",
    consentPersonalData:
      "Men shaxsiy maʼlumotlarimni qayta ishlashga rozilik beraman —",
    consentPersonalDataLink:
      "Shaxsiy maʼlumotlarni qayta ishlash siyosatiga muvofiq",
    consentTermsLead: "Men shartlarni oʻqidim va qabul qilaman:",
    consentTermsLink: "Foydalanuvchi shartnomasi",
    consentTermsAnd: "va",
    consentTermsPolicyLink: "shaxsiy maʼlumotlarni qayta ishlash",
    creating: "Hisob yaratilmoqda…",
    createAccount: "Hisob yaratish",
    haveAccount: "Hisobingiz bormi?",
    accountCreated: "Hisob yaratildi",
    accountCreatedLead:
      "Kapibaraga xush kelibsiz! Endi buyurtma berishingiz va ularni shaxsiy kabinetda kuzatishingiz mumkin.",
    toAccount: "Shaxsiy kabinetga oʻtish",

    forgotTitle: "Parolni tiklash",
    forgotLead:
      "Hisob roʻyxatdan oʻtkazilgan manzilni kiriting — parolni almashtirish havolasini yuboramiz.",
    forgotSentTitle: "Pochtangizni tekshiring",
    forgotSentLead:
      "Agar bu manzil roʻyxatdan oʻtgan boʻlsa, unga parolni almashtirish havolasini yubordik.",
    forgotSentNote: "Havola bir soat amal qiladi va faqat bir marta ishlaydi.",
    backToLogin: "Kirishga qaytish",
    emailInvalid: "Toʻgʻri elektron pochta manzilini kiriting",
    sending: "Yuborilmoqda…",
    sendLink: "Havolani yuborish",
    rememberedPassword: "Parolni esladingizmi?",

    resetTitle: "Yangi parol",
    resetLead: "Hali hech qayerda ishlatmagan parol oʻylab toping.",
    resetLinkBroken: "Havola ishlamayapti",
    requestNewLink: "Yangi havola soʻrash",
    newPassword: "Yangi parol",
    newPasswordRequired: "Yangi parolni kiriting",
    passwordTooShort: "Parol kamida {min} ta belgidan iborat boʻlishi kerak",
    passwordNeedsLetterAndDigit:
      "Parolda hech boʻlmaganda bitta harf va bitta raqam boʻlishi kerak",
    passwordRepeatRequired: "Parolni takrorlang",
    passwordMismatch: "Parollar mos kelmadi",
    saving: "Saqlanmoqda…",
    savePassword: "Parolni saqlash",
    passwordChanged: "Parol oʻzgartirildi",

    verifyTitle: "Manzilni tasdiqlash",
    verifyFailed: "Manzilni tasdiqlab boʻlmadi",
    verifyFailedLead:
      "Hisobingizga kiring — shaxsiy kabinetda yangi xat soʻrash mumkin.",
    verifiedTitle: "Manzil tasdiqlandi",
    verifiedLead: "{email} — endi sizga buyurtmalar haqida xat yubora olamiz.",
    toAccountShort: "Shaxsiy kabinetga",
  },

  authErrors: {
    emailInvalid: "Toʻgʻri elektron pochta manzilini kiriting",
    emailTaken: "Bu manzil allaqachon roʻyxatdan oʻtgan",
    passwordShort: "Parol kamida {min} ta belgidan iborat boʻlishi kerak",
    passwordWeak: "Parolda hech boʻlmaganda bitta harf va bitta raqam boʻlishi kerak",
    passwordMismatch: "Parollar mos kelmadi",
    nameRequired: "Ismni kiriting",
    consentsRequired: "Roʻyxatdan oʻtish uchun majburiy shartlarni qabul qilish kerak",
    generic: "Hisob yaratib boʻlmadi. Qayta urinib koʻring",
    invalidCredentials: "Pochta yoki parol notoʻgʻri",
    linkInvalid: "Havola yaroqsiz. Yangisini soʻrang",
    linkExpired: "Havolaning amal qilish muddati tugadi. Yangisini soʻrang",
    linkUsed: "Havola allaqachon ishlatilgan. Yangisini soʻrang",
    resetFailed: "Parolni almashtirib boʻlmadi. Qayta urinib koʻring",
    verifyFailed: "Manzilni tasdiqlab boʻlmadi. Qayta urinib koʻring",
    alreadyVerified: "Manzil allaqachon tasdiqlangan",
  },

  orderStatus: {
    new: "Yangi",
    awaiting_confirmation: "Tasdiqlash kutilmoqda",
    in_progress: "Ishlanmoqda",
    personalization: "Shaxsiylashtirilmoqda",
    sent_to_print: "Chop etishga yuborildi",
    ready_to_ship: "Joʻnatishga tayyor",
    in_delivery: "Yetkazib berishga topshirildi",
    completed: "Yakunlandi",
    cancelled: "Bekor qilindi",
  },
  paymentStatus: {
    unpaid: "Toʻlanmagan",
    pay_on_confirmation: "Tasdiqlashda toʻlov",
    paid: "Toʻlangan",
    refunded: "Qaytarilgan",
  },
  deliveryMethod: {
    courier: "Kuryer orqali",
    pickup_point: "Topshirish punktiga",
    post: "Pochta orqali",
  },

  account: {
    metaTitle: "Shaxsiy kabinet",
    greeting: "Assalomu alaykum, {name}!",
    ordersTotal: "Jami buyurtmalar",
    createBook: "Yangi kitob yaratish",
    toCatalog: "Katalogga",
    recentOrders: "Soʻnggi buyurtmalar",
    allOrders: "Barcha buyurtmalar",
    noOrders: "Sizda hozircha buyurtmalar yoʻq",
    noOrdersLead:
      "Birinchi shaxsiy kitobni yarating — farzandingizning ismi va fotosurati hikoyaning bir qismiga aylanadi.",
    chooseBook: "Kitob tanlash",

    ordersTitle: "Mening buyurtmalarim",
    reviewInviteOne: "Kitobingiz haqida gapirib bering",
    reviewInviteMany: "Kitoblaringiz haqida gapirib bering",
    reviewInviteLead:
      "Buyurtmangiz yetkazildi — taassurotlaringizni ulashing. Sharh tekshiruvdan soʻng saytda paydo boʻladi.",
    noOrdersYet: "Sizda hozircha buyurtmalar yoʻq",
    noOrdersYetLead:
      "Birinchi buyurtmani rasmiylashtirganingizdan soʻng u tayyorlanish holati bilan birga shu yerda koʻrinadi.",
    orderedOn: "{date} dan",

    orderTitle: "Buyurtma",
    orderContents: "Buyurtma tarkibi",
    childName: "Bolaning ismi:",
    childAge: "Yoshi:",
    photo: "Fotosurat:",
    photoUploaded: "Yuklangan",
    photoMissing: "Qoʻshilmagan",
    dedication: "Bagʻishlov:",
    goods: "Mahsulotlar",
    delivery: "Yetkazib berish",
    deliveryPending: "hisoblanmoqda",
    total: "Jami",
    payment: "Toʻlov",
    deliveryHeading: "Yetkazib berish",
    recipient: "Qabul qiluvchi",
    history: "Buyurtma tarixi",

    profileTitle: "Profil",
    profileLead: "Bu maʼlumotlarni buyurtma rasmiylashtirishda ishlatamiz.",
    securityTitle: "Xavfsizlik",
    securityLead: "Shaxsiy kabinetga kirish parolini almashtirish.",

    navOverview: "Umumiy",
    navProfile: "Profil",
    navOrders: "Mening buyurtmalarim",
    navSecurity: "Xavfsizlik",
    navAria: "Shaxsiy kabinet boʻlimlari",

    name: "Ism",
    email: "Elektron pochta",
    emailHint: "Manzil kirish uchun ishlatiladi va hozircha oʻzgartirib boʻlmaydi",
    phone: "Telefon",
    saved: "Oʻzgarishlar saqlandi",
    saving: "Saqlanmoqda…",
    save: "Saqlash",

    currentPassword: "Joriy parol",
    newPassword: "Yangi parol",
    passwordHint: "Kamida {min} ta belgi, hech boʻlmaganda bitta harf va bitta raqam",
    repeatNewPassword: "Yangi parolni takrorlang",
    passwordUpdated: "Parol yangilandi",
    changePassword: "Parolni oʻzgartirish",

    verifyHeading: "Pochta manzilini tasdiqlang",
    verifyLead:
      "{email} manziliga xat yubordik. Tasdiqlanmasa, buyurtmalar haqidagi xatlar yetib bormasligi mumkin.",
    verifySending: "Yuborilmoqda…",
    verifyResend: "Yana yuborish",
  },

  review: {
    thanks:
      "Rahmat! Sharh tekshiruvga yuborildi va moderatsiyadan soʻng saytda paydo boʻladi.",
    heading: "«{title}» kitobini baholang",
    childLine: "Bolaning ismi: {name}",
    ratingLegend: "1 dan 5 gacha baho",
    ratingValue: "5 dan {value}",
    textLabel: "Sizning sharhingiz",
    textPlaceholder:
      "Sizga va bolangizga nima yoqdi? Kitob jonli holda qanday koʻrinadi?",
    charsLeft: "Yana {count} ta belgi",
    sending: "Yuborilmoqda…",
    submit: "Sharh yuborish",
    note:
      "Sharh tekshiruvdan soʻng saytda paydo boʻladi. Uni ism va familiyaning birinchi harfi bilan eʼlon qilamiz.",
  },

  misc: {
    notFoundHeading: "Bu sahifa sehrli oʻrmonda adashib qoldi",
    notFoundLead:
      "Balki sahifa koʻchgandir yoki havola eskirgandir — lekin kitobingiz hech qayerga ketmagan.",
    toHome: "Bosh sahifaga",
    toCatalog: "Katalogga",
    toFaq: "Koʻp beriladigan savollar",

    noAccessTitle: "Ruxsat yoʻq",
    noAccessHeading: "Huquqlar yetarli emas",
    noAccessLead:
      "Bu boʻlim faqat administratorlarga ochiq. Agar sizga ruxsat kerak boʻlsa, doʻkon egasiga murojaat qiling.",
    toAccount: "Shaxsiy kabinetga",

    coverAlt: "«{title}» kitobining muqovasi",
    previewMetaTitle: "Kitob maketi",
    storyNotFound: "Hikoya topilmadi",
    personalizationMetaTitle: "Shaxsiylashtirish — {title}",
    personalizationMetaDescription:
      "«{title}» kitobiga bolaning ismi va fotosuratini qoʻshing.",
    notOrderable: "«{title}» ni hozircha buyurtma qilib boʻlmaydi",
    notOrderableLead:
      "Bu hikoya hali chiqishga tayyorlanmoqda. Uni shaxsiylashtirish mumkin boʻlganda xabar beramiz.",

    cookieAria: "Cookie fayllardan foydalanish",
    cookieBody:
      "Hisobga kirish va savat ishlashi uchun cookie fayllardan foydalanamiz. Tahliliy fayllar — faqat sizning roziligingiz bilan.",
    cookieMore: "Batafsil",
    cookieAcceptAll: "Hammasini qabul qilish",
    cookieEssentialOnly: "Faqat zaruriylari",
    cookieSettings: "Cookie sozlamalari",

    galleryRole: "karusel",
    galleryAria: "Kitob fotosuratlari",
    slideRole: "slayd",
    slideOf: "{total} dan {index}",
    prevPhoto: "Oldingi fotosurat",
    nextPhoto: "Keyingi fotosurat",
    openFullscreen: "Fotosuratni toʻliq ekranda ochish",
    goToPhoto: "{index}-fotosuratga oʻtish",
    showPhoto: "{index}-fotosuratni koʻrsatish: {alt}",
    viewingPhoto: "Fotosuratni koʻrish",

    ratingAria: "Baho: 5 dan {rating}",
    aboutBook: "Kitob haqida:",
    demoReview: "Namoyish sharhi",
    verifiedPurchase: "Tasdiqlangan xarid",

    pauseVideo: "Videoni pauza qilish",
    resumeVideo: "Videoni davom ettirish",
    hidePassword: "Parolni yashirish",
    showPassword: "Parolni koʻrsatish",
  },

  catalog: {
    metaTitle: "Shaxsiy kitoblar katalogi",
    metaDescription:
      "Farzandingiz bosh qahramonga aylanadigan hikoyalar: uning ismi matnda, yuzi esa rasmlarda. 2 yoshdan 9 yoshgacha boʻlgan bolalar uchun.",
    eyebrow: "Katalog",
    heading: "Shaxsiy kitoblar katalogi",
    subheading:
      "Har bir kitob aynan sizning farzandingiz uchun chop etiladi — uning ismi matnda, fotosurati esa rasmlarda.",
    upcomingHeading: "Yangi hikoyalar tayyorlanmoqda",
    upcomingLead:
      "Turkumning davomini yozmoqdamiz va chizmoqdamiz. Hozir ustida ishlayotganlarimiz:",
  },

  upcomingStories: [
    "Dengiz sayohati haqidagi hikoya",
    "Yulduzlarga parvoz haqidagi hikoya",
    "Maktabdagi birinchi kun haqidagi hikoya",
  ],

  book: {
    create: "Shu kitobni yaratish",
    createShort: "Kitob yaratish",
    moreAbout: "«{title}» kitobi haqida batafsil",
    breadcrumbAria: "Navigatsiya zanjiri",
    deliveryNote:
      "Yetkazib berish narxi va muddati buyurtma rasmiylashtirilayotganda hisoblanadi.",
    galleryCaption: "Chop etilgan kitobning haqiqiy fotosuratlari",
    coverCaption: "Kitobning haqiqiy muqovasi — aynan shuni olasiz",
    includesHeading: "Kitob tarkibi",
    storyHeading: "Hikoya haqida",
    personalizationHeading: "Kitob qanday qilib shaxsiy boʻladi",
    personalizationLead:
      "Fotosuratni yuklaganingizdan soʻng dastlabki maketni koʻrasiz va buyurtmadan oldin maʼlumotlarni tekshirib olasiz.",
    personalizationName: "Bolaning ismi hikoya matnida uchraydi",
    personalizationFace: "Bolaning yuzi rasmlarda paydo boʻladi",
    personalizationDedication: "Birinchi sahifada shaxsiy bagʻishlov",
    printHeading: "Chop etish va yetkazib berish",
    printBody:
      "Har bir kitob aynan sizning buyurtmangiz uchun alohida chop etiladi. Yetkazib berish narxi va muddati buyurtma rasmiylashtirilayotganda hisoblanadi — ular shahringizga bogʻliq.",
    reviewsHeading: "Kitob haqidagi sharhlar",
    // Uzbek has one plural form; the other keys are never selected for uz-UZ,
    // and repeating the string costs nothing.
    reviewCount: {
      one: "{count} ta sharh",
      few: "{count} ta sharh",
      many: "{count} ta sharh",
      other: "{count} ta sharh",
    },
    faqHeading: "Koʻp beriladigan savollar",
    otherStoriesHeading: "Boshqa hikoyalar",
  },

  bookIncludes: [
    "Bolaning ismi hikoya matnida",
    "Bolaning fotosurati rasmlarda",
    "Birinchi sahifada shaxsiy bagʻishlov",
    "{pages} ta rasmli sahifa",
    "Qattiq muqova, kvadrat format",
    "Matt qoplamali zich qogʻoz",
  ],

  faq: [
    {
      question: "Shaxsiy kitob qanday yaratiladi?",
      answer:
        "Siz hikoyani tanlaysiz, bolaning ismini kiritasiz va uning fotosuratini yuklaysiz. Yuklagandan soʻng dastlabki maketni koʻrasiz va buyurtmani rasmiylashtirishdan oldin barcha maʼlumotlarni tekshirib olasiz.",
    },
    {
      question: "Kitob tarkibida nima bor?",
      answer:
        "Kvadrat formatdagi qattiq muqova, 40 ta rasmli sahifa, hikoya matnidagi bolaning ismi, rasmlardagi uning fotosurati va birinchi sahifadagi shaxsiy bagʻishlov.",
    },
    {
      question: "Qanday fotosurat yuklagan maʼqul?",
      answer:
        "Yaxshi yoritilgan, yuz yaqindan koʻringan aniq fotosurat mos keladi, imkon qadar och fonda. Guruh suratlari va quyoshdan saqlovchi koʻzoynakdagi suratlardan foydalanmang.",
    },
    {
      question: "Bolaning fotosurati bilan nima boʻladi?",
      answer:
        "Fotosurat yopiq omborda saqlanadi va faqat sizning kitobingizni yaratish uchun ishlatiladi: uni buyurtma ustida ishlayotgan xodimlar va rasmlarni yaratadigan xizmat koʻradi. Biz uni eʼlon qilmaymiz va reklama uchun bermaymiz. Fotosuratni oʻchirish uchun bizga yozing — soʻrovingiz boʻyicha oʻchiramiz.",
    },
    {
      question: "Yetkazib berish qancha turadi?",
      answer:
        "Narx va muddat buyurtma rasmiylashtirilayotganda hisoblanadi — ular shahringiz va tanlangan xizmatga bogʻliq.",
    },
    {
      question: "Kitobni sovgʻa sifatida buyurtma qilsa boʻladimi?",
      answer:
        "Ha. Buyurtma rasmiylashtirishda qabul qiluvchining manzilini, bagʻishlov maydonida esa birinchi sahifada chop etadigan iliq soʻzlaringizni koʻrsating.",
    },
    {
      question: "Yangi hikoyalar qachon paydo boʻladi?",
      answer:
        "Katalog toʻldirilib boradi: hozir unda mashinalar, hayvonlar, qish va sehr haqidagi hikoyalar bor — 2 yoshdan 9 yoshgacha boʻlgan bolalar uchun, oʻgʻil bola va qiz bola uchun alohida. Yangi kitoblar haqida ijtimoiy tarmoqlarimizda aytamiz.",
    },
  ],
};
