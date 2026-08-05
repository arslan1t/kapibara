/**
 * Background worker.
 *
 * Long-running process that polls the job queue. Deploy it alongside the web
 * application on any platform that supports a persistent process (Railway,
 * Render, Fly, a container, systemd). On a serverless platform, use the cron
 * endpoint at /api/cron/worker instead — both call the same `runTick`.
 *
 *   npm run worker
 *
 * Safe to run several instances: jobs are claimed with a conditional update,
 * so two workers never process the same job.
 */
import { runTick } from "../src/lib/generation/worker";
import { WORKER_ID } from "../src/lib/generation/queue";
import { assertStorageReady } from "../src/lib/storage";
import { logger } from "../src/lib/logger";
import { db } from "../src/lib/db";

const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 15_000);

let stopping = false;
let ticking = false;

async function tick(): Promise<void> {
  // Never overlap: a slow tick must not have a second one started underneath it.
  if (ticking || stopping) return;
  ticking = true;
  try {
    await runTick({ maxJobs: 5, budgetMs: INTERVAL_MS * 3 });
  } catch (error) {
    logger.error("worker.tick_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
  } finally {
    ticking = false;
  }
}

async function main(): Promise<void> {
  // Refuses to start if storage would silently lose customer photographs.
  assertStorageReady();

  // Prove the database is reachable before claiming to be up, so a bad
  // DATABASE_URL fails the deploy instead of looking healthy and doing nothing.
  await db.$queryRaw`SELECT 1`;

  logger.info("worker.started", { worker: WORKER_ID, intervalMs: INTERVAL_MS });

  const timer = setInterval(tick, INTERVAL_MS);
  void tick();

  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    logger.info("worker.stopping", { worker: WORKER_ID, signal });
    clearInterval(timer);

    // Let an in-flight tick finish so a job is not abandoned mid-provider-call.
    // Its lease would expire and another worker would retry it, but finishing
    // cleanly avoids a duplicate provider request.
    const deadline = Date.now() + 30_000;
    while (ticking && Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 250));
    }

    await db.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error("worker.start_failed", {
    reason: error instanceof Error ? error.message : "unknown",
  });
  process.exit(1);
});
