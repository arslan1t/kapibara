/**
 * Seeds the catalogue.
 *
 * Idempotent: every write is an upsert keyed on a stable slug, so running it
 * again after a schema change refreshes content without duplicating rows or
 * touching customer data.
 *
 *   npm run db:seed
 */
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

const BOOK_PRICE = 9990;
/**
 * Whole sum, for the Uzbek storefront. A separate figure rather than a
 * converted rouble price: the two markets are priced independently, and a
 * book with no price here is not buyable at all, whatever its status says.
 */
const BOOK_PRICE_UZS = 500_000;
const PAGE_COUNT = 40;

/** The six supplied photographs, in the order they appear in the gallery. */
const galleryImages = [
  { file: "boy-1.jpg", alt: "Книга «Приключения Мальчика и Колёсика» — обложка с именем ребёнка" },
  { file: "girl-1.jpg", alt: "Версия книги для девочки — обложка с именем ребёнка" },
  { file: "boy-2.jpg", alt: "Разворот книги: мальчик и Колёсик в волшебном лесу" },
  { file: "girl-2.jpg", alt: "Разворот книги: девочка и Колёсик в волшебном лесу" },
  { file: "boy-3.jpg", alt: "Напечатанная книга для мальчика — качество печати и переплёта" },
  { file: "girl-3.jpg", alt: "Напечатанная книга для девочки — качество печати и переплёта" },
];


/**
 * The rest of the catalogue.
 *
 * Written as data rather than six more upsert blocks: they differ only in
 * content, and a table makes a missing field obvious at a glance.
 *
 * `description` is deliberately a short premise, not the finished blurb. The
 * stories themselves are still to be written, and inventing plot details here
 * would put claims about the book in front of customers that nobody has agreed
 * to honour.
 */
/**
 * The same catalogue in Uzbek.
 *
 * Kept as a separate table rather than extra fields on CATALOGUE so the
 * Russian entries stay readable, and so a third language is another table
 * rather than another column in every row.
 *
 * The companions' names are translated, not transliterated. "Колёсик" is a
 * little wheel and "Огонёк" a little flame; a child reading Oʻzbek should meet
 * Gʻildirakcha and Olovcha, not a Russian word in Latin letters they cannot
 * parse. Only the story is translated — the artwork still carries its Russian
 * lettering, which is a separate job.
 */
const CATALOGUE_UZ: Record<
  string,
  { title: string; shortTitle: string; companion: string; idea: string }
