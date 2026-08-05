"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  isOrderStatus,
  isPaymentStatus,
  PRODUCT_STATUSES,
  type ProductStatus,
} from "@/lib/constants";
import { reconcilePayment } from "@/lib/payments";
import { deleteProductImage, publicUrlFor, isValidKey } from "@/lib/storage";
import { sendOrderStatusEmail } from "@/lib/mail/order-mail";
import {
  recordAudit,
  type AdminAuditAction,
  type AuditTargetType,
} from "@/lib/audit";

type Result = { ok: true } | { ok: false; error: string };

const DENIED = "Недостаточно прав для этого действия";

/**
 * Every admin mutation starts here.
 *
 * The role is read from the database on each call rather than taken from the
 * session token, so removing someone's admin rights takes effect immediately
 * even if they still hold a valid cookie.
 */
async function assertAdmin(): Promise<{ id: string; email: string } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const ok = await isAdmin();
  return ok ? { id: user.id, email: user.email } : null;
}

/** Shorthand so every mutation records itself the same way. */
async function audit(
  admin: { id: string; email: string },
  action: AdminAuditAction,
  targetType: AuditTargetType,
  targetId: string,
  summary?: string
): Promise<void> {
  await recordAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action,
    targetType,
    targetId,
    summary,
  });
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string,
  note?: string
): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };
  if (!isOrderStatus(nextStatus)) {
    return { ok: false, error: "Неизвестный статус заказа" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { orderStatus: true },
  });
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.orderStatus === nextStatus) return { ok: true };

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { orderStatus: nextStatus },
    }),
    db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.orderStatus,
        toStatus: nextStatus,
        changedById: admin.id,
        note: note?.trim() || null,
      },
    }),
  ]);

  await audit(
    admin,
    "order.status_changed",
    "order",
    orderId,
    `${order.orderStatus} -> ${nextStatus}`
  );

  // Tells the customer their order moved. Fire-and-forget: a mail outage must
  // not undo a status change an administrator has already made.
  void sendOrderStatusEmail(orderId, nextStatus).catch(() => {});

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { ok: true };
}

export async function updatePaymentStatus(
  orderId: string,
  nextStatus: string
): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };
  if (!isPaymentStatus(nextStatus)) {
    return { ok: false, error: "Неизвестный статус оплаты" };
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true },
  });
  if (!order) return { ok: false, error: "Заказ не найден" };
  if (order.paymentStatus === nextStatus) return { ok: true };

  await db.$transaction([
    db.order.update({
      where: { id: orderId },
      data: { paymentStatus: nextStatus },
    }),
    // Payment is money, so who changed it and when is worth keeping even
    // though the order status itself did not move.
    db.orderStatusHistory.create({
      data: {
        orderId,
        toStatus: nextStatus,
        changedById: admin.id,
        note: `Статус оплаты изменён вручную: ${order.paymentStatus} → ${nextStatus}`,
      },
    }),
  ]);

  // Money moved by hand: the single most important thing to be able to trace.
  await audit(
    admin,
    "order.payment_status_changed",
    "order",
    orderId,
    `${order.paymentStatus} -> ${nextStatus}`
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  return { ok: true };
}

/**
 * Re-reads a payment from the provider.
 *
 * Gives an administrator a way to resolve a payment stuck in "ожидает" because
 * a webhook was lost, without touching the database by hand.
 */
