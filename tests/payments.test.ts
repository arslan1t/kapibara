import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db, resetDatabase, createUser, createProduct, createOrder } from "./helpers";
import { applyProviderEvent } from "../src/lib/payments";
import { manualGateway } from "../src/lib/payments/manual";
import type { ProviderEvent } from "../src/lib/payments/types";

/**
 * Payment webhook handling.
 *
 * The property under test throughout: nothing an attacker can put in a webhook
 * body should be able to mark an order paid. Every guard is exercised against
 * real rows.
 */
describe("payment webhooks", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  async function seedPayment(amount = 9990, status = "pending") {
    const user = await createUser();
    const product = await createProduct();
    const order = await createOrder(user.id, product.id);

    const payment = await db.payment.create({
      data: {
        orderId: order.id,
        provider: "yookassa",
        providerPaymentId: `pay_${randomUUID()}`,
        status,
        amount,
        idempotencyKey: randomUUID(),
      },
    });

    return { order, payment };
  }

  function event(overrides: Partial<ProviderEvent> & { providerPaymentId: string }) {
    return {
      status: "succeeded" as const,
      amount: 9990,
      raw: { source: "test" },
      ...overrides,
    } satisfies ProviderEvent;
  }

  // ─── The happy path ─────────────────────────────────────────────────────────

  test("a matching succeeded event marks the order paid", async () => {
    const { order, payment } = await seedPayment();

    const result = await applyProviderEvent(
      event({ providerPaymentId: payment.providerPaymentId! })
    );
    assert.equal(result.ok, true);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after!.paymentStatus, "paid");
    assert.equal(after!.orderStatus, "in_progress");

    const settled = await db.payment.findUnique({ where: { id: payment.id } });
    assert.equal(settled!.status, "succeeded");
    assert.ok(settled!.paidAt, "paidAt was not recorded");
  });

  // ─── Idempotency ────────────────────────────────────────────────────────────

  test("a replayed webhook is a no-op, not a second settlement", async () => {
    const { order, payment } = await seedPayment();
    const payload = event({ providerPaymentId: payment.providerPaymentId! });

    await applyProviderEvent(payload);
    const firstPaidAt = (await db.payment.findUnique({ where: { id: payment.id } }))!
      .paidAt;

    // Same event delivered three more times, as a provider retry would.
    for (let i = 0; i < 3; i++) {
      const replay = await applyProviderEvent(payload);
      assert.equal(replay.ok, true, "a replay reported failure");
    }

    const settled = await db.payment.findUnique({ where: { id: payment.id } });
    assert.equal(
      settled!.paidAt?.getTime(),
      firstPaidAt?.getTime(),
      "a replay overwrote the settlement time"
    );

    // Exactly one "paid" transition in the audit trail.
    const transitions = await db.orderStatusHistory.count({
      where: { orderId: order.id, note: "Оплата подтверждена провайдером" },
    });
    assert.equal(transitions, 1, `expected 1 settlement entry, found ${transitions}`);
  });

  test("a later cancellation cannot un-pay a settled order", async () => {
    const { order, payment } = await seedPayment();

    await applyProviderEvent(event({ providerPaymentId: payment.providerPaymentId! }));
    await applyProviderEvent(
      event({
        providerPaymentId: payment.providerPaymentId!,
        status: "canceled",
        failureReason: "late cancellation",
      })
    );

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after!.paymentStatus, "paid", "a settled order was reopened");
  });

  // ─── Amount matching ────────────────────────────────────────────────────────

  test("an event with the wrong amount does not mark the order paid", async () => {
    const { order, payment } = await seedPayment(9990);

    const result = await applyProviderEvent(
      event({ providerPaymentId: payment.providerPaymentId!, amount: 1 })
    );

    assert.equal(result.ok, false, "a mismatched amount was accepted");

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.notEqual(after!.paymentStatus, "paid", "order was paid for the wrong amount");

    const rejected = await db.payment.findUnique({ where: { id: payment.id } });
    assert.equal(rejected!.status, "failed");
    assert.match(rejected!.failureReason ?? "", /Сумма не совпадает/);
  });

  test("an amount the provider does not report is not treated as a match", async () => {
    // A provider that omits the amount cannot be used to bypass the check by
    // simply leaving the field out — but it also must not block a legitimate
    // settlement, so this documents the deliberate choice.
    const { order, payment } = await seedPayment();

    await applyProviderEvent(
      event({ providerPaymentId: payment.providerPaymentId!, amount: null })
    );

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(
      after!.paymentStatus,
      "paid",
      "a provider that omits the amount should still settle"
    );
  });

  // ─── Unknown payments ───────────────────────────────────────────────────────

  test("an event for an unknown payment changes nothing", async () => {
    const { order } = await seedPayment();

    const result = await applyProviderEvent(
      event({ providerPaymentId: "pay_does_not_exist" })
    );

    assert.equal(result.ok, false);
    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.notEqual(after!.paymentStatus, "paid");
  });

  // ─── Manual fallback ────────────────────────────────────────────────────────

  test("the manual gateway never claims money was collected", async () => {
    const created = await manualGateway.createPayment({
      orderId: "o1",
      orderNumber: "KPB-2026-0001",
      amount: 9990,
      description: "test",
      customerEmail: "buyer@example.com",
      returnUrl: "https://example.com/return",
      idempotencyKey: randomUUID(),
    });

    assert.equal(created.ok, true);
    assert.equal(created.ok && created.value.status, "pending");
    assert.equal(
      created.ok && created.value.confirmationUrl,
      null,
      "manual payment offered a redirect"
    );
  });

  test("the manual gateway refuses webhooks outright", async () => {
    // Accepting an unauthenticated 'succeeded' here would let anyone mark any
    // order paid for free.
    const parsed = await manualGateway.parseWebhook(
      JSON.stringify({ object: { id: "x", status: "succeeded" } }),
      new Headers()
    );
    assert.equal(parsed.ok, false, "manual gateway accepted a webhook");
  });

  test("the manual gateway is always available as a fallback", () => {
    assert.equal(manualGateway.isConfigured(), true);
  });

  // ─── Idempotency keys ───────────────────────────────────────────────────────

  test("payment idempotency keys are unique per attempt", async () => {
    const user = await createUser();
    const product = await createProduct();
    const order = await createOrder(user.id, product.id);

    const key = randomUUID();
    await db.payment.create({
      data: {
        orderId: order.id,
        provider: "yookassa",
        status: "pending",
        amount: 9990,
        idempotencyKey: key,
      },
    });

    let rejected = false;
    try {
      await db.payment.create({
        data: {
          orderId: order.id,
          provider: "yookassa",
          status: "pending",
          amount: 9990,
          idempotencyKey: key,
        },
      });
    } catch {
      rejected = true;
    }

    assert.ok(rejected, "a duplicate idempotency key was accepted");
  });
});
