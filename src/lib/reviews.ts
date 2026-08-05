import "server-only";

import { db } from "@/lib/db";

/**
 * Read access to published reviews.
 *
 * Every query here filters on `status: "approved"`. Nothing a customer wrote
 * reaches the public site until a person has read it, and nothing that is not a
 * verified purchase can exist in this table at all.
 */

export interface PublicReview {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  /** First name plus an initial — never the full name or the email. */
  authorName: string;
  productTitle: string;
  childName: string | null;
}

/**
 * "Анна Смирнова" → "Анна С."
 *
 * Reviews are public, so the display name is deliberately reduced. The full
 * name stays in the account record where it belongs.
 */
function displayName(fullName: string): string {
  const [first, ...rest] = fullName.trim().split(/\s+/);
  const initial = rest[0]?.[0];
  return initial ? `${first} ${initial}.` : (first ?? "Покупатель");
}

type ReviewRow = {
  id: string;
  rating: number;
  text: string;
  createdAt: Date;
  user: { fullName: string };
  product: { title: string };
};

function toPublic(row: ReviewRow, childName: string | null = null): PublicReview {
  return {
    id: row.id,
    rating: row.rating,
    text: row.text,
    createdAt: row.createdAt,
    authorName: displayName(row.user.fullName),
    productTitle: row.product.title,
    childName,
  };
}

const publicSelect = {
  id: true,
  rating: true,
  text: true,
  createdAt: true,
  user: { select: { fullName: true } },
  product: { select: { title: true } },
} as const;

/** Approved reviews, newest first. */
export async function getApprovedReviews(limit?: number): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { status: "approved" },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
    select: publicSelect,
  });
  return rows.map((r) => toPublic(r));
}

/** Approved reviews pinned to the homepage. */
export async function getFeaturedReviews(limit = 3): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { status: "approved", featured: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: publicSelect,
  });
  return rows.map((r) => toPublic(r));
}

export async function getProductReviews(productId: string): Promise<PublicReview[]> {
  const rows = await db.review.findMany({
    where: { productId, status: "approved" },
    orderBy: { createdAt: "desc" },
    select: publicSelect,
  });
  return rows.map((r) => toPublic(r));
}

export interface RatingSummary {
  count: number;
  /** Mean rating to one decimal, or null when there is nothing to average. */
  average: number | null;
}

/**
 * Rating aggregate for a product.
 *
 * Returns a null average rather than a placeholder when no reviews exist, so
 * callers are forced to render an honest empty state instead of "5.0".
 */
export async function getRatingSummary(productId: string): Promise<RatingSummary> {
  const result = await db.review.aggregate({
    where: { productId, status: "approved" },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const count = result._count._all;
  const avg = result._avg.rating;

  return {
    count,
    average: count > 0 && avg !== null ? Math.round(avg * 10) / 10 : null,
  };
}

/** Sitewide totals, used by the reviews page header. */
export async function getSiteRatingSummary(): Promise<RatingSummary> {
  const result = await db.review.aggregate({
    where: { status: "approved" },
    _count: { _all: true },
    _avg: { rating: true },
  });

  const count = result._count._all;
  const avg = result._avg.rating;

  return {
    count,
    average: count > 0 && avg !== null ? Math.round(avg * 10) / 10 : null,
  };
}

/**
 * Order lines the signed-in customer may still review.
 *
 * Scoped to their own completed orders, excluding anything already reviewed.
 */
export async function getReviewableItems(userId: string) {
  return db.orderItem.findMany({
    where: {
      order: { userId, orderStatus: "completed" },
      review: null,
      productId: { not: null },
    },
    orderBy: { order: { createdAt: "desc" } },
    select: {
      id: true,
      productTitle: true,
      personalization: { select: { childName: true } },
      order: { select: { id: true, orderNumber: true } },
    },
  });
}
