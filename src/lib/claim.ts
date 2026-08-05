import "server-only";

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Claim tokens for records that have no signed-in owner.
 *
 * Two things a visitor may legitimately read without an account: the
 * confirmation page for an order they just placed as a guest, and the
 * illustration preview they just started. Both are addressed by a database id,
 * and an id alone must never be enough — that is the classic insecure direct
 * object reference.
 *
 * So the browser that created the record is given an unguessable token in an
 * httpOnly cookie, and the record stores its hash. Reading requires presenting
 * the cookie; the id by itself grants nothing.
 *
 * The cookie is httpOnly and SameSite=Lax, so it is not readable by scripts and
 * is not sent from a third-party site.
 */

/** Guest order confirmation: long enough to survive a slow payment redirect. */
const ORDER_CLAIM_MAX_AGE = 60 * 60 * 24; // 24 hours
/** Anonymous preview: only needs to outlive the personalization session. */
const JOB_CLAIM_MAX_AGE = 60 * 60 * 6; // 6 hours

const ORDER_COOKIE = "kpb_order_claim";
const JOB_COOKIE = "kpb_job_claim";

/** Random, URL-safe, and long enough that guessing is not a threat. */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Only the hash is stored, for the same reason password reset tokens are
 * hashed: a read-only leak of the database should not hand out working claims.
 */
export function hashClaim(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison of two stored hashes. */
export function claimMatches(stored: string | null, presented: string | undefined): boolean {
  if (!stored || !presented) return false;

  const a = Buffer.from(stored);
  const b = Buffer.from(hashClaim(presented));
  return a.length === b.length && timingSafeEqual(a, b);
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    // Secure in production only, so the flow still works over plain HTTP in
    // local development.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * Issues a claim for an order and sets the cookie.
 * Returns the hash to store on the row.
 */
export async function issueOrderClaim(): Promise<string> {
  const token = generateToken();
  (await cookies()).set(ORDER_COOKIE, token, cookieOptions(ORDER_CLAIM_MAX_AGE));
  return hashClaim(token);
}

export async function readOrderClaim(): Promise<string | undefined> {
  return (await cookies()).get(ORDER_COOKIE)?.value;
}

// ─── Generation jobs ──────────────────────────────────────────────────────────

export async function issueJobClaim(): Promise<string> {
  const token = generateToken();
  (await cookies()).set(JOB_COOKIE, token, cookieOptions(JOB_CLAIM_MAX_AGE));
  return hashClaim(token);
}

export async function readJobClaim(): Promise<string | undefined> {
  return (await cookies()).get(JOB_COOKIE)?.value;
}
