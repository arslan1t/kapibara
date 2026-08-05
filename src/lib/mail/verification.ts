import "server-only";

import { db } from "@/lib/db";
import { TOKEN_TTL_MINUTES } from "@/lib/constants";
import { issueToken, pruneExpiredTokens } from "@/lib/tokens";
import { sendEmail, absoluteUrl, emailVerifyTemplate } from "@/lib/mail";

/**
 * Issues a verification token and mails the link.
 *
 * Deliberately NOT in src/app/actions: every export from a "use server" module
 * is a public endpoint, and this function takes a user id. Exported from there
 * it would let anyone send unlimited verification mail to any account whose id
 * they learned — mail-bombing the customer and burning provider quota. Callers
 * that a visitor can reach (registration, the resend button) do their own
 * authorization and rate limiting before calling this.
 */
export async function sendVerificationEmail(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.emailVerified) return false;

  const { token } = await issueToken(user.id, "email_verify");
  const result = await sendEmail(
    user.email,
    "email_verify",
    emailVerifyTemplate({
      name: user.fullName.split(" ")[0] || user.fullName,
      url: absoluteUrl(`/verify-email?token=${encodeURIComponent(token)}`),
      hours: Math.round(TOKEN_TTL_MINUTES.email_verify / 60),
    })
  );

  void pruneExpiredTokens();
  return result.ok;
}
