-- Payme and Click.
--
-- Both are merchant-implemented protocols rather than the create-then-webhook
-- shape YooKassa uses: the provider calls us and drives a transaction through
-- states we have to remember. Payme in particular asks us, at any time, when a
-- transaction was created, performed or cancelled and why — so that has to be
-- stored, not derived.
--
-- One JSON column rather than six typed ones: the state genuinely is
-- provider-specific (Payme's cancel reason codes mean nothing to Click, whose
-- prepare id means nothing to Payme), and columns that only one provider ever
-- writes read as though every provider might.

ALTER TABLE "payments" ADD COLUMN "providerState" TEXT;

-- The currency a payment was taken in. It was defaulted to roubles when there
-- was one market; an Uzbek payment is in sum and the record has to say so.
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_currency_check" CHECK ("currency" IN ('RUB', 'UZS'));

-- Providers that can now appear on a payment row. "manual" and "yookassa"
-- were the whole list, so the existing constraint is replaced rather than
-- added to — a CHECK cannot be widened in place.
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_provider_check";
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_provider_check"
  CHECK ("provider" IN ('manual', 'yookassa', 'payme', 'click'));

-- Looking a payment up by its order is what both new providers do on every
-- callback: Payme addresses a transaction by our order id, and Click sends
-- merchant_trans_id. Without this each callback is a sequential scan.
CREATE INDEX IF NOT EXISTS "payments_orderId_status_idx"
  ON "payments" ("orderId", "status");
