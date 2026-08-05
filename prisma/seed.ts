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
      personalizationEnabled: true,
    },
  });

  const products = await db.product.count();
  console.log(`✔ Каталог: ${products} товара, галерея: ${galleryImages.length} изображений`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