> = {
  "priklyucheniya-devochki-i-kitenka": {
    title: "Qizcha va Kit bolasi sarguzashtlari",
    shortTitle: "Qizcha va Kit bolasi",
    companion: "kit bolasi",
    idea: "Dengiz, sukunat va yulduzli suvda porlaydigan kit bolasi bilan doʻstlik haqidagi hikoya.",
  },
  "priklyucheniya-malchika-i-sovenka": {
    title: "Oʻgʻilcha va Boyqush bolasi sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Boyqush bolasi",
    companion: "boyqush bolasi",
    idea: "Jasorat haqidagi tungi hikoya: yoningda kichkina boyqush boʻlsa, qorongʻilikdan qoʻrqmasa ham boʻladi.",
  },
  "priklyucheniya-devochki-i-oblachka": {
    title: "Qizcha va Bulutcha sarguzashtlari",
    shortTitle: "Qizcha va Bulutcha",
    companion: "bulutcha",
    idea: "Orzular haqidagi yengil hikoya: kichkina bulutcha dunyoga yuqoridan qarashni oʻrgatadi.",
  },
  "priklyucheniya-malchika-i-ezhika": {
    title: "Oʻgʻilcha va Kirpicha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Kirpicha",
    companion: "kirpicha",
    idea: "Gʻamxoʻrlik haqidagi kuzgi hikoya: tikanli kirpicha bilan doʻstlashib, oʻrmonni qishga tayyorlash.",
  },
  "priklyucheniya-devochki-i-snezhka": {
    title: "Qizcha va Qorcha sarguzashtlari",
    shortTitle: "Qizcha va Qorcha",
    companion: "oq tulki Qorcha",
    idea: "Iliqlik haqidagi qishki hikoya: oq tulki Qorcha qorli oʻrmon orqali eng muhim narsaga boshlab boradi.",
  },
  "priklyucheniya-malchika-i-korablika": {
    title: "Oʻgʻilcha va Kemacha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Kemacha",
    companion: "kemacha",
    idea: "Uyga qaytish haqidagi dengiz hikoyasi: yogʻoch kemacha va doim kutib turadigan mayoq.",
  },
  "priklyucheniya-malchika-i-parovozika": {
    title: "Oʻgʻilcha va Parovozcha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Parovozcha",
    companion: "parovozcha",
    idea: "Yoʻl va doʻstlik haqidagi hikoya: yashil parovozcha vodiy orqali eng qiziq joyga olib boradi.",
  },
  "priklyucheniya-devochki-i-samoletika": {
    title: "Qizcha va Samolyotcha sarguzashtlari",
    shortTitle: "Qizcha va Samolyotcha",
    companion: "samolyotcha",
    idea: "Baland osmon va jasorat haqidagi hikoya: sariq samolyotcha balandlikdan qoʻrqmaslikni oʻrgatadi.",
  },
  "priklyucheniya-malchika-i-boltika": {
    title: "Oʻgʻilcha va Boltcha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Boltcha",
    companion: "robot Boltcha",
    idea: "Ixtiro haqidagi hikoya: misdan yasalgan robot Boltcha va imkonsizni ham tuzatadigan ustaxona.",
  },
  "priklyucheniya-devochki-i-zontika": {
    title: "Qizcha va Soyaboncha sarguzashtlari",
    shortTitle: "Qizcha va Soyaboncha",
    companion: "soyaboncha",
    idea: "Yomgʻir va quvonch haqidagi hikoya: qizil soyaboncha kulrang kunni bayramga aylantiradi.",
  },
  "priklyucheniya-malchika-i-vertoletika": {
    title: "Oʻgʻilcha va Vertolyotcha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Vertolyotcha",
    companion: "vertolyotcha",
    idea: "Togʻlar va yordam haqidagi hikoya: yashil vertolyotcha kerak boʻlganda doim yetib keladi.",
  },
  "priklyucheniya-devochki-i-fonarika": {
    title: "Qizcha va Fonarcha sarguzashtlari",
    shortTitle: "Qizcha va Fonarcha",
    companion: "fonarcha",
    idea: "Tungi oʻrmon haqidagi hikoya: iliq fonarcha qorongʻi va biroz qoʻrqinchli joylarni yoritadi.",
  },
  "priklyucheniya-devochki-i-snegovika": {
    title: "Qizcha va Qor odam sarguzashtlari",
    shortTitle: "Qizcha va Qor odam",
    companion: "qor odam",
    idea: "Moʻjiza haqidagi yangi yil hikoyasi: qizil sharfli qor odam maydondagi archa yonida kutib turadi.",
  },
  "priklyucheniya-malchika-i-olenenka": {
    title: "Oʻgʻilcha va Bugʻu bolasi sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Bugʻu bolasi",
    companion: "bugʻu bolasi",
    idea: "Qish orqali oʻtadigan yoʻl haqidagi yangi yil hikoyasi: qoʻngʻiroqchali bugʻu bolasi shimoliy shafaq ostida boshlab boradi.",
  },
  "priklyucheniya-malchika-i-kolesika": {
    title: "Oʻgʻilcha va Gʻildirakcha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Gʻildirakcha",
    companion: "gapiradigan mashina Gʻildirakcha",
    idea: "Doʻstlik, jasorat va gapiradigan mashina Gʻildirakcha haqidagi sehrli sarguzasht.",
  },
  "priklyucheniya-devochki-i-kolesika": {
    title: "Qizcha va Gʻildirakcha sarguzashtlari",
    shortTitle: "Qizcha va Gʻildirakcha",
    companion: "gapiradigan mashina Gʻildirakcha",
    idea: "Doʻstlik, jasorat va gapiradigan mashina Gʻildirakcha haqidagi sehrli sarguzasht.",
  },
  "priklyucheniya-devochki-i-ogonka": {
    title: "Qizcha va Olovcha sarguzashtlari",
    shortTitle: "Qizcha va Olovcha",
    companion: "kichkina ajdar Olovcha",
    idea: "Kichkina ajdar Olovcha bilan doʻstlik haqidagi iliq hikoya.",
  },
  "priklyucheniya-malchika-i-ogonka": {
    title: "Oʻgʻilcha va Olovcha sarguzashtlari",
    shortTitle: "Oʻgʻilcha va Olovcha",
    companion: "kichkina ajdar Olovcha",
    idea: "Kichkina ajdar Olovcha bilan doʻstlik haqidagi iliq hikoya.",
  },
};

