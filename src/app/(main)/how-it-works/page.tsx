import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpenCheck,
  PenLine,
  Camera,
  PackageOpen,
  Check,
  ShieldCheck,
} from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import SectionDivider from "@/components/shared/SectionDivider";
import StoryVideoHero from "@/components/media/StoryVideoHero";
import { BOOK_PAGE_COUNT, bookIncludes } from "@/data/books";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Как это работает",
  description:
    "Четыре шага: выберите историю, добавьте имя и фотографию, проверьте предварительный макет и получите напечатанную книгу.",
};

const steps = [
  {
    icon: BookOpenCheck,
    title: "Выберите историю",
    text: "Две сказки о говорящем автомобильчике Колёсике — одна про мальчика, другая про девочку. Обе одинаковой длины и качества печати.",
  },
  {
    icon: PenLine,
    title: "Добавьте имя и фотографию",
    text: "Имя ребёнка войдёт в текст истории, а фотография станет основой для иллюстраций, где он будет главным героем.",
  },
  {
    icon: Camera,
    title: "Проверьте превью",
    text: "После загрузки фотографии вы увидите предварительный макет и сможете проверить все данные перед оформлением заказа.",
  },
  {
    icon: PackageOpen,
    title: "Получите книгу",
    text: "Мы печатаем книгу под ваш заказ и отправляем её вам. Стоимость и срок доставки рассчитываются при оформлении.",
  },
];

const photoTips = [
  "Лицо крупным планом",
  "Хорошее естественное освещение",
  "Светлый однотонный фон",
  "Ребёнок смотрит в камеру",
  "Без солнцезащитных очков",
  "Не групповое фото",
];

// Book covers are read from the database, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const catalogue = await getPublishedProducts();
  const heroBook = catalogue.find((b) => b.available) ?? catalogue[0];

  return (
    <>
      {/* ── Intro with the story film ── */}
      <section className="bg-gradient-to-b from-cream-100 to-parchment py-14 md:py-20">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Как это работает</span>
            <h1 className="section-title mt-5">От фотографии до книги на полке</h1>
            <p className="section-subtitle">
              Показываем весь путь: как обычный снимок превращается в
              иллюстрацию, а история — в настоящую напечатанную книгу.
            </p>
          </Reveal>

          <Reveal delay={140} className="mx-auto mt-12 max-w-4xl">
            <StoryVideoHero
              src="/videos/hero-story.mp4"
              label="Фотография ребёнка превращается в иллюстрацию, а затем в напечатанную книгу"
              className="shadow-elevated ring-1 ring-white/60"
              fallback={
                <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-cream-200 via-cream-100 to-gold-100">
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
              <h2 className="section-title">Какое фото подойдёт</h2>
              <p className="section-subtitle">
                Чем чётче снимок, тем точнее художник нарисует ребёнка в
                иллюстрациях.
              </p>
              <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-white px-4 py-3.5 text-sm leading-relaxed text-brown">
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0 text-sage-500"
                  strokeWidth={2}
                />
                Фотография используется только для создания вашей книги. Мы не
                передаём её третьим лицам и удаляем после выполнения заказа.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <ul className="grid gap-3">
                {photoTips.map((tip) => (
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
                {catalogue.map((book, i) => (
                  <Image
                    key={book.id}
                    src={book.image}
                    alt={`Обложка книги «${book.title}»`}
                    width={440}
                    height={440}
                    className={
                      i === 0
                        ? "relative w-[48%] -rotate-3 rounded-3xl drop-shadow-2xl"
                        : "relative -ml-8 w-[48%] rotate-3 rounded-3xl drop-shadow-2xl"
                    }
                  />
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <h2 className="section-title">Что вы получите</h2>
              <p className="section-subtitle">
                {BOOK_PAGE_COUNT} иллюстрированных страниц в твёрдой обложке —
                книга, которую можно поставить на полку.
              </p>
              <ul className="mt-8 space-y-3">
                {bookIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-sage-500"
                      strokeWidth={2.4}
                    />
                    <span className="text-[15px] leading-relaxed text-brown">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/catalog" className="btn-primary mt-9 text-base">
                Выбрать историю
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
