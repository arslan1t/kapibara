import Link from "next/link";
import Image from "next/image";
import {
  BookHeart,
  Camera,
  Layers,
  Sparkles,
  PenLine,
  ScanFace,
  BookOpenCheck,
  PackageOpen,
} from "lucide-react";
import BookCard from "@/components/books/BookCard";
import TestimonialCard from "@/components/shared/TestimonialCard";
import FAQAccordion from "@/components/shared/FAQAccordion";
import Reveal from "@/components/shared/Reveal";
import SectionDivider from "@/components/shared/SectionDivider";
import Mascot from "@/components/shared/Mascot";
import StoryVideoHero from "@/components/media/StoryVideoHero";
import { mockFAQ } from "@/data/mock";
import { getFeaturedReviews } from "@/lib/reviews";
import { BOOK_PAGE_COUNT, bookIncludes } from "@/data/books";
import { getPublishedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";

const trustPoints = [
  { icon: PenLine, label: "Имя ребёнка в истории" },
  { icon: ScanFace, label: "Фото в иллюстрациях" },
  { icon: Layers, label: "Плотная бумага, твёрдый переплёт" },
  { icon: BookHeart, label: `${BOOK_PAGE_COUNT} иллюстрированных страниц` },
];

const steps = [
  {
    icon: BookOpenCheck,
    title: "Выберите историю",
    text: "Две сказки о Колёсике — для мальчика и для девочки.",
  },
  {
    icon: PenLine,
    title: "Добавьте имя и фотографию",
    text: "Имя войдёт в текст, а лицо ребёнка — в иллюстрации.",
  },
  {
    icon: Camera,
    title: "Проверьте превью",
    text: "Покажем предварительный макет — вы всё проверите до заказа.",
  },
  {
    icon: PackageOpen,
    title: "Получите книгу",
    text: "Печатаем и отправляем настоящую книгу в твёрдой обложке.",
  },
];

// Prices, availability and the book line-up all come from the database, so the
// homepage reflects whatever an administrator has published.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalogue, featuredReviews] = await Promise.all([
    getPublishedProducts(),
    // Only approved reviews an administrator pinned. No reviews yet means
    // the section is skipped entirely rather than filled with invented ones.
    getFeaturedReviews(3),
  ]);

  // Buyable books first (that is the order getPublishedProducts returns), so
  // the hero always leads with something a visitor can actually order.
  const heroBook = catalogue.find((b) => b.available) ?? catalogue[0];
  const secondCover = catalogue.find((b) => b.id !== heroBook?.id);

  // Nothing published yet — the storefront has no product to show.
  if (!heroBook) return <EmptyCatalogueNotice />;

  return (
    <>
      {/* ══════════════════════════════════════════════ HERO */}
      <section className="paper-texture relative overflow-hidden bg-gradient-to-b from-brand-100 via-cream-100 to-parchment pb-28 md:pb-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-brand-200/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 top-40 h-[26rem] w-[26rem] rounded-full bg-gold-200/25 blur-3xl"
        />

        <div className="page-container relative py-14 md:py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            {/* ── Copy (below the film on mobile: the footage explains the
                 product faster than any headline can) ── */}
            <div className="order-2 lg:order-1">
              <Reveal>
                <span className="eyebrow">
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Персональная сказка о вашем ребёнке
                </span>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-6 font-display text-[2.4rem] font-extrabold leading-[1.08] text-brown-dark sm:text-5xl lg:text-[3.4rem]">
                  Ваш ребёнок становится{" "}
                  <span className="text-brand-500">героем настоящей книги</span>
                </h1>
              </Reveal>

              <Reveal delay={150}>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-brown">
                  Добавьте имя и фотографию — мы создадим волшебную историю
                  с вашим ребёнком на каждой странице.
                </p>
              </Reveal>

              <Reveal delay={220}>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link href="/catalog" className="btn-primary text-base">
                    Создать свою книгу
                  </Link>
                  <Link href="/catalog" className="btn-secondary text-base">
                    Посмотреть книги
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={290}>
                <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-3xl font-extrabold text-brown-dark">
                    {formatPrice(heroBook.price)}
                  </span>
                  <span className="text-[15px] text-brown">
                    Персональная обложка · {BOOK_PAGE_COUNT} иллюстрированных страниц ·
                    твёрдый переплёт
                  </span>
                </div>
              </Reveal>
            </div>

            {/* ── Story video ── */}
            <Reveal delay={120} className="order-1 lg:order-2">
              <StoryVideoHero
                src="/videos/hero-story.mp4"
                label="Фотография ребёнка превращается в иллюстрацию, а затем в напечатанную книгу"
                className="shadow-elevated ring-1 ring-white/60"
                fallback={
                  <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-200 via-brand-100 to-cream-100">
                    <Image
                      src={heroBook.image}
                      alt={`Обложка книги «${heroBook.title}»`}
                      width={520}
                      height={520}
                      priority
                      className="h-[86%] w-auto object-contain drop-shadow-2xl"
                    />
                  </div>
                }
              />
            </Reveal>
          </div>
        </div>

        <SectionDivider variant="wave" className="text-white" height="md" />
      </section>

      {/* ══════════════════════════════════════════════ TRUST STRIP */}
      <section className="relative bg-white pb-16 md:pb-20">
        <div className="page-container py-8 md:py-10">
          <ul className="grid grid-cols-1 gap-x-6 gap-y-5 min-[420px]:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-500">
                  <Icon className="h-[21px] w-[21px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 text-[15px] font-semibold leading-snug text-brown-dark">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <SectionDivider variant="hill" className="text-parchment" height="sm" />
      </section>

      {/* ══════════════════════════════════════════════ BOOKS */}
      <section className="relative overflow-hidden bg-parchment py-20 pb-40 md:py-28 md:pb-52">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Выберите приключение</span>
            <h2 className="section-title mt-5">
              История, в которой главный герой — ваш ребёнок
            </h2>
          </Reveal>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 sm:grid-cols-2">
            {catalogue.map((book, i) => (
              <Reveal key={book.id} delay={i * 90}>
                <BookCard book={book} className="h-full" />
              </Reveal>
            ))}
          </div>
        </div>

        {/* Curtain rising into the blue chapter */}
        <SectionDivider variant="arch" className="text-brand-600" height="lg" />
      </section>

      {/* ══════════════════════════════════════════════ HOW IT WORKS */}
      <section className="relative overflow-hidden bg-brand-600 py-20 pb-40 text-white md:py-28 md:pb-52">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-300/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold-300/15 blur-3xl"
        />

        <div className="page-container relative">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white">
              Как это работает
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl md:text-[2.75rem]">
              Четыре шага до вашей книги
            </h2>
          </Reveal>

          <ol className="relative mt-14 grid gap-10 md:mt-16 md:grid-cols-4 md:gap-6">
            {/* Dotted trail linking the steps on desktop */}
            <div
              aria-hidden="true"
              className="absolute left-0 right-0 top-8 hidden border-t-2 border-dashed border-white/30 md:block"
            />

            {steps.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 100} className="relative">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-parchment text-brand-600 shadow-[0_10px_28px_rgba(0,0,0,0.18)]">
                  <Icon className="h-7 w-7" strokeWidth={1.7} />
                  <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold-300 font-display text-sm font-extrabold text-brown-dark">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-lg font-extrabold text-white">
                  {title}
                </h3>
                <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-brand-100">
                  {text}
                </p>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={200} className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
            <Mascot variant={1} float className="w-40 shrink-0 sm:w-48" />
            <p className="max-w-md text-center text-[15px] leading-relaxed text-brand-100/90 sm:text-left">
              После загрузки фотографии вы увидите предварительный макет и
              сможете проверить данные перед заказом.
            </p>
          </Reveal>
        </div>

        <SectionDivider variant="hill" className="text-parchment" height="lg" />
      </section>

      {/* ══════════════════════════════════════════════ WHAT YOU RECEIVE */}
      <section className="relative bg-parchment py-20 pb-36 md:py-28 md:pb-44">
        <div className="page-container">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-6 rounded-full bg-brand-200/40 blur-3xl"
                />
                {/* Two covers, layered like books on a table */}
                <div className="relative flex items-center justify-center">
                  {secondCover && (
                    <Image
                      src={secondCover.image}
                      alt=""
                      aria-hidden="true"
                      width={420}
                      height={420}
                      className="w-[52%] -rotate-6 rounded-2xl drop-shadow-2xl"
                    />
                  )}
                  <Image
                    src={heroBook.image}
                    alt={`Обложка книги «${heroBook.title}»`}
                    width={460}
                    height={460}
                    className={`w-[58%] rotate-3 rounded-2xl drop-shadow-2xl ${
                      secondCover ? "-ml-14" : ""
                    }`}
                  />
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <span className="eyebrow">Что вы получите</span>
              <h2 className="section-title mt-5">Настоящая книга, а не файл</h2>
              <p className="section-subtitle">
                Мы печатаем и переплетаем каждый экземпляр отдельно — это
                книга, которую можно поставить на полку и перечитывать годами.
              </p>

              <ul className="mt-8 space-y-3.5">
                {bookIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-500">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="text-[15px] leading-relaxed text-brown">{item}</span>
                  </li>
                ))}
              </ul>

              <Link href="/catalog" className="btn-primary mt-9 text-base">
                Создать свою книгу
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Puffy cloud edge floating into the reviews */}
        <SectionDivider variant="cloud" className="text-cream-100" height="md" />
      </section>

      {/* ══════════════════════════════════════════════ REVIEWS */}
      {featuredReviews.length > 0 && (
        <section className="relative bg-cream-100 py-20 pb-36 md:py-28 md:pb-44">
          <div className="page-container">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Отзывы</span>
              <h2 className="section-title mt-5">Что говорят родители</h2>
              <p className="mt-4 text-[15px] text-brown">
                Отзывы покупателей, получивших книгу.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {featuredReviews.map((review, i) => (
                <Reveal key={review.id} delay={i * 90}>
                  <TestimonialCard
                    review={{
                      id: review.id,
                      rating: review.rating,
                      text: review.text,
                      authorName: review.authorName,
                      productTitle: review.productTitle,
                      createdAt: review.createdAt,
                    }}
                  />
                </Reveal>
              ))}
            </div>

            <Reveal delay={200} className="mt-10 text-center">
              <Link
                href="/reviews"
                className="text-[15px] font-bold text-brand-500 underline-offset-4 hover:underline"
              >
                Все отзывы
              </Link>
            </Reveal>
          </div>

          <SectionDivider variant="wave" className="text-parchment" height="md" />
        </section>
      )}

      {/* ══════════════════════════════════════════════ FAQ */}
      <section className="relative bg-parchment py-20 pb-40 md:py-28 md:pb-52">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <Reveal className="text-center">
              <span className="eyebrow">Вопросы</span>
              <h2 className="section-title mt-5">Частые вопросы</h2>
            </Reveal>
            <Reveal delay={100} className="mt-10">
              <FAQAccordion items={mockFAQ.slice(0, 5)} />
            </Reveal>
            <Reveal delay={150} className="mt-8 text-center">
              <Link
                href="/faq"
                className="text-[15px] font-bold text-brand-500 underline-offset-4 hover:underline"
              >
                Все вопросы
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Night falls — the last seam before the closing invitation.
            Matches the top of the CTA's gradient so the join is seamless. */}
        <SectionDivider variant="arch" className="text-brown-500" height="lg" />
      </section>

      {/* ══════════════════════════════════════════════ FINAL CTA */}
      <section className="relative overflow-hidden bg-brown-600 py-24 text-center md:py-32">
        {/* Night sky with quiet stars */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brown-500 via-brown-600 to-[#2A1A12]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {[
            { top: "14%", left: "12%", d: "0s" },
            { top: "26%", left: "78%", d: "1.2s" },
            { top: "62%", left: "22%", d: "2.1s" },
            { top: "18%", left: "46%", d: "0.6s" },
            { top: "70%", left: "68%", d: "1.7s" },
            { top: "44%", left: "88%", d: "2.6s" },
          ].map((s, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 animate-twinkle rounded-full bg-gold-200"
              style={{ top: s.top, left: s.left, animationDelay: s.d }}
            />
          ))}
          <div className="absolute -bottom-10 left-1/2 h-72 w-[52rem] -translate-x-1/2 rounded-full bg-gold-300/20 blur-3xl" />
        </div>

        <div className="page-container relative">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl md:text-[2.9rem]">
              Подарите ребёнку историю, которую он запомнит
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <Link
              href="/catalog"
              className="mt-10 inline-flex items-center justify-center rounded-full bg-gold-300 px-8 py-4 text-base font-bold text-brown-dark shadow-[0_14px_36px_rgba(0,0,0,0.32)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-200 active:translate-y-0"
            >
              Создать персональную книгу
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/**
 * Shown when the database holds no published product. This is an honest empty
 * state rather than a hardcoded fallback book, so the storefront never
 * advertises something that is not actually for sale.
 */
function EmptyCatalogueNotice() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-20">
      <div className="page-container mx-auto max-w-lg text-center">
        <Mascot variant={1} float />
        <h1 className="mt-8 font-display text-3xl font-extrabold text-brown-dark">
          Каталог скоро откроется
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-brown">
          Мы готовим наши истории к публикации. Загляните чуть позже.
        </p>
        <Link href="/contact" className="btn-secondary mt-8 inline-flex">
          Связаться с нами
        </Link>
      </div>
    </div>
  );
}
