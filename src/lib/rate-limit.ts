import "server-only";

import { headers } from "next/headers";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiting, backed by the database.
 *
 * Deliberately not in-memory: a per-process counter resets on every deploy and
 * does nothing at all once there is more than one instance. The database is
 * already a shared dependency, so it is the honest place for this. If write
 * volume ever makes these rows hot, swap the two helpers below for Redis —
 * nothing else has to change.
 */

export interface RateLimitRule {
  /** Maximum attempts allowed inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

/**
 * Limits chosen to stop credential-stuffing and mail-bombing without getting
 * in the way of a person who mistyped their password twice.
 */
export const RATE_LIMITS = {
  login: { limit: 8, windowSeconds: 15 * 60 },
  register: { limit: 5, windowSeconds: 60 * 60 },
  passwordReset: { limit: 4, windowSeconds: 60 * 60 },
  emailVerifyResend: { limit: 4, windowSeconds: 60 * 60 },
  review: { limit: 10, windowSeconds: 60 * 60 },
  upload: { limit: 30, windowSeconds: 60 * 60 },
  checkout: { limit: 15, windowSeconds: 60 * 60 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets. Only meaningful when `ok` is false. */
  retryAfter: number;
}

/**
 * Client identifier for rate limiting.
 *
 * X-Forwarded-For is a list the client can seed: a request sent with
 * `X-Forwarded-For: 1.2.3.4` arrives as "1.2.3.4, <real ip>" once the proxy
 * appends. Reading the *leftmost* entry therefore reads whatever the attacker
 * chose, and a rotating header defeats every IP-keyed limit.
 *
 * So: prefer the headers a platform sets itself and a client cannot forge, and
 * otherwise take the *rightmost* XFF entry — the one appended by the hop
 * closest to us. TRUSTED_PROXY_COUNT tunes that when several of our own proxies
 * are chained.
 *
 * Auth actions additionally key on the submitted email, which an attacker
 * cannot vary without also changing which account they are attacking.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();

  // Set by the platform's own edge, after any client-supplied value.
  const platform =
    h.get("cf-connecting-ip") ??
    h.get("x-vercel-forwarded-for") ??
    h.get("x-real-ip");
  if (platform) return platform.trim();

  const forwarded = h.get("x-forwarded-for");
  if (!forwarded) return "unknown";

  const hops = forwarded
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (hops.length === 0) return "unknown";

  // Count from the right: our own proxies appended those entries.
  const trusted = Math.max(
    0,
    Math.min(Number(process.env.TRUSTED_PROXY_COUNT ?? 0), hops.length - 1)
  );
  return hops[hops.length - 1 - trusted]!;
}

/**
 * Records one attempt and reports whether it is allowed.
 *
 * Counts the attempt before answering, so a caller that forgets to check the
 * result still contributes to the limit.
 */
export async function rateLimit(
  action: RateLimitAction,
  identifier: string
): Promise<RateLimitResult> {
  const rule = RATE_LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = new Date();

  try {
    const existing = await db.rateLimitCounter.findUnique({ where: { key } });

    // No window yet, or the previous one has run out: start a fresh one.
    if (!existing || existing.expiresAt <= now) {
      const expiresAt = new Date(now.getTime() + rule.windowSeconds * 1000);
      await db.rateLimitCounter.upsert({
        where: { key },
        create: { key, count: 1, windowStart: now, expiresAt },
        update: { count: 1, windowStart: now, expiresAt },
      });
      return { ok: true, remaining: rule.limit - 1, retryAfter: 0 };
    }

    if (existing.count >= rule.limit) {
      const retryAfter = Math.max(
        1,
        Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)
      );
      return { ok: false, remaining: 0, retryAfter };
    }

    const updated = await db.rateLimitCounter.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      ok: updated.count <= rule.limit,
      remaining: Math.max(0, rule.limit - updated.count),
      retryAfter: 0,
    };
  } catch {
    // A limiter that fails closed would take the whole site down with the
    // database. Allow the request and let the action's own validation stand.
    return { ok: true, remaining: 0, retryAfter: 0 };
  }
}

/** Removes counters whose window has closed. Cheap, so callers can fire it freely. */
export async function pruneRateLimits(): Promise<void> {
  await db.rateLimitCounter.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

/** Russian message for a blocked attempt, with a human-readable wait. */
export function rateLimitMessage(retryAfter: number): string {
  const minutes = Math.ceil(retryAfter / 60);
  if (minutes <= 1) return "Слишком много попыток. Попробуйте через минуту";
  if (minutes < 60) return `Слишком много попыток. Попробуйте через ${minutes} мин.`;
  const hours = Math.ceil(minutes / 60);
  return `Слишком много попыток. Попробуйте через ${hours} ч.`;
}
