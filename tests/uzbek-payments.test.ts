import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db, resetDatabase, createUser, createProduct, createOrder } from "./helpers";

/**
 * Payme and Click.
 *
 * Both are merchant-implemented protocols: the provider calls us and we drive
 * a transaction through states. That makes the failure modes ours rather than
 * the provider's, and the property under test throughout is the same one the
 * YooKassa tests assert — nothing a caller can put in a request should mark an
 * order paid unless it genuinely was.
 *
 * Credentials are set per test rather than read from the environment, so these
 * run anywhere and never depend on a real merchant account. What they cannot
 * prove is that the wire format matches what Payme and Click actually send;
 * only their own test suites can, and that has not been run.
 */

const PAYME_MERCHANT = "merchant-test-id";
const PAYME_KEY = "payme-test-key";
const CLICK_SERVICE = "11111";
const CLICK_MERCHANT = "22222";
const CLICK_SECRET = "click-test-secret";

function configure() {
  process.env.NEXT_PUBLIC_MARKET = "UZ";
  process.env.PAYME_MERCHANT_ID = PAYME_MERCHANT;
  process.env.PAYME_KEY = PAYME_KEY;
  process.env.CLICK_SERVICE_ID = CLICK_SERVICE;
  process.env.CLICK_MERCHANT_ID = CLICK_MERCHANT;
  process.env.CLICK_SECRET_KEY = CLICK_SECRET;
}

async function uzbekOrder(total = 1_290_000) {
  const user = await createUser();
  const product = await createProduct();
  return createOrder(user.id, product.id, {
    region: "UZ",
    currency: "UZS",
    locale: "uz",
    subtotal: total,
    total,
  });
}

function basicAuth(key: string): string {
  return `Basic ${Buffer.from(`Paycom:${key}`).toString("base64")}`;
}

