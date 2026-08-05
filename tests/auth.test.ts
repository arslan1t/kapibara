import { test, describe, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { db, resetDatabase, createUser, expectRejected } from "./helpers";
import {
  issueToken,
  checkToken,
  consumeToken,
  pruneExpiredTokens,
} from "../src/lib/tokens";
import { rateLimit, RATE_LIMITS } from "../src/lib/rate-limit";
import { normalizeEmail, checkPassword } from "../src/lib/validation";

describe("authentication", () => {
  before(async () => {
    await db.$queryRaw`SELECT 1`;
  });
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  // ─── Password storage ───────────────────────────────────────────────────────

  test("passwords are stored as bcrypt hashes, never in plaintext", async () => {
    const plaintext = "correct-horse-1";
    const user = await createUser({ passwordHash: await bcrypt.hash(plaintext, 12) });

    assert.notEqual(user.passwordHash, plaintext);
    assert.match(user.passwordHash, /^\$2[aby]\$\d{2}\$/, "not a bcrypt hash");
    assert.equal(user.passwordHash.length, 60);
    assert.ok(await bcrypt.compare(plaintext, user.passwordHash));
    assert.equal(await bcrypt.compare("wrong", user.passwordHash), false);
  });

  test("password policy rejects weak passwords", () => {
    assert.equal(checkPassword("short1").ok, false, "too short accepted");
    assert.equal(checkPassword("alllettersonly").ok, false, "no digit accepted");
    assert.equal(checkPassword("12345678").ok, false, "no letter accepted");
    assert.equal(checkPassword("goodpass1").ok, true, "valid password rejected");
  });

  // ─── Email normalisation ────────────────────────────────────────────────────

  test("email is normalised so one address cannot register twice", async () => {
    const email = normalizeEmail("  Ivan@Example.COM ");
    assert.equal(email, "ivan@example.com");

    await createUser({ email });
    await expectRejected(
      "second account with the same email",
      () => createUser({ email }),
      async () => (await db.user.count({ where: { email } })) === 1
    );
  });

  test("database rejects a non-normalised email even if code forgets", async () => {
    // The CHECK constraint is the backstop for the application-level
    // normalisation above.
    await expectRejected(
      "mixed-case email inserted directly",
      () =>
        db.$executeRawUnsafe(
          `INSERT INTO users (id,email,"passwordHash","fullName",role,"updatedAt")
           VALUES ('u-mixed','Mixed@Case.com','h','N','customer',now())`
        ),
      async () => (await db.user.count({ where: { id: "u-mixed" } })) === 0
    );
  });

  // ─── Tokens ─────────────────────────────────────────────────────────────────

  test("token plaintext is never stored", async () => {
    const user = await createUser();
    const { token } = await issueToken(user.id, "password_reset");

    const rows = await db.verificationToken.findMany({ where: { userId: user.id } });
    assert.equal(rows.length, 1);
    assert.notEqual(rows[0]!.token, token, "plaintext token was stored");
    assert.match(rows[0]!.token, /^[a-f0-9]{64}$/, "not a SHA-256 hash");
  });

  test("a reset token works exactly once", async () => {
    const user = await createUser();
    const { token } = await issueToken(user.id, "password_reset");

    const first = await consumeToken(token, "password_reset");
    assert.equal(first.ok, true);

    const second = await consumeToken(token, "password_reset");
    assert.equal(second.ok, false);
    assert.equal(second.ok === false && second.reason, "used");
  });

  test("a token is not valid for the other flow", async () => {
    const user = await createUser();
    const { token } = await issueToken(user.id, "password_reset");

    const wrongType = await checkToken(token, "email_verify");
    assert.equal(wrongType.ok, false);
    assert.equal(wrongType.ok === false && wrongType.reason, "invalid");
  });

  test("an expired token is refused", async () => {
    const user = await createUser();
    const { token } = await issueToken(user.id, "email_verify");

    await db.verificationToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await checkToken(token, "email_verify");
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.reason, "expired");
  });

  test("issuing a new token invalidates the previous one", async () => {
    const user = await createUser();
    const first = await issueToken(user.id, "password_reset");
    const second = await issueToken(user.id, "password_reset");

    assert.equal((await checkToken(first.token, "password_reset")).ok, false);
    assert.equal((await checkToken(second.token, "password_reset")).ok, true);
  });

  test("a forged token is refused", async () => {
    const result = await checkToken("totally-made-up-token", "password_reset");
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.reason, "invalid");
  });

  test("pruning removes only long-expired tokens", async () => {
    const user = await createUser();
    await issueToken(user.id, "email_verify");
    await db.verificationToken.updateMany({
      where: { userId: user.id },
      data: { expiresAt: new Date(Date.now() - 48 * 60 * 60_000) },
    });

    const live = await createUser();
    await issueToken(live.id, "email_verify");

    await pruneExpiredTokens();

    assert.equal(await db.verificationToken.count({ where: { userId: user.id } }), 0);
    assert.equal(await db.verificationToken.count({ where: { userId: live.id } }), 1);
  });

  // ─── Rate limiting ──────────────────────────────────────────────────────────

  test("login attempts are blocked past the limit", async () => {
    const key = `victim-${Date.now()}@example.com`;
    const limit = RATE_LIMITS.login.limit;

    for (let i = 0; i < limit; i++) {
      const result = await rateLimit("login", key);
      assert.equal(result.ok, true, `attempt ${i + 1} should be allowed`);
    }

    const blocked = await rateLimit("login", key);
    assert.equal(blocked.ok, false, "attempt past the limit was allowed");
    assert.ok(blocked.retryAfter > 0, "no retry hint given");
  });

  test("rate limits are independent per identifier", async () => {
    const limit = RATE_LIMITS.login.limit;
    for (let i = 0; i < limit + 1; i++) await rateLimit("login", "a@example.com");

    const other = await rateLimit("login", "b@example.com");
    assert.equal(other.ok, true, "one account's limit blocked another");
  });

  test("an expired window resets the counter", async () => {
    const key = `expiring-${Date.now()}`;
    await rateLimit("passwordReset", key);

    await db.rateLimitCounter.updateMany({
      where: { key: `passwordReset:${key}` },
      data: { count: 99, expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await rateLimit("passwordReset", key);
    assert.equal(result.ok, true, "expired window still blocking");
  });
});
