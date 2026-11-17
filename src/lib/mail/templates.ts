import "server-only";

import { type OrderStatus } from "@/lib/constants";
import { type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill, formatAmount } from "@/i18n/format";
import { marketDefaultLocale } from "@/i18n/market";

/**
 * Transactional email templates.
 *
 * Every template returns both HTML and plain text: some mail clients show only
 * the text part, and a link the reader cannot reach is a broken flow. The HTML
 * uses tables and inline styles because that is what mail clients render
 * reliably — this is not a place for modern CSS.
 */

const BRAND = "#BC5129";
const INK = "#3B2A21";
const MUTED = "#7A6558";
const PAPER = "#FDF7F2";

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * The currency the order was actually placed in, not the reader's current one.
 *
 * An email is a record of what was charged. Re-deriving the currency from the
 * locale would quote a sum in roubles for an order paid in sum.
 */
function money(amount: number, currency: string, locale: Locale): string {
  return formatAmount(amount, currency, locale);
}

/** Shared shell so every message looks like it came from the same company. */
function layout(opts: {
  brand: string;
  autoNote: string;
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footnote?: string;
}): string {
  const button = opts.cta
    ? `<tr><td style="padding:8px 0 28px">
         <a href="${opts.cta.url}"
            style="display:inline-block;background:${BRAND};color:#ffffff;
                   text-decoration:none;font-weight:700;font-size:16px;
                   padding:14px 28px;border-radius:999px">${opts.cta.label}</a>
       </td></tr>`
    : "";

  const footnote = opts.footnote
    ? `<tr><td style="padding-top:8px;color:${MUTED};font-size:13px;line-height:1.6">
         ${opts.footnote}
       </td></tr>`
    : "";

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${PAPER};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"
       style="background:${PAPER};padding:32px 16px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="max-width:560px;background:#ffffff;border-radius:20px;
                  padding:36px 32px;font-family:-apple-system,BlinkMacSystemFont,
                  'Segoe UI',Roboto,Arial,sans-serif;color:${INK}">
      <tr><td style="padding-bottom:20px;font-size:20px;font-weight:800;color:${BRAND}">
        ${opts.brand}
      </td></tr>
      <tr><td style="font-size:22px;font-weight:800;line-height:1.3;padding-bottom:14px">
        ${opts.heading}
      </td></tr>
      <tr><td style="font-size:15px;line-height:1.7;color:${INK};padding-bottom:20px">
        ${opts.body}
      </td></tr>
      ${button}
      ${footnote}
      <tr><td style="padding-top:26px;border-top:1px solid #EFE3D9;
                     color:${MUTED};font-size:12px;line-height:1.6">
        ${opts.autoNote}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ─── Email verification ───────────────────────────────────────────────────────

export function emailVerifyTemplate(opts: {
  name: string;
  url: string;
  hours: number;
  locale?: Locale;
}): RenderedEmail {
  const locale = opts.locale ?? marketDefaultLocale();
  const t = getDictionary(locale);
  const v = { name: opts.name, hours: opts.hours, brand: t.common.brand };

  return {
    subject: fill(t.mail.verifySubject, v),
    html: layout({
      brand: t.common.brand,
      autoNote: t.mail.autoNote,
      heading: fill(t.mail.verifyHeading, v),
      body: fill(t.mail.verifyBody, v),
      cta: { label: t.mail.verifyCta, url: opts.url },
      footnote: fill(t.mail.verifyFootnote, v),
    }),
    text: [
      fill(t.mail.verifyHeading, v),
      "",
      fill(t.mail.verifyPlainLead, v),
      opts.url,
      "",
      fill(t.mail.verifyPlainExpiry, v),
      t.mail.verifyPlainIgnore,
    ].join("\n"),
  };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export function passwordResetTemplate(opts: {
  name: string;
  url: string;
  minutes: number;
  locale?: Locale;
}): RenderedEmail {
  const locale = opts.locale ?? marketDefaultLocale();
  const t = getDictionary(locale);
  const v = { name: opts.name, minutes: opts.minutes, brand: t.common.brand };

  return {
    subject: fill(t.mail.resetSubject, v),
    html: layout({
      brand: t.common.brand,
      autoNote: t.mail.autoNote,
      heading: t.mail.resetHeading,
      body: fill(t.mail.resetBody, v),
      cta: { label: t.mail.resetCta, url: opts.url },
      footnote: fill(t.mail.resetFootnote, v),
    }),
    text: [
      t.mail.resetHeading,
      "",
      fill(t.mail.resetPlainLead, v),
      opts.url,
      "",
      fill(t.mail.resetPlainExpiry, v),
      t.mail.resetPlainIgnore,
    ].join("\n"),
  };
}

// ─── Order created ────────────────────────────────────────────────────────────

export interface OrderEmailItem {
  title: string;
  childName: string;
  quantity: number;
  lineTotal: number;
}

export function orderCreatedTemplate(opts: {
  name: string;
  orderNumber: string;
  items: OrderEmailItem[];
  total: number;
  currency: string;
  orderUrl: string;
  paymentNote: string;
  locale?: Locale;
}): RenderedEmail {
  const locale = opts.locale ?? marketDefaultLocale();
  const t = getDictionary(locale);
  const v = { orderNumber: opts.orderNumber, name: opts.name, brand: t.common.brand };
  const price = (amount: number) => money(amount, opts.currency, locale);

  const rows = opts.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:14px;line-height:1.5">
          <strong>${i.title}</strong><br>
          <span style="color:${MUTED}">${fill(t.mail.orderChildName, {
            name: i.childName,
            quantity: i.quantity,
          })}</span>
        </td>
        <td style="padding:8px 0;font-size:14px;text-align:right;white-space:nowrap">
          ${price(i.lineTotal)}
        </td>
      </tr>`
    )
    .join("");

  return {
    subject: fill(t.mail.orderSubject, v),
    html: layout({
      brand: t.common.brand,
      autoNote: t.mail.autoNote,
      heading: fill(t.mail.orderHeading, v),
      body: `${fill(t.mail.orderBody, v)}
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                    style="margin-top:18px;border-top:1px solid #EFE3D9">
               ${rows}
               <tr><td style="padding-top:12px;border-top:1px solid #EFE3D9;
                              font-size:15px;font-weight:700">${t.mail.orderTotal}</td>
                   <td style="padding-top:12px;border-top:1px solid #EFE3D9;
                              font-size:15px;font-weight:700;text-align:right">
                     ${price(opts.total)}</td></tr>
             </table>`,
      cta: { label: t.mail.orderCta, url: opts.orderUrl },
      footnote: opts.paymentNote,
    }),
    text: [
      fill(t.mail.orderHeading, v),
      "",
      fill(t.mail.orderPlainThanks, v),
      "",
      ...opts.items.map((i) =>
        fill(t.mail.orderPlainItem, {
          title: i.title,
          childName: i.childName,
          quantity: i.quantity,
          price: price(i.lineTotal),
        })
      ),
      "",
      fill(t.mail.orderPlainTotal, { total: price(opts.total) }),
      "",
      opts.paymentNote,
      "",
      fill(t.mail.orderPlainLink, { url: opts.orderUrl }),
    ].join("\n"),
  };
}

// ─── Order status changed ─────────────────────────────────────────────────────

export function orderStatusTemplate(opts: {
  name: string;
  orderNumber: string;
  status: OrderStatus;
  orderUrl: string;
  /** Set for a completed order, inviting a review. */
  reviewUrl?: string;
  locale?: Locale;
}): RenderedEmail {
  const locale = opts.locale ?? marketDefaultLocale();
  const t = getDictionary(locale);

  const status = t.orderStatus[opts.status].toLocaleLowerCase(locale);
  // Written so the customer learns what actually happened, rather than reading
  // a database value back.
  const explanation = fill(t.statusExplanation[opts.status], {
    brand: t.common.brand,
  });
  const v = {
    orderNumber: opts.orderNumber,
    status,
    name: opts.name,
    explanation,
    brand: t.common.brand,
  };

  return {
    subject: fill(t.mail.statusSubject, v),
    html: layout({
      brand: t.common.brand,
      autoNote: t.mail.autoNote,
      heading: fill(t.mail.statusHeading, v),
      body: fill(t.mail.statusBody, v),
      cta: opts.reviewUrl
        ? { label: t.mail.statusReviewCta, url: opts.reviewUrl }
        : { label: t.mail.orderCta, url: opts.orderUrl },
      footnote: opts.reviewUrl ? t.mail.statusReviewNote : undefined,
    }),
    text: [
      fill(t.mail.statusHeading, v),
      "",
      fill(t.mail.statusBody, v),
      "",
      opts.reviewUrl
        ? fill(t.mail.statusReviewPlain, { url: opts.reviewUrl })
        : fill(t.mail.orderPlainLink, { url: opts.orderUrl }),
    ].join("\n"),
  };
}
