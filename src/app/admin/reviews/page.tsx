import Link from "next/link";
import { Star, Inbox } from "lucide-react";
import { db } from "@/lib/db";
import ReviewModeration from "@/components/admin/ReviewModeration";
import {
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONE,
  type ReviewStatus,
} from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Отзывы" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

/**
 * Moderation queue.
 *
 * Defaults to the pending tab, because that is the only view with work in it.
 * Authorization is enforced by the admin layout and again by every action.
 */
export default async function AdminReviewsPage({ searchParams }: Props) {
  const { status } = await searchParams;

  const active: ReviewStatus | "all" =
    status && (REVIEW_STATUSES as readonly string[]).includes(status)
      ? (status as ReviewStatus)
      : status === "all"
        ? "all"
        : "pending";

  const [reviews, counts] = await Promise.all([
    db.review.findMany({
      where: active === "all" ? {} : { status: active },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true } },
        product: { select: { title: true } },
        orderItem: {
          select: {
            order: { select: { orderNumber: true } },
            personalization: { select: { childName: true } },
          },
        },
      },
    }),
    db.review.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = (s: ReviewStatus) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;

  const tabs: { key: ReviewStatus | "all"; label: string; count: number | null }[] = [
    { key: "pending", label: REVIEW_STATUS_LABELS.pending, count: countFor("pending") },
    { key: "approved", label: REVIEW_STATUS_LABELS.approved, count: countFor("approved") },
    { key: "rejected", label: REVIEW_STATUS_LABELS.rejected, count: countFor("rejected") },
    { key: "all", label: "Все", count: null },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark">
        Отзывы
      </h1>
      <p className="mt-1.5 text-sm text-brown">
        Отзыв может оставить только покупатель после доставки заказа. До
        одобрения он не виден на сайте.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Фильтр отзывов">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/reviews?status=${tab.key}`}
            aria-current={active === tab.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              active === tab.key
                ? "bg-brown-dark text-white"
                : "bg-white text-brown-dark hover:bg-cream-200"
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="ml-1.5 opacity-70">{tab.count}</span>
            )}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-soft">
          <Inbox
            className="mx-auto h-10 w-10 text-cream-400"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <p className="mt-3 font-semibold text-brown-dark">
            {active === "pending"
              ? "Отзывов на модерации нет"
              : "В этом разделе пусто"}
          </p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-brown">
            Как только покупатель оставит отзыв по доставленному заказу, он
            появится здесь.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-2xl bg-white p-5 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p className="font-semibold text-brown-dark">
                    {review.user.fullName}
                    <span className="ml-2 font-normal text-brown">
                      {review.user.email}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-brown">
                    {review.product.title}
                    {review.orderItem?.order.orderNumber && (
                      <> · заказ {review.orderItem.order.orderNumber}</>
                    )}
                    {review.orderItem?.personalization?.childName && (
                      <> · имя ребёнка: {review.orderItem.personalization.childName}</>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center gap-0.5"
                    role="img"
                    aria-label={`Оценка ${review.rating} из 5`}
                  >
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        aria-hidden="true"
                        className={
                          i < review.rating
                            ? "h-4 w-4 fill-gold-300 text-gold-300"
                            : "h-4 w-4 fill-cream-200 text-cream-200"
                        }
                      />
                    ))}
                  </span>
                  <span
                    className={`badge ${REVIEW_STATUS_TONE[review.status as ReviewStatus]}`}
                  >
                    {REVIEW_STATUS_LABELS[review.status as ReviewStatus]}
                  </span>
                </div>
              </div>

              <blockquote className="mt-4 whitespace-pre-line rounded-xl bg-cream-50 p-4 text-[15px] leading-relaxed text-brown-dark">
                {review.text}
              </blockquote>

              <p className="mt-2 text-xs text-brown">
                {review.createdAt.toLocaleString("ru-RU")}
                {review.moderatedAt && (
                  <> · проверен {review.moderatedAt.toLocaleString("ru-RU")}</>
                )}
              </p>

              <div className="mt-4">
                <ReviewModeration
                  reviewId={review.id}
                  status={review.status as ReviewStatus}
                  featured={review.featured}
                  moderatorNote={review.moderatorNote ?? ""}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
