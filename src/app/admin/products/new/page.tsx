import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";

export const metadata = { title: "Новый товар" };

export default function NewProductPage() {
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
        Новый товар
      </h1>
      <div className="mt-6 max-w-3xl rounded-2xl bg-white p-5 shadow-soft sm:p-7">
        <ProductForm />
      </div>
    </div>
  );
}
