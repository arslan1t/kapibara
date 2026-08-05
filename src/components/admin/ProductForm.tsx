"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  createProduct,
  updateProduct,
  archiveProduct,
  type ProductInput,
} from "@/app/actions/admin";
import { PRODUCT_STATUSES, PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/constants";

interface Props {
  productId?: string;
  initial?: Partial<ProductInput>;
}

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100";
const label = "block text-sm font-semibold text-brown-dark";

export default function ProductForm({ productId, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<ProductInput>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    shortTitle: initial?.shortTitle ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    oldPrice: initial?.oldPrice ?? null,
    status: initial?.status ?? "coming_soon",
    published: initial?.published ?? false,
    featured: initial?.featured ?? false,
    ageRange: initial?.ageRange ?? "3–8 лет",
    ageMin: initial?.ageMin ?? 3,
    ageMax: initial?.ageMax ?? 8,
    pageCount: initial?.pageCount ?? 40,
    childGender: initial?.childGender ?? null,
  });

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = productId
        ? await updateProduct(productId, form)
        : await createProduct(form);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
      if (!productId) router.push("/admin/products");
    });
  }

  function handleArchive() {
    if (!productId) return;
    const confirmed = window.confirm(
      "Отправить товар в архив? Он исчезнет из каталога, но останется в старых заказах."
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await archiveProduct(productId);
      if (!result.ok) setError(result.error);
      else router.push("/admin/products");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-title" className={label}>Название</label>
          <input
            id="p-title"
            className={`${field} mt-1.5`}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="p-short-title" className={label}>Короткое название</label>
          <input
            id="p-short-title"
            className={`${field} mt-1.5`}
            value={form.shortTitle}
            onChange={(e) => set("shortTitle", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="p-slug" className={label}>Slug (адрес страницы)</label>
        <input
          id="p-slug"
          className={`${field} mt-1.5`}
          value={form.slug}
          onChange={(e) => set("slug", e.target.value)}
          placeholder="priklyucheniya-malchika-i-kolesika"
          required
        />
        <p className="mt-1 text-xs text-brown-400">
          Латиница в нижнем регистре, цифры и дефис
        </p>
      </div>

      <div>
        <label htmlFor="p-short-desc" className={label}>Краткое описание</label>
        <textarea
          id="p-short-desc"
          rows={2}
          className={`${field} mt-1.5 resize-y`}
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="p-desc" className={label}>Полное описание</label>
        <textarea
          id="p-desc"
          rows={5}
          className={`${field} mt-1.5 resize-y`}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="p-price" className={label}>Цена, ₽</label>
          <input
            id="p-price"
            type="number"
            min={0}
            className={`${field} mt-1.5`}
            value={form.price}
            onChange={(e) => set("price", Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label htmlFor="p-old-price" className={label}>Старая цена, ₽</label>
          <input
            id="p-old-price"
            type="number"
            min={0}
            className={`${field} mt-1.5`}
            value={form.oldPrice ?? ""}
            onChange={(e) =>
              set("oldPrice", e.target.value ? Number(e.target.value) : null)
            }
          />
        </div>
        <div>
          <label htmlFor="p-pages" className={label}>Страниц</label>
          <input
            id="p-pages"
            type="number"
            min={1}
            className={`${field} mt-1.5`}
            value={form.pageCount}
            onChange={(e) => set("pageCount", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="p-age-range" className={label}>Возраст (текст)</label>
          <input
            id="p-age-range"
            className={`${field} mt-1.5`}
            value={form.ageRange}
            onChange={(e) => set("ageRange", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="p-age-min" className={label}>Возраст от</label>
          <input
            id="p-age-min"
            type="number"
            min={0}
            className={`${field} mt-1.5`}
            value={form.ageMin}
            onChange={(e) => set("ageMin", Number(e.target.value))}
          />
        </div>
        <div>
          <label htmlFor="p-age-max" className={label}>Возраст до</label>
          <input
            id="p-age-max"
            type="number"
            min={0}
            className={`${field} mt-1.5`}
            value={form.ageMax}
            onChange={(e) => set("ageMax", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="p-status" className={label}>Статус</label>
          <select
            id="p-status"
            className={`${field} mt-1.5`}
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {PRODUCT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PRODUCT_STATUS_LABELS[s as ProductStatus]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-brown-400">
            Купить можно только товар со статусом «В продаже»
          </p>
        </div>
        <div>
          <label htmlFor="p-gender" className={label}>Версия истории</label>
          <select
            id="p-gender"
            className={`${field} mt-1.5`}
            value={form.childGender ?? ""}
            onChange={(e) => set("childGender", e.target.value || null)}
          >
            <option value="">не указано</option>
            <option value="boy">для мальчика</option>
            <option value="girl">для девочки</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-cream-100 p-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-brown-dark">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => set("published", e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--brand-500))]"
          />
          Опубликован на сайте
        </label>
        <label className="flex items-center gap-3 text-sm font-semibold text-brown-dark">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4 accent-[rgb(var(--brand-500))]"
          />
          Показывать как рекомендованный
        </label>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-[13px] font-medium text-red-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}
      {saved && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl bg-sage-50 px-3.5 py-3 text-[13px] font-medium text-sage-500"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          Изменения сохранены
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : productId ? "Сохранить" : "Создать товар"}
        </button>
        {productId && (
          <button
            type="button"
            onClick={handleArchive}
            disabled={pending}
            className="rounded-xl border-2 border-cream-300 px-6 py-3 text-sm font-bold text-brown transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-60"
          >
            В архив
          </button>
        )}
      </div>
    </form>
  );
}
