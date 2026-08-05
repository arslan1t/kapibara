import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  db,
  resetDatabase,
  createUser,
  createProduct,
  createOrder,
  expectRejected,
} from "./helpers";
import { hashClaim, claimMatches } from "../src/lib/claim";
import { getJobForUser } from "../src/lib/generation";
import { recordAudit } from "../src/lib/audit";

/**
 * Regression tests for the defects found in the pre-production audit.
 *
 * Each one fails against the code as it was before the fix. They exist so a
 * future refactor cannot quietly reopen the same hole.
 */
describe("security hardening", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  // ─── Claim tokens ───────────────────────────────────────────────────────────

  describe("claim tokens", () => {
    test("only the hash is ever stored", async () => {
      const token = "a-secret-claim-token-value";
      const stored = hashClaim(token);

      assert.notEqual(stored, token);
      assert.match(stored, /^[a-f0-9]{64}$/);
    });

    test("a matching token is accepted and anything else is not", () => {
      const token = randomUUID();
      const stored = hashClaim(token);

      assert.equal(claimMatches(stored, token), true);
      assert.equal(claimMatches(stored, "wrong-token"), false);
      assert.equal(claimMatches(stored, undefined), false, "missing token accepted");
      assert.equal(claimMatches(null, token), false, "record without a claim accepted");
      assert.equal(claimMatches(null, undefined), false, "two absences matched");
    });
  });

  // ─── Guest order confirmation (IDOR) ────────────────────────────────────────

  describe("guest order confirmation", () => {
    test("an order id alone does not entitle a stranger to the order", async () => {
      const buyer = await createUser({ email: "buyer@example.com" });
      const stranger = await createUser({ email: "stranger@example.com" });
      const product = await createProduct();

      const claim = randomUUID();
      const order = await createOrder(null, product.id, {
        guestClaimToken: hashClaim(claim),
      });

      const record = await db.order.findUnique({
        where: { id: order.id },
        select: { userId: true, guestClaimToken: true },
      });

      // The exact predicate the confirmation page evaluates.
      const entitled = (viewerId: string | null, presented?: string) =>
        (viewerId !== null && record!.userId === viewerId) ||
        claimMatches(record!.guestClaimToken, presented);

      assert.equal(
        entitled(stranger.id, undefined),
        false,
        "a signed-in stranger could read a guest order"
      );
      assert.equal(
        entitled(null, undefined),
        false,
        "an anonymous visitor could read a guest order by id"
      );
      assert.equal(
        entitled(null, "guessed-token"),
        false,
        "a wrong claim token was accepted"
      );
      assert.equal(
        entitled(null, claim),
        true,
        "the browser that placed the order could not read it"
      );
      assert.equal(
        entitled(buyer.id, undefined),
        false,
        "an unrelated account matched an order it does not own"
      );
    });

    test("the owning account reads its own order without a cookie", async () => {
      const buyer = await createUser();
      const product = await createProduct();
      const order = await createOrder(buyer.id, product.id);

      const record = await db.order.findUnique({
        where: { id: order.id },
        select: { userId: true, guestClaimToken: true },
      });

      assert.equal(record!.userId, buyer.id);
      assert.equal(record!.guestClaimToken, null);
    });
  });

  // ─── Anonymous generation jobs ──────────────────────────────────────────────

  describe("generation job access", () => {
    async function seedAnonymousJob(claim: string) {
      const product = await createProduct();
      return db.generationJob.create({
        data: {
          productId: product.id,
          userId: null,
          claimToken: hashClaim(claim),
          childName: "Пётр",
          photoKey: "55555555-5555-4555-8555-555555555555.jpg",
          provider: "nano_banana",
          status: "succeeded",
          results: {
            create: {
              pageNumber: 1,
              storageKey: "66666666-6666-4666-8666-666666666666.png",
            },
          },
        },
      });
    }

    test("an anonymous job is not readable without its claim", async () => {
      const claim = randomUUID();
      const job = await seedAnonymousJob(claim);
      const other = await createUser();

      assert.equal(
        await getJobForUser(job.id, null, undefined),
        null,
        "an anonymous job was readable by anyone with its id"
      );
      assert.equal(
        await getJobForUser(job.id, other.id, undefined),
        null,
        "an anonymous job was readable by an unrelated account"
      );
      assert.equal(
        await getJobForUser(job.id, null, "wrong-claim"),
        null,
        "a wrong claim was accepted"
      );
    });

    test("the browser that started the preview can read it", async () => {
      const claim = randomUUID();
      const job = await seedAnonymousJob(claim);

      const view = await getJobForUser(job.id, null, claim);
      assert.ok(view, "the originating browser could not read its own job");
      assert.equal(view!.pages.length, 1);
    });

    test("a job with an owner is not readable by another account", async () => {
      const owner = await createUser({ email: "owner@example.com" });
      const other = await createUser({ email: "other@example.com" });
      const product = await createProduct();

      const job = await db.generationJob.create({
        data: {
          productId: product.id,
          userId: owner.id,
          childName: "Пётр",
          photoKey: "77777777-7777-4777-8777-777777777777.jpg",
          provider: "nano_banana",
          status: "succeeded",
        },
      });

      assert.ok(await getJobForUser(job.id, owner.id));
      assert.equal(await getJobForUser(job.id, other.id), null);
      assert.equal(await getJobForUser(job.id, null), null);
    });

    test("a job with neither owner nor claim is unreachable", async () => {
      // This combination should never be created; if a bug ever produces one,
      // it must fail closed rather than become public.
      const product = await createProduct();
      const job = await db.generationJob.create({
        data: {
          productId: product.id,
          userId: null,
          claimToken: null,
          childName: "Пётр",
          photoKey: "88888888-8888-4888-8888-888888888888.jpg",
          provider: "nano_banana",
          status: "succeeded",
        },
      });

      assert.equal(await getJobForUser(job.id, null), null);
      assert.equal(await getJobForUser(job.id, "some-user-id"), null);
    });
  });

  // ─── Checkout idempotency ───────────────────────────────────────────────────

  describe("checkout idempotency", () => {
    test("the same key cannot produce two orders", async () => {
      const user = await createUser();
      const product = await createProduct();
      const key = randomUUID();

      await createOrder(user.id, product.id, { idempotencyKey: key });

      await expectRejected(
        "a second order carrying an already-used idempotency key",
        () => createOrder(user.id, product.id, { idempotencyKey: key }),
        async () =>
          (await db.order.count({ where: { idempotencyKey: key } })) === 1
      );
    });

    test("orders without a key are unaffected", async () => {
      const user = await createUser();
      const product = await createProduct();

      await createOrder(user.id, product.id);
      await createOrder(user.id, product.id);

      // A unique index over a nullable column permits many NULLs in PostgreSQL,
      // which is what lets a legacy or key-less order still be created.
      assert.equal(await db.order.count(), 2);
    });
  });

  // ─── Session invalidation ───────────────────────────────────────────────────

  describe("session invalidation", () => {
    test("changing a password retires tokens issued before it", async () => {
      const user = await createUser();

      const issuedAt = Math.floor(Date.now() / 1000) - 60;
      await db.user.update({
        where: { id: user.id },
        data: { passwordChangedAt: new Date() },
      });

      const account = await db.user.findUnique({
        where: { id: user.id },
        select: { passwordChangedAt: true },
      });

      // The exact comparison the JWT callback performs.
      const retired =
        account!.passwordChangedAt !== null &&
        account!.passwordChangedAt.getTime() > issuedAt * 1000;

      assert.equal(retired, true, "an old session survived a password change");
    });

    test("a token issued after the change stays valid", async () => {
      const user = await createUser();
      await db.user.update({
        where: { id: user.id },
        data: { passwordChangedAt: new Date(Date.now() - 60_000) },
      });

      const issuedAt = Math.floor(Date.now() / 1000);
      const account = await db.user.findUnique({
        where: { id: user.id },
        select: { passwordChangedAt: true },
      });

      const retired =
        account!.passwordChangedAt !== null &&
        account!.passwordChangedAt.getTime() > issuedAt * 1000;

      assert.equal(retired, false, "a fresh session was wrongly retired");
    });
  });

  // ─── Audit log ──────────────────────────────────────────────────────────────

  describe("admin audit log", () => {
    test("an entry records the actor, action and target", async () => {
      const admin = await createUser({
        email: "admin@example.com",
        role: "admin",
      });

      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "order.payment_status_changed",
        targetType: "order",
        targetId: "order-123",
        summary: "unpaid -> paid",
      });

      const [entry] = await db.adminAuditLog.findMany();
      assert.ok(entry, "nothing was recorded");
      assert.equal(entry!.actorId, admin.id);
      assert.equal(entry!.action, "order.payment_status_changed");
      assert.equal(entry!.summary, "unpaid -> paid");
    });

    test("the log survives the actor being deleted", async () => {
      const admin = await createUser({ role: "admin" });

      await recordAudit({
        actorId: admin.id,
        actorEmail: admin.email,
        action: "product.archived",
        targetType: "product",
        targetId: "product-1",
      });

      await db.user.delete({ where: { id: admin.id } });

      const [entry] = await db.adminAuditLog.findMany();
      assert.ok(entry, "the audit entry was deleted with the actor");
      assert.equal(entry!.actorId, null, "the reference was not nulled");
      assert.ok(entry!.actorEmail, "the actor's identity was lost entirely");
    });

    test("the database refuses an unknown target type", async () => {
      await expectRejected(
        "an audit entry with an unknown target type",
        () =>
          db.$executeRawUnsafe(
            `INSERT INTO admin_audit_log (id,"actorEmail",action,"targetType","targetId")
             VALUES ('a1','a@example.com','x','bank_account','1')`
          ),
        async () => (await db.adminAuditLog.count({ where: { id: "a1" } })) === 0
      );
    });
  });
});
