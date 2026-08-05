-- Security hardening found in the pre-production audit.
--
-- Four independent fixes, grouped because they are one deploy:
--   1. Session invalidation after a password change.
--   2. Idempotent order creation.
--   3. Claim tokens so a guest order and an anonymous preview job are readable
--      only by the browser that created them.
--   4. An append-only audit log for sensitive administrator actions.

-- ── 1. Session invalidation ──────────────────────────────────────────────────
-- A JWT session cannot be revoked server-side on its own. Recording when the
-- password last changed lets the token callback reject any session issued
-- earlier, so changing a password logs out every other device.
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);

-- ── 2. Idempotent checkout ───────────────────────────────────────────────────
-- A double-click, a retried request or a refresh replays the same key. The
-- unique index is what actually prevents the duplicate: two concurrent inserts
-- race, one wins, and the loser reads back the winner's order.
ALTER TABLE "orders" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders" ("idempotencyKey");

-- ── 3. Claim tokens ──────────────────────────────────────────────────────────
-- Knowing an order id or a job id must never be enough to read it. The token
-- lives in an httpOnly cookie set for the browser that created the record.
ALTER TABLE "orders" ADD COLUMN "guestClaimToken" TEXT;
CREATE UNIQUE INDEX "orders_guestClaimToken_key" ON "orders" ("guestClaimToken");

ALTER TABLE "generation_jobs" ADD COLUMN "claimToken" TEXT;
CREATE UNIQUE INDEX "generation_jobs_claimToken_key" ON "generation_jobs" ("claimToken");

-- ── 4. Administrator audit log ───────────────────────────────────────────────
CREATE TABLE "admin_audit_log" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_log_createdAt_idx" ON "admin_audit_log" ("createdAt");
CREATE INDEX "admin_audit_log_targetType_targetId_idx"
  ON "admin_audit_log" ("targetType", "targetId");
CREATE INDEX "admin_audit_log_actorId_idx" ON "admin_audit_log" ("actorId");

ALTER TABLE "admin_audit_log"
  ADD CONSTRAINT "admin_audit_log_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_audit_log"
  ADD CONSTRAINT "admin_audit_log_target_type_check"
  CHECK ("targetType" IN ('order', 'product', 'review', 'payment', 'user', 'image'));
