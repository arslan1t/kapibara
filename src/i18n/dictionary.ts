import { LOCALE_CONFIG, type Language, type Locale } from "./config";
import { ru, type Dictionary } from "./dictionaries/ru";
import { uz } from "./dictionaries/uz";

export type { Dictionary };

const BY_LANGUAGE: Record<Language, Dictionary> = { ru, uz };

/**
 * The wording for a locale.
 *
 * Keyed by language, not locale: /ru and /ru-uz read the same Russian. What
 * differs between those two is the price, the seller and the delivery, none of
 * which live in a dictionary.
 */
export function getDictionary(locale: Locale): Dictionary {
  return BY_LANGUAGE[LOCALE_CONFIG[locale].language];
}
