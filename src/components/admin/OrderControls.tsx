"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  updateOrderStatus,
  updatePaymentStatus,
  saveAdminNote,
} from "@/app/actions/admin";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from "@/lib/constants";

interface Props {
  orderId: string;
  currentStatus: string;
  currentPayment: string;
  currentNote: string;
}

/** Feedback banner shared by all three controls. */
function Feedback({ tone, text }: { tone: "ok" | "error"; text: string }) {
  const Icon = tone === "ok" ? CheckCircle2 : AlertCircle;
  return (
    <p
      role={tone === "ok" ? "status" : "alert"}
      className={
        tone === "ok"
          ? "flex items-start gap-2 rounded-xl bg-sage-50 px-3 py-2.5 text-[13px] font-medium text-sage-500"
          : "flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-600"
      }
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      {text}
    </p>
  );
}

export default function OrderControls({
  orderId,
  currentStatus,
  currentPayment,
  currentNote,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [status, setStatus] = useState(currentStatus);
  const [payment, setPayment] = useState(currentPayment);
  const [note, setNote] = useState(currentNote);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null
  );

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        setMessage({ tone: "ok", text: okText });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error ?? "Не удалось сохранить" });
      }
    });
  }

  function handleStatusChange(next: string) {
    const previous = status;
    setStatus(next);

    // Cancelling an order is hard to undo, so confirm it explicitly.
    if (next === "cancelled") {
      const confirmed = window.confirm(
        "Отменить заказ? Клиент увидит статус «Отменён»."
      );
      if (!confirmed) {
        setStatus(previous);
        return;
      }
    }

    run(() => updateOrderStatus(orderId, next), "Статус заказа обновлён");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="order-status"
          className="block text-sm font-semibold text-brown-dark"
        >
          Статус заказа
        </label>
        <select
          id="order-status"
          value={status}
          disabled={pending}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="payment-status"
          className="block text-sm font-semibold text-brown-dark"
        >
          Статус оплаты
        </label>
        <select
          id="payment-status"
          value={payment}
          disabled={pending}
          onChange={(e) => {
            setPayment(e.target.value);
            run(
              () => updatePaymentStatus(orderId, e.target.value),
              "Статус оплаты обновлён"
            );
          }}
          className="mt-1.5 w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        >
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="admin-note"
          className="block text-sm font-semibold text-brown-dark"
        >
          Внутренний комментарий
        </label>
        <p className="mt-0.5 text-xs text-brown-400">Виден только сотрудникам</p>
        <textarea
          id="admin-note"
          rows={3}
          value={note}
          disabled={pending}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-sm text-brown-dark outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => saveAdminNote(orderId, note), "Комментарий сохранён")}
          className="mt-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сохранить комментарий"}
        </button>
      </div>

      {message && <Feedback tone={message.tone} text={message.text} />}
    </div>
  );
}
