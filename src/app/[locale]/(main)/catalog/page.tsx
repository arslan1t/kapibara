import type { Metadata } from "next";
import BookCard from "@/components/books/BookCard";
import Reveal from "@/components/shared/Reveal";
import { getPublishedProducts } from "@/lib/products";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return { title: t.catalog.metaTitle, description: t.catalog.metaDescription };
}

// The catalogue reflects what an administrator has published, so it must not
// be cached at build time.
export const dynamic = "force-dynamic";

export default async function CatalogPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const catalogue = await getPublishedProducts(locale);
  return (
    <div className="pb-24 pt-14 md:pb-32 md:pt-20">
      <div className="page-container">
        {/* ── Heading ── */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t.catalog.eyebrow}</span>
          <h1 className="section-title mt-5">{t.catalog.heading}</h1>
          <p className="section-subtitle">
{t.catalog.subheading}
          </p>
        </Reveal>

        {/* ── The two books ── */}
        <div className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2 md:mt-16">
          {catalogue.map((book, i) => (
            <Reveal key={book.id} delay={i * 90}>
              <BookCard book={book} priority={i === 0} className="h-full" />
            </Reveal>
          ))}
        </div>

        {/* ── Quiet note about what's next ── */}
        <Reveal className="mx-auto mt-20 max-w-3xl rounded-4xl bg-cream-100 px-8 py-10 text-center md:mt-24">
          <h2 className="font-display text-xl font-extrabold text-brown-dark sm:text-2xl">
            {t.catalog.upcomingHeading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-brown">
            {t.catalog.upcomingLead}
          </p>
          <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-[15px] text-brown">
            {t.upcomingStories.map((story) => (
              <li key={story} className="flex items-center justify-center gap-2.5">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand-200" />
                {story}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </div>
  );
}
