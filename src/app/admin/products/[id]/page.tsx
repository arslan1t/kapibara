import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import ProductGalleryManager from "@/components/admin/ProductGalleryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Редактирование товара" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });

  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-brown transition-colors hover:text-brown-dark"
      >
        <ArrowLeft className="h-4 w-4" />
        Все товары
      </Link>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        {product.shortTitle}
      </h1>

      <section className="mt-6 max-w-3xl rounded-2xl bg-white p-5 shadow-soft">
        <ProductGalleryManager
          productId={product.id}
          images={product.images.map((img) => ({
            id: img.id,
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary,
          }))}
        />
      </section>

      <div className="mt-4 max-w-3xl rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <ProductForm
          productId={product.id}
          initial={{
            slug: product.slug,
            title: product.title,
            shortTitle: product.shortTitle,
            shortDescription: product.shortDescription,
            description: product.description,
            price: product.price,
            oldPrice: product.oldPrice,
            status: product.status,
            published: product.published,
            featured: product.featured,
            ageRange: product.ageRange,
            ageMin: product.ageMin,
            ageMax: product.ageMax,
            pageCount: product.pageCount,
            childGender: product.childGender,
          }}
        />
      </div>
    </div>
  );
}
