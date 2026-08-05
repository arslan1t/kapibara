import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { runTick } from "@/lib/generation/worker";
import { logger } from "@/lib/logger";

/**
 * Serverless alternative to the standalone worker.
 *
 * Call this on a schedule (Vercel Cron, GitHub Actions, cron-job.org, a
 * platform scheduler) when the deployment has no place for a long-running
 * process. It runs exactly the same `runTick` as scripts/worker.ts.
 *
 * Protected by a shared secret rather than a session, because the caller is a
 * machine. Without CRON_SECRET the route refuses every request — an unprotected
 * endpoint that spends money at an AI provider is not something to leave open.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Ask the platform for the longest it will give us; the tick has its own budget.
export const maxDuration = 60;

function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  // Vercel Cron sends `Authorization: Bearer <secret>`; other schedulers are
  // easier to configure with a header, so both are accepted.
  const header =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    request.headers.get("x-cron-secret") ??
    "";

  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  if (!authorised(request)) {
    // 404, not 401: an unauthenticated caller should not learn this exists.
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const result = await runTick({ maxJobs: 3, budgetMs: 45_000 });
    return NextResponse.json(
      { ok: true, ...result },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logger.error("cron.tick_failed", {
      reason: error instanceof Error ? error.message : "unknown",
    });
    // 500 so the scheduler records a failure and alerts.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
