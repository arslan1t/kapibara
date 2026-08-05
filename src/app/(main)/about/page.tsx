import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Heart, Printer, ShieldCheck, Sparkles } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import SectionDivider from "@/components/shared/SectionDivider";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "О нас",
  description:
    "Капибара печатает персональные книги, где главным героем становится ваш ребёнок. Рассказываем, как мы их создаём и как бережно обращаемся с фотографиями.",
};

const values = [
  {
    icon: Heart,
    title: "Истории, а не шаблоны",
    text: "Каждая книга написана и нарисована так, чтобы ребёнку хотелось вернуться к ней снова.",
  },
  {
    icon: Printer,
    title: "Честная печать",
    text: "Плотная бумага, твёрдая обложка, аккуратный переплёт. Книга должна пережить много прочтений.",
  },
  {
    icon: ShieldCheck,
    title: "Бережно с фотографиями",
    text: "Фото используется только для вашей книги. Мы не передаём его третьим лицам и удаляем после заказа.",
  },
];

// Book covers are read from the database, so this page is rendered per request.
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const catalogue = await getPublishedProducts();

  return (
    <>
      {/* ── Intro ── */}
      <section className="bg-gradient-to-b from-cream-100 to-parchment py-16 md:py-24">
        <div className="page-container">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />О нас
            </span>
            <h1 className="section-title mt-5">
              Мы делаем книги, в которых ребёнок узнаёт себя
            </h1>
            <p className="section-subtitle">
              Капибара — небольшая студия. Мы пишем, рисуем и печатаем истории,
              где главным героем становится конкретный ребёнок: с его именем в
              тексте и лицом в иллюстрациях.
            </p>
          </Reveal>

          <Reveal delay={140} className="mx-auto mt-14 max-w-3xl">
            <div className="flex items-center justify-center">
              {catalogue.map((book, i) => (
                <Image
                  key={book.id}
                  src={book.image}
                  alt={`Обложка книги «${book.title}»`}
                  width={440}
                  height={440}
                  className={
                    i === 0
                      ? "w-[46%] -rotate-3 rounded-3xl drop-shadow-2xl"
                      : "-ml-8 w-[46%] rotate-3 rounded-3xl drop-shadow-2xl"
                  }
                />
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
                Почему персональные книги
              </h2>
            </Reveal>
            <Reveal delay={100}>
              <div className="space-y-4 text-[15px] leading-relaxed text-brown">
                <p>
                  Дети читают охотнее, когда история про них. Собственное имя на
                  странице превращает чтение в игру и повод возвращаться к книге
                  снова и снова.
                </p>
                <p>
                  Поэтому мы начали с одной истории про автомобильчика Колёсика —
                  и сделали две её версии, для мальчика и для девочки. Сейчас
                  работаем над продолжением серии.
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
            <h2 className="section-title">Что для нас важно</h2>
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
              Создайте книгу для своего ребёнка
            </h2>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full bg-gold-300 px-8 py-4 text-base font-bold text-brown-dark transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold-200"
            >
              Выбрать историю
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
