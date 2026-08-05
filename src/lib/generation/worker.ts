import "server-only";

import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { reconcileStalePayments } from "@/lib/payments";
import {
  claimNextJob,
  releaseLease,
  requeueJob,
  failJob,
  runMaintenance,
  queueDepth,
  WORKER_ID,
} from "./queue";
import { runJob, pollJob } from "./index";

/**
 * One unit of background work.
 *
 * Shared by the standalone worker process and the cron endpoint, so both
 * deployment shapes run identical logic and there is only one place for a bug
 * to hide. Each tick is bounded: it processes at most `maxJobs` and returns,
 * which keeps a serverless invocation inside its time limit.
 */

export interface TickResult {
  claimed: number;
  succeeded: number;
  failed: number;
  polled: number;
  paymentsReconciled: number;
  tokensPruned: number;
  rateLimitsPruned: number;
}

export interface TickOptions {
  /** Upper bound on jobs handled in this tick. */
  maxJobs?: number;
  /** Stop claiming new work once this much wall time has passed. */
  budgetMs?: number;
}

export async function runTick(options: TickOptions = {}): Promise<TickResult> {
  const maxJobs = options.maxJobs ?? 5;
  const budgetMs = options.budgetMs ?? 50_000;
  const startedAt = Date.now();

  const result: TickResult = {
    claimed: 0,
    succeeded: 0,
    failed: 0,
    polled: 0,
    paymentsReconciled: 0,
    tokensPruned: 0,
    rateLimitsPruned: 0,
  };

  // ── 1. New work ──
  while (result.claimed < maxJobs && Date.now() - startedAt < budgetMs) {
    const job = await claimNextJob();
    if (!job) break;

    result.claimed += 1;

    try {
      await runJob(job.id);

      const after = await db.generationJob.findUnique({
        where: { id: job.id },
        select: { status: true },
      });

      if (after?.status === "succeeded") {
        result.succeeded += 1;
        await releaseLease(job.id);
      } else if (after?.status === "failed") {
        result.failed += 1;
      }
      // "processing" means the provider accepted it and we poll below on a
      // later tick; the lease stays held until then.
    } catch (error) {
      // An exception here means our own code failed, not the provider. Treat it
      // as retryable so a transient fault (a dropped database connection) does
      // not burn the job, but let the attempt cap stop a genuine bug looping.
      const message = error instanceof Error ? error.message : "Unhandled worker error";
      logger.error("worker.job_threw", { jobId: job.id, reason: message });
      await requeueJob(job.id, job.attempts, message).catch(() =>
        failJob(job.id, message)
      );
      result.failed += 1;
    }
  }

  // ── 2. Jobs the provider is still working on ──
  const inFlight = await db.generationJob.findMany({
    where: { status: "processing", providerJobId: { not: null } },
    orderBy: { startedAt: "asc" },
    take: 20,
    select: { id: true },
  });

  for (const job of inFlight) {
    if (Date.now() - startedAt > budgetMs) break;
    await pollJob(job.id).catch((error) =>
      logger.warn("worker.poll_failed", {
        jobId: job.id,
        reason: error instanceof Error ? error.message : "unknown",
      })
    );
    result.polled += 1;
  }

  // ── 3. Payments whose webhook never arrived ──
  result.paymentsReconciled = await reconcileStalePayments().catch((error) => {
    logger.warn("worker.reconcile_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    return 0;
  });

  // ── 4. Housekeeping ──
  const maintenance = await runMaintenance().catch(() => ({
    tokensPruned: 0,
    rateLimitsPruned: 0,
  }));
  result.tokensPruned = maintenance.tokensPruned;
  result.rateLimitsPruned = maintenance.rateLimitsPruned;

  const depth = await queueDepth();
  logger.info("worker.tick", {
    worker: WORKER_ID,
    durationMs: Date.now() - startedAt,
    ...result,
    depth,
  });

  return result;
}
