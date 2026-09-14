import { LOCALE_CONFIG, type Locale } from "@/i18n/config";
import { ruRU } from "./ru-RU";
import { ruUZ } from "./ru-UZ";
import { uzUZ } from "./uz-UZ";
import type { LegalBundle, LegalDocumentKey } from "./types";

export type {
  LegalBundle,
  LegalDocumentKey,
  LegalSection,
  LegalClause,
  LegalDocumentContent,
} from "./types";

/**
 * The legal bundle for a locale.
 *
 * Keyed by the pair, not by language: what the document says is decided by the
 * jurisdiction, and how it is worded by the language. A Russian speaker in
 * Tashkent reads Uzbek law in Russian, which is a third document, not either
 * of the other two.
 */
const BUNDLES: Record<Locale, LegalBundle> = {
  ru: ruRU,
  "ru-uz": ruUZ,
  uz: uzUZ,
};

export function legalFor(locale: Locale): LegalBundle {
  return BUNDLES[locale];
}

export function legalDocument(locale: Locale, key: LegalDocumentKey) {
  return BUNDLES[locale][key];
}

/** The market whose law a locale's documents are written under. */
export function jurisdictionOf(locale: Locale) {
  return LOCALE_CONFIG[locale].region;
}
