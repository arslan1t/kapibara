import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Нет доступа",
  robots: { index: false, follow: false },
};

export default function NoAccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <div className="page-container mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-4xl bg-white text-brand-500 shadow-elevated">
          <ShieldAlert className="h-8 w-8" strokeWidth={1.7} />
        </span>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
          Недостаточно прав
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-brown">
          Этот раздел доступен только администраторам. Если вам нужен доступ,
          обратитесь к владельцу магазина.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className="btn-primary">
            На главную
          </Link>
          <Link href="/account" className="btn-secondary">
            В личный кабинет
          </Link>
        </div>
      </div>
    </div>
  );
}
