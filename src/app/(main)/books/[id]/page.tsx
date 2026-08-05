import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Sparkles, PenLine, ScanFace, Truck, Star } from "lucide-react";
import { bookIncludes } from "@/data/books";
import { formatPrice } from "@/lib/utils";
import { mockFAQ } from "@/data/mock";
import TestimonialCard from "@/components/shared/TestimonialCard";
import { getProductReviews, getRatingSummary } from "@/lib/reviews";
import BookCover from "@/components/books/BookCover";
import BookCard from "@/components/books/BookCard";
import FAQAccordion from "@/components/shared/FAQAccordion";
import Reveal from "@/components/shared/Reveal";
import ProductGallery from "@/components/books/ProductGallery";
import { getBookBySlugOrId, getPublishedProducts, getProductGallery } from "@/lib/products";

interface Props {
  params: Promise<{ id: string }>;
}

// Content is editable in the admin panel, so pages render per request
// rather than being frozen at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const book = await getBookBySlugOrId(id);
  if (!book) return {};

  return {
    title: book.title,
    description: book.shortDescription,
    openGraph: {
      title: book.title,
      description: book.shortDescription,
      images: [{ url: book.image, width: 1254, height: 1254, alt: book.title }],
      type: "website",
    },
  };
}

const personalizationPoints = [
  { icon: PenLine, text: "Имя ребёнка встречается в тексте истории" },
  { icon: ScanFace, text: "Лицо ребёнка появляется в иллюстрациях" },
  { icon: Sparkles, text: "Персональное посвящение на первой странице" },
];

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;
  const book = await getBookBySlugOrId(id);
  if (!book) notFound();

  const allBooks = await getPublishedProducts();
  const otherBook = allBooks.find((b) => b.id !== book.id);
  const gallery = await getProductGallery(book.slug);

  // Approved reviews only. An empty list renders no section at all rather
  // than a rating placeholder.
  const [reviews, rating] = await Promise.all([
    getProductReviews(book.id),
    getRatingSummary(book.id),
  ]);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: book.title,
    description: book.shortDescription,
    image: book.image,
    brand: { "@type": "Brand", name: "Капибара" },
    offers: {
      "@type": "Offer",
      price: book.price,
      priceCurrency: book.currency,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* ── Product ── */}
      <section className="bg-gradient-to-b from-cream-100 to-parchment pb-16 pt-8 md:pb-20">
        <div className="page-container">
          <nav
            aria-label="Хлебные крошки"
            className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-brown-300"
          >
            <Link href="/" className="transition-colors hover:text-brown">
              Главная
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link href="/catalog" className="transition-colors hover:text-brown">
              Каталог
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <span className="text-brown">{book.shortTitle}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            {/* Photographs of the printed book, or the cover when a product
                has no gallery yet. */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              {gallery.length > 0 ? (
                <>
                  <ProductGallery
                    images={gallery.map((img) => ({
                      id: img.id,
                      url: img.url,
                      alt: img.alt,
                    }))}
                  />
                  <p className="mt-4 text-center text-sm text-brown-300">
                    Настоящие фотографии напечатанной книги
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-4xl bg-white p-6 shadow-card sm:p-10">
                    <BookCover book={book} size="lg" priority glow />
                  </div>
                  <p className="mt-4 text-center text-sm text-brown-300">
                    Настоящая обложка книги — именно её вы получите
                  </p>
                </>
              )}
            </div>

            {/* Details */}
            <div>
              <span className="eyebrow">{book.ageRange}</span>

              <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.12] text-brown-dark sm:text-4xl lg:text-[2.9rem]">
                {book.title}
              </h1>

              <p className="mt-5 text-lg leading-relaxed text-brown">
                {book.shortDescription}
              </p>

              <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-4xl font-extrabold text-brown-dark">
                  {formatPrice(book.price)}
                </span>
                <span className="text-[15px] text-brown-300">
                  {book.pageCount} страниц · твёрдая обложка
                </span>
              </div>

              <Link
                href={`/personalize/${book.slug}`}
                className="btn-primary mt-8 w-full py-4 text-base sm:w-auto sm:px-10"
              >
                Создать эту книгу
              </Link>

              <p className="mt-3 text-sm text-brown-300">
                Стоимость и срок доставки рассчитываются при оформлении заказа.
              </p>

              {/* What's inside */}
              <div className="mt-10 rounded-4xl bg-white p-7 shadow-soft">
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  Что входит в книгу
                </h2>
                <ul className="mt-5 space-y-3">
                  {bookIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-500">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-brown">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Story */}
              <div className="mt-8">
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  Об истории
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-brown">
                  {book.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How personalization works ── */}
      <section className="bg-white py-16 md:py-20">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="section-title">Как книга становится персональной</h2>
            <p className="section-subtitle">
              После загрузки фотографии вы увидите предварительный макет и
              сможете проверить данные перед заказом.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            {personalizationPoints.map(({ icon: Icon, text }, i) => (
              <Reveal key={text} delay={i * 90}>
                <div className="flex h-full flex-col items-center gap-4 rounded-4xl bg-cream-100 p-7 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-500">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <p className="text-[15px] leading-relaxed text-brown">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Delivery ── */}
      <section className="py-16 md:py-20">
        <div className="page-container">
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-4 rounded-4xl bg-cream-100 px-8 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600">
              <Truck className="h-6 w-6" strokeWidth={1.8} />
            </span>
            <h2 className="font-display text-xl font-extrabold text-brown-dark">
              Печать и доставка
            </h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-brown">
              Каждая книга печатается отдельно под ваш заказ. Стоимость и срок
              доставки рассчитываются при оформлении заказа — они зависят от
              вашего города.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section className="bg-cream-100 py-16 md:py-20">
          <div className="page-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">Отзывы о книге</h2>
              {rating.average !== null && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-soft">
                  <Star
                    className="h-5 w-5 fill-gold-300 text-gold-300"
                    aria-hidden="true"
                  />
                  <span className="font-display text-lg font-extrabold text-brown-dark">
                    {rating.average.toLocaleString("ru-RU", {
                      minimumFractionDigits: 1,
                    })}
                  </span>
                  <span className="text-sm text-brown">
                    {rating.count}{" "}
                    {rating.count === 1
                      ? "отзыв"
                      : rating.count < 5
                        ? "отзыва"
                        : "отзывов"}
                  </span>
                </p>
              )}
            </Reveal>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, 6).map((review, i) => (
                <Reveal key={review.id} delay={(i % 3) * 90}>
                  <TestimonialCard
                    review={{
                      id: review.id,
                      rating: review.rating,
                      text: review.text,
                      authorName: review.authorName,
                      createdAt: review.createdAt,
                    }}
                  />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      <section className="pb-16 md:pb-24">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center">
              <h2 className="section-title">Частые вопросы</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <FAQAccordion items={mockFAQ.slice(0, 4)} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The other story ── */}
      {otherBook && (
        <section className="bg-cream-100 py-16 md:py-24">
          <div className="page-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">Вторая история</h2>
            </Reveal>
            <Reveal delay={100} className="mx-auto mt-10 max-w-md">
              <BookCard book={otherBook} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Mobile sticky CTA ── */}
      <div className="sticky bottom-0 z-40 border-t border-cream-300 bg-parchment/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-none text-brown-dark">
              {formatPrice(book.price)}
            </p>
            <p className="mt-1 truncate text-xs text-brown-300">{book.shortTitle}</p>
          </div>
          <Link
            href={`/personalize/${book.slug}`}
            className="btn-primary ml-auto shrink-0 px-6 py-3 text-[15px]"
          >
            Создать книгу
          </Link>
        </div>
      </div>
    </>
  );
}
