import { PrismaClient } from "../src/generated/prisma";

/**
 * Shared test fixtures.
 *
 * Tests run against a real PostgreSQL (PGlite in development, a throwaway
 * database in CI) so constraints, transactions and concurrency behave exactly
 * as they will in production. An in-memory fake would pass tests that the real
 * database would fail.
 */

export const db = new PrismaClient();

/**
 * Refuses to run destructive tests against anything but a local database.
 *
 * `resetDatabase` truncates every table. A .env pointed at production — which
 * is a completely ordinary thing to do while debugging a deployment — turns
 * `npm test` into a command that erases the shop. A comment in the README is
 * not a safeguard; this is. Learned the hard way: this exact mistake wiped the
 * seeded catalogue and the administrator account from a live database.
 */
function assertLocalDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL is missing or unparseable; refusing to run tests.");
  }

  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".local") ||
    // Explicit opt-in for a throwaway database in CI.
    process.env.ALLOW_DESTRUCTIVE_TESTS === "yes-i-am-sure";

  if (!isLocal) {
    throw new Error(
      `Refusing to run destructive tests against "${host}".\n` +
        "These tests TRUNCATE every table. Point DATABASE_URL at a local\n" +
        "database (npm run db:local), or set\n" +
        "ALLOW_DESTRUCTIVE_TESTS=yes-i-am-sure if this really is a throwaway."
    );
  }
}

/** Wipes every table, in dependency order. */
export async function resetDatabase(): Promise<void> {
  assertLocalDatabase();

  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      generation_results, generation_jobs, reviews, payments,
      order_status_history, personalizations, order_items, orders,
      product_images, product_variants, products,
      consents, verification_tokens, users,
      email_messages, rate_limit_counters
    RESTART IDENTITY CASCADE
  `);
}

export async function createProduct(overrides: Record<string, unknown> = {}) {
  return db.product.create({
    data: {
      slug: `book-${Math.random().toString(36).slice(2, 10)}`,
      title: "Приключения Мальчика и Колёсика",
      shortTitle: "Мальчик и Колёсик",
      shortDescription: "Короткое описание",
      description: "Полное описание",
      price: 9990,
      status: "available",
      published: true,
      stockStatus: "in_stock",
      ageRange: "3–8 лет",
      ageMin: 3,
      ageMax: 8,
      pageCount: 40,
      format: "hardcover-square",
      childGender: "boy",
      coverImage: "/images/books/kolesik-cover.png",
      ...overrides,
    },
  });
}

export async function createUser(overrides: Record<string, unknown> = {}) {
  const suffix = Math.random().toString(36).slice(2, 10);
  return db.user.create({
    data: {
      email: `user-${suffix}@example.com`,
      // A bcrypt hash of "correct-horse-1"; tests that need a real comparison
      // hash their own.
      passwordHash: "$2b$12$abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOP",
      fullName: "Тестовый Пользователь",
      role: "customer",
      ...overrides,
    },
  });
}

export async function createOrder(
  userId: string | null,
  productId: string,
  overrides: Record<string, unknown> = {}
) {
  const rows = await db.$queryRaw<{ n: string }[]>`SELECT next_order_number() AS n`;

  return db.order.create({
    data: {
      orderNumber: rows[0]!.n,
      userId,
      customerEmail: "buyer@example.com",
      customerName: "Покупатель",
      customerPhone: "+79991234567",
      subtotal: 9990,
      deliveryPrice: 0,
      total: 9990,
      paymentStatus: "unpaid",
      orderStatus: "new",
      deliveryMethod: "courier",
      deliveryAddress: "Москва, ул. Тверская, 1",
      items: {
        create: {
          productId,
          productTitle: "Приключения Мальчика и Колёсика",
          productSlug: "priklyucheniya-malchika-i-kolesika",
          unitPrice: 9990,
          quantity: 1,
          lineTotal: 9990,
          personalization: { create: { childName: "Пётр" } },
        },
      },
      ...overrides,
    },
    include: { items: { include: { personalization: true } } },
  });
}

/**
 * Asserts that an operation is refused by the database.
 *
 * Written as an explicit try/catch rather than assert.rejects because these
 * tests deliberately provoke constraint violations, and we want the actual
 * driver message in the failure output when one is unexpectedly accepted.
 */
/**
 * Asserts that the database refused an operation, and that nothing was written.
 *
 * Deliberately checks the *effect* rather than the driver's error code. The
 * local PostgreSQL used in development resets the connection on a constraint
 * violation, which masks Prisma's P2002 behind a generic P1017 — but the
 * property that actually matters is that the row does not exist afterwards,
 * and that is true on every PostgreSQL.
 *
 * The connection is re-established afterwards so the next test starts clean.
 */
export async function expectRejected(
  label: string,
  fn: () => Promise<unknown>,
  verifyNotWritten?: () => Promise<boolean>
): Promise<void> {
  let error: unknown;
  try {
    await fn();
  } catch (caught) {
    error = caught;
  }

  // Some drivers drop the connection on a constraint error; reconnect before
  // the verification query runs.
  await reconnect();

  if (!error) {
    throw new Error(`Expected the database to reject: ${label}`);
  }

  if (verifyNotWritten && !(await verifyNotWritten())) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `An error was raised for "${label}" but the row was written anyway.\n` +
        `  ${message.replace(/\s+/g, " ").slice(0, 200)}`
    );
  }
}

/** Restores the connection after an error that reset it. */
export async function reconnect(): Promise<void> {
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    await db.$disconnect().catch(() => {});
    await db.$connect().catch(() => {});
  }
}
