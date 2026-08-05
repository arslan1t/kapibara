import "server-only";

/**
 * Structured server logging.
 *
 * JSON lines in production so a log aggregator can parse them; readable text in
 * development. The important part is what never reaches a log line: this module
 * redacts on the way out rather than trusting every call site to remember.
 *
 * Logs are treated as a place an attacker or a support engineer may eventually
 * read. Anything that would let either impersonate a customer, or that a
 * customer would not expect us to keep, is removed here.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minLevel(): number {
  const configured = process.env.LOG_LEVEL?.trim().toLowerCase() as LogLevel;
  if (configured && configured in LEVEL_ORDER) return LEVEL_ORDER[configured];
  return process.env.NODE_ENV === "production"
    ? LEVEL_ORDER.info
    : LEVEL_ORDER.debug;
}

/**
 * Keys whose values are never written, at any depth.
 *
 * Matched case-insensitively on substring, so `passwordHash`, `x-auth-token`
 * and `yookassaSecretKey` are all covered without listing every spelling.
 */
const REDACTED_KEY_PATTERNS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "sessionid",
  "credential",
  "signature",
  "idempotencykey",
  "photokey",
  "storagekey",
  "photo",
  "image",
  "bytes",
  "buffer",
  "body",
  "rawpayload",
  "cardnumber",
  "cvv",
  "pan",
];

/**
 * Keys carrying personal data, reduced rather than dropped.
 *
 * An operator debugging an order needs to know *which* customer without the log
 * itself becoming a copy of the customer database.
 */
const MASKED_KEY_PATTERNS = ["email", "phone", "fullname", "customername", "address"];

/**
 * Short key names matched exactly rather than by substring.
 *
 * "to" is the mail layer's name for the recipient and must be masked, but as a
 * substring it also appears in "total", "token" and "storageKey" — matching it
 * loosely would either mangle unrelated fields or, worse, lull a reader into
 * thinking a field is handled when it is not.
 */
const MASKED_EXACT_KEYS = new Set([
  "to",
  "cc",
  "bcc",
  "from",
  "recipient",
  "sender",
  "name",
  "contact",
]);

function isRedactedKey(key: string): boolean {
  const k = key.toLowerCase();
  return REDACTED_KEY_PATTERNS.some((p) => k.includes(p));
}

function isMaskedKey(key: string): boolean {
  const k = key.toLowerCase();
  return MASKED_EXACT_KEYS.has(k) || MASKED_KEY_PATTERNS.some((p) => k.includes(p));
}

/** ivan@example.com → i***@example.com; +7 999 123-45-67 → +7…67 */
function mask(value: string): string {
  if (value.includes("@")) {
    const [local, domain] = value.split("@");
    return `${local?.[0] ?? ""}***@${domain ?? ""}`;
  }
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}…${value.slice(-2)}`;
}

const MAX_DEPTH = 6;
const MAX_STRING = 512;

export function redact(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return "[depth-limit]";

  if (typeof value === "string") {
    return value.length > MAX_STRING
      ? `${value.slice(0, MAX_STRING)}…[truncated]`
      : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();

  // Never serialise binary — this is how a photograph would end up in a log.
  if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return `[binary ${value.byteLength} bytes]`;
  }
  if (value instanceof Date) return value.toISOString();

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      // Stacks only in development: in production they leak file paths and
      // occasionally interpolated values.
      ...(process.env.NODE_ENV === "production"
        ? {}
        : { stack: value.stack?.split("\n").slice(0, 5).join("\n") }),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1));
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      // A number or boolean cannot carry a credential, so counts and flags are
      // kept even when the key name matches a sensitive pattern
      // ("tokensPruned", "hasPhoto"). Redacting those would hide the metrics
      // the logs exist for.
      const isScalar = typeof v === "number" || typeof v === "boolean";

      if (isRedactedKey(key) && !isScalar) {
        out[key] = "[redacted]";
      } else if (isMaskedKey(key) && typeof v === "string") {
        out[key] = mask(v);
      } else {
        out[key] = redact(v, depth + 1);
      }
    }
    return out;
  }

  return "[unserialisable]";
}

export interface LogContext {
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, context?: LogContext): void {
  if (LEVEL_ORDER[level] < minLevel()) return;

  const payload = {
    level,
    event,
    time: new Date().toISOString(),
    ...(context ? (redact(context) as LogContext) : {}),
  };

  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(payload)
      : `${level.toUpperCase()} ${event} ${
          context ? JSON.stringify(redact(context)) : ""
        }`;

  // Warnings and errors go to stderr so a platform's log router can separate
  // them; everything else to stdout.
  if (level === "error" || level === "warn") console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (event: string, context?: LogContext) => emit("debug", event, context),
  info: (event: string, context?: LogContext) => emit("info", event, context),
  warn: (event: string, context?: LogContext) => emit("warn", event, context),
  error: (event: string, context?: LogContext) => emit("error", event, context),
};

/**
 * Safe headers for logging.
 *
 * Allow-list rather than deny-list: a new authentication header added by a
 * proxy tomorrow should not start appearing in logs because nobody remembered
 * to add it to a block list.
 */
const LOGGABLE_HEADERS = [
  "content-type",
  "content-length",
  "user-agent",
  "referer",
  "x-forwarded-for",
];

export function safeHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of LOGGABLE_HEADERS) {
    const value = headers.get(name);
    if (value) out[name] = value.slice(0, 200);
  }
  return out;
}
