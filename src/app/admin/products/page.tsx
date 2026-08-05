import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { PRODUCT_STATUS_LABELS, type ProductStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Товары" };

const STATUS_TONE: Record<ProductStatus, string> = {
  available: "bg-sage-100 text-sage-500",
  coming_soon: "bg-gold-100 text-brown-dark",
  archived: "bg-cream-300 text-brown",
};

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { items: true, images: true } },
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
          Товары
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} />
          Добавить товар
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-8 text-center text-[15px] text-brown shadow-soft">
          Товаров пока нет.
        </p>
      ) : (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="rounded-2xl bg-white p-4 shadow-soft">
              <div className="flex gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt=""
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-brown-400">
                      нет фото
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-brown-dark">
                    {p.shortTitle}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-brown-400">/{p.slug}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${STATUS_TONE[p.status as ProductStatus]}`}>
                      {PRODUCT_STATUS_LABELS[p.status as ProductStatus]}
                    </span>
                    {!p.published && (
                      <span className="badge bg-cream-300 text-brown">Черновик</span>
                    )}
                    {p.featured && (
                      <span className="badge bg-brand-100 text-brand-600">Хит</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-cream-200 pt-3">
                <span className="font-display font-extrabold text-brown-dark">
                  {formatPrice(p.price)}
                </span>
                <span className="text-xs text-brown-400">
                  {p._count.images} фото · {p._count.items} в заказах
                </span>
              </div>

              <Link
                href={`/admin/products/${p.id}`}
                className="mt-3 block rounded-xl bg-cream-100 px-4 py-2.5 text-center text-sm font-bold text-brown-dark transition-colors hover:bg-cream-200"
              >
                Редактировать
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
