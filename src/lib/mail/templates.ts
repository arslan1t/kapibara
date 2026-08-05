import "server-only";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";

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

function money(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

/** Shared shell so every message looks like it came from the same company. */
function layout(opts: {
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
        Капибара
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
        Это письмо отправлено автоматически, отвечать на него не нужно.
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
}): RenderedEmail {
  return {
    subject: "Подтвердите адрес электронной почты — Капибара",
    html: layout({
      heading: `${opts.name}, подтвердите адрес почты`,
      body: `Мы создали для вас аккаунт в Капибаре. Чтобы получать письма о заказах,
             подтвердите адрес — это займёт одну секунду.`,
      cta: { label: "Подтвердить адрес", url: opts.url },
      footnote: `Ссылка действует ${opts.hours} ч. Если вы не регистрировались,
                 просто удалите это письмо — аккаунт останется неподтверждённым.`,
    }),
    text: [
      `${opts.name}, подтвердите адрес почты`,
      "",
      "Мы создали для вас аккаунт в Капибаре. Подтвердите адрес по ссылке:",
      opts.url,
      "",
      `Ссылка действует ${opts.hours} ч.`,
      "Если вы не регистрировались, просто удалите это письмо.",
    ].join("\n"),
  };
}

// ─── Password reset ───────────────────────────────────────────────────────────

export function passwordResetTemplate(opts: {
  name: string;
  url: string;
  minutes: number;
}): RenderedEmail {
  return {
    subject: "Восстановление пароля — Капибара",
    html: layout({
      heading: "Восстановление пароля",
      body: `${opts.name}, мы получили запрос на смену пароля для вашего аккаунта.
             Нажмите кнопку ниже, чтобы задать новый пароль.`,
      cta: { label: "Задать новый пароль", url: opts.url },
      footnote: `Ссылка действует ${opts.minutes} мин. и сработает один раз.
                 Если вы не запрашивали смену пароля, ничего делать не нужно —
                 пароль останется прежним.`,
    }),
    text: [
      "Восстановление пароля",
      "",
      `${opts.name}, мы получили запрос на смену пароля. Задайте новый пароль по ссылке:`,
      opts.url,
      "",
      `Ссылка действует ${opts.minutes} мин. и сработает один раз.`,
      "Если вы не запрашивали смену пароля, ничего делать не нужно.",
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
  orderUrl: string;
  paymentNote: string;
}): RenderedEmail {
  const rows = opts.items
    .map(
      (i) => `<tr>
        <td style="padding:8px 0;font-size:14px;line-height:1.5">
          <strong>${i.title}</strong><br>
          <span style="color:${MUTED}">Имя ребёнка: ${i.childName} · ${i.quantity} шт.</span>
        </td>
        <td style="padding:8px 0;font-size:14px;text-align:right;white-space:nowrap">
          ${money(i.lineTotal)}
        </td>
      </tr>`
    )
    .join("");

  return {
    subject: `Заказ ${opts.orderNumber} принят — Капибара`,
    html: layout({
      heading: `Заказ ${opts.orderNumber} принят`,
      body: `${opts.name}, спасибо за заказ. Мы уже начали над ним работать и
             сообщим, когда книга отправится в печать.
             <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                    style="margin-top:18px;border-top:1px solid #EFE3D9">
               ${rows}
               <tr><td style="padding-top:12px;border-top:1px solid #EFE3D9;
                              font-size:15px;font-weight:700">Итого</td>
                   <td style="padding-top:12px;border-top:1px solid #EFE3D9;
                              font-size:15px;font-weight:700;text-align:right">
                     ${money(opts.total)}</td></tr>
             </table>`,
      cta: { label: "Открыть заказ", url: opts.orderUrl },
      footnote: opts.paymentNote,
    }),
    text: [
      `Заказ ${opts.orderNumber} принят`,
      "",
      `${opts.name}, спасибо за заказ.`,
      "",
      ...opts.items.map(
        (i) => `— ${i.title} (имя: ${i.childName}, ${i.quantity} шт.) — ${money(i.lineTotal)}`
      ),
      "",
      `Итого: ${money(opts.total)}`,
      "",
      opts.paymentNote,
      "",
      `Заказ: ${opts.orderUrl}`,
    ].join("\n"),
  };
}

// ─── Order status changed ─────────────────────────────────────────────────────

/**
 * A sentence per status. Written so the customer learns what actually happened,
 * rather than reading a database value.
 */
const STATUS_EXPLANATION: Record<OrderStatus, string> = {
  new: "Мы получили заказ и скоро возьмём его в работу.",
  awaiting_confirmation: "Мы свяжемся с вами, чтобы подтвердить детали заказа.",
  in_progress: "Заказ в работе.",
  personalization: "Добавляем имя и лицо вашего ребёнка в иллюстрации.",
  sent_to_print: "Книга отправлена в печать.",
  ready_to_ship: "Книга напечатана и готова к отправке.",
  in_delivery: "Заказ передан в доставку.",
  completed: "Заказ доставлен. Спасибо, что выбрали Капибару!",
  cancelled: "Заказ отменён. Если это ошибка, напишите нам.",
};

export function orderStatusTemplate(opts: {
  name: string;
  orderNumber: string;
  status: OrderStatus;
  orderUrl: string;
  /** Set for a completed order, inviting a review. */
  reviewUrl?: string;
}): RenderedEmail {
  const label = ORDER_STATUS_LABELS[opts.status];
  const explanation = STATUS_EXPLANATION[opts.status];

  return {
    subject: `Заказ ${opts.orderNumber}: ${label.toLowerCase()} — Капибара`,
    html: layout({
      heading: `Заказ ${opts.orderNumber} — ${label.toLowerCase()}`,
      body: `${opts.name}, статус вашего заказа изменился. ${explanation}`,
      cta: opts.reviewUrl
        ? { label: "Оставить отзыв", url: opts.reviewUrl }
        : { label: "Открыть заказ", url: opts.orderUrl },
      footnote: opts.reviewUrl
        ? "Ваш отзыв появится на сайте после проверки модератором."
        : undefined,
    }),
    text: [
      `Заказ ${opts.orderNumber} — ${label.toLowerCase()}`,
      "",
      `${opts.name}, статус вашего заказа изменился. ${explanation}`,
      "",
      opts.reviewUrl ? `Оставить отзыв: ${opts.reviewUrl}` : `Заказ: ${opts.orderUrl}`,
    ].join("\n"),
  };
}
