import "server-only";
import { coverPathFor } from "@/lib/generation/cover";

import { db } from "@/lib/db";
import type { Book } from "@/types";
import type {
  Product,
  ProductImage,
  ProductTranslation,
} from "@/generated/prisma";
import {
  DEFAULT_LOCALE,
  LOCALE_CONFIG,
  REGION_CONFIG,
  type Locale,
} from "@/i18n/config";

/**
 * Server-side catalogue access.
 *
 * The storefront components were written against the `Book` shape, so rows are
 * mapped into it here. That keeps the presentation layer untouched while the
 * data itself now comes from the database.
 */

type ProductRow = Product & {
  images?: ProductImage[];
  translations?: ProductTranslation[];
};

/** Every query that feeds the storefront needs both of these. */
export const storefrontInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  translations: true,
} as const;

/**
 * One database row, resolved for one reader.
 *
 * Two things are decided here and nowhere else, so that no component has to
 * carry the rules around: which language the book speaks, and which market's
 * price applies. A missing translation falls back to the Russian original —
 * a book described in the wrong language is still orderable, a book that
 * renders as undefined is not.
 */
export function toBook(product: ProductRow, locale: Locale = DEFAULT_LOCALE): Book {
  const primary =
    product.images?.find((i) => i.isPrimary) ??
    product.images?.[0] ??
    undefined;

  const { language, region } = LOCALE_CONFIG[locale];
  const translation =
    language === "ru"
      ? undefined
      : product.translations?.find((t) => t.language === language);

  const { currency, priceField, oldPriceField } = REGION_CONFIG[region];

  return {
    id: product.id,
    slug: product.slug,
    title: translation?.title ?? product.title,
    shortTitle: translation?.shortTitle ?? product.shortTitle,
    childGender: (product.childGender as "boy" | "girl") ?? "boy",
    description: translation?.description ?? product.description,
    shortDescription: translation?.shortDescription ?? product.shortDescription,
    // Cover art still lives in /public; the gallery rows are separate. Shared
    // with the generation layer, which hands this same file to the provider as
    // the reference image — the two must never drift apart.
    image: coverPathFor(product.coverImage),
    ageRange: translation?.ageRange ?? product.ageRange,
    ageMin: product.ageMin,
    ageMax: product.ageMax,
    pageCount: product.pageCount,
    price: product[priceField],
    currency,
    status: product.status === "available" ? "available" : "in-development",
    // A book with no price in this market cannot be ordered here, whatever its
    // status says. The catalogue still shows it — it is a real book — but the
    // buy button would otherwise take money for an amount nobody set.
    available:
      product.status === "available" &&
      product.published &&
      product[priceField] !== null,
    personalizationEnabled: product.personalizationEnabled,
    category: "adventure",
    format: "hardcover-square",
    oldPrice: product[oldPriceField],
    // Extra fields the gallery needs, ignored by older components.
    ...(primary ? {} : {}),
  };
}

/** Everything visible in the storefront, buyable first. */
export async function getPublishedProducts(
  locale: Locale = DEFAULT_LOCALE
): Promise<Book[]> {
  const rows = await db.product.findMany({
    where: { published: true, status: { not: "archived" } },
    orderBy: [{ status: "asc" }, { featured: "desc" }, { createdAt: "asc" }],
    include: storefrontInclude,
  });
  return rows.map((row) => toBook(row, locale));
}

/** Only products a customer may actually buy. */
export async function getAvailableProducts(
  locale: Locale = DEFAULT_LOCALE
): Promise<Book[]> {
  const rows = await db.product.findMany({
    where: { published: true, status: "available" },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    include: storefrontInclude,
  });
  return rows.map((row) => toBook(row, locale));
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
export async function getBookBySlugOrId(
  value: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Book | null> {
  const row = await db.product.findFirst({
    where: {
      OR: [{ slug: value }, { id: value }],
      published: true,
      status: { not: "archived" },
    },
    include: storefrontInclude,
  });
  return row ? toBook(row, locale) : null;
}

/** Gallery images for a product, in display order. */
export async function getProductGallery(slug: string) {
  const row = await db.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  return row?.images ?? [];
}
