"use client";

import { useState } from "react";
import { MailWarning, CheckCircle2, AlertCircle } from "lucide-react";
import { resendVerificationEmail } from "@/app/actions/account-recovery";

/**
 * Prompt shown to a customer whose address is not yet confirmed.
 *
 * Deliberately not blocking: an unverified account can still browse, order and
 * manage its profile. The only thing verification unlocks is our confidence
 * that order emails will actually arrive.
 */
export default function VerifyEmailBanner({ email }: { email: string }) {
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "sending" }
    | { kind: "sent"; notice: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  async function resend() {
    setState({ kind: "sending" });
    const result = await resendVerificationEmail();
    setState(
      result.ok
        ? { kind: "sent", notice: result.notice }
        : { kind: "error", message: result.error }
    );
  }

  if (state.kind === "sent") {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl bg-sage-100 p-4 text-sm text-sage-500"
      >
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="leading-relaxed">{state.notice}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-gold-100 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning
          className="mt-0.5 h-5 w-5 shrink-0 text-brown-dark"
          aria-hidden="true"
        />
        <div className="text-sm leading-relaxed text-brown-dark">
          <p className="font-semibold">Подтвердите адрес почты</p>
          <p className="mt-0.5 text-brown">
            Мы отправили письмо на {email}. Без подтверждения письма о заказах
            могут не дойти.
          </p>
          {state.kind === "error" && (
            <p
              role="alert"
              className="mt-2 flex items-center gap-1.5 font-medium text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              {state.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={resend}
        disabled={state.kind === "sending"}
        className="shrink-0 rounded-full bg-brown-dark px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state.kind === "sending" ? "Отправляем…" : "Отправить ещё раз"}
      </button>
    </div>
  );
}
