-- Integrity constraints that PostgreSQL can enforce and SQLite could not.
--
-- The application already validates all of this, but application checks are a
-- convenience: they protect against bugs, not against a bad migration, a manual
-- UPDATE in a console, or a second service writing to the same database. These
-- constraints make the invalid states unrepresentable.

-- ── Allowed status values ────────────────────────────────────────────────────
-- Text + CHECK rather than a Postgres enum: adding a value to an enum takes an
-- ACCESS EXCLUSIVE lock on every table that uses it, whereas a CHECK can be
-- dropped and recreated inside a transaction during a deploy.

ALTER TABLE "users"
  ADD CONSTRAINT "users_role_check"
  CHECK ("role" IN ('customer', 'admin'));

ALTER TABLE "consents"
  ADD CONSTRAINT "consents_type_check"
  CHECK ("type" IN ('personal_data', 'promo_rules', 'user_agreement'));

ALTER TABLE "verification_tokens"
  ADD CONSTRAINT "verification_tokens_type_check"
  CHECK ("type" IN ('email_verify', 'password_reset'));

ALTER TABLE "products"
  ADD CONSTRAINT "products_status_check"
  CHECK ("status" IN ('available', 'coming_soon', 'archived'));

ALTER TABLE "products"
  ADD CONSTRAINT "products_stock_status_check"
  CHECK ("stockStatus" IN ('in_stock', 'out_of_stock'));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_order_status_check"
  CHECK ("orderStatus" IN (
    'new', 'awaiting_confirmation', 'in_progress', 'personalization',
    'sent_to_print', 'ready_to_ship', 'in_delivery', 'completed', 'cancelled'
  ));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_payment_status_check"
  CHECK ("paymentStatus" IN ('unpaid', 'pay_on_confirmation', 'paid', 'refunded'));

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_delivery_method_check"
  CHECK ("deliveryMethod" IN ('courier', 'pickup_point', 'post'));

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_provider_check"
  CHECK ("provider" IN ('manual', 'yookassa'));

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_status_check"
  CHECK ("status" IN ('pending', 'waiting_for_capture', 'succeeded', 'canceled', 'failed'));

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_status_check"
  CHECK ("status" IN ('pending', 'approved', 'rejected'));

ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_status_check"
  CHECK ("status" IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled'));

ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_provider_check"
  CHECK ("provider" IN ('nano_banana'));

ALTER TABLE "email_messages"
  ADD CONSTRAINT "email_messages_status_check"
  CHECK ("status" IN ('queued', 'sent', 'failed'));

-- ── Value ranges ─────────────────────────────────────────────────────────────
-- Money is never negative and a total must equal what its parts add up to.

ALTER TABLE "products"
  ADD CONSTRAINT "products_price_non_negative" CHECK ("price" >= 0);

ALTER TABLE "products"
  ADD CONSTRAINT "products_old_price_non_negative"
  CHECK ("oldPrice" IS NULL OR "oldPrice" >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_amounts_non_negative"
  CHECK ("subtotal" >= 0 AND "deliveryPrice" >= 0 AND "total" >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT "orders_total_consistent"
  CHECK ("total" = "subtotal" + "deliveryPrice");

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_line_total_consistent"
  CHECK ("lineTotal" = "unitPrice" * "quantity");

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "generation_jobs"
  ADD CONSTRAINT "generation_jobs_attempts_non_negative" CHECK ("attempts" >= 0);

-- ── Email hygiene ────────────────────────────────────────────────────────────
-- The application lower-cases and trims before writing. This makes it true of
-- every row regardless of who wrote it, so the unique index cannot be defeated
-- by a differently-cased duplicate.

ALTER TABLE "users"
  ADD CONSTRAINT "users_email_normalised"
  CHECK ("email" = lower("email") AND "email" = btrim("email"));

-- ── Order numbering ──────────────────────────────────────────────────────────
-- Replaces a read-then-increment in application code, which could hand the same
-- number to two concurrent checkouts. A sequence is atomic, so concurrent
-- callers always receive distinct values.

CREATE SEQUENCE IF NOT EXISTS "order_number_seq" AS bigint START WITH 1;

CREATE OR REPLACE FUNCTION next_order_number() RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  seq bigint;
BEGIN
  seq := nextval('order_number_seq');
  RETURN 'KPB-' || to_char(now() AT TIME ZONE 'UTC', 'YYYY') || '-'
         || lpad(seq::text, 4, '0');
END;
$$;

-- ── Query support ────────────────────────────────────────────────────────────
-- Indexes the application's actual access patterns need and that were not
-- expressible as Prisma @@index attributes.

-- Admin dashboards page orders newest-first within a status filter.
CREATE INDEX "orders_order_status_created_at_idx"
  ON "orders" ("orderStatus", "createdAt" DESC);

-- The webhook path looks a payment up by provider id; already unique, but the
-- reconciliation sweep scans unsettled payments by age.
CREATE INDEX "payments_status_created_at_idx"
  ON "payments" ("status", "createdAt");

-- The background worker claims the oldest queued job.
CREATE INDEX "generation_jobs_queue_idx"
  ON "generation_jobs" ("status", "createdAt")
  WHERE "status" IN ('queued', 'processing');

-- Expired rate-limit and token rows are pruned by expiry.
CREATE INDEX "rate_limit_counters_expires_at_idx"
  ON "rate_limit_counters" ("expiresAt");
