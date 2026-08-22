"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Check, ShieldCheck, Truck, Sparkles } from "lucide-react";
import PreviewBook from "@/components/preview/PreviewBook";
import GenerationPanel, { type JobState } from "@/components/preview/GenerationPanel";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/shared/EmptyState";
import { useCartStore } from "@/store/cart";
import { getPreview } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { GeneratedProject } from "@/types";

interface Props {
  projectId: string;
  /** True only when the illustration provider has credentials. */
  generationEnabled: boolean;
}

export default function PreviewClient({ projectId, generationEnabled }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [project, setProject] = useState<GeneratedProject | null | undefined>(undefined);
  const [job, setJob] = useState<JobState | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getPreview(projectId).then(setProject);
  }, [projectId]);

  function handleAddToCart() {
    if (!project) return;
    addItem(project.book, project.personalization);
    setAdded(true);
    setTimeout(() => setAdded(false), 3000);
  }

  function handleBuyNow() {
    if (!project) return;
    addItem(project.book, project.personalization);
    router.push("/cart");
  }

  if (project === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-300 border-t-brand-400" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="py-20">
        <div className="page-container mx-auto max-w-lg">
          <EmptyState
            icon={<ShoppingBag className="h-11 w-11 text-brown-300" strokeWidth={1.6} />}
            title="Превью не найдено"
            description="Похоже, ссылка устарела. Создайте книгу заново — это займёт пару минут."
            action={{ label: "Выбрать книгу", href: "/catalog" }}
          />
        </div>
      </div>
    );
  }

  const { book, personalization } = project;

  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-10 md:py-14">
      <div className="page-container">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm font-semibold text-brown transition-colors hover:text-brown-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col gap-5">
            <PreviewBook project={project} job={job} />
            <GenerationPanel
              productSlug={book.slug}
              childName={personalization.childName}
              photoKey={personalization.photoKey ?? null}
              enabled={generationEnabled}
              onJob={setJob}
            />
          </div>

          {/* ── Order panel ── */}
          <div>
            <div className="flex items-center gap-3 rounded-3xl bg-sage-50 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sage-500">
                <Check className="h-5 w-5" strokeWidth={2.4} />
              </span>
              {/* Says what is actually true. The book image beside it is the
                  series cover, not a personalised render, and the claim that a
                  "макет" was ready appeared even when nothing had been
                  generated at all. */}
              <p className="text-[15px] font-semibold text-brown-dark">
                Данные сохранены — можно оформлять заказ
              </p>
            </div>

            <h1 className="mt-7 font-display text-2xl font-extrabold leading-tight text-brown-dark sm:text-3xl">
              {book.title}
            </h1>
            <p className="mt-2 text-[15px] text-brown">
              Главный герой —{" "}
              <strong className="font-bold text-brand-500">
                {personalization.childName}
              </strong>
            </p>

            <dl className="mt-7 grid grid-cols-2 gap-4 rounded-3xl bg-white p-5 shadow-soft text-sm">
              {[
                { label: "Страниц", value: `${book.pageCount}` },
                { label: "Обложка", value: "Твёрдая" },
                { label: "Возраст", value: book.ageRange },
                { label: "Формат", value: "Квадратный" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-brown-300">{label}</dt>
                  <dd className="mt-0.5 font-semibold text-brown-dark">{value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-7 font-display text-4xl font-extrabold text-brown-dark">
              {formatPrice(book.price)}
            </p>
            <p className="mt-2 text-sm text-brown-300">
              Стоимость и срок доставки рассчитываются при оформлении заказа.
            </p>

            <div className="mt-7 flex flex-col gap-3">
              <Button onClick={handleBuyNow} size="lg" fullWidth>
                <ShoppingBag className="h-5 w-5" />
                Оформить заказ
              </Button>
              <Button variant="secondary" onClick={handleAddToCart} fullWidth>
                {added ? (
                  <>
                    <Check className="h-4 w-4 text-sage-500" strokeWidth={2.4} />
                    Добавлено в корзину
                  </>
                ) : (
                  "Добавить в корзину"
                )}
              </Button>
            </div>

            <ul className="mt-7 space-y-3">
              {[
                { icon: Sparkles, text: "Имя и фото ребёнка внутри книги" },
                { icon: Truck, text: "Печатаем и отправляем по России" },
                { icon: ShieldCheck, text: "Фотография используется только для вашей книги" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-brown">
                  <Icon className="h-4 w-4 shrink-0 text-sage-500" strokeWidth={2} />
                  {text}
                </li>
              ))}
            </ul>

            <Link
              href={`/books/${book.slug}`}
              className="mt-7 inline-block text-[15px] font-bold text-brand-500 underline-offset-4 hover:underline"
            >
              Подробнее о книге
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
