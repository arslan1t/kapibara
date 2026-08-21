/**
 * Domain vocabulary shared by the database, server actions and UI.
 *
 * The schema stores these as plain strings so it stays portable to Postgres and
 * SQLite alike; these unions are what actually constrain them in the codebase.
 */

// ─── Order status ─────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
  "new",
  "awaiting_confirmation",
  "in_progress",
  "personalization",
  "sent_to_print",
  "ready_to_ship",
  "in_delivery",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: "Новый",
  awaiting_confirmation: "Ожидает подтверждения",
  in_progress: "В работе",
  personalization: "На персонализации",
  sent_to_print: "Отправлен в печать",
  ready_to_ship: "Готов к отправке",
  in_delivery: "Передан в доставку",
  completed: "Завершён",
  cancelled: "Отменён",
};

/** Tailwind classes for status pills, kept next to the labels they describe. */
export const ORDER_STATUS_TONE: Record<OrderStatus, string> = {
  new: "bg-brand-100 text-brand-600",
  awaiting_confirmation: "bg-gold-100 text-brown-dark",
  in_progress: "bg-gold-200 text-brown-dark",
  personalization: "bg-brand-100 text-brand-600",
  sent_to_print: "bg-cream-300 text-brown-dark",
  ready_to_ship: "bg-sage-100 text-sage-500",
  in_delivery: "bg-sage-100 text-sage-500",
  completed: "bg-sage-200 text-sage-500",
  cancelled: "bg-red-100 text-red-600",
};

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

// ─── Payment status ───────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = [
  "unpaid",
  "pay_on_confirmation",
  "paid",
  "refunded",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Не оплачен",
  pay_on_confirmation: "Оплата при подтверждении",
  paid: "Оплачен",
  refunded: "Возврат",
};

export function isPaymentStatus(value: string): value is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value);
}

// ─── Product status ───────────────────────────────────────────────────────────

export const PRODUCT_STATUSES = ["available", "coming_soon", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  available: "В продаже",
  coming_soon: "Скоро",
  archived: "В архиве",
};

/** A product may only be added to a cart or ordered when this is true. */
export function isPurchasable(product: {
  published: boolean;
  status: string;
  stockStatus: string;
}): boolean {
  return (
    product.published &&
    product.status === "available" &&
    product.stockStatus === "in_stock"
  );
}

// ─── Delivery ─────────────────────────────────────────────────────────────────

export const DELIVERY_METHODS = ["courier", "pickup_point", "post"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  courier: "Курьером",
  pickup_point: "В пункт выдачи",
  post: "Почтой России",
};

export function isDeliveryMethod(value: string): value is DeliveryMethod {
  return (DELIVERY_METHODS as readonly string[]).includes(value);
}

// ─── Roles ────────────────────────────────────────────────────────────────────

export const ROLES = ["customer", "admin"] as const;
export type Role = (typeof ROLES)[number];

// ─── Legal consents ───────────────────────────────────────────────────────────

/**
 * Version stamped onto stored consents. Defined in src/lib/legal.ts alongside
 * the documents themselves, so the wording and the version cannot drift apart.
 */
export { LEGAL_VERSION as CONSENT_DOCUMENT_VERSION } from "@/lib/legal";

/**
 * Consents collected at registration.
 *
 * "promo_rules" was removed: there is no promotion, so the checkbox asked
 * people to accept rules for something that does not exist. The database CHECK
 * constraint still permits the value — consents already given must remain
 * readable exactly as they were recorded.
 */
export const CONSENT_TYPES = ["personal_data", "user_agreement"] as const;

export type ConsentType = (typeof CONSENT_TYPES)[number];

// ─── Payments ─────────────────────────────────────────────────────────────────

/**
 * Payment providers the application can drive.
 *
 * "manual" needs no credentials and is the default: the order is confirmed by
 * an administrator and paid on delivery or by invoice. "yookassa" is the online
 * provider; it activates automatically once its credentials are configured.
 */
export const PAYMENT_PROVIDERS = ["manual", "yookassa"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PROVIDER_LABELS: Record<PaymentProvider, string> = {
  manual: "Оплата при подтверждении",
  yookassa: "Онлайн-оплата картой",
};

/** Lifecycle of a single payment attempt, mirroring what providers report. */
export const PAYMENT_ATTEMPT_STATUSES = [
  "pending",
  "waiting_for_capture",
  "succeeded",
  "canceled",
  "failed",
] as const;
export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

export const PAYMENT_ATTEMPT_STATUS_LABELS: Record<PaymentAttemptStatus, string> = {
  pending: "Ожидает оплаты",
  waiting_for_capture: "Ожидает подтверждения",
  succeeded: "Оплачен",
  canceled: "Отменён",
  failed: "Ошибка оплаты",
};

export function isPaymentAttemptStatus(v: string): v is PaymentAttemptStatus {
  return (PAYMENT_ATTEMPT_STATUSES as readonly string[]).includes(v);
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "На модерации",
  approved: "Опубликован",
  rejected: "Отклонён",
};

export const REVIEW_STATUS_TONE: Record<ReviewStatus, string> = {
  pending: "bg-gold-100 text-brown-dark",
  approved: "bg-sage-200 text-sage-500",
  rejected: "bg-red-100 text-red-600",
};

export const REVIEW_MIN_LENGTH = 20;
export const REVIEW_MAX_LENGTH = 2000;

/** Order statuses after which the customer has the book and may review it. */
export const REVIEWABLE_ORDER_STATUSES = ["completed"] as const;

// ─── AI illustration generation ───────────────────────────────────────────────

export const GENERATION_PROVIDERS = ["nano_banana"] as const;
export type GenerationProvider = (typeof GENERATION_PROVIDERS)[number];

export const GENERATION_STATUSES = [
  "queued",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
] as const;
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

export const GENERATION_STATUS_LABELS: Record<GenerationStatus, string> = {
  queued: "В очереди",
  processing: "Создаём иллюстрации",
  succeeded: "Готово",
  failed: "Не удалось создать",
  cancelled: "Отменено",
};

/** Give up after this many provider attempts so a broken job stops retrying. */
export const GENERATION_MAX_ATTEMPTS = 3;

// ─── Email ────────────────────────────────────────────────────────────────────

export const EMAIL_TEMPLATES = [
  "email_verify",
  "password_reset",
  "order_created",
  "order_status",
] as const;
export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

/** How long an emailed link stays usable. */
export const TOKEN_TTL_MINUTES = {
  email_verify: 60 * 24, // a day — verification is not urgent
  password_reset: 60, // an hour — a reset link is a credential
} as const;
