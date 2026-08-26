import "server-only";
import { coverPathFor } from "@/lib/generation/cover";

import { db } from "@/lib/db";
import type { Book } from "@/types";
import type { Product, ProductImage } from "@/generated/prisma";

/**
 * Server-side catalogue access.
 *
 * The storefront components were written against the `Book` shape, so rows are
 * mapped into it here. That keeps the presentation layer untouched while the
 * data itself now comes from the database.
 */

type ProductWithImages = Product & { images?: ProductImage[] };

export function toBook(product: ProductWithImages): Book {
  const primary =
    product.images?.find((i) => i.isPrimary) ??
    product.images?.[0] ??
    undefined;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortTitle: product.shortTitle,
    childGender: (product.childGender as "boy" | "girl") ?? "boy",
    description: product.description,
    shortDescription: product.shortDescription,
    // Cover art still lives in /public; the gallery rows are separate. Shared
    // with the generation layer, which hands this same file to the provider as
    // the reference image — the two must never drift apart.
    image: coverPathFor(product.childGender),
    ageRange: product.ageRange,
    ageMin: product.ageMin,
    ageMax: product.ageMax,
    pageCount: product.pageCount,
    price: product.price,
    currency: "RUB",
    status: product.status === "available" ? "available" : "in-development",
    available: product.status === "available" && product.published,
    personalizationEnabled: product.personalizationEnabled,
    category: "adventure",
    format: "hardcover-square",
    // Extra fields the gallery needs, ignored by older components.
    ...(primary ? {} : {}),
  };
}

/** Everything visible in the storefront, buyable first. */
export async function getPublishedProducts(): Promise<Book[]> {
  const rows = await db.product.findMany({
    where: { published: true, status: { not: "archived" } },
    orderBy: [{ status: "asc" }, { featured: "desc" }, { createdAt: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return rows.map(toBook);
}

/** Only products a customer may actually buy. */
export async function getAvailableProducts(): Promise<Book[]> {
  const rows = await db.product.findMany({
    where: { published: true, status: "available" },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return rows.map(toBook);
}

export async function getProductBySlug(slug: string) {
  return db.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
}

/**
 * Storefront lookup by slug or id.
 *
 * Unpublished and archived products are treated as missing: once a book is
 * withdrawn from sale its page must stop resolving, otherwise the old URL keeps
 * serving a product nobody can buy. Administrators use `getProductBySlug`,
 * which has no such filter.
 */
export async function getBookBySlugOrId(value: string): Promise<Book | null> {
  const row = await db.product.findFirst({
    where: {
      OR: [{ slug: value }, { id: value }],
      published: true,
      status: { not: "archived" },
    },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return row ? toBook(row) : null;
}

/** Gallery images for a product, in display order. */
export async function getProductGallery(slug: string) {
  const row = await db.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return row?.images ?? [];
}
