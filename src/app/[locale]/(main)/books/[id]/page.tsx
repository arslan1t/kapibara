import { notFound } from "next/navigation";
import Link from "@/i18n/navigation";
import type { Metadata } from "next";
import { ChevronRight, Sparkles, PenLine, ScanFace, Truck, Star } from "lucide-react";
import Price from "@/components/shared/Price";
import { BOOK_PAGE_COUNT } from "@/data/books";
import TestimonialCard from "@/components/shared/TestimonialCard";
import { getProductReviews, getRatingSummary } from "@/lib/reviews";
import BookCover from "@/components/books/BookCover";
import BookCard from "@/components/books/BookCard";
import FAQAccordion from "@/components/shared/FAQAccordion";
import Reveal from "@/components/shared/Reveal";
import ProductGallery from "@/components/books/ProductGallery";
import { getBookBySlugOrId, getPublishedProducts, getProductGallery } from "@/lib/products";
import { asLocale, LOCALE_CONFIG, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill, formatNumber, plural } from "@/i18n/format";

interface Props {
  params: Promise<LocaleParams & { id: string }>;
}

// Content is editable in the admin panel, so pages render per request
// rather than being frozen at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale: raw } = await params;
  const locale = asLocale(raw);
  const book = await getBookBySlugOrId(id, locale);
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

export default async function BookDetailPage({ params }: Props) {
  const { id, locale: raw } = await params;
  const locale = asLocale(raw);
  const t = getDictionary(locale);
  const book = await getBookBySlugOrId(id, locale);
  if (!book) notFound();

  const personalizationPoints = [
    { icon: PenLine, text: t.book.personalizationName },
    { icon: ScanFace, text: t.book.personalizationFace },
    { icon: Sparkles, text: t.book.personalizationDedication },
  ];

  const allBooks = await getPublishedProducts(locale);
  // Three, not "the other one": there were two books when this was written and
  // there are eighteen now.
  const otherBooks = allBooks.filter((b) => b.id !== book.id).slice(0, 3);
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
    brand: { "@type": "Brand", name: t.common.brand },
    // A book with no price in this market has no offer to describe. Emitting
    // one with a null price is worse than emitting none: it is a structured,
    // machine-read claim that the book is available for nothing.
    ...(book.price !== null
      ? {
          offers: {
            "@type": "Offer",
            price: book.price,
            priceCurrency: book.currency,
            availability: book.available
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            areaServed: LOCALE_CONFIG[locale].region,
          },
        }
      : {}),
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
            aria-label={t.book.breadcrumbAria}
            className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-brown-300"
          >
            <Link href="/" className="transition-colors hover:text-brown">
              {t.nav.home}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            <Link href="/catalog" className="transition-colors hover:text-brown">
              {t.nav.catalog}
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
                    {t.book.galleryCaption}
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-4xl bg-white p-6 shadow-card sm:p-10">
                    <BookCover book={book} size="lg" priority glow />
                  </div>
                  <p className="mt-4 text-center text-sm text-brown-300">
                    {t.book.coverCaption}
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
                  <Price amount={book.price} />
                </span>
                <span className="text-[15px] text-brown-300">
                  {fill(t.common.pagesAndCover, { pages: book.pageCount })}
                </span>
              </div>

              <Link
                href={`/personalize/${book.slug}`}
                className="btn-primary mt-8 w-full py-4 text-base sm:w-auto sm:px-10"
              >
                {t.book.create}
              </Link>

              <p className="mt-3 text-sm text-brown-300">
                {t.book.deliveryNote}
              </p>

              {/* What's inside */}
              <div className="mt-10 rounded-4xl bg-white p-7 shadow-soft">
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  {t.book.includesHeading}
                </h2>
                <ul className="mt-5 space-y-3">
                  {t.bookIncludes.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-500">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                      </span>
                      <span className="text-[15px] leading-relaxed text-brown">
                        {fill(item, { pages: BOOK_PAGE_COUNT })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Story */}
              <div className="mt-8">
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  {t.book.storyHeading}
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
            <h2 className="section-title">{t.book.personalizationHeading}</h2>
            <p className="section-subtitle">
{t.book.personalizationLead}
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
              {t.book.printHeading}
            </h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-brown">
{t.book.printBody}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Reviews ── */}
      {reviews.length > 0 && (
        <section className="bg-cream-100 py-16 md:py-20">
          <div className="page-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">{t.book.reviewsHeading}</h2>
              {rating.average !== null && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 shadow-soft">
                  <Star
                    className="h-5 w-5 fill-gold-300 text-gold-300"
                    aria-hidden="true"
                  />
                  <span className="font-display text-lg font-extrabold text-brown-dark">
{formatNumber(rating.average, locale)}
                  </span>
                  <span className="text-sm text-brown">
                    {plural(rating.count, t.book.reviewCount, locale)}
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
              <h2 className="section-title">{t.book.faqHeading}</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <FAQAccordion items={t.faq.slice(0, 4)} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── The other story ── */}
      {otherBooks.length > 0 && (
        <section className="bg-cream-100 py-16 md:py-24">
          <div className="page-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="section-title">{t.book.otherStoriesHeading}</h2>
            </Reveal>
            <div className="mx-auto mt-10 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {otherBooks.map((other, i) => (
                <Reveal key={other.id} delay={i * 90}>
                  <BookCard book={other} className="h-full" />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Mobile sticky CTA ── */}
      <div className="sticky bottom-0 z-40 border-t border-cream-300 bg-parchment/95 px-5 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold leading-none text-brown-dark">
              <Price amount={book.price} />
            </p>
            <p className="mt-1 truncate text-xs text-brown-300">{book.shortTitle}</p>
          </div>
          <Link
            href={`/personalize/${book.slug}`}
            className="btn-primary ml-auto shrink-0 px-6 py-3 text-[15px]"
          >
            {t.book.createShort}
          </Link>
        </div>
      </div>
    </>
  );
}
