import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { verifyEmailToken } from "@/app/actions/account-recovery";

export const metadata: Metadata = {
  title: "Подтверждение адреса",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

/**
 * Consumes the verification token on load.
 *
 * Doing the work in the page rather than behind a button means the link in the
 * email does what the reader expects when they click it. It is safe here
 * because the token is single-use and confirms only the address it was issued
 * for — there is no destructive side effect to protect against.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const result = await verifyEmailToken(token ?? "");

  if (!result.ok) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold text-brown-dark">
          Не удалось подтвердить адрес
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">{result.error}</p>
        <p className="mt-3 text-[13px] leading-relaxed text-brown">
          Войдите в аккаунт — в личном кабинете можно запросить новое письмо.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-card">
      <div className="mb-4 flex justify-center">
        <CheckCircle2 className="h-12 w-12 text-sage-500" aria-hidden="true" />
      </div>
      <h1 className="font-display text-xl font-bold text-brown-dark">
        Адрес подтверждён
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-brown">
        {result.email} — теперь мы сможем присылать вам письма о заказах.
      </p>
      <Link href="/account" className="btn-primary mt-6 inline-flex">
        В личный кабинет
      </Link>
    </div>
  );
}
