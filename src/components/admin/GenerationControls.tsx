"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RotateCw, AlertCircle } from "lucide-react";
import {
  startOrderGeneration,
  retryGeneration,
} from "@/app/actions/generation";
import { GENERATION_STATUS_LABELS, type GenerationStatus } from "@/lib/constants";

interface Props {
  orderItemId: string;
  hasPhoto: boolean;
  /** False when the provider has no credentials — the button is not offered. */
  enabled: boolean;
  job: {
    id: string;
    status: GenerationStatus;
    attempts: number;
    lastError: string | null;
    /** Storage keys of the finished artwork, in page order. */
    resultKeys?: string[];
    resultCount: number;
  } | null;
}

/**
 * Illustration controls for one order line.
 *
 * States are the job's real states. Nothing here claims progress the provider
 * has not reported.
 */
export default function GenerationControls({
  orderItemId,
  hasPhoto,
  enabled,
  job,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setBusy(true);
    const result = await fn();
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Не удалось выполнить действие");
      return;
    }
    startTransition(() => router.refresh());
  }

  if (!enabled) {
    return (
      <p className="text-xs leading-relaxed text-brown">
        Автоматическая генерация не подключена — иллюстрации готовятся вручную.
      </p>
    );
  }

  if (!hasPhoto) {
    return (
      <p className="text-xs leading-relaxed text-brown">
        К позиции не приложена фотография — генерация недоступна.
      </p>
    );
  }

  const disabled = busy || pending;

  return (
    <div>
      {job ? (
        <div className="text-xs leading-relaxed text-brown">
          <p>
            Иллюстрации:{" "}
            <span className="font-semibold text-brown-dark">
              {GENERATION_STATUS_LABELS[job.status]}
            </span>
            {job.status === "succeeded" && ` · ${job.resultCount} шт.`}
            {job.attempts > 1 && ` · попыток: ${job.attempts}`}
          </p>
          {/* Provider wording, kept for the operator only. */}
          {job.lastError && (
            <p className="mt-1 text-red-600">{job.lastError}</p>
          )}

          {/* The artwork the customer approved and the book is printed from.
              Shown here because an order without it in reach is an order the
              production team cannot act on. */}
          {job.resultKeys && job.resultKeys.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-2">
              {job.resultKeys.map((key, i) => (
                <li key={key}>
                  <a
                    href={`/api/uploads/${key}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Открыть в полном размере"
                    className="block overflow-hidden rounded-lg ring-1 ring-cream-300 transition-opacity hover:opacity-80"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/uploads/${key}`}
                      alt={`Обложка, вариант ${i + 1}`}
                      width={96}
                      height={96}
                      className="h-24 w-24 object-cover"
                    />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="text-xs text-brown">Иллюстрации ещё не создавались.</p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        {!job && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => run(() => startOrderGeneration(orderItemId))}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-semibold text-brand-600 transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {busy ? "Запускаем…" : "Создать иллюстрации"}
          </button>
        )}

        {job && job.status === "failed" && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => run(() => retryGeneration(job.id))}
            className="inline-flex items-center gap-1.5 rounded-full bg-cream-300 px-3.5 py-1.5 text-xs font-semibold text-brown-dark transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            Повторить
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
