import {
  LOCALE_CONFIG,
  REGION_CONFIG,
  type CurrencyCode,
  type Language,
  type Locale,
} from "./config";

/**
 * Money, dates and numbers in the reader's own conventions.
 *
 * The currency symbol is written out here rather than left to Intl. Asked for
 * UZS in a Russian locale, Intl produces "1 290 000 UZS" — correct, and not
 * what anyone in Tashkent has ever seen on a price tag. The grouping and digit
 * shapes still come from Intl, which is the part that genuinely varies.
 */
const CURRENCY_LABEL: Record<CurrencyCode, Record<Language, string>> = {
  RUB: { ru: "₽", uz: "₽" },
  UZS: { ru: "сум", uz: "soʻm" },
};

export function currencyOf(locale: Locale): CurrencyCode {
  return REGION_CONFIG[LOCALE_CONFIG[locale].region].currency;
}

export function currencyLabel(locale: Locale): string {
  const { language } = LOCALE_CONFIG[locale];
  return CURRENCY_LABEL[currencyOf(locale)][language];
}

/**
 * Formats a whole-unit amount in the region's currency.
 *
 * Amounts are integers everywhere in this codebase — whole roubles, whole
 * sum — so there is never a fractional part to show.
 */
export function formatMoney(amount: number, locale: Locale): string {
  const { htmlLang } = LOCALE_CONFIG[locale];
  const digits = new Intl.NumberFormat(htmlLang, {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${digits} ${currencyLabel(locale)}`;
}

/**
 * Formats an amount in a currency named explicitly.
 *
 * For anything already recorded — an order total, a payment, a line item.
 * Those carry the currency they were placed in, and it must be shown as it was
 * charged even when the reader has since switched country. The reader's own
 * conventions still decide the grouping, so a Russian-speaking administrator
 * sees Uzbek sums grouped the way they expect.
 */
export function formatAmount(
  amount: number,
  currency: string,
  locale: Locale
): string {
  const { htmlLang, language } = LOCALE_CONFIG[locale];
  const digits = new Intl.NumberFormat(htmlLang, {
    maximumFractionDigits: 0,
  }).format(amount);
  const label =
    currency in CURRENCY_LABEL
      ? CURRENCY_LABEL[currency as CurrencyCode][language]
      : currency;
  return `${digits}\u00A0${label}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_CONFIG[locale].htmlLang).format(value);
}

export function formatDate(value: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateShort(value: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].htmlLang, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_CONFIG[locale].htmlLang, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Substitutes {name}-style placeholders.
 *
 * Deliberately not a template literal in the dictionary: a translator has to
 * be able to move the placeholder to wherever their grammar puts it, and in
 * Uzbek that is very often somewhere else.
 */
export function fill(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole
  );
}

/**
 * Picks the right plural form.
 *
 * Russian has three (1 книга / 2 книги / 5 книг); Uzbek has one, and a
 * dictionary that supplies the same string three times costs nothing. Using
 * Intl.PluralRules rather than the usual hand-rolled modulo arithmetic means
 * adding a language later does not mean rewriting this.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string;
};

export function plural(
  count: number,
  forms: PluralForms,
  locale: Locale
): string {
  const rule = new Intl.PluralRules(LOCALE_CONFIG[locale].htmlLang).select(count);
  return fill(forms[rule] ?? forms.other, { count: formatNumber(count, locale) });
}
