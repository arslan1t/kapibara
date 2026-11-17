import "server-only";

import { db } from "@/lib/db";
import type { EmailTemplate } from "@/lib/constants";
import type { MailDriverId } from "./transport";
import { deliver, isMailConfigured } from "./transport";
import { logger } from "@/lib/logger";
import type { RenderedEmail } from "./templates";
import { type Locale } from "@/i18n/config";
import { marketDefaultLocale } from "@/i18n/market";

export {
  isMailConfigured,
  verifyMailTransport,
  activeMailDriver,
  type MailDriverId,
} from "./transport";
export * from "./templates";

/**
 * Sends a rendered message and records the attempt.
 *
 * Every send is logged before it is attempted, so a failure leaves a row an
 * administrator can find rather than disappearing into a catch block. The
 * message body is not stored — only the metadata needed to diagnose delivery.
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  rendered: RenderedEmail
): Promise<{ ok: boolean; deliveredBy: MailDriverId }> {
  const record = await db.emailMessage.create({
    data: { to, subject: rendered.subject, template, status: "queued" },
  });

  const result = await deliver({
    to,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
  });

  await db.emailMessage.update({
    where: { id: record.id },
    data: {
      status: result.ok ? "sent" : "failed",
      attempts: { increment: 1 },
      sentAt: result.ok ? new Date() : null,
      // Provider errors are kept for the operator only; nothing here is ever
      // rendered to a customer.
      error: result.error ?? null,
    },
  });

  // Recipient is masked by the logger; the body is never logged.
  if (result.ok) {
    logger.info("mail.sent", { template, to, driver: result.deliveredBy });
  } else {
    logger.error("mail.failed", {
      template,
      to,
      driver: result.deliveredBy,
      reason: result.error,
    });
  }

  return { ok: result.ok, deliveredBy: result.deliveredBy };
}

/**
 * Absolute URL for links inside emails.
 *
 * Emails are read outside the browser, so relative paths are useless here.
 * Falls back to localhost only in development; a production deployment that
 * has not set the site URL would otherwise mail out unusable links.
 */
export function absoluteUrl(path: string, locale: Locale = marketDefaultLocale()): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    process.env.AUTH_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  const clean = path.startsWith("/") ? path : `/${path}`;
  // The locale goes in the link, not left to middleware to guess. Middleware
  // would fall back to Accept-Language, and a reader who chose Uzbek on a
  // Russian-configured browser would land on the Russian site from their own
  // confirmation email.
  return `${base}/${locale}${clean}`;
}

/**
 * What to tell a user after an email-dependent action.
 *
 * When SMTP is not configured nothing was actually delivered, and saying
 * "письмо отправлено" would be a lie. The wording changes instead of the
 * behaviour, so the flow stays testable locally.
 */
export function mailDeliveryNotice(): string {
  return isMailConfigured()
    ? "Мы отправили письмо — проверьте почту, включая папку «Спам»."
    : "Отправка писем пока не настроена: ссылка выведена в журнал сервера.";
}