/**
 * Writes the Uzbek wording for one book.
 *
 * Built the same way the Russian is — premise plus companion — so the two
 * languages say the same thing about the same book, and neither invents plot
 * details nobody has agreed to honour.
 */
async function upsertUzbek(slug: string, gender: "boy" | "girl", ageMin: number, ageMax: number) {
  const uz = CATALOGUE_UZ[slug];
  if (!uz) return;

  const product = await db.product.findUnique({ where: { slug }, select: { id: true } });
  if (!product) return;

  const hero = gender === "girl" ? "sizning qizingiz" : "sizning oʻgʻlingiz";
  const shortDescription = `${uz.idea} Bosh qahramon — ${hero}.`;
  const description = `${uz.idea} Farzandingizning ismi va yuzi har bir sahifaga kiritilgan: u shu hikoyaning bosh qahramoni, yonida esa ${uz.companion} bilan doʻstlik.`;

  const data = {
    language: "uz",
    title: uz.title,
    shortTitle: uz.shortTitle,
    shortDescription,
    description,
    ageRange: `${ageMin}-${ageMax} yosh`,
  };

  await db.productTranslation.upsert({
    where: { productId_language: { productId: product.id, language: "uz" } },
    update: data,
    create: { productId: product.id, ...data },
  });
}

