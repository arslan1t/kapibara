import type { Metadata } from "next";
import BookCard from "@/components/books/BookCard";
import Reveal from "@/components/shared/Reveal";
import { upcomingStories } from "@/data/books";
import { getPublishedProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Каталог персональных книг",
  description:
    "Две истории о приключениях с автомобильчиком Колёсиком — для мальчика и для девочки. Имя и фотография ребёнка вплетены в каждую страницу.",
};

// The catalogue reflects what an administrator has published, so it must not
// be cached at build time.
export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const catalogue = await getPublishedProducts();
  return (
    <div className="pb-24 pt-14 md:pb-32 md:pt-20">
      <div className="page-container">
        {/* ── Heading ── */}
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Каталог</span>
          <h1 className="section-title mt-5">Каталог персональных книг</h1>
          <p className="section-subtitle">
            Каждая книга печатается специально для вашего ребёнка — с его именем
            в тексте и фотографией в иллюстрациях.
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
            Новые истории уже создаются
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-brown">
            Мы рисуем и пишем продолжение серии. Вот над чем идёт работа:
          </p>
          <ul className="mx-auto mt-5 flex max-w-md flex-col gap-2 text-[15px] text-brown">
            {upcomingStories.map((story) => (
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
