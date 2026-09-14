-- A customer's language, so our mail reaches them in it.
--
-- Order mail can read the locale off the order. Verification and password-reset
-- mail cannot: they are about the account, not a purchase, and by the time they
-- are sent there is no request to read a locale from. Without this the link in
-- a confirmation email lands a reader from Tashkent on the Russian site.

ALTER TABLE "users" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'ru';

ALTER TABLE "users"
  ADD CONSTRAINT "users_locale_check" CHECK ("locale" IN ('ru', 'ru-uz', 'uz'));
