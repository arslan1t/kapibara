import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { redact, safeHeaders } from "../src/lib/logger";

/**
 * What must never reach a log line.
 *
 * Logs are read by support engineers, shipped to third-party aggregators, and
 * kept far longer than anyone intends. Anything here that leaked would let a
 * reader impersonate a customer or would retain data a customer never agreed
 * to have stored twice.
 */
describe("log redaction", () => {
  test("credentials are removed at any depth", () => {
    const out = redact({
      password: "correct-horse-1",
      passwordHash: "$2b$12$abcdefghijklmnop",
      token: "GS0CMqgGcxLByZWSI1dqxNlyvXCUMzhp",
      apiKey: "re_AbCdEf0123456789",
      authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.abc.def",
      cookie: "session=abc123",
      idempotencyKey: "9f8e7d6c",
      nested: {
        deeper: { yookassaSecretKey: "live_secret_value", safe: "keep-me" },
      },
    }) as Record<string, unknown>;

    const serialised = JSON.stringify(out);

    for (const secret of [
      "correct-horse-1",
      "$2b$12$abcdefghijklmnop",
      "GS0CMqgGcxLByZWSI1dqxNlyvXCUMzhp",
      "re_AbCdEf0123456789",
      "eyJhbGciOiJIUzI1NiJ9",
      "session=abc123",
      "9f8e7d6c",
      "live_secret_value",
    ]) {
      assert.ok(
        !serialised.includes(secret),
        `secret leaked into the log: ${secret}`
      );
    }

    // Non-sensitive siblings survive, or the logs would be useless.
    assert.ok(serialised.includes("keep-me"));
  });

  test("mail recipients are masked under every key the mail layer uses", () => {
    // Regression: the mail layer logs the recipient as `to`, which an
    // "email"-substring rule does not catch. Found by reading a real log line
    // from a live send, not by reading the code.
    const out = redact({
      to: "arslan.shipulin@gmail.com",
      from: "shop@example.com",
      recipient: "buyer@example.com",
      cc: "manager@example.com",
    }) as Record<string, string>;

    for (const [key, value] of Object.entries(out)) {
      assert.ok(
        !value.includes("shipulin") && !value.includes("buyer") && !value.includes("manager"),
        `recipient leaked into the log under key "${key}": ${value}`
      );
      assert.match(value, /\*\*\*@/, `key "${key}" was not masked`);
    }
  });

  test("short masked keys do not swallow unrelated fields", () => {
    // "to" must be masked; "total" and "tokensPruned" must not be mangled by it.
    const out = redact({ total: 9990, tokensPruned: 3, storageKeyCount: 6 }) as Record<
      string,
      unknown
    >;
    assert.equal(out.total, 9990);
    assert.equal(out.tokensPruned, 3);
    assert.equal(out.storageKeyCount, 6);
  });

  test("personal data is masked, not printed in full", () => {
    const out = redact({
      email: "anna.smirnova@example.com",
      phone: "+79991234567",
      customerName: "Анна Смирнова",
      deliveryAddress: "Москва, ул. Тверская, 1, кв. 5",
    }) as Record<string, string>;

    assert.equal(out.email, "a***@example.com");
    assert.ok(!out.phone!.includes("9991234"), "full phone number was logged");
    assert.ok(!out.customerName!.includes("Смирнова"), "full name was logged");
    assert.ok(!out.deliveryAddress!.includes("Тверская"), "address was logged");
  });

  test("binary is never serialised", () => {
    const photo = Buffer.alloc(2048, 7);
    const out = redact({ data: photo, view: new Uint8Array(16) }) as Record<
      string,
      string
    >;

    assert.match(out.data!, /^\[binary 2048 bytes\]$/);
    assert.match(out.view!, /^\[binary 16 bytes\]$/);
  });

  test("storage keys for private files are not logged", () => {
    const out = redact({
      photoKey: "11111111-1111-4111-8111-111111111111.jpg",
      storageKey: "22222222-2222-4222-8222-222222222222.png",
    }) as Record<string, string>;

    assert.equal(out.photoKey, "[redacted]");
    assert.equal(out.storageKey, "[redacted]");
  });

  test("counts and flags survive even when the key name looks sensitive", () => {
    // "tokensPruned" is a metric, not a token. Redacting it would hide exactly
    // the numbers the logs exist to report.
    const out = redact({
      tokensPruned: 12,
      hasPhoto: true,
      imageCount: 5,
    }) as Record<string, unknown>;

    assert.equal(out.tokensPruned, 12);
    assert.equal(out.hasPhoto, true);
    assert.equal(out.imageCount, 5);
  });

  test("long strings are truncated so a body cannot be smuggled in", () => {
    const out = redact({ note: "x".repeat(5000) }) as Record<string, string>;
    assert.ok(out.note!.length < 600);
    assert.match(out.note!, /\[truncated\]$/);
  });

  test("errors keep their message and never carry a full stack", () => {
    const out = redact(new Error("connection refused")) as Record<string, unknown>;

    assert.equal(out.message, "connection refused");
    assert.equal(out.name, "Error");

    // Outside production a short stack helps debugging; it is capped so a deep
    // trace cannot push interpolated values into the log.
    if (out.stack !== undefined) {
      assert.ok(
        String(out.stack).split("\n").length <= 5,
        "an unbounded stack was logged"
      );
    }
  });

  test("only an allow-list of request headers is loggable", () => {
    const headers = new Headers({
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0",
      authorization: "Bearer super-secret",
      cookie: "session=abc",
      "x-cron-secret": "cron-secret-value",
      "x-webhook-secret": "webhook-secret-value",
    });

    const safe = safeHeaders(headers);
    const serialised = JSON.stringify(safe);

    assert.ok(serialised.includes("application/json"));
    assert.ok(!serialised.includes("super-secret"), "authorization was logged");
    assert.ok(!serialised.includes("session=abc"), "cookie was logged");
    assert.ok(!serialised.includes("cron-secret-value"), "cron secret was logged");
    assert.ok(!serialised.includes("webhook-secret-value"), "webhook secret logged");
  });
});
