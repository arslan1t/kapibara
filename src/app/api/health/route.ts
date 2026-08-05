import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { storageStatus, verifyStorage } from "@/lib/storage";
import { activeMailDriver, isMailConfigured } from "@/lib/mail";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { isGenerationEnabled } from "@/lib/generation";
import { queueDepth } from "@/lib/generation/queue";

/**
 * Health and readiness.
 *
 * Reports whether each dependency is *configured and reachable*, never what it
 * is configured with. No hostnames, no bucket names, no key prefixes, no
 * versions — this endpoint is unauthenticated, so everything here is public and
 * must be useless to an attacker mapping the deployment.
 *
 * A load balancer wants the status code: 200 when the application can serve
 * customers, 503 when it cannot. The body is for a human reading a dashboard.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Check {
  ok: boolean;
  /** Short, non-identifying detail. */
  detail?: string;
}

async function checkDatabase(): Promise<Check> {
  const startedAt = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, detail: `${Date.now() - startedAt}ms` };
  } catch {
    // The driver's error would name the host and often the user. Not here.
    return { ok: false, detail: "unreachable" };
  }
}

export async function GET() {
  const database = await checkDatabase();
  const storage = storageStatus();

  // Configuration being *present* is not the same as it being *correct*. This
  // reaches the provider — see StorageDriver.verify.
  const storageProof = await verifyStorage();

  // Queue depth is diagnostic, not a readiness signal: a backlog means the
  // worker is behind, not that the site cannot take orders.
  const queue = database.ok
    ? await queueDepth().catch(() => null)
    : null;

  // Readiness is only about what a customer needs right now. Mail, payment and
  // generation being unconfigured are deliberate, supported states — the
  // application degrades honestly rather than breaking.
  const ready =
    database.ok && storage.configured && storage.durable && storageProof.ok;

  const body = {
    status: ready ? "ok" : "degraded",
    time: new Date().toISOString(),
    checks: {
      database,
      storage: {
        ok: storage.configured && storage.durable && storageProof.ok,
        // Driver name only — never the bucket, endpoint or credentials.
        driver: storage.driver,
        durable: storage.durable,
        // Deliberately included: an operator cannot fix a misconfiguration
        // they cannot see, and these messages name settings, never secrets.
        ...(storageProof.ok ? {} : { detail: storageProof.error }),
      },
      mail: { ok: isMailConfigured(), driver: activeMailDriver() },
      onlinePayment: { ok: isOnlinePaymentEnabled() },
      illustrationProvider: { ok: isGenerationEnabled() },
    },
    ...(queue ? { queue } : {}),
  };

  return NextResponse.json(body, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
