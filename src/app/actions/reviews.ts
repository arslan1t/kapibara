"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import {
  REVIEW_MIN_LENGTH,
  REVIEW_MAX_LENGTH,
  REVIEW_STATUSES,
  REVIEWABLE_ORDER_STATUSES,
  type ReviewStatus,
} from "@/lib/constants";
import { rateLimit, rateLimitMessage } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/audit";

export type ReviewResult = { ok: true } | { ok: false; error: string };

const DENIED = "Недостаточно прав для этого действия";

/**
 * Submits a review for a delivered book.
 *
 * The gate is ownership of a completed order line, checked here and not in the
 * browser: a review that anyone could post would be worthless, and inventing
 * social proof is exactly what this project must not do.
 */
export async function submitReview(input: {
  orderItemId: string;
  rating: number;
  text: string;
}): Promise<ReviewResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Войдите в аккаунт" };

  const rating = Math.trunc(Number(input.rating));
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Поставьте оценку от 1 до 5" };
  }

  const text = (input.text ?? "").trim();
  if (text.length < REVIEW_MIN_LENGTH) {
    return {
      ok: false,
      error: `Расскажите чуть подробнее — не менее ${REVIEW_MIN_LENGTH} символов`,
    };
  }
  if (text.length > REVIEW_MAX_LENGTH) {
    return {
      ok: false,
      error: `Отзыв слишком длинный — не более ${REVIEW_MAX_LENGTH} символов`,
    };
  }

  const limited = await rateLimit("review", user.id);
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter) };
  }

  // The order line must exist, belong to this user, and be delivered.
  const item = await db.orderItem.findUnique({
    where: { id: input.orderItemId },
    select: {
      id: true,
      productId: true,
      order: { select: { userId: true, orderStatus: true } },
    },
  });

  if (!item || item.order.userId !== user.id) {
    // Same message for "not yours" and "does not exist", so this cannot be
    // used to probe which order ids are real.
    return { ok: false, error: "Заказ не найден" };
  }
  if (!item.productId) {
    return { ok: false, error: "Этот товар больше нельзя оценить" };
  }
  if (
    !(REVIEWABLE_ORDER_STATUSES as readonly string[]).includes(
      item.order.orderStatus
    )
  ) {
    return {
      ok: false,
      error: "Оставить отзыв можно после того, как заказ будет завершён",
    };
  }

  const existing = await db.review.findUnique({
    where: { orderItemId: item.id },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Вы уже оставили отзыв на этот заказ" };
  }

  try {
    await db.review.create({
      data: {
        userId: user.id,
        productId: item.productId,
        orderItemId: item.id,
        rating,
        text,
        // Nothing appears on the site until a person has read it.
        status: "pending",
      },
    });

    revalidatePath("/account/orders");
    revalidatePath("/admin/reviews");
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось сохранить отзыв. Попробуйте ещё раз" };
  }
}

// ─── Moderation ───────────────────────────────────────────────────────────────

/** Approves, rejects or re-queues a review. Administrators only. */
export async function moderateReview(
  reviewId: string,
  status: string,
  moderatorNote?: string
): Promise<ReviewResult> {
  const actor = await getCurrentUser();
  if (!actor || !(await isAdmin())) return { ok: false, error: DENIED };

  if (!(REVIEW_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: "Неизвестный статус отзыва" };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true },
  });
  if (!review) return { ok: false, error: "Отзыв не найден" };

  await db.review.update({
    where: { id: reviewId },
    data: {
      status: status as ReviewStatus,
      moderatorNote: moderatorNote?.trim() || null,
      moderatedAt: new Date(),
      // A rejected review cannot stay featured.
      ...(status === "approved" ? {} : { featured: false }),
    },
  });

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "review.moderated",
    targetType: "review",
    targetId: reviewId,
    // The decision, not the review text — the log is not a second copy of what
    // the customer wrote.
    summary: status,
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true };
}

/** Pins an approved review to the homepage. */
export async function toggleReviewFeatured(
  reviewId: string,
  featured: boolean
): Promise<ReviewResult> {
  const actor = await getCurrentUser();
  if (!actor || !(await isAdmin())) return { ok: false, error: DENIED };

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { status: true },
  });
  if (!review) return { ok: false, error: "Отзыв не найден" };

  // Featuring an unapproved review would publish it without moderation.
  if (featured && review.status !== "approved") {
    return { ok: false, error: "Сначала одобрите отзыв" };
  }

  await db.review.update({ where: { id: reviewId }, data: { featured } });

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "review.featured_changed",
    targetType: "review",
    targetId: reviewId,
    summary: featured ? "pinned" : "unpinned",
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
  return { ok: true };
}
