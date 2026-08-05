import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

/**
 * Outbound mail transport.
 *
 * Three drivers behind one interface, chosen by configuration:
 *
 *   • Resend  — the production default. An HTTP API, so it works on platforms
 *               that block outbound SMTP ports (Vercel, most serverless).
 *   • SMTP    — for a self-hosted or corporate mail server.
 *   • Console — the development fallback. Writes the message, including any
 *               link, to the server log so the whole flow is testable without
 *               an account anywhere.
 *
 * The console driver never pretends a message was delivered: `deliveredBy`
 * reports which path ran, and the UI wording changes accordingly.
 */

export type MailDriverId = "resend" | "smtp" | "console";

export interface OutgoingMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface DeliveryResult {
  ok: boolean;
  deliveredBy: MailDriverId;
  messageId?: string;
  error?: string;
}

// ─── Configuration ────────────────────────────────────────────────────────────

interface ResendConfig {
  apiKey: string;
  from: string;
  replyTo: string | undefined;
}

function readResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!apiKey || !from) return null;

  return { apiKey, from, replyTo: process.env.MAIL_REPLY_TO?.trim() || undefined };
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Reads SMTP settings.
 *
 * Returns null when incomplete — a half-filled configuration is treated as "not
 * configured" rather than failing at send time with a confusing provider error.
 */
export function readSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD?.trim();
  const from = process.env.MAIL_FROM?.trim();

  if (!host || !user || !pass || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isInteger(port) || port <= 0) return null;

  return {
    host,
    port,
    // Implicit TLS on 465; STARTTLS is negotiated on everything else.
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    user,
    pass,
    from,
  };
}

/**
 * Which driver will handle the next send.
 *
 * MAIL_DRIVER forces a choice; otherwise Resend wins when configured, then
 * SMTP, then the console fallback.
 */
export function activeMailDriver(): MailDriverId {
  const requested = process.env.MAIL_DRIVER?.trim() as MailDriverId | undefined;
  if (requested === "resend" || requested === "smtp" || requested === "console") {
    return requested;
  }
  if (readResendConfig()) return "resend";
  if (readSmtpConfig()) return "smtp";
  return "console";
}

/** True when real delivery is possible. Drives honest wording in the UI. */
export function isMailConfigured(): boolean {
  const driver = activeMailDriver();
  if (driver === "resend") return readResendConfig() !== null;
  if (driver === "smtp") return readSmtpConfig() !== null;
  return false;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

let resendClient: { key: string; client: Resend } | null = null;

function getResend(config: ResendConfig): Resend {
  if (resendClient?.key === config.apiKey) return resendClient.client;
  const client = new Resend(config.apiKey);
  resendClient = { key: config.apiKey, client };
  return client;
}

// Transporters hold a connection pool, so one instance is reused across
// requests. Recreated only if the configuration itself changes.
let smtpClient: { key: string; transporter: Transporter } | null = null;

function getTransporter(config: SmtpConfig): Transporter {
  const key = `${config.host}:${config.port}:${config.user}`;
  if (smtpClient?.key === key) return smtpClient.transporter;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    pool: true,
    maxConnections: 3,
  });

  smtpClient = { key, transporter };
  return transporter;
}

/**
 * Checks that the configured provider accepts our credentials.
 * Surfaced by the health check so a misconfiguration is visible before a
 * customer hits it.
 */
export async function verifyMailTransport(): Promise<
  { ok: true; driver: MailDriverId } | { ok: false; driver: MailDriverId; error: string }
> {
  const driver = activeMailDriver();

  if (driver === "console") {
    return { ok: false, driver, error: "Почта не настроена" };
  }

  if (driver === "resend") {
    const config = readResendConfig();
    if (!config) return { ok: false, driver, error: "RESEND_API_KEY не задан" };

    try {
      // Listing domains is the cheapest authenticated call that proves the key
      // works without sending anything to a real person.
      const result = await getResend(config).domains.list();

      if (result.error) {
        // A send-only key is REFUSED this call, and that is the correct way to
        // issue a key: least privilege. Treat the refusal as proof the key is
        // valid and correctly scoped, not as a fault. Anything else would push
        // an operator towards a full-access key to make a green tick appear.
        const message = result.error.message ?? "";
        if (
          result.error.name === "restricted_api_key" ||
          /restricted/i.test(message)
        ) {
          return { ok: true, driver };
        }
        return { ok: false, driver, error: message };
      }
      return { ok: true, driver };
    } catch (error) {
      return {
        ok: false,
        driver,
        error: error instanceof Error ? error.message : "Не удалось подключиться",
      };
    }
  }

  const config = readSmtpConfig();
  if (!config) return { ok: false, driver, error: "SMTP не настроен" };

  try {
    await getTransporter(config).verify();
    return { ok: true, driver };
  } catch (error) {
    return {
      ok: false,
      driver,
      error: error instanceof Error ? error.message : "Не удалось подключиться",
    };
  }
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export async function deliver(message: OutgoingMessage): Promise<DeliveryResult> {
  const driver = activeMailDriver();

  if (driver === "resend") {
    const config = readResendConfig();
    if (!config) {
      return { ok: false, deliveredBy: "resend", error: "RESEND_API_KEY не задан" };
    }

    try {
      const result = await getResend(config).emails.send({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(config.replyTo ? { replyTo: config.replyTo } : {}),
      });

      if (result.error) {
        return {
          ok: false,
          deliveredBy: "resend",
          error: result.error.message,
        };
      }
      return { ok: true, deliveredBy: "resend", messageId: result.data?.id };
    } catch (error) {
      return {
        ok: false,
        deliveredBy: "resend",
        error: error instanceof Error ? error.message : "Ошибка отправки",
      };
    }
  }

  if (driver === "smtp") {
    const config = readSmtpConfig();
    if (!config) {
      return { ok: false, deliveredBy: "smtp", error: "SMTP не настроен" };
    }

    try {
      const info = await getTransporter(config).sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { ok: true, deliveredBy: "smtp", messageId: info.messageId };
    } catch (error) {
      return {
        ok: false,
        deliveredBy: "smtp",
        error: error instanceof Error ? error.message : "Ошибка отправки",
      };
    }
  }

  // Console fallback. The body is printed so a developer can follow the link;
  // this is the only place a token ever reaches the log, it is guarded by
  // NODE_ENV, and it cannot happen once a provider is configured.
  if (process.env.NODE_ENV === "production") {
    logger.error("mail.not_configured", { subject: message.subject });
    return {
      ok: false,
      deliveredBy: "console",
      error: "Почтовый провайдер не настроен",
    };
  }

  console.info(
    [
      "",
      "──────────── ПИСЬМО (провайдер не настроен) ────────────",
      `Кому:  ${message.to}`,
      `Тема:  ${message.subject}`,
      "",
      message.text,
      "────────────────────────────────────────────────────────",
      "",
    ].join("\n")
  );
  return { ok: true, deliveredBy: "console" };
}
