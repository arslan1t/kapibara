import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { Heart, Printer, ShieldCheck, Sparkles } from "lucide-react";
import BookCover from "@/components/books/BookCover";
import Reveal from "@/components/shared/Reveal";
import SectionDivider from "@/components/shared/SectionDivider";
import { getPublishedProducts } from "@/lib/products";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/format";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return { title: t.about.metaTitle, description: t.about.metaDescription };
}

// Book covers are read from the database, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function AboutPage({
  params,
}: {
  params: Promise<LangParams>;
}) {
  const locale = localeFromSegment((await params).lang);
  const t = getDictionary(locale);
  const catalogue = await getPublishedProducts(locale);
  // Two covers, overlapped. See the note in how-it-works: the arrangement only
  // works for a pair, and the catalogue is far longer than that now.
  const stack = catalogue.slice(0, 2);

  const values = [
    { icon: Heart, title: t.about.value1Title, text: t.about.value1Text },
    { icon: Printer, title: t.about.value2Title, text: t.about.value2Text },
    { icon: ShieldCheck, title: t.about.value3Title, text: t.about.value3Text },
  ];

  return (
    <>
      {/* ── Intro ── */}
      <section className="bg-gradient-to-b from-cream-100 to-parchment py-16 md:py-24">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
              {t.about.eyebrow}
            </span>
            <h1 className="section-title mt-5">
              {t.about.heading}
            </h1>
            <p className="section-subtitle">
{t.about.lead}
            </p>
          </Reveal>

          <Reveal delay={140} className="mx-auto mt-14 max-w-3xl">
            <div className="flex items-center justify-center">
              {stack.map((book, i) => (
                <div
                  key={book.id}
                  className={
                    i === 0
                      ? "w-[46%] -rotate-3"
                      : "relative z-10 -ml-8 w-[46%] rotate-3"
                  }
                >
                  <BookCover book={book} size="sm" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Why ── */}
      <section className="py-16 md:py-24">
        <div className="page-container">
          <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2 md:gap-14">
            <Reveal>
              <h2 className="font-display text-2xl font-extrabold leading-snug text-brown-dark">
                {t.about.whyHeading}
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="space-y-4 text-[15px] leading-relaxed text-brown">
                <p>
{t.about.whyFirst}
                </p>
                <p>
{fill(t.about.whySecond, { count: catalogue.length })}
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <SectionDivider variant="cloud" className="text-cream-100" height="md" />
      </section>

      {/* ── Values ── */}
      <section className="relative bg-cream-100 py-16 pb-28 md:py-24 md:pb-36">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="section-title">{t.about.valuesHeading}</h2>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-3">
            {values.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="flex h-full flex-col gap-4 rounded-4xl bg-white p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-brand-500">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <h3 className="font-display text-lg font-extrabold text-brown-dark">
                    {title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-brown">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <SectionDivider variant="wave" className="text-parchment" height="md" />
      </section>

      {/* ── CTA ── */}
      <section className="py-16 md:py-24">
        <div className="page-container">
          <Reveal className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-4xl bg-brand-600 px-8 py-14 text-center">
            <h2 className="font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl">
              {t.about.ctaHeading}
            </h2>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full bg-gold-300 px-8 py-4 text-base font-bold text-brown-dark transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-200"
            >
              {t.about.ctaButton}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
