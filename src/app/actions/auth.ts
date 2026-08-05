"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import {
  AUTH_ERRORS,
  checkPassword,
  isEmailValid,
  isFullNameValid,
  normalizeEmail,
} from "@/lib/validation";
import { CONSENT_DOCUMENT_VERSION, CONSENT_TYPES } from "@/lib/constants";
import { rateLimit, rateLimitMessage, clientIp } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/mail/verification";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string; field?: string };

/**
 * Creates an account.
 *
 * Every rule enforced in the browser is re-checked here, including the legal
 * consents: a crafted request that skips the checkboxes is rejected server-side
 * rather than trusted.
 */
export async function registerAccount(input: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  consents: Record<string, boolean>;
}): Promise<ActionResult> {
  const fullName = input.fullName?.trim() ?? "";
  const email = normalizeEmail(input.email ?? "");
  const password = input.password ?? "";

  if (!isFullNameValid(fullName)) {
    return { ok: false, error: AUTH_ERRORS.nameRequired, field: "fullName" };
  }
  if (!isEmailValid(email)) {
    return { ok: false, error: AUTH_ERRORS.emailInvalid, field: "email" };
  }

  const strength = checkPassword(password);
  if (!strength.ok) {
    return { ok: false, error: strength.message, field: "password" };
  }
  if (password !== input.confirmPassword) {
    return {
      ok: false,
      error: AUTH_ERRORS.passwordMismatch,
      field: "confirmPassword",
    };
  }

  // Authoritative consent check — the client cannot bypass this.
  const allAccepted = CONSENT_TYPES.every((t) => input.consents?.[t] === true);
  if (!allAccepted) {
    return { ok: false, error: AUTH_ERRORS.consentsRequired, field: "consents" };
  }

  // Throttled per client, not per address: an attacker creating throwaway
  // accounts varies the email but not their origin.
  const limited = await rateLimit("register", `ip:${await clientIp()}`);
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter) };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: AUTH_ERRORS.emailTaken, field: "email" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: "customer",
        consents: {
          create: CONSENT_TYPES.map((type) => ({
            type,
            accepted: true,
            documentVersion: CONSENT_DOCUMENT_VERSION,
          })),
        },
      },
    });

    // The account works whether or not this succeeds, so a mail outage must not
    // fail the registration the customer already completed.
    void sendVerificationEmail(user.id).catch(() => {});

    return { ok: true };
  } catch {
    // Never surface the raw database or provider error to the user.
    return { ok: false, error: AUTH_ERRORS.generic };
  }
}

/** Signs in with email + password. Returns a Russian message on failure. */
export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<ActionResult> {
  const email = normalizeEmail(input.email ?? "");

  // Two keys, because either one alone is evadable: an attacker rotating
  // proxies still hammers one address, and one attacking many addresses still
  // comes from somewhere.
  const [byEmail, byIp] = await Promise.all([
    rateLimit("login", email),
    rateLimit("login", `ip:${await clientIp()}`),
  ]);
  if (!byEmail.ok || !byIp.ok) {
    const retry = Math.max(byEmail.retryAfter, byIp.retryAfter);
    return { ok: false, error: rateLimitMessage(retry) };
  }

  try {
    await signIn("credentials", {
      email,
      password: input.password ?? "",
      redirect: false,
    });
    return { ok: true };
  } catch {
    // Deliberately identical whether the address is unknown or the password is
    // wrong, so this cannot be used to enumerate accounts.
    return { ok: false, error: AUTH_ERRORS.invalidCredentials };
  }
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
