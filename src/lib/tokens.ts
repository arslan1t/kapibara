import "server-only";

import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { TOKEN_TTL_MINUTES } from "@/lib/constants";

/**
 * Single-use tokens for email verification and password reset.
 *
 * Only a SHA-256 hash of each token is stored. A database leak therefore hands
 * an attacker no usable reset links — the same reasoning that applies to
 * passwords applies here, because a valid reset token *is* a credential.
 * The plaintext exists exactly once, in the email we send.
 */

export type TokenType = "email_verify" | "password_reset";

/** 32 random bytes, URL-safe. Long enough that guessing is not a threat. */
function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface IssuedToken {
  /** Send this to the user. It is never stored. */
  token: string;
  expiresAt: Date;
}

/**
 * Issues a fresh token, invalidating any earlier unused token of the same type
 * for that user so only the newest emailed link works.
 */
export async function issueToken(
  userId: string,
  type: TokenType
): Promise<IssuedToken> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES[type] * 60_000);

  await db.$transaction([
    db.verificationToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    }),
    db.verificationToken.create({
      data: { userId, type, token: hashToken(token), expiresAt },
    }),
  ]);

  return { token, expiresAt };
}

export type TokenCheck =
  | { ok: true; userId: string; tokenId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Validates a token without consuming it — used to decide what to render on
 * the reset page before the user has typed a new password.
 */
export async function checkToken(
  rawToken: string,
  type: TokenType
): Promise<TokenCheck> {
  if (!rawToken) return { ok: false, reason: "invalid" };

  const record = await db.verificationToken.findUnique({
    where: { token: hashToken(rawToken) },
  });

  if (!record || record.type !== type) return { ok: false, reason: "invalid" };

  // Constant-time comparison of the stored hash against the recomputed one.
  // The unique lookup above already matched, so this only guards against an
  // exotic collision, but the cost is negligible.
  const a = Buffer.from(record.token);
  const b = Buffer.from(hashToken(rawToken));
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "invalid" };
  }

  if (record.usedAt) return { ok: false, reason: "used" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, userId: record.userId, tokenId: record.id };
}

/**
 * Validates and consumes a token in one step.
 *
 * The update is conditional on `usedAt` still being null, so two requests
 * arriving at the same moment cannot both succeed — the second one updates zero
 * rows and is rejected.
 */
export async function consumeToken(
  rawToken: string,
  type: TokenType
): Promise<TokenCheck> {
  const check = await checkToken(rawToken, type);
  if (!check.ok) return check;

  const claimed = await db.verificationToken.updateMany({
    where: { id: check.tokenId, usedAt: null },
    data: { usedAt: new Date() },
  });

  if (claimed.count !== 1) return { ok: false, reason: "used" };
  return check;
}

/**
 * Deletes tokens that expired more than a day ago. Called opportunistically
 * when tokens are issued; there is no cron in this deployment.
 */
export async function pruneExpiredTokens(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
  await db.verificationToken.deleteMany({ where: { expiresAt: { lt: cutoff } } });
}