export async function refreshPayment(paymentId: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const result = await reconcilePayment(paymentId);
  if (!result.ok) {
    return { ok: false, error: result.error ?? "Не удалось обновить платёж" };
  }

  await audit(admin, "payment.refreshed", "payment", paymentId, result.status);

  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function saveAdminNote(
  orderId: string,
  note: string
): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  await db.order.update({
    where: { id: orderId },
    data: { adminNote: note.trim() || null },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductInput = {
  slug: string;
  title: string;
  shortTitle: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice?: number | null;
  status: string;
  published: boolean;
  featured: boolean;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  pageCount: number;
  childGender?: string | null;
};

function validateProduct(input: ProductInput): string | null {
  if (!/^[a-z0-9-]+$/.test(input.slug)) {
    return "Slug может содержать только латиницу в нижнем регистре, цифры и дефис";
  }
  if (input.title.trim().length < 2) return "Укажите название";
  if (!Number.isInteger(input.price) || input.price < 0) {
    return "Цена должна быть целым неотрицательным числом";
  }
  if (!(PRODUCT_STATUSES as readonly string[]).includes(input.status)) {
    return "Неизвестный статус товара";
  }
  return null;
}

export async function createProduct(input: ProductInput): Promise<Result & { id?: string }> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const invalid = validateProduct(input);
  if (invalid) return { ok: false, error: invalid };

  const clash = await db.product.findUnique({ where: { slug: input.slug } });
  if (clash) return { ok: false, error: "Товар с таким slug уже существует" };

  const created = await db.product.create({
    data: {
      slug: input.slug,
      title: input.title.trim(),
      shortTitle: input.shortTitle.trim() || input.title.trim(),
      shortDescription: input.shortDescription.trim(),
      description: input.description.trim(),
      price: input.price,
      oldPrice: input.oldPrice ?? null,
      status: input.status as ProductStatus,
      published: input.published,
      featured: input.featured,
      ageRange: input.ageRange,
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      pageCount: input.pageCount,
      format: "hardcover-square",
      childGender: input.childGender ?? null,
    },
    select: { id: true },
  });

  await audit(admin, "product.created", "product", created.id, input.slug);

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { ok: true, id: created.id };
}

export async function updateProduct(
  id: string,
  input: ProductInput
): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const invalid = validateProduct(input);
  if (invalid) return { ok: false, error: invalid };

  const clash = await db.product.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (clash) return { ok: false, error: "Товар с таким slug уже существует" };

  const existing = await db.product.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Товар не найден" };

  await db.product.update({
    where: { id },
    data: {
      slug: input.slug,
      title: input.title.trim(),
      shortTitle: input.shortTitle.trim() || input.title.trim(),
      shortDescription: input.shortDescription.trim(),
      description: input.description.trim(),
      price: input.price,
      oldPrice: input.oldPrice ?? null,
      status: input.status as ProductStatus,
      published: input.published,
      featured: input.featured,
      ageRange: input.ageRange,
      ageMin: input.ageMin,
      ageMax: input.ageMax,
      pageCount: input.pageCount,
      childGender: input.childGender ?? null,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  revalidatePath(`/books/${input.slug}`);
  revalidatePath(`/books/${existing.slug}`);
  revalidatePath("/");
  return { ok: true };
}

/** Archives rather than deletes, so historical orders keep their product link. */
export async function archiveProduct(id: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  await db.product.update({
    where: { id },
    data: { status: "archived", published: false, featured: false },
  });

  revalidatePath("/admin/products");
  revalidatePath("/catalog");
  return { ok: true };
}

// ─── Product gallery ──────────────────────────────────────────────────────────

/**
 * Attaches an uploaded image to a product.
 *
 * The key must already exist in catalogue storage — the file itself is
 * uploaded through /api/admin/product-images, which performs its own admin
 * check before writing anything to disk.
 */
export async function addProductImage(input: {
  productId: string;
  key: string;
  alt: string;
}): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const alt = input.alt?.trim() ?? "";
  if (alt.length < 3) {
    // Alt text is not optional: a gallery without it is unusable with a screen
    // reader, and this is the only place it can be authored.
    return { ok: false, error: "Опишите изображение — это нужно для доступности" };
  }
  if (!isValidKey(input.key ?? "")) {
    return { ok: false, error: "Загрузите файл ещё раз" };
  }

  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!product) return { ok: false, error: "Товар не найден" };

  const image = await db.productImage.create({
    data: {
      productId: product.id,
      // Driver-aware: a storage CDN URL in production, the local
      // route in development. Stored resolved so the storefront needs
      // no knowledge of which driver is active.
      url: publicUrlFor(input.key),
      alt,
      sortOrder: product._count.images,
      // The first image uploaded becomes the cover.
      isPrimary: product._count.images === 0,
    },
  });

  await audit(admin, "product.image_added", "image", image.id, product.id);

  revalidatePath(`/admin/products/${product.id}`);
  revalidatePath("/catalog");
  return { ok: true };
}

/** Removes an image from a product and deletes the file behind it. */
export async function deleteProductImageById(imageId: string): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const image = await db.productImage.findUnique({
    where: { id: imageId },
    select: { id: true, url: true, productId: true, isPrimary: true },
  });
  if (!image) return { ok: false, error: "Изображение не найдено" };

  await db.productImage.delete({ where: { id: imageId } });

  // Only files this app wrote are removed; seeded artwork under /images stays.
  const candidate = image.url.split("/").pop() ?? "";
  if (isValidKey(candidate)) await deleteProductImage(candidate);

  // Promote the next image so a product is never left without a cover.
  if (image.isPrimary) {
    const next = await db.productImage.findFirst({
      where: { productId: image.productId },
      orderBy: { sortOrder: "asc" },
      select: { id: true },
    });
    if (next) {
      await db.productImage.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
    }
  }

  await audit(admin, "product.image_deleted", "image", imageId, image.productId);

  revalidatePath(`/admin/products/${image.productId}`);
  revalidatePath("/catalog");
  return { ok: true };
}

/** Reorders a product's gallery. */
export async function reorderProductImages(
  productId: string,
  orderedIds: string[]
): Promise<Result> {
  const admin = await assertAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const images = await db.productImage.findMany({
    where: { productId },
    select: { id: true },
  });
  const known = new Set(images.map((i) => i.id));

  // Ignore anything not belonging to this product rather than trusting the list.
  const filtered = orderedIds.filter((id) => known.has(id));
  if (filtered.length !== images.length) {
    return { ok: false, error: "Список изображений устарел — обновите страницу" };
  }

  await db.$transaction([
    ...filtered.map((id, index) =>
      db.productImage.update({
        where: { id },
        data: { sortOrder: index, isPrimary: index === 0 },
      })
    ),
  ]);

  await audit(
    admin,
    "product.images_reordered",
    "product",
    productId,
    `${filtered.length} изображений`
  );

  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/catalog");
  return { ok: true };
}
