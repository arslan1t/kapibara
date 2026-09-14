/**
 * Shared form validation rules.
 *
 * The rules live here so the same one is applied wherever a value is checked.
 * The wording that explains a failure lives in the dictionaries, because it
 * has to reach the reader in their own language.
 */
import { DEFAULT_LOCALE, type Locale, type Region } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/format";

// ─── Child name ───────────────────────────────────────────────────────────────

/**
 * Which alphabet a child's name may be written in.
 *
 * Russia is Cyrillic. Uzbekistan is both: the official script is Latin and a
 * great many families write in Cyrillic, and the name has to be printed in the
 * book exactly as the parent typed it. Rejecting "Gulnora" from a Tashkent
 * parent, or "Гулнора" from the same parent on a different day, would make the
 * shop unusable for the market it was built for.
 */
export type NameScript = "cyrillic" | "cyrillic-latin";

export function nameScriptFor(region: Region): NameScript {
  return region === "UZ" ? "cyrillic-latin" : "cyrillic";
}

/**
 * Characters a name may contain, per script.
 *
 * The Uzbek set includes ʻ (U+02BB) and ' (U+2018/U+0027), which carry meaning
 * in Oʻzbek — oʻ and gʻ are separate letters, not decorated vowels.
 */
const ALLOWED: Record<NameScript, RegExp> = {
  cyrillic: /[^А-Яа-яЁё\s-]/g,
  "cyrillic-latin": /[^А-Яа-яЁёA-Za-zʻʼ'\u2018\u2019\s-]/g,
};

/** A complete, well-formed name: letters joined by single spaces or hyphens. */
const SHAPE: Record<NameScript, RegExp> = {
  cyrillic: /^[А-Яа-яЁё]+(?:[\s-][А-Яа-яЁё]+)*$/,
  "cyrillic-latin":
    /^[А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-zʻʼ'\u2018\u2019]*(?:[\s-][А-Яа-яЁёA-Za-z][А-Яа-яЁёA-Za-zʻʼ'\u2018\u2019]*)*$/,
};

/**
 * Strips characters that are not allowed in a child's name.
 *
 * Returns the cleaned value plus whether anything was removed, so the caller
 * can explain the rejection instead of silently swallowing keystrokes.
 */
export function sanitizeChildName(
  value: string,
  script: NameScript = "cyrillic"
): { value: string; rejected: boolean } {
  const cleaned = value.replace(ALLOWED[script], "");
  return { value: cleaned, rejected: cleaned !== value };
}

/** True when the name is long enough and correctly shaped. */
export function isChildNameValid(
  value: string,
  script: NameScript = "cyrillic"
): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && SHAPE[script].test(trimmed);
}

// ─── Account credentials ──────────────────────────────────────────────────────

/**
 * Deliberately permissive: the goal is to catch obvious typos, not to reject
 * unusual-but-valid addresses. The server remains the real authority.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const PASSWORD_MIN_LENGTH = 8;

/**
 * The wording for every credential failure, in the caller's language.
 *
 * A function rather than a constant because the same failure has to reach a
 * reader in Tashkent in Uzbek and a reader in Moscow in Russian, and server
 * actions are the ones producing most of them.
 */
export function authErrors(locale: Locale = DEFAULT_LOCALE) {
  const t = getDictionary(locale).authErrors;
  return {
    ...t,
    passwordShort: fill(t.passwordShort, { min: PASSWORD_MIN_LENGTH }),
  };
}

/** Lower-cased and trimmed, so one address can never register twice. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isEmailValid(value: string): boolean {
  return EMAIL_SHAPE.test(value.trim());
}

export function isPasswordValid(value: string): boolean {
  return value.length >= PASSWORD_MIN_LENGTH;
}

/** At least 8 characters, containing at least one letter and one digit. */
export function checkPassword(
  value: string,
  locale: Locale = DEFAULT_LOCALE
): { ok: true } | { ok: false; message: string } {
  const errors = authErrors(locale);
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: errors.passwordShort };
  }
  if (!/\d/.test(value) || !/\p{L}/u.test(value)) {
    return { ok: false, message: errors.passwordWeak };
  }
  return { ok: true };
}

/** Account holder's name — allows Cyrillic or Latin, unlike the child's name. */
export function isFullNameValid(value: string): boolean {
  return value.trim().length >= 2;
}
