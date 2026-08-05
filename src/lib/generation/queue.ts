import "server-only";

import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { GENERATION_MAX_ATTEMPTS } from "@/lib/constants";

/**
 * Durable job queue for illustration generation.
 *
 * The database is the queue. That is a deliberate choice over Redis or SQS: the
 * jobs are already rows here, volume is low (one job per ordered book), and it
 * removes an entire piece of infrastructure from the deployment. If throughput
 * ever outgrows it, `claimNextJob` is the only function that has to change.
 *
 * Correctness rests on one property: a job is claimed by a conditional UPDATE
 * that only matches an unclaimed row. Two workers polling simultaneously will
 * see exactly one succeed, because PostgreSQL serialises the row update.
 */

/** A claim older than this is treated as abandoned by a crashed worker. */
export const LEASE_TIMEOUT_MS = 10 * 60 * 1000;

/** Backoff between attempts, indexed by attempt number. */
const RETRY_DELAYS_MS = [30_000, 2 * 60_000, 10 * 60_000];

/** Identifies this process in the lease, so a stuck job can be traced. */
export const WORKER_ID = `${process.env.WORKER_NAME ?? "worker"}-${randomUUID().slice(0, 8)}`;

export interface ClaimedJob {
  id: string;
  attempts: number;
}

/**
 * Atomically claims the next runnable job, or returns null.
 *
 * Runnable means: queued (or processing with an expired lease — a crashed
 * worker's job), not past its retry cap, and past its backoff time.
 *
 * `updateMany` with the full predicate in the WHERE clause is what makes this
 * safe. A second worker running the same statement matches zero rows.
 */
export async function claimNextJob(): Promise<ClaimedJob | null> {
  const now = new Date();
  const leaseCutoff = new Date(now.getTime() - LEASE_TIMEOUT_MS);

  const candidate = await db.generationJob.findFirst({
    where: {
      attempts: { lt: GENERATION_MAX_ATTEMPTS },
      OR: [
        // Never started, or requeued after a retryable failure.
        {
          status: "queued",
          OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
        },
        // Claimed by a worker that has since died.
        { status: "processing", lockedAt: { lt: leaseCutoff } },
      ],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    select: { id: true, attempts: true, lockedAt: true, status: true },
  });

  if (!candidate) return null;

  // The conditional claim. Repeating the lock state in the WHERE clause means
  // another worker that read the same candidate a millisecond earlier has
  // already changed it, and this update matches nothing.
  const claimed = await db.generationJob.updateMany({
    where: {
      id: candidate.id,
      status: candidate.status,
      lockedAt: candidate.lockedAt,
      attempts: { lt: GENERATION_MAX_ATTEMPTS },
    },
    data: {
      status: "processing",
      lockedAt: now,
      lockedBy: WORKER_ID,
      startedAt: now,
      attempts: { increment: 1 },
    },
  });

  if (claimed.count !== 1) return null;

  logger.info("queue.claimed", {
    jobId: candidate.id,
    worker: WORKER_ID,
    attempt: candidate.attempts + 1,
  });

  return { id: candidate.id, attempts: candidate.attempts + 1 };
}

/** Releases a lease and schedules the next attempt. */
export async function requeueJob(
  jobId: string,
  attempts: number,
  reason: string
): Promise<void> {
  const delay = RETRY_DELAYS_MS[Math.min(attempts, RETRY_DELAYS_MS.length - 1)]!;

  await db.generationJob.update({
    where: { id: jobId },
    data: {
      status: "queued",
      lockedAt: null,
      lockedBy: null,
      lastError: reason,
      nextAttemptAt: new Date(Date.now() + delay),
    },
  });

  logger.warn("queue.requeued", { jobId, attempts, retryInMs: delay });
}

/** Marks a job permanently failed, releasing its lease. */
export async function failJob(jobId: string, reason: string): Promise<void> {
  await db.generationJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      lockedAt: null,
      lockedBy: null,
      lastError: reason,
      completedAt: new Date(),
      nextAttemptAt: null,
    },
  });

  logger.error("queue.failed", { jobId, reason });
}

/** Releases the lease on a job that finished successfully. */
export async function releaseLease(jobId: string): Promise<void> {
  await db.generationJob.updateMany({
    where: { id: jobId },
    data: { lockedAt: null, lockedBy: null, nextAttemptAt: null },
  });
}

export interface QueueDepth {
  queued: number;
  processing: number;
  failed: number;
  /** Jobs whose lease expired — evidence a worker died mid-job. */
  stalled: number;
}

/** Queue statistics for the health check and the admin dashboard. */
export async function queueDepth(): Promise<QueueDepth> {
  const leaseCutoff = new Date(Date.now() - LEASE_TIMEOUT_MS);

  const [queued, processing, failed, stalled] = await Promise.all([
    db.generationJob.count({ where: { status: "queued" } }),
    db.generationJob.count({ where: { status: "processing" } }),
    db.generationJob.count({ where: { status: "failed" } }),
    db.generationJob.count({
      where: { status: "processing", lockedAt: { lt: leaseCutoff } },
    }),
  ]);

  return { queued, processing, failed, stalled };
}

/**
 * Housekeeping that has to happen on a schedule but has no queue of its own.
 *
 * Run by the same worker tick, because standing up a second scheduler for three
 * DELETE statements would not be worth it.
 */
export async function runMaintenance(): Promise<{
  tokensPruned: number;
  rateLimitsPruned: number;
}> {
  const tokenCutoff = new Date(Date.now() - 24 * 60 * 60_000);

  const [tokens, rateLimits] = await Promise.all([
    db.verificationToken.deleteMany({ where: { expiresAt: { lt: tokenCutoff } } }),
    db.rateLimitCounter.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);

  return { tokensPruned: tokens.count, rateLimitsPruned: rateLimits.count };
}
