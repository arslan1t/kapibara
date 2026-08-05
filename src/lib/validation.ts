/**
 * Shared form validation rules.
 *
 * Messages live here rather than in components so the same wording is used
 * everywhere a rule is applied.
 */

// ─── Child name ───────────────────────────────────────────────────────────────

/** Characters a child's name may contain: Russian letters (incl. Ё/ё), spaces, hyphens. */
const NAME_ALLOWED_CHARS = /[^А-Яа-яЁё\s-]/g;

/** A complete, well-formed name: Cyrillic words joined by single spaces or hyphens. */
const NAME_SHAPE = /^[А-Яа-яЁё]+(?:[\s-][А-Яа-яЁё]+)*$/;

export const NAME_HINT = "Введите имя только кириллицей";
export const NAME_ERROR_LATIN = "Используйте только кириллицу";
export const NAME_ERROR_SHORT = "Введите имя — минимум 2 буквы";

/**
 * Strips characters that are not allowed in a child's name.
 * Returns the cleaned value plus whether anything was removed, so the caller
 * can explain the rejection instead of silently swallowing keystrokes.
 */
export function sanitizeChildName(value: string): {
  value: string;
  rejected: boolean;
} {
  const cleaned = value.replace(NAME_ALLOWED_CHARS, "");
  return { value: cleaned, rejected: cleaned !== value };
}

/** True when the name is long enough and correctly shaped. */
export function isChildNameValid(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= 2 && NAME_SHAPE.test(trimmed);
}

// ─── Account credentials ──────────────────────────────────────────────────────

/**
 * Deliberately permissive: the goal is to catch obvious typos, not to reject
 * unusual-but-valid addresses. The server remains the real authority.
 */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const PASSWORD_MIN_LENGTH = 8;

export const AUTH_ERRORS = {
  emailInvalid: "Введите корректный адрес электронной почты",
  emailTaken: "Этот адрес уже зарегистрирован",
  passwordShort: `Пароль должен содержать не менее ${PASSWORD_MIN_LENGTH} символов`,
  passwordWeak: "Пароль должен содержать хотя бы одну букву и одну цифру",
  passwordMismatch: "Пароли не совпадают",
  nameRequired: "Введите имя",
  consentsRequired: "Для регистрации необходимо принять обязательные условия",
  generic: "Не удалось создать аккаунт. Попробуйте ещё раз",
  invalidCredentials: "Неверная почта или пароль",
  // Emailed-link flows. Worded so they never reveal whether an address is
  // registered — that would turn the reset form into an account-enumeration tool.
  linkInvalid: "Ссылка недействительна. Запросите новую",
  linkExpired: "Срок действия ссылки истёк. Запросите новую",
  linkUsed: "Ссылка уже использована. Запросите новую",
  resetFailed: "Не удалось сменить пароль. Попробуйте ещё раз",
  verifyFailed: "Не удалось подтвердить адрес. Попробуйте ещё раз",
  alreadyVerified: "Адрес уже подтверждён",
} as const;

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
export function checkPassword(value: string): { ok: true } | { ok: false; message: string } {
  if (value.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: AUTH_ERRORS.passwordShort };
  }
  if (!/\d/.test(value) || !/\p{L}/u.test(value)) {
    return { ok: false, message: AUTH_ERRORS.passwordWeak };
  }
  return { ok: true };
}

/** Account holder's name — allows Cyrillic or Latin, unlike the child's name. */
export function isFullNameValid(value: string): boolean {
  return value.trim().length >= 2;
}
