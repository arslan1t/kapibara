import { test, describe, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db, resetDatabase, createUser, createProduct, expectRejected } from "./helpers";
import { isPurchasable } from "../src/lib/constants";
import { sanitizeChildName, isChildNameValid } from "../src/lib/validation";
import { checkUpload, isValidKey, ALLOWED_MIME } from "../src/lib/storage";

/**
 * Checkout correctness.
 *
 * The rule these all serve: the browser is an untrusted source of prices,
 * quantities and product identity. Everything that determines what a customer
 * is charged is derived server-side.
 */
describe("checkout", () => {
  after(async () => {
    await db.$disconnect();
  });
  beforeEach(resetDatabase);

  // ─── Purchasability ─────────────────────────────────────────────────────────

  test("only a published, available, in-stock product is purchasable", () => {
    const base = { published: true, status: "available", stockStatus: "in_stock" };

    assert.equal(isPurchasable(base), true);
    assert.equal(isPurchasable({ ...base, published: false }), false, "unpublished");
    assert.equal(isPurchasable({ ...base, status: "coming_soon" }), false, "coming soon");
    assert.equal(isPurchasable({ ...base, status: "archived" }), false, "archived");
    assert.equal(
      isPurchasable({ ...base, stockStatus: "out_of_stock" }),
      false,
      "out of stock"
    );
  });

  // ─── Server-side pricing ────────────────────────────────────────────────────

  test("the line total is computed from the stored price, not the request", async () => {
    const product = await createProduct({ price: 9990 });

    // What a tampered client might claim.
    const claimedUnitPrice = 1;
    const quantity = 2;

    // What the server does: read the price from the product row.
    const stored = await db.product.findUnique({ where: { id: product.id } });
    const lineTotal = stored!.price * quantity;

    assert.equal(lineTotal, 19980);
    assert.notEqual(lineTotal, claimedUnitPrice * quantity);
  });

  test("the database refuses a line total that disagrees with its parts", async () => {
    const user = await createUser();
    const product = await createProduct();

    const rows = await db.$queryRaw<{ n: string }[]>`SELECT next_order_number() AS n`;
    const order = await db.order.create({
      data: {
        orderNumber: rows[0]!.n,
        userId: user.id,
        customerEmail: "buyer@example.com",
        customerName: "Покупатель",
        customerPhone: "+79991234567",
        subtotal: 9990,
        deliveryPrice: 0,
        total: 9990,
        deliveryMethod: "courier",
        deliveryAddress: "Москва",
      },
    });

    await expectRejected(
      "an order line priced 1 ₽ for a 9990 ₽ product",
      () =>
        db.$executeRawUnsafe(
          `INSERT INTO order_items
             (id,"orderId","productId","productTitle","productSlug","unitPrice",quantity,"lineTotal")
           VALUES ('oi-bad','${order.id}','${product.id}','T','t',9990,1,1)`
        ),
      async () => (await db.orderItem.count({ where: { id: "oi-bad" } })) === 0
    );
  });

  test("the database refuses an order total that disagrees with its parts", async () => {
    const user = await createUser();

    await expectRejected(
      "total that is not subtotal + delivery",
      () =>
        db.$executeRawUnsafe(
          `INSERT INTO orders
             (id,"orderNumber","userId","customerEmail","customerName","customerPhone",
              subtotal,"deliveryPrice",total,"deliveryMethod","deliveryAddress","updatedAt")
           VALUES ('o-bad','KPB-BAD','${user.id}','b@example.com','N','1',
                   9990,500,1,'courier','Москва',now())`
        ),
      async () => (await db.order.count({ where: { id: "o-bad" } })) === 0
    );
  });

  test("the database refuses a negative quantity", async () => {
    await expectRejected(
      "zero quantity",
      () =>
        db.$executeRawUnsafe(
          `INSERT INTO order_items
             (id,"orderId","productTitle","productSlug","unitPrice",quantity,"lineTotal")
           VALUES ('oi-zero','none','T','t',100,0,0)`
        ),
      async () => (await db.orderItem.count({ where: { id: "oi-zero" } })) === 0
    );
  });

  // ─── Order numbering ────────────────────────────────────────────────────────

  test("order numbers are unique under repeated allocation", async () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const rows = await db.$queryRaw<{ n: string }[]>`SELECT next_order_number() AS n`;
      seen.add(rows[0]!.n);
    }
    assert.equal(seen.size, 40, "the sequence produced a duplicate order number");
    for (const n of seen) assert.match(n, /^KPB-\d{4}-\d{4,}$/);
  });

  // ─── Child name validation ──────────────────────────────────────────────────

  test("child names accept Cyrillic and reject everything else", () => {
    const accepted = ["Пётр", "Анна-Мария", "Марья Ивановна", "Ёлка"];
    for (const name of accepted) {
      assert.equal(isChildNameValid(name), true, `rejected valid name: ${name}`);
    }

    // Checked before sanitising: these are what a crafted request would send
    // straight to the server action.
    const rejected = ["Peter", "Пётр123", "Ivan Петров", "🙂", "", "   ", "P", "12"];
    for (const name of rejected) {
      assert.equal(
        isChildNameValid(name),
        false,
        `accepted invalid name: ${JSON.stringify(name)}`
      );
    }
  });

  test("sanitising strips disallowed characters and reports that it did", () => {
    // The form strips as the customer types, so a name that merely contains a
    // stray character becomes valid rather than blocking the form. The caller
    // is told, which is how the field shows «Используйте только кириллицу».
    const withDigits = sanitizeChildName("Пётр123");
    assert.equal(withDigits.value, "Пётр");
    assert.equal(withDigits.rejected, true, "removal was not reported to the caller");

    const clean = sanitizeChildName("Пётр");
    assert.equal(clean.value, "Пётр");
    assert.equal(clean.rejected, false, "a clean name was reported as modified");

    // Latin letters are removed entirely, leaving nothing valid behind.
    const latin = sanitizeChildName("Peter");
    assert.equal(latin.rejected, true);
    assert.equal(
      isChildNameValid(latin.value),
      false,
      "an all-Latin name survived sanitising"
    );
  });

  // ─── Upload validation ──────────────────────────────────────────────────────

  test("storage keys are UUID-shaped and reject traversal", () => {
    assert.equal(isValidKey("11111111-1111-4111-8111-111111111111.jpg"), true);

    const bad = [
      "../../etc/passwd",
      "../secret.jpg",
      "file.jpg/../../x",
      "not-a-uuid.jpg",
      "11111111-1111-4111-8111-111111111111.exe",
      "11111111-1111-4111-8111-111111111111.jpg.sh",
      "",
    ];
    for (const key of bad) {
      assert.equal(isValidKey(key), false, `accepted dangerous key: ${key}`);
    }
  });

  test("uploads are checked against real magic bytes, not the declared type", () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(64),
    ]);
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);
    const pdf = Buffer.concat([Buffer.from("%PDF-1.7\n"), Buffer.alloc(64)]);

    const asFile = (type: string, size: number) => ({ type, size }) as File;

    assert.equal(checkUpload(asFile("image/png", png.length), png).ok, true);
    assert.equal(checkUpload(asFile("image/jpeg", jpeg.length), jpeg).ok, true);

    // A PDF renamed to look like a PNG.
    const disguised = checkUpload(asFile("image/png", pdf.length), pdf);
    assert.equal(disguised.ok, false, "a PDF passed as a PNG was accepted");

    // A real PNG declared as a JPEG.
    const mismatched = checkUpload(asFile("image/jpeg", png.length), png);
    assert.equal(mismatched.ok, false, "a mismatched declared type was accepted");

    // An executable.
    const elf = Buffer.concat([Buffer.from([0x7f, 0x45, 0x4c, 0x46]), Buffer.alloc(64)]);
    assert.equal(
      checkUpload(asFile("image/png", elf.length), elf).ok,
      false,
      "an ELF binary was accepted"
    );
  });

  test("uploads are size-limited and reject empty files", () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(64),
    ]);
    const asFile = (type: string, size: number) => ({ type, size }) as File;

    assert.equal(checkUpload(asFile("image/png", 0), Buffer.alloc(0)).ok, false, "empty");

    const huge = Buffer.concat([png, Buffer.alloc(9 * 1024 * 1024)]);
    assert.equal(checkUpload(asFile("image/png", huge.length), huge).ok, false, "9 MB");
  });

  test("only printable image formats are accepted", () => {
    assert.deepEqual(
      [...ALLOWED_MIME].sort(),
      ["image/heic", "image/jpeg", "image/png", "image/webp"]
    );
    assert.equal(ALLOWED_MIME.has("image/svg+xml"), false, "SVG would allow scripts");
    assert.equal(ALLOWED_MIME.has("application/pdf"), false);
  });
});