describe("Payme merchant API", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase();
    configure();
  });

  async function rpc(method: string, params: Record<string, unknown>, key = PAYME_KEY) {
    const { handlePaymeRpc } = await import("../src/lib/payments/payme");
    const { body } = await handlePaymeRpc(
      { id: 1, method, params },
      basicAuth(key)
    );
    return body as { result?: Record<string, unknown>; error?: { code: number } };
  }

  test("a wrong merchant key is refused and changes nothing", async () => {
    const order = await uzbekOrder();
    const answer = await rpc(
      "CheckPerformTransaction",
      { amount: 129_000_000, account: { order_id: order.id } },
      "not-the-key"
    );
    assert.equal(answer.error?.code, -32504);
    assert.equal(await db.payment.count(), 0);
  });

  test("amounts are in tiyin, and a sum-denominated amount is refused", async () => {
    const order = await uzbekOrder(1_290_000);

    const correct = await rpc("CheckPerformTransaction", {
      amount: 129_000_000,
      account: { order_id: order.id },
    });
    assert.deepEqual(correct.result, { allow: true });

    // The classic hundredfold mistake: the amount in sum rather than tiyin.
    const wrong = await rpc("CheckPerformTransaction", {
      amount: 1_290_000,
      account: { order_id: order.id },
    });
    assert.equal(wrong.error?.code, -31001);
  });

  test("a Russian order cannot be paid through Payme", async () => {
    const user = await createUser();
    const product = await createProduct();
    const order = await createOrder(user.id, product.id, {
      region: "RU",
      currency: "RUB",
    });

    const answer = await rpc("CheckPerformTransaction", {
      amount: 999_000,
      account: { order_id: order.id },
    });
    assert.equal(answer.error?.code, -31051);
  });

  test("create then perform settles the order exactly once", async () => {
    const order = await uzbekOrder();

    const created = await rpc("CreateTransaction", {
      id: "pm-1",
      time: Date.now(),
      amount: 129_000_000,
      account: { order_id: order.id },
    });
    assert.equal(created.result?.state, 1);

    const performed = await rpc("PerformTransaction", { id: "pm-1" });
    assert.equal(performed.result?.state, 2);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "paid");

    // Payme retries; the repeat must return the same answer, not a second
    // settlement.
    const again = await rpc("PerformTransaction", { id: "pm-1" });
    assert.equal(again.result?.state, 2);
    assert.equal(again.result?.perform_time, performed.result?.perform_time);
    assert.equal(await db.payment.count({ where: { status: "succeeded" } }), 1);
  });

  test("a second transaction for an order already in flight is refused", async () => {
    const order = await uzbekOrder();
    await rpc("CreateTransaction", {
      id: "pm-a",
      time: Date.now(),
      amount: 129_000_000,
      account: { order_id: order.id },
    });

    const second = await rpc("CreateTransaction", {
      id: "pm-b",
      time: Date.now(),
      amount: 129_000_000,
      account: { order_id: order.id },
    });
    assert.equal(second.error?.code, -31008);
  });

  test("a transaction older than twelve hours cannot be performed", async () => {
    const order = await uzbekOrder();
    await rpc("CreateTransaction", {
      id: "pm-old",
      time: Date.now() - 13 * 60 * 60 * 1000,
      amount: 129_000_000,
      account: { order_id: order.id },
    });

    const performed = await rpc("PerformTransaction", { id: "pm-old" });
    assert.equal(performed.error?.code, -31008);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "unpaid");
  });

  test("cancelling a performed transaction refunds the order", async () => {
    const order = await uzbekOrder();
    await rpc("CreateTransaction", {
      id: "pm-c",
      time: Date.now(),
      amount: 129_000_000,
      account: { order_id: order.id },
    });
    await rpc("PerformTransaction", { id: "pm-c" });

    const cancelled = await rpc("CancelTransaction", { id: "pm-c", reason: 5 });
    assert.equal(cancelled.result?.state, -2);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "refunded");
  });

  test("a dispatched order cannot be cancelled through Payme", async () => {
    const order = await uzbekOrder();
    await rpc("CreateTransaction", {
      id: "pm-d",
      time: Date.now(),
      amount: 129_000_000,
      account: { order_id: order.id },
    });
    await rpc("PerformTransaction", { id: "pm-d" });
    await db.order.update({
      where: { id: order.id },
      data: { orderStatus: "in_delivery" },
    });

    const cancelled = await rpc("CancelTransaction", { id: "pm-d", reason: 5 });
    assert.equal(cancelled.error?.code, -31007);
  });

  test("an unknown transaction is not found rather than invented", async () => {
    const answer = await rpc("CheckTransaction", { id: "nope" });
    assert.equal(answer.error?.code, -31003);
  });
});

