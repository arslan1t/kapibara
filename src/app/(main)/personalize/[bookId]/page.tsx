import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBookBySlugOrId } from "@/lib/products";
import PersonalizeForm from "./PersonalizeForm";

interface Props {
  params: Promise<{ bookId: string }>;
}

// The product is read per request, so an archived or unpublished book stops
// being personalizable immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId } = await params;
  const book = await getBookBySlugOrId(bookId);
  if (!book) return { title: "История не найдена" };

  return {
    title: `Персонализация — ${book.title}`,
    description: `Добавьте имя и фотографию ребёнка в книгу «${book.title}».`,
    // A half-finished order form has no business in search results.
    robots: { index: false, follow: true },
  };
}

export default async function PersonalizePage({ params }: Props) {
  const { bookId } = await params;
  const book = await getBookBySlugOrId(bookId);

  if (!book) notFound();

  // The book exists but is not for sale yet — say so instead of letting the
  // customer fill in a form that could never become an order.
  if (!book.available) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <div className="page-container flex max-w-md flex-col items-center gap-5 text-center">
          <h1 className="font-display text-2xl font-extrabold text-brown-dark">
            «{book.title}» пока нельзя заказать
          </h1>
          <p className="text-[15px] leading-relaxed text-brown">
            Эта история ещё готовится к выпуску. Мы сообщим, когда её можно будет
            персонализировать.
          </p>
          <Link href="/catalog" className="btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return <PersonalizeForm book={book} />;
}
