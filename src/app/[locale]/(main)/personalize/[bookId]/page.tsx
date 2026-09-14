import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/i18n/navigation";
import { getBookBySlugOrId } from "@/lib/products";
import PersonalizeForm from "./PersonalizeForm";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/format";

interface Props {
  params: Promise<LocaleParams & { bookId: string }>;
}

// The product is read per request, so an archived or unpublished book stops
// being personalizable immediately.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { bookId, locale: raw } = await params;
  const locale = asLocale(raw);
  const t = getDictionary(locale);
  const book = await getBookBySlugOrId(bookId, locale);
  if (!book) return { title: t.misc.storyNotFound };

  return {
    title: fill(t.misc.personalizationMetaTitle, { title: book.title }),
    description: fill(t.misc.personalizationMetaDescription, {
      title: book.title,
    }),
    // A half-finished order form has no business in search results.
    robots: { index: false, follow: true },
  };
}

export default async function PersonalizePage({ params }: Props) {
  const { bookId, locale: raw } = await params;
  const locale = asLocale(raw);
  const t = getDictionary(locale);
  const book = await getBookBySlugOrId(bookId, locale);

  if (!book) notFound();

  // The book exists but is not for sale yet — say so instead of letting the
  // customer fill in a form that could never become an order.
  if (!book.available) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-16">
        <div className="page-container flex max-w-md flex-col items-center gap-5 text-center">
          <h1 className="font-display text-2xl font-extrabold text-brown-dark">
            {fill(t.misc.notOrderable, { title: book.title })}
          </h1>
          <p className="text-[15px] leading-relaxed text-brown">
{t.misc.notOrderableLead}
          </p>
          <Link href="/catalog" className="btn-primary">
            {t.misc.toCatalog}
          </Link>
        </div>
      </div>
    );
  }

  return <PersonalizeForm book={book} />;
}
