"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { refreshPayment } from "@/app/actions/admin";

/**
 * Re-reads a payment from the provider.
 *
 * The escape hatch for a lost webhook: rather than editing the database by
 * hand, an administrator asks the provider what actually happened and lets the
 * normal reconciliation path apply it.
 */
export default function RefreshPaymentButton({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    const result = await refreshPayment(paymentId);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    startTransition(() => router.refresh());
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-cream-300 px-4 py-2 text-xs font-semibold text-brown-dark transition-colors hover:bg-cream-400 disabled:opacity-60"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {pending ? "Обновляем…" : "Проверить у провайдера"}
      </button>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
