import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import {
  BookOpenCheck,
  PenLine,
  Camera,
  PackageOpen,
  Check,
  ShieldCheck,
} from "lucide-react";
import BookCover from "@/components/books/BookCover";
import Reveal from "@/components/shared/Reveal";
import SectionDivider from "@/components/shared/SectionDivider";
import StoryVideoHero from "@/components/media/StoryVideoHero";
import { BOOK_PAGE_COUNT } from "@/data/books";
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
  return {
    title: t.howItWorks.metaTitle,
    description: t.howItWorks.metaDescription,
  };
}

// Book covers are read from the database, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<LangParams>;
}) {
  const locale = localeFromSegment((await params).lang);
  const t = getDictionary(locale);
  const catalogue = await getPublishedProducts(locale);
  const heroBook = catalogue.find((b) => b.available) ?? catalogue[0];
  // Two covers, layered like books on a table. The catalogue has grown well
  // past the pair this arrangement was drawn for; rendering all of it turned
  // the illustration into a ribbon of thumbnails.
  const stack = catalogue.slice(0, 2);

  const steps = [
    { icon: BookOpenCheck, title: t.howItWorks.step1Title, text: t.howItWorks.step1Text },
    { icon: PenLine, title: t.howItWorks.step2Title, text: t.howItWorks.step2Text },
    { icon: Camera, title: t.howItWorks.step3Title, text: t.howItWorks.step3Text },
    { icon: PackageOpen, title: t.howItWorks.step4Title, text: t.howItWorks.step4Text },
  ];

  return (
    <>
      {/* ── Intro with the story film ── */}
      <section className="bg-gradient-to-b from-cream-100 to-parchment py-14 md:py-20">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{t.howItWorks.eyebrow}</span>
            <h1 className="section-title mt-5">{t.howItWorks.heading}</h1>
            <p className="section-subtitle">
{t.howItWorks.lead}
            </p>
          </Reveal>

          <Reveal delay={140} className="mx-auto mt-12 max-w-4xl">
            <StoryVideoHero
              src="/videos/hero-story.mp4"
              label={t.home.videoLabel}
              className="shadow-elevated ring-1 ring-white/60"
              fallback={
                <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-200 via-cream-100 to-gold-100">
                  <div className="w-[46%] max-w-[360px]">
                    <BookCover book={heroBook} size="md" priority />
                  </div>
                </div>
              }
            />
          </Reveal>
        </div>
      </section>

      {/* ── Steps, alternating ── */}
      <section className="relative py-16 pb-28 md:py-24 md:pb-36">
        <div className="page-container">
          <ol className="mx-auto flex max-w-4xl flex-col gap-14 md:gap-20">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 60}>
                <div
                  className={
                    i % 2 === 1
                      ? "flex flex-col items-center gap-8 md:flex-row-reverse md:gap-14"
                      : "flex flex-col items-center gap-8 md:flex-row md:gap-14"
                  }
                >
                  <div className="relative shrink-0">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-cream-100 text-brand-600">
                      <Icon className="h-12 w-12" strokeWidth={1.5} />
                    </div>
                    <span className="absolute -right-1 -top-1 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-extrabold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className={i % 2 === 1 ? "md:text-right" : ""}>
                    <h2 className="font-display text-2xl font-extrabold text-brown-dark">
                      {title}
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-brown">{text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <SectionDivider variant="cloud" className="text-cream-100" height="md" />
      </section>

      {/* ── Photo guidance ── */}
      <section className="relative bg-cream-100 py-16 pb-28 md:py-24 md:pb-36">
        <div className="page-container">
          <div className="mx-auto grid max-w-4xl items-center gap-12 md:grid-cols-2">
            <Reveal>
              <h2 className="section-title">{t.howItWorks.photoHeading}</h2>
              <p className="section-subtitle">
{t.howItWorks.photoLead}
              </p>
              <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm leading-relaxed text-brown">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-sage-500"
                  strokeWidth={2}
                />
{t.howItWorks.photoPrivacy}
              </p>
            </Reveal>

            <Reveal delay={120}>
              <ul className="grid gap-3">
                {t.photoTips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-[15px] text-brown"
                  >
                    <Check className="h-4 w-4 shrink-0 text-sage-500" strokeWidth={2.4} />
                    {tip}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <SectionDivider variant="wave" className="text-parchment" height="md" />
      </section>

      {/* ── What arrives ── */}
      <section className="py-16 md:py-24">
        <div className="page-container">
          <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative flex items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute inset-8 rounded-full bg-gold-200/35 blur-3xl"
                />
                {stack.map((book, i) => (
                  <div
                    key={book.id}
                    className={
                      i === 0
                        ? "relative w-[48%] -rotate-3"
                        : "relative z-10 -ml-8 w-[48%] rotate-3"
                    }
                  >
                    <BookCover book={book} size="sm" />
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="section-title">{t.howItWorks.receiveHeading}</h2>
              <p className="section-subtitle">
{fill(t.howItWorks.receiveLead, { pages: BOOK_PAGE_COUNT })}
              </p>
              <ul className="mt-8 space-y-3">
                {t.bookIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-sage-500"
                      strokeWidth={2.4}
                    />
                    <span className="text-[15px] leading-relaxed text-brown">
                      {fill(item, { pages: BOOK_PAGE_COUNT })}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/catalog" className="btn-primary mt-9 text-base">
                {t.howItWorks.receiveCta}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
