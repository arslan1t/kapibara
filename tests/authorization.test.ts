import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  db,
  resetDatabase,
  createUser,
  createProduct,
  createOrder,
  expectRejected,
} from "./helpers";
import { getReviewableItems, getApprovedReviews } from "../src/lib/reviews";
import { getBookBySlugOrId } from "../src/lib/products";

/**
 * Authorization: can one customer reach another customer's data?
 *
 * These exercise the queries the pages and routes actually run, so a scoping
 * mistake in a `where` clause is caught here rather than by a customer.
 */
describe("authorization", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  test("order queries are scoped to the owner", async () => {
    const alice = await createUser({ email: "alice@example.com" });
    const bob = await createUser({ email: "bob@example.com" });
    const product = await createProduct();

    const aliceOrder = await createOrder(alice.id, product.id);
    await createOrder(bob.id, product.id);

    // The query used by /account/orders.
    const aliceSees = await db.order.findMany({ where: { userId: alice.id } });
    assert.equal(aliceSees.length, 1);
    assert.equal(aliceSees[0]!.id, aliceOrder.id);

    // The query used by /account/orders/[id] — Bob asking for Alice's order.
    const bobProbe = await db.order.findFirst({
      where: { id: aliceOrder.id, userId: bob.id },
    });
    assert.equal(bobProbe, null, "another customer's order was readable");
  });

  test("a guest order is not attributed to any account", async () => {
    const alice = await createUser();
    const product = await createProduct();
    await createOrder(null, product.id);

    const owned = await db.order.findMany({ where: { userId: alice.id } });
    assert.equal(owned.length, 0, "a guest order leaked into an account");
  });

  test("upload ownership: only the owner's own files resolve", async () => {
    const alice = await createUser({ email: "alice@example.com" });
    const bob = await createUser({ email: "bob@example.com" });
    const product = await createProduct();

    const order = await createOrder(alice.id, product.id);
    const photoKey = "11111111-1111-4111-8111-111111111111.jpg";
    await db.personalization.update({
      where: { orderItemId: order.items[0]!.id },
      data: { photoKey },
    });

    // The exact predicate /api/uploads/[key] uses.
    const aliceClaim = await db.personalization.findFirst({
      where: { photoKey, orderItem: { order: { userId: alice.id } } },
    });
    assert.ok(aliceClaim, "owner could not read their own photo");

    const bobClaim = await db.personalization.findFirst({
      where: { photoKey, orderItem: { order: { userId: bob.id } } },
    });
    assert.equal(bobClaim, null, "another customer's photo was readable");
  });

  test("generation results are readable only by the job's owner", async () => {
    const alice = await createUser({ email: "alice@example.com" });
    const bob = await createUser({ email: "bob@example.com" });
    const product = await createProduct();

    const job = await db.generationJob.create({
      data: {
        productId: product.id,
        userId: alice.id,
        childName: "Пётр",
        photoKey: "22222222-2222-4222-8222-222222222222.jpg",
        provider: "nano_banana",
        status: "succeeded",
        results: {
          create: {
            pageNumber: 1,
            storageKey: "33333333-3333-4333-8333-333333333333.png",
          },
        },
      },
      include: { results: true },
    });

    const key = job.results[0]!.storageKey;

    const owner = await db.generationResult.findFirst({
      where: { storageKey: key, job: { userId: alice.id } },
    });
    assert.ok(owner, "owner could not read their own illustration");

    const other = await db.generationResult.findFirst({
      where: { storageKey: key, job: { userId: bob.id } },
    });
    assert.equal(other, null, "another customer's illustration was readable");
  });

  test("only delivered orders become reviewable, and only for their owner", async () => {
    const alice = await createUser({ email: "alice@example.com" });
    const bob = await createUser({ email: "bob@example.com" });
    const product = await createProduct();

    const open = await createOrder(alice.id, product.id);
    const delivered = await createOrder(alice.id, product.id, {
      orderStatus: "completed",
    });

    const aliceItems = await getReviewableItems(alice.id);
    const ids = aliceItems.map((i) => i.order.id);
    assert.ok(ids.includes(delivered.id), "delivered order was not reviewable");
    assert.ok(!ids.includes(open.id), "an undelivered order was reviewable");

    const bobItems = await getReviewableItems(bob.id);
    assert.equal(bobItems.length, 0, "another customer's order was reviewable");
  });

  test("one purchase yields at most one review", async () => {
    const alice = await createUser();
    const product = await createProduct();
    const order = await createOrder(alice.id, product.id, {
      orderStatus: "completed",
    });
    const orderItemId = order.items[0]!.id;

    await db.review.create({
      data: {
        userId: alice.id,
        productId: product.id,
        orderItemId,
        rating: 5,
        text: "Отличная книга, ребёнок в восторге.",
      },
    });

    await expectRejected(
      "second review for the same purchase",
      () =>
        db.review.create({
          data: {
            userId: alice.id,
            productId: product.id,
            orderItemId,
            rating: 1,
            text: "Повторный отзыв на ту же покупку.",
          },
        }),
      async () => (await db.review.count({ where: { orderItemId } })) === 1
    );
  });

  test("unapproved reviews are never returned publicly", async () => {
    const alice = await createUser();
    const product = await createProduct();
    const order = await createOrder(alice.id, product.id, {
      orderStatus: "completed",
    });

    await db.review.create({
      data: {
        userId: alice.id,
        productId: product.id,
        orderItemId: order.items[0]!.id,
        rating: 5,
        text: "Ждёт модерации и не должен быть виден.",
        status: "pending",
      },
    });

    assert.equal((await getApprovedReviews()).length, 0, "pending review was public");

    await db.review.updateMany({ data: { status: "approved" } });
    assert.equal((await getApprovedReviews()).length, 1, "approved review is missing");
  });

  test("public reviews do not expose the author's full name or email", async () => {
    const alice = await createUser({
      email: "anna.smirnova@example.com",
      fullName: "Анна Смирнова",
    });
    const product = await createProduct();
    const order = await createOrder(alice.id, product.id, {
      orderStatus: "completed",
    });

    await db.review.create({
      data: {
        userId: alice.id,
        productId: product.id,
        orderItemId: order.items[0]!.id,
        rating: 5,
        text: "Книга приехала быстро, качество отличное.",
        status: "approved",
      },
    });

    const [review] = await getApprovedReviews();
    assert.equal(review!.authorName, "Анна С.");
    assert.ok(!JSON.stringify(review).includes("anna.smirnova@example.com"));
    assert.ok(!JSON.stringify(review).includes("Смирнова"));
  });

  test("an archived product stops resolving on the storefront", async () => {
    const product = await createProduct();

    assert.ok(await getBookBySlugOrId(product.slug), "published product not found");

    await db.product.update({
      where: { id: product.id },
      data: { status: "archived" },
    });
    assert.equal(
      await getBookBySlugOrId(product.slug),
      null,
      "archived product still resolves"
    );

    await db.product.update({
      where: { id: product.id },
      data: { status: "available", published: false },
    });
    assert.equal(
      await getBookBySlugOrId(product.slug),
      null,
      "unpublished product still resolves"
    );
  });

  test("the database refuses an unknown role", async () => {
    await expectRejected(
      "role outside the allowed set",
      () =>
        db.$executeRawUnsafe(
          `INSERT INTO users (id,email,"passwordHash","fullName",role,"updatedAt")
           VALUES ('u-root','root@example.com','h','N','superuser',now())`
        ),
      async () => (await db.user.count({ where: { id: "u-root" } })) === 0
    );
  });
});