describe("Click SHOP API", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase();
    configure();
  });

  async function sign(params: Record<string, string>) {
    const { clickSignature } = await import("../src/lib/payments/click");
    return clickSignature(
      params as never,
      CLICK_SECRET
    );
  }

  async function prepare(overrides: Record<string, string> = {}) {
    const { handleClickPrepare } = await import("../src/lib/payments/click");
    const params: Record<string, string> = {
      click_trans_id: "ck-1",
      service_id: CLICK_SERVICE,
      merchant_trans_id: overrides.merchant_trans_id ?? "",
      amount: "1290000.00",
      action: "0",
      error: "0",
      sign_time: "2026-11-17 10:00:00",
      sign_string: "",
      ...overrides,
    };
    params.sign_string = params.sign_string || (await sign(params));
    return handleClickPrepare(params as never);
  }

  async function complete(prepareId: string, overrides: Record<string, string> = {}) {
    const { handleClickComplete } = await import("../src/lib/payments/click");
    const params: Record<string, string> = {
      click_trans_id: "ck-1",
      service_id: CLICK_SERVICE,
      merchant_trans_id: overrides.merchant_trans_id ?? "",
      merchant_prepare_id: prepareId,
      amount: "1290000.00",
      action: "1",
      error: "0",
      sign_time: "2026-11-17 10:05:00",
      sign_string: "",
      ...overrides,
    };
    params.sign_string = params.sign_string || (await sign(params));
    return handleClickComplete(params as never);
  }

  test("a forged signature is refused and nothing is written", async () => {
    const order = await uzbekOrder();
    const answer = await prepare({
      merchant_trans_id: order.id,
      sign_string: "0".repeat(32),
    });
    assert.equal(answer.error, -1);
    assert.equal(await db.payment.count(), 0);
  });

  test("prepare then complete settles the order exactly once", async () => {
    const order = await uzbekOrder();

    const prepared = await prepare({ merchant_trans_id: order.id });
    assert.equal(prepared.error, 0);
    assert.ok(prepared.merchant_prepare_id);

    const completed = await complete(prepared.merchant_prepare_id!, {
      merchant_trans_id: order.id,
    });
    assert.equal(completed.error, 0);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "paid");

    // Click retries; the repeat is a no-op with the same answer.
    const again = await complete(prepared.merchant_prepare_id!, {
      merchant_trans_id: order.id,
    });
    assert.equal(again.error, 0);
    assert.equal(await db.payment.count({ where: { status: "succeeded" } }), 1);
  });

  test("a complete quoting the wrong prepare id is refused", async () => {
    const order = await uzbekOrder();
    await prepare({ merchant_trans_id: order.id });

    const completed = await complete("999", { merchant_trans_id: order.id });
    assert.equal(completed.error, -6);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "unpaid");
  });

  test("an amount that does not match the order is refused", async () => {
    const order = await uzbekOrder();
    const answer = await prepare({
      merchant_trans_id: order.id,
      amount: "1000.00",
    });
    assert.equal(answer.error, -2);
  });

  test("a Russian order cannot be paid through Click", async () => {
    const user = await createUser();
    const product = await createProduct();
    const order = await createOrder(user.id, product.id, {
      region: "RU",
      currency: "RUB",
    });

    const answer = await prepare({
      merchant_trans_id: order.id,
      amount: "9990.00",
    });
    assert.equal(answer.error, -5);
  });

  test("an order already paid is refused rather than charged twice", async () => {
    const order = await uzbekOrder();
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: "paid" },
    });

    const answer = await prepare({ merchant_trans_id: order.id });
    assert.equal(answer.error, -4);
  });

  test("a failure reported by Click cancels rather than settles", async () => {
    const order = await uzbekOrder();
    const prepared = await prepare({ merchant_trans_id: order.id });

    const completed = await complete(prepared.merchant_prepare_id!, {
      merchant_trans_id: order.id,
      error: "-5",
      error_note: "User not found",
    });
    assert.equal(completed.error, -9);

    const after = await db.order.findUnique({ where: { id: order.id } });
    assert.equal(after?.paymentStatus, "unpaid");
  });
});

describe("Uzbek product wording in the back office", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase();
    configure();
  });

  // The half-filled case is refused in validateProduct, which cannot be
  // reached from here: importing a server action pulls in Next's client
  // navigation context and the module graph does not load under the test
  // runner. What is asserted instead is the rule underneath it, which is the
  // one that holds even if the form is bypassed entirely.

  test("the database refuses an empty translation outright", async () => {
    const product = await createProduct();
    await assert.rejects(() =>
      db.productTranslation.create({
        data: {
          productId: product.id,
          language: "uz",
          title: "",
          shortTitle: "",
          shortDescription: "",
          description: "",
        },
      })
    );
  });

  test("only Uzbek may be stored as a translation — Russian lives on the product", async () => {
    const product = await createProduct();
    await assert.rejects(() =>
      db.productTranslation.create({
        data: {
          productId: product.id,
          language: "ru",
          title: "T",
          shortTitle: "T",
          shortDescription: "S",
          description: "D",
        },
      })
    );
  });
});
