-- A second market.
--
-- Uzbekistan is not a translation of the Russian shop: it has its own seller,
-- its own currency and its own delivery. Three things follow from that.
--
-- 1. A price per market. Deliberately a column rather than a conversion rate:
--    a rate makes every price move when the rate does, produces 1 287 340 sum
--    where a person would have written 1 290 000, and means nobody can say what
--    a book actually costs without knowing when you asked.
--
-- 2. A book's own words per language. Russian stays on the product row — it is
--    what the catalogue was written in and what the back office edits — and
--    anything else is a row in a side table, so a third language is data
--    rather than another migration.
--
-- 3. Orders remember which shop took them. The currency in particular is
--    stamped, never re-derived: a market's currency can be changed later, an
--    order that has already been placed cannot.

-- ─── Prices ───────────────────────────────────────────────────────────────────

ALTER TABLE "products" ADD COLUMN "priceUzs" INTEGER;
ALTER TABLE "products" ADD COLUMN "oldPriceUzs" INTEGER;

-- Same rules the rouble price lives under. NULL stays legal and means "not on
-- sale in Uzbekistan yet", which the storefront states plainly instead of
-- inventing a number.
ALTER TABLE "products"
  ADD CONSTRAINT "products_price_uzs_check"
  CHECK ("priceUzs" IS NULL OR "priceUzs" > 0);

ALTER TABLE "products"
  ADD CONSTRAINT "products_old_price_uzs_check"
  CHECK ("oldPriceUzs" IS NULL OR "oldPriceUzs" > "priceUzs");

-- ─── Translations ─────────────────────────────────────────────────────────────

CREATE TABLE "product_translations" (
  "id"               TEXT NOT NULL,
  "productId"        TEXT NOT NULL,
  "language"         TEXT NOT NULL,
  "title"            TEXT NOT NULL,
  "shortTitle"       TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description"      TEXT NOT NULL,
  "ageRange"         TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,

  CONSTRAINT "product_translations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_translations_productId_language_key"
  ON "product_translations" ("productId", "language");

ALTER TABLE "product_translations"
  ADD CONSTRAINT "product_translations_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Russian is the base row, never a translation of itself. Without this the
-- same book could carry two different Russian titles and nothing would say
-- which one wins.
ALTER TABLE "product_translations"
  ADD CONSTRAINT "product_translations_language_check"
  CHECK ("language" IN ('uz'));

-- Empty text is not a translation.
ALTER TABLE "product_translations"
  ADD CONSTRAINT "product_translations_text_check"
  CHECK (
    length("title") > 0 AND
    length("shortTitle") > 0 AND
    length("shortDescription") > 0 AND
    length("description") > 0
  );

ALTER TABLE "product_images" ADD COLUMN "altUz" TEXT;

-- ─── Orders ───────────────────────────────────────────────────────────────────

ALTER TABLE "orders" ADD COLUMN "region"   TEXT NOT NULL DEFAULT 'RU';
ALTER TABLE "orders" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'RUB';
ALTER TABLE "orders" ADD COLUMN "locale"   TEXT NOT NULL DEFAULT 'ru';

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_region_check" CHECK ("region" IN ('RU', 'UZ'));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_currency_check" CHECK ("currency" IN ('RUB', 'UZS'));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_locale_check" CHECK ("locale" IN ('ru', 'ru-uz', 'uz'));

CREATE INDEX "orders_region_idx" ON "orders" ("region");
