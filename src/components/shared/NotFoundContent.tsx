import Link from "next/link";
import { BookOpen, Home, Search, Compass } from "lucide-react";

export default function NotFoundContent() {
  return (
    <section className="relative min-h-[75vh] flex items-center overflow-hidden bg-gradient-to-br from-cream-200 via-cream-50 to-brand-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand-100 opacity-50 blur-3xl" />
        <div className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-sage-100 opacity-40 blur-3xl" />
      </div>

      <div className="page-container relative z-10 py-16 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-4xl bg-white shadow-elevated text-brand-500">
          <Compass className="h-11 w-11" strokeWidth={1.6} />
        </div>
        <p className="font-display text-7xl font-extrabold text-accent leading-none sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
          Эта страница потерялась в волшебном лесу
        </h1>
        <p className="mt-3 text-brown max-w-md mx-auto leading-relaxed">
          Даже Колёсик не смог найти сюда дорогу. Возможно, страница переехала
          или ссылка устарела — но ваша книга точно никуда не делась.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary px-6 py-3.5">
            <Home className="h-4 w-4" />
            На главную
          </Link>
          <Link href="/catalog" className="btn-secondary px-6 py-3.5">
            <BookOpen className="h-4 w-4" />
            В каталог
          </Link>
          <Link href="/faq" className="btn-ghost px-6 py-3.5 border border-cream-200">
            <Search className="h-4 w-4" />
            Частые вопросы
          </Link>
        </div>
      </div>
    </section>
  );
}
