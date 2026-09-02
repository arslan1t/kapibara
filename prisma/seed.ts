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
    update: { price: BOOK_PRICE, status: "coming_soon", published: true },
    create: {
      slug: "priklyucheniya-devochki-i-kolesika",
      title: "Приключения Девочки и Колёсика",
      shortTitle: "Девочка и Колёсик",
      shortDescription:
        "Волшебное приключение о смелости, дружбе и говорящем автомобильчике Колёсике, где главной героиней становится ваша девочка.",
      description:
        "За старым мостом, там где лесная дорога уходит к сияющему водопаду, ждёт своего друга голубой автомобильчик Колёсик. В этой истории рядом с ним оказывается девочка — и это ваша дочь. Их ждёт дорога сквозь заколдованную чащу, встречи с лесными жителями и вечер, полный светлячков и тихих чудес. Добрая сказка о смелости и дружбе, в которой имя и лицо вашей девочки живут на каждой странице.",
      price: BOOK_PRICE,
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
        coverImage: content.coverImage,
      },
      create: { slug: book.slug, ...content },
    });
  }

  const products = await db.product.count();
  console.log(`✔ Каталог: ${products} книг, галерея: ${galleryImages.length} изображений`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
