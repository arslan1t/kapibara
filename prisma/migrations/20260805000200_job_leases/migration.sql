-- Worker leases for the generation queue.
--
-- A job is claimed by a conditional UPDATE that sets lockedBy/lockedAt only if
-- the row is still unclaimed. Two workers racing for the same job therefore see
-- one succeed and one update zero rows. A lease older than the timeout is
-- treated as abandoned, which is how work is recovered from a crashed worker.

ALTER TABLE "generation_jobs" ADD COLUMN "lockedAt" TIMESTAMP(3);
ALTER TABLE "generation_jobs" ADD COLUMN "lockedBy" TEXT;
ALTER TABLE "generation_jobs" ADD COLUMN "nextAttemptAt" TIMESTAMP(3);

-- The claim query orders by nextAttemptAt within the runnable statuses.
DROP INDEX IF EXISTS "generation_jobs_queue_idx";
CREATE INDEX "generation_jobs_queue_idx"
  ON "generation_jobs" ("status", "nextAttemptAt", "createdAt")
  WHERE "status" IN ('queued', 'processing');