const CATALOGUE = [
  {
    slug: "priklyucheniya-devochki-i-kitenka",
    ageMin: 3,
    ageMax: 7,
    title: "Приключения Девочки и Китёнка",
    shortTitle: "Девочка и Китёнок",
    companion: "китёнком",
    gender: "girl",
    cover: "/images/books/girl-kitenok.png",
    idea: "История о море, тишине и дружбе с китёнком, который светится в звёздной воде.",
  },
  {
    slug: "priklyucheniya-malchika-i-sovenka",
    ageMin: 4,
    ageMax: 8,
    title: "Приключения Мальчика и Совёнка",
    shortTitle: "Мальчик и Совёнок",
    companion: "совёнком",
    gender: "boy",
    cover: "/images/books/boy-sovenok.png",
    idea: "Ночная история о смелости: как не бояться темноты, когда рядом маленький совёнок.",
  },
  {
    slug: "priklyucheniya-devochki-i-oblachka",
    ageMin: 2,
    ageMax: 6,
    title: "Приключения Девочки и Облачка",
    shortTitle: "Девочка и Облачко",
    companion: "облачком",
    gender: "girl",
    cover: "/images/books/girl-oblachko.png",
    idea: "Лёгкая история о мечтах и о том, как маленькое облачко учит смотреть на мир сверху.",
  },
  {
    slug: "priklyucheniya-malchika-i-ezhika",
    ageMin: 3,
    ageMax: 7,
    title: "Приключения Мальчика и Ёжика",
    shortTitle: "Мальчик и Ёжик",
    companion: "ёжиком",
    gender: "boy",
    cover: "/images/books/boy-ezhik.png",
    idea: "Осенняя история о заботе: как подружиться с колючим ёжиком и подготовить лес к зиме.",
  },
  {
    slug: "priklyucheniya-devochki-i-snezhka",
    ageMin: 3,
    ageMax: 7,
    title: "Приключения Девочки и Снежка",
    shortTitle: "Девочка и Снежок",
    companion: "песцом Снежком",
    gender: "girl",
    cover: "/images/books/girl-snezhok.png",
    idea: "Зимняя история о тепле: белый песец Снежок ведёт через снежный лес к самому важному.",
  },
  {
    slug: "priklyucheniya-malchika-i-korablika",
    ageMin: 4,
    ageMax: 8,
    title: "Приключения Мальчика и Кораблика",
    shortTitle: "Мальчик и Кораблик",
    companion: "корабликом",
    gender: "boy",
    cover: "/images/books/boy-korablik.png",
    idea: "Морская история о пути домой: деревянный кораблик и маяк, который всегда ждёт.",
  },
  {
    slug: "priklyucheniya-malchika-i-parovozika",
    ageMin: 2,
    ageMax: 5,
    title: "Приключения Мальчика и Паровозика",
    shortTitle: "Мальчик и Паровозик",
    companion: "паровозиком",
    gender: "boy",
    cover: "/images/books/boy-parovozik.png",
    idea: "История о дороге и дружбе: зелёный паровозик везёт через долину к самому интересному.",
  },
  {
    slug: "priklyucheniya-devochki-i-samoletika",
    ageMin: 3,
    ageMax: 7,
    title: "Приключения Девочки и Самолётика",
    shortTitle: "Девочка и Самолётик",
    companion: "самолётиком",
    gender: "girl",
    cover: "/images/books/girl-samoletik.png",
    idea: "История о высоком небе и смелости: жёлтый самолётик учит не бояться высоты.",
  },
  {
    slug: "priklyucheniya-malchika-i-boltika",
    ageMin: 5,
    ageMax: 9,
    title: "Приключения Мальчика и Болтика",
    shortTitle: "Мальчик и Болтик",
    companion: "роботом Болтиком",
    gender: "boy",
    cover: "/images/books/boy-boltik.png",
    idea: "История о выдумке: медный робот Болтик и мастерская, где чинят даже невозможное.",
  },
  {
    slug: "priklyucheniya-devochki-i-zontika",
    ageMin: 3,
    ageMax: 6,
    title: "Приключения Девочки и Зонтика",
    shortTitle: "Девочка и Зонтик",
    companion: "зонтиком",
    gender: "girl",
    cover: "/images/books/girl-zontik.png",
    idea: "История о дожде и радости: красный зонтик превращает серый день в праздник.",
  },
  {
    slug: "priklyucheniya-malchika-i-vertoletika",
    ageMin: 4,
    ageMax: 8,
    title: "Приключения Мальчика и Вертолётика",
    shortTitle: "Мальчик и Вертолётик",
    companion: "вертолётиком",
    gender: "boy",
    cover: "/images/books/boy-vertoletik.png",
    idea: "История о горах и помощи: зелёный вертолётик всегда прилетает, когда нужен.",
  },
  {
    slug: "priklyucheniya-devochki-i-fonarika",
    ageMin: 3,
    ageMax: 7,
    title: "Приключения Девочки и Фонарика",
    shortTitle: "Девочка и Фонарик",
    companion: "фонариком",
    gender: "girl",
    cover: "/images/books/girl-fonarik.png",
    idea: "История о ночном лесе: тёплый фонарик светит там, где темно и немного страшно.",
  },
  {
    slug: "priklyucheniya-devochki-i-snegovika",
    ageMin: 2,
    ageMax: 6,
    title: "Приключения Девочки и Снеговика",
    shortTitle: "Девочка и Снеговик",
    companion: "снеговиком",
    gender: "girl",
    cover: "/images/books/girl-snegovik.png",
    idea: "Новогодняя история о чуде: снеговик в красном шарфе ждёт у ёлки на площади.",
  },
  {
    slug: "priklyucheniya-malchika-i-olenenka",
    ageMin: 5,
    ageMax: 9,
    title: "Приключения Мальчика и Оленёнка",
    shortTitle: "Мальчик и Оленёнок",
    companion: "оленёнком",
    gender: "boy",
    cover: "/images/books/boy-olenenok.png",
    idea: "Новогодняя история о дороге сквозь зиму: оленёнок с бубенцом ведёт под северным сиянием.",
  },
] as const;

