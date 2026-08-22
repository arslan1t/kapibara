import "server-only";

import { runTick } from "./worker";
import { logger } from "@/lib/logger";

/**
 * Keeps the queue moving without a separate process.
 *
 * Beget's shared hosting runs the app under mod_passenger — one long-lived
 * Node process, no cron, no way to start a second daemon. Without this, a
 * generation job only advances while the customer's browser is polling it.
 * That was observed in production: a job sat in "processing" for ten minutes
 * after the provider had already finished, purely because the tab was closed —
 * and the preview panel promises that closing the tab is fine.
 *
 * Started from a route module rather than Next's instrumentation hook: that
 * hook is compiled for the edge runtime as well, where importing this chain
 * pulls in nodemailer and the build fails on a missing `fs`.
 *
 * Safe with several instances. Jobs are claimed by a conditional update that
 * carries the whole predicate in its WHERE clause, so two workers never take
 * the same job, and a lease outliving its worker is reclaimed once it expires.
 *
 * Set WORKER_IN_PROCESS=false when a dedicated worker runs elsewhere.
 */

let started = false;

export function startInProcessWorker(): void {
  if (started) return;
  if (process.env.WORKER_IN_PROCESS === "false") return;
  if (!process.env.NANO_BANANA_API_KEY?.trim()) return;

  started = true;

  const intervalMs = Number(process.env.WORKER_INTERVAL_MS ?? 15_000);
  let running = false;

  const timer = setInterval(async () => {
    // A tick that overruns its interval must not stack on the next one.
    if (running) return;
    running = true;
    try {
      await runTick();
    } catch (error) {
      logger.error("worker.in_process_tick_failed", {
        reason: error instanceof Error ? error.message : "unknown",
      });
    } finally {
      running = false;
    }
  }, intervalMs);

  // Never hold the process open on this timer's account.
  timer.unref?.();

  logger.info("worker.in_process_started", { intervalMs });
}
