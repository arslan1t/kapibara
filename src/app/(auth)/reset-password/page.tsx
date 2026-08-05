import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { inspectResetToken } from "@/app/actions/account-recovery";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Новый пароль",
  // A one-time credential link has no business in a search index.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;

  // Checked before the form is shown so an expired link says so immediately,
  // instead of after the customer has typed a new password twice. The token is
  // validated but not consumed here.
  const state = await inspectResetToken(token ?? "");

  if (!state.valid) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold text-brown-dark">
          Ссылка не работает
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">{state.error}</p>
        <Link href="/forgot-password" className="btn-primary mt-6 inline-flex">
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token ?? ""} />;
}