async function main() {
  // ── The flagship product: the only fully purchasable book ──
  const boy = await db.product.upsert({
    where: { slug: "priklyucheniya-malchika-i-kolesika" },
    update: {
      title: "Приключения Мальчика и Колёсика",
      shortDescription:
        "Волшебное приключение о дружбе, смелости и говорящем автомобильчике Колёсике, где главным героем становится ваш мальчик.",
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "available",
      published: true,
      featured: true,
      stockStatus: "in_stock",
    },
    create: {
      slug: "priklyucheniya-malchika-i-kolesika",
      title: "Приключения Мальчика и Колёсика",
      shortTitle: "Мальчик и Колёсик",
      shortDescription:
        "Волшебное приключение о дружбе, смелости и говорящем автомобильчике Колёсике, где главным героем становится ваш мальчик.",
      description:
        "В глубине волшебного леса, где солнце пробивается сквозь листву, а тропинки светятся золотыми искрами, живёт добрый говорящий автомобильчик Колёсик. Однажды он встречает мальчика — и этим мальчиком становится ваш сын. Вместе они отправляются в путь: мимо поющего водопада, через поляны светящихся грибов, навстречу новым друзьям и большим маленьким открытиям. Тёплая история о дружбе, смелости и любопытстве, где имя и лицо ребёнка вплетены в каждую страницу.",
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "available",
      published: true,
      featured: true,
      stockStatus: "in_stock",
      ageRange: "3–8 лет",
      ageMin: 3,
      ageMax: 8,
      pageCount: PAGE_COUNT,
      format: "hardcover-square",
      coverType: "hardcover",
      childGender: "boy",
      coverImage: "/images/books/kolesik-cover.png",
      personalizationEnabled: true,
    },
  });

  // Replace the gallery wholesale so re-seeding cannot accumulate duplicates.
  await db.productImage.deleteMany({ where: { productId: boy.id } });
  await db.productImage.createMany({
    data: galleryImages.map((img, i) => ({
      productId: boy.id,
      url: `/images/gallery/${img.file}`,
      alt: img.alt,
      sortOrder: i,
      isPrimary: i === 0,
    })),
  });

  // ── The girl's edition: real, but not yet released ──
  await db.product.upsert({
    where: { slug: "priklyucheniya-devochki-i-kolesika" },
    update: {
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "coming_soon",
      published: true,
    },
    create: {
      slug: "priklyucheniya-devochki-i-kolesika",
      title: "Приключения Девочки и Колёсика",
      shortTitle: "Девочка и Колёсик",
      shortDescription:
        "Волшебное приключение о смелости, дружбе и говорящем автомобильчике Колёсике, где главной героиней становится ваша девочка.",
      description:
        "За старым мостом, там где лесная дорога уходит к сияющему водопаду, ждёт своего друга голубой автомобильчик Колёсик. В этой истории рядом с ним оказывается девочка — и это ваша дочь. Их ждёт дорога сквозь заколдованную чащу, встречи с лесными жителями и вечер, полный светлячков и тихих чудес. Добрая сказка о смелости и дружбе, в которой имя и лицо вашей девочки живут на каждой странице.",
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      // Announced but not purchasable — the storefront shows it as «Скоро».
      status: "coming_soon",
      published: true,
      featured: false,
      stockStatus: "in_stock",
      ageRange: "3–8 лет",
      ageMin: 3,
      ageMax: 8,
      pageCount: PAGE_COUNT,
      format: "hardcover-square",
      coverType: "hardcover",
      childGender: "girl",
      coverImage: "/images/books/girl-kolesik-cover.png",
      personalizationEnabled: true,
    },
  });

  // ── Вторая серия: «Огонёк» ──
  await db.product.upsert({
    where: { slug: "priklyucheniya-devochki-i-ogonka" },
    update: {
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "coming_soon",
      published: true,
      coverImage: "/images/books/girl-ogonek-cover.png",
    },
    create: {
      slug: "priklyucheniya-devochki-i-ogonka",
      title: "Приключения Девочки и Огонька",
      shortTitle: "Девочка и Огонёк",
      shortDescription:
        "Тёплая история о дружбе с маленьким дракончиком Огоньком, где главной героиней становится ваша девочка.",
      description:
        "Высоко в горах, где туман ложится на луга, а колокольчики звенят от ветра, живёт маленький дракончик Огонёк — со светящимися крыльями и тёплым огоньком на хвосте. Однажды он встречает девочку, и этой девочкой становится ваша дочь. Вместе они учатся не бояться высоты, беречь чужие секреты и находить дорогу домой по светящимся камням. Нежная акварельная сказка о дружбе и доверии, где имя и лицо вашего ребёнка вплетены в каждую страницу.",
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "coming_soon",
      published: true,
      featured: false,
      stockStatus: "in_stock",
      ageRange: "3–8 лет",
      ageMin: 3,
      ageMax: 8,
      pageCount: PAGE_COUNT,
      format: "hardcover-square",
      coverType: "hardcover",
      childGender: "girl",
      coverImage: "/images/books/girl-ogonek-cover.png",
      personalizationEnabled: true,
    },
  });

  await db.product.upsert({
    where: { slug: "priklyucheniya-malchika-i-ogonka" },
    update: {
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "coming_soon",
      published: true,
      coverImage: "/images/books/boy-ogonek-cover.png",
    },
    create: {
      slug: "priklyucheniya-malchika-i-ogonka",
      title: "Приключения Мальчика и Огонька",
      shortTitle: "Мальчик и Огонёк",
      shortDescription:
        "Тёплая история о дружбе с маленьким дракончиком Огоньком, где главным героем становится ваш мальчик.",
      description:
        "Высоко в горах, где туман ложится на луга, а колокольчики звенят от ветра, живёт маленький дракончик Огонёк — со светящимися крыльями и тёплым огоньком на хвосте. Однажды он встречает мальчика, и этим мальчиком становится ваш сын. Вместе они учатся не бояться высоты, беречь чужие секреты и находить дорогу домой по светящимся камням. Нежная акварельная сказка о дружбе и доверии, где имя и лицо вашего ребёнка вплетены в каждую страницу.",
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "coming_soon",
      published: true,
      featured: false,
      stockStatus: "in_stock",
      ageRange: "3–8 лет",
      ageMin: 3,
      ageMax: 8,
      pageCount: PAGE_COUNT,
      format: "hardcover-square",
      coverType: "hardcover",
      childGender: "boy",
      coverImage: "/images/books/boy-ogonek-cover.png",
      personalizationEnabled: true,
    },
  });

  for (const book of CATALOGUE) {
    const hero = book.gender === "girl" ? "ваша девочка" : "ваш мальчик";
    const shortDescription = `${book.idea} Главным героем становится ${hero}.`;

    const content = {
      title: book.title,
      shortTitle: book.shortTitle,
      shortDescription,
      description: `${book.idea} Имя и лицо вашего ребёнка вплетены в каждую страницу: он и есть главный герой этой истории, а рядом с ним — дружба с ${book.companion}.`,
      price: BOOK_PRICE,
      priceUzs: BOOK_PRICE_UZS,
      status: "available",
      published: true,
      featured: false,
      stockStatus: "in_stock",
      ageRange: `${book.ageMin}–${book.ageMax} лет`,
      ageMin: book.ageMin,
      ageMax: book.ageMax,
      pageCount: PAGE_COUNT,
      format: "hardcover-square",
      coverType: "hardcover",
      childGender: book.gender,
      coverImage: book.cover,
      personalizationEnabled: true,
    };

    await db.product.upsert({
      where: { slug: book.slug },
      // Re-seeding refreshes wording, price and artwork but never resurrects a
      // book an administrator has deliberately taken off sale.
      update: {
        title: content.title,
        shortTitle: content.shortTitle,
        shortDescription: content.shortDescription,
        description: content.description,
        price: content.price,
        priceUzs: content.priceUzs,
        coverImage: content.coverImage,
        // Age band too: it is content, not an operator decision, and leaving it
        // out meant a corrected range never reached a book that already existed.
        ageRange: content.ageRange,
        ageMin: content.ageMin,
        ageMax: content.ageMax,
      },
      create: { slug: book.slug, ...content },
    });

    await upsertUzbek(book.slug, book.gender as "boy" | "girl", book.ageMin, book.ageMax);
  }

  // The four books that predate the data table above, and so are upserted by
  // hand higher up. Their age bands are fixed in those blocks.
  await upsertUzbek("priklyucheniya-malchika-i-kolesika", "boy", 3, 8);
  await upsertUzbek("priklyucheniya-devochki-i-kolesika", "girl", 3, 8);
  await upsertUzbek("priklyucheniya-malchika-i-ogonka", "boy", 3, 8);
  await upsertUzbek("priklyucheniya-devochki-i-ogonka", "girl", 3, 8);

  const products = await db.product.count();
  const translations = await db.productTranslation.count();
  console.log(
    `✔ Каталог: ${products} книг (${translations} на узбекском), галерея: ${galleryImages.length} изображений`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
