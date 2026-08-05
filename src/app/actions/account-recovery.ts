"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  AUTH_ERRORS,
  checkPassword,
  isEmailValid,
  normalizeEmail,
} from "@/lib/validation";
import { TOKEN_TTL_MINUTES } from "@/lib/constants";
import {
  issueToken,
  consumeToken,
  checkToken,
  pruneExpiredTokens,
} from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail/verification";
import {
  sendEmail,
  absoluteUrl,
  mailDeliveryNotice,
  passwordResetTemplate,
} from "@/lib/mail";
import { rateLimit, rateLimitMessage, clientIp } from "@/lib/rate-limit";

export type RecoveryResult =
  | { ok: true; notice: string }
  | { ok: false; error: string; field?: string };

// ─── Email verification ───────────────────────────────────────────────────────

/** Resends the verification link to the signed-in user. */
export async function resendVerificationEmail(): Promise<RecoveryResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Войдите в аккаунт" };

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Войдите в аккаунт" };
  if (user.emailVerified) return { ok: false, error: AUTH_ERRORS.alreadyVerified };

  const limited = await rateLimit("emailVerifyResend", user.id);
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter) };
  }

  const sent = await sendVerificationEmail(user.id);
  if (!sent) return { ok: false, error: AUTH_ERRORS.verifyFailed };

  return { ok: true, notice: mailDeliveryNotice() };
}

export type VerifyOutcome =
  | { ok: true; email: string }
  | { ok: false; error: string };

/**
 * Consumes a verification token and marks the address confirmed.
 *
 * Idempotent from the user's point of view: clicking an already-used link on an
 * account that is verified reports success rather than an alarming error.
 */
export async function verifyEmailToken(token: string): Promise<VerifyOutcome> {
  const consumed = await consumeToken(token, "email_verify");

  if (!consumed.ok) {
    // A used token on an already-verified account means the user clicked twice.
    if (consumed.reason === "used") {
      const stale = await checkToken(token, "email_verify");
      void stale;
    }
    return {
      ok: false,
      error:
        consumed.reason === "expired"
          ? AUTH_ERRORS.linkExpired
          : consumed.reason === "used"
            ? AUTH_ERRORS.linkUsed
            : AUTH_ERRORS.linkInvalid,
    };
  }

  const user = await db.user.update({
    where: { id: consumed.userId },
    data: { emailVerified: new Date() },
  });

  return { ok: true, email: user.email };
}

// ─── Password reset ───────────────────────────────────────────────────────────

/**
 * Starts a password reset.
 *
 * Always reports the same success message, whether or not the address exists.
 * Anything else turns this form into a way to discover who has an account.
 */
export async function requestPasswordReset(input: {
  email: string;
}): Promise<RecoveryResult> {
  const email = normalizeEmail(input.email ?? "");

  if (!isEmailValid(email)) {
    return { ok: false, error: AUTH_ERRORS.emailInvalid, field: "email" };
  }

  // Keyed on both address and IP: the first stops one account being mail-bombed,
  // the second stops one client walking a list of addresses.
  const [byEmail, byIp] = await Promise.all([
    rateLimit("passwordReset", email),
    rateLimit("passwordReset", `ip:${await clientIp()}`),
  ]);
  if (!byEmail.ok || !byIp.ok) {
    const retry = Math.max(byEmail.retryAfter, byIp.retryAfter);
    return { ok: false, error: rateLimitMessage(retry) };
  }

  const neutralSuccess: RecoveryResult = {
    ok: true,
    notice: mailDeliveryNotice(),
  };

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return neutralSuccess;

  const { token } = await issueToken(user.id, "password_reset");
  await sendEmail(
    user.email,
    "password_reset",
    passwordResetTemplate({
      name: user.fullName.split(" ")[0] || user.fullName,
      url: absoluteUrl(`/reset-password?token=${encodeURIComponent(token)}`),
      minutes: TOKEN_TTL_MINUTES.password_reset,
    })
  );

  void pruneExpiredTokens();
  return neutralSuccess;
}

export type ResetTokenState =
  | { valid: true }
  | { valid: false; error: string };

/** Checks a reset link before showing the form, without consuming the token. */
export async function inspectResetToken(token: string): Promise<ResetTokenState> {
  const check = await checkToken(token, "password_reset");
  if (check.ok) return { valid: true };

  return {
    valid: false,
    error:
      check.reason === "expired"
        ? AUTH_ERRORS.linkExpired
        : check.reason === "used"
          ? AUTH_ERRORS.linkUsed
          : AUTH_ERRORS.linkInvalid,
  };
}

/**
 * Sets a new password from a reset link.
 *
 * The token is consumed first: if that fails the password is untouched, so a
 * replayed link cannot overwrite a password the real owner has already set.
 */
export async function resetPassword(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<RecoveryResult> {
  const strength = checkPassword(input.password ?? "");
  if (!strength.ok) {
    return { ok: false, error: strength.message, field: "password" };
  }
  if (input.password !== input.confirmPassword) {
    return {
      ok: false,
      error: AUTH_ERRORS.passwordMismatch,
      field: "confirmPassword",
    };
  }

  const consumed = await consumeToken(input.token ?? "", "password_reset");
  if (!consumed.ok) {
    return {
      ok: false,
      error:
        consumed.reason === "expired"
          ? AUTH_ERRORS.linkExpired
          : consumed.reason === "used"
            ? AUTH_ERRORS.linkUsed
            : AUTH_ERRORS.linkInvalid,
    };
  }

  try {
    const passwordHash = await bcrypt.hash(input.password, 12);

    await db.$transaction([
      db.user.update({
        where: { id: consumed.userId },
        data: {
          passwordHash,
          // Completing a reset proves control of the mailbox, which is exactly
          // what email verification asks for.
          emailVerified: new Date(),
          // Invalidates every session issued before now. Someone resetting a
          // password they suspect is compromised expects the intruder out.
          passwordChangedAt: new Date(),
        },
      }),
      // Any other outstanding reset link is now void.
      db.verificationToken.updateMany({
        where: { userId: consumed.userId, type: "password_reset", usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return {
      ok: true,
      notice: "Пароль изменён. Теперь войдите с новым паролем.",
    };
  } catch {
    return { ok: false, error: AUTH_ERRORS.resetFailed };
  }
}
