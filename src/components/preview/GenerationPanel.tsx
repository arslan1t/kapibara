"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Sparkles, AlertCircle, Loader2, ImageOff } from "lucide-react";
import Button from "@/components/ui/Button";
import { requestPreviewGeneration } from "@/app/actions/generation";
import { GENERATION_STATUS_LABELS, type GenerationStatus } from "@/lib/constants";

interface Props {
  productSlug: string;
  childName: string;
  photoKey: string | null;
  /** False when the provider has no credentials configured. */
  enabled: boolean;
}

interface JobState {
  id: string;
  status: GenerationStatus;
  pages: { pageNumber: number; storageKey: string }[];
}

/** How often to ask the server for progress while a job is in flight. */
const POLL_MS = 3000;
/** Give up polling after this long so a wedged job cannot poll forever. */
const POLL_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Live illustration generation.
 *
 * Shows real job state from the server — queued, processing, done, failed —
 * and nothing else. When the provider is not configured the panel says so
 * plainly instead of faking a progress bar.
 */
export default function GenerationPanel({
  productSlug,
  childName,
  photoKey,
  enabled,
}: Props) {
  const [job, setJob] = useState<JobState | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef<number>(0);

  const poll = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/generation/${jobId}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as JobState;
  }, []);

  // Polls while the job is unfinished. Cleared on unmount, on completion and
  // on timeout, so no interval outlives the component.
  useEffect(() => {
    if (
      !job ||
      job.status === "succeeded" ||
      job.status === "failed" ||
      job.status === "cancelled"
    ) {
      return;
    }

    const timer = setInterval(async () => {
      if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
        // Only this page stops watching. The job itself is a durable row that
        // a background worker keeps processing, so closing the tab loses
        // nothing.
        clearInterval(timer);
        setError(
          "Создание иллюстраций занимает дольше обычного. Работа продолжается в фоне — можно закрыть страницу, мы пришлём готовый макет."
        );
        return;
      }

      const next = await poll(job.id);
      if (next) setJob(next);
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [job, poll]);

  /**
   * Starts generation as soon as the page opens.
   *
   * It used to wait for a click, which put the one thing the customer came for
   * behind a button they had no reason to expect. There is nothing to decide
   * here: they uploaded a photograph in order to see this.
   *
   * Guarded on `job` so a re-render never submits twice — each submission is
   * billed.
   */
  useEffect(() => {
    if (enabled && photoKey && !job && !starting) void start();
    // `start` is stable for a given photo; re-running on every render is what
    // the guard above prevents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, photoKey]);

  async function start() {
    if (!photoKey) return;
    setError(null);
    setStarting(true);

    const result = await requestPreviewGeneration({
      productSlug,
      childName,
      photoKey,
    });
    setStarting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    startedAt.current = Date.now();
    setJob({ id: result.jobId, status: "queued", pages: [] });
  }

  // ── Provider not configured ──
  if (!enabled) {
    return (
      <div className="rounded-3xl bg-cream-100 p-5">
        <p className="flex items-center gap-2 font-semibold text-brown-dark">
          <ImageOff className="h-5 w-5 text-brown" aria-hidden="true" />
          Иллюстрации создаются вручную
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brown">
          Автоматическая генерация ещё не подключена. Наш художник вставит лицо
          вашего ребёнка в иллюстрации после подтверждения заказа, и мы пришлём
          готовый макет на согласование.
        </p>
      </div>
    );
  }

  if (!photoKey) {
    return (
      <div className="rounded-3xl bg-cream-100 p-5">
        <p className="text-sm leading-relaxed text-brown">
          Загрузите фотографию ребёнка, чтобы увидеть, как он будет выглядеть в
          иллюстрациях.
        </p>
      </div>
    );
  }

  // ── Not started ──
  if (!job) {
    return (
      <div className="rounded-3xl bg-brand-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-brown-dark">
          <Sparkles className="h-5 w-5 text-brand-500" aria-hidden="true" />
          Посмотрите иллюстрации с вашим ребёнком
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brown">
          Мы создадим несколько разворотов, чтобы вы увидели книгу до заказа.
          Это займёт около минуты.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <Button onClick={start} isLoading={starting} className="mt-4">
          {starting ? "Запускаем…" : "Создать иллюстрации"}
        </Button>
      </div>
    );
  }

  // ── Failed or cancelled ──
  if (job.status === "failed" || job.status === "cancelled") {
    return (
      <div className="rounded-3xl bg-red-50 p-5">
        <p className="flex items-center gap-2 font-semibold text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden="true" />
          Не удалось создать иллюстрации
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brown">
          Попробуйте другую фотографию: лицо должно быть крупным, в фокусе и при
          хорошем освещении. Заказ можно оформить и без предпросмотра — мы
          согласуем макет с вами до печати.
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            setJob(null);
            setError(null);
          }}
          className="mt-4"
        >
          Попробовать ещё раз
        </Button>
      </div>
    );
  }

  // ── Done ──
  if (job.status === "succeeded") {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-soft">
        <p className="font-semibold text-brown-dark">Иллюстрации готовы</p>
        <p className="mt-1 text-sm text-brown">
          Так {childName} будет выглядеть на страницах книги.
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {job.pages.map((page) => (
            <li key={page.pageNumber}>
              <Image
                // Served through the authorization-checked upload route, never
                // from a public path.
                src={`/api/uploads/${page.storageKey}`}
                alt={`Разворот ${page.pageNumber}: ${childName} в иллюстрации`}
                width={400}
                height={400}
                unoptimized
                className="aspect-square w-full rounded-xl object-cover"
              />
              <p className="mt-1 text-center text-xs text-brown">
                Стр. {page.pageNumber}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // ── In progress ──
  return (
    <div className="rounded-3xl bg-brand-50 p-5" aria-live="polite">
      <p className="flex items-center gap-2 font-semibold text-brown-dark">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden="true" />
        {GENERATION_STATUS_LABELS[job.status]}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-brown">
        Рисуем {childName} в сценах книги. Обычно это занимает около минуты.
        Страницу можно закрыть — работа продолжится, и результат сохранится.
      </p>

      {error && (
        <p role="status" className="mt-3 text-sm leading-relaxed text-brown">
          {error}
        </p>
      )}
    </div>
  );
}
