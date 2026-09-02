-- Cover artwork becomes a property of the product.
--
-- It used to be derived from childGender in application code, which held only
-- while there was a single series. A second series makes that mapping wrong:
-- the girl's book from series B would be served the girl's cover from series A,
-- and the illustration provider would be given it as the reference image to
-- redraw — producing a preview of a book the customer did not order.

ALTER TABLE "products" ADD COLUMN "coverImage" TEXT;

-- Backfill reproduces exactly what the old code did, so existing rows keep the
-- cover they were already being shown.
UPDATE "products"
SET "coverImage" = CASE
  WHEN "childGender" = 'girl' THEN '/images/books/girl-kolesik-cover.png'
  ELSE '/images/books/kolesik-cover.png'
END
WHERE "coverImage" IS NULL;

ALTER TABLE "products" ALTER COLUMN "coverImage" SET NOT NULL;

-- A product without artwork cannot be displayed or generated from.
ALTER TABLE "products"
  ADD CONSTRAINT "products_cover_image_check"
  CHECK (length("coverImage") > 0);
