"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Sparkles, ShieldCheck } from "lucide-react";
import Stepper from "@/components/personalize/Stepper";
import UploadBox from "@/components/personalize/UploadBox";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import BookCover from "@/components/books/BookCover";
import type { Book, PersonalizationData } from "@/types";
import { createPersonalization, uploadChildPhoto } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import {
  sanitizeChildName,
  isChildNameValid,
  NAME_HINT,
  NAME_ERROR_LATIN,
  NAME_ERROR_SHORT,
} from "@/lib/validation";

const steps = [{ label: "Книга" }, { label: "Ребёнок" }, { label: "Фото" }, { label: "Превью" }];

const DRAFT_KEY = "kapibara-personalize-draft";

interface Props {
  /** Resolved on the server from the database, so it is always a real product. */
  book: Book;
}

export default function PersonalizeForm({ book }: Props) {
  const bookId = book.slug;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [nameRejected, setNameRejected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState<PersonalizationData>({
    bookId,
    childName: "",
    childAge: undefined,
    photoUrl: undefined,
    dedication: "",
  });

  // Restore a draft for this book. A blob: photo URL does not survive a reload,
  // so it is deliberately never persisted.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft?.bookId === bookId) {
        // A draft saved before the Cyrillic-only rule could hold characters
        // that are no longer allowed, so clean it on the way back in.
        setForm((f) => ({
          ...f,
          ...draft,
          childName: sanitizeChildName(String(draft.childName ?? "")).value,
          photoUrl: undefined,
        }));
      }
    } catch {
      // no usable draft — start fresh
    }
  }, [bookId]);

  useEffect(() => {
    try {
      // photoUrl is a blob: handle and dies with the page; photoKey names a
      // real object in private storage, so it is worth keeping.
      const { photoUrl, ...persistable } = form;
      void photoUrl;
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(persistable));
    } catch {
      // storage unavailable — the flow still works for this session
    }
  }, [form]);

  /**
   * Sends the photograph to private storage and keeps the key it comes back
   * with.
   *
   * Previously the file never left the browser: the form held a blob: URL, the
   * preview showed it, and nothing was ever uploaded — so `photoKey` stayed
   * undefined and illustration generation, which needs a real stored object,
   * could not start at all.
   */
  async function handlePhotoChange(url: string | undefined, file?: File) {
    setUploadError(null);

    if (!url || !file) {
      setForm((f) => ({ ...f, photoUrl: undefined, photoKey: undefined }));
      return;
    }

    // Show it immediately; the upload runs behind the preview.
    setForm((f) => ({ ...f, photoUrl: url, photoKey: undefined }));
    setUploading(true);

    const result = await uploadChildPhoto(file);
    setUploading(false);

    if (!result.ok) {
      // Keep the picture on screen so the choice is not lost, but say plainly
      // that it has not been saved — otherwise the next screen silently offers
      // no illustration and nobody knows why.
      setUploadError(result.error);
      return;
    }
    setForm((f) => ({ ...f, photoKey: result.key }));
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const project = await createPersonalization(form, book);
      router.push(`/preview/${project.id}`);
    } finally {
      // Always release the button. Without this a failed navigation would
      // leave it permanently disabled with no way to retry.
      setLoading(false);
    }
  }

  const nameValid = isChildNameValid(form.childName);

  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-10 md:py-14">
      <div className="page-container">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
              Создание книги
            </span>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
              {book.title}
            </h1>
          </div>

          <div className="mt-8">
            <Stepper steps={steps} currentStep={step} />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-5">
            {/* ── Live summary ── */}
            <aside className="order-2 lg:order-1 lg:col-span-2">
              <div className="sticky top-28 rounded-4xl bg-white p-6 shadow-card">
                <div className="rounded-3xl bg-cream-100 p-4">
                  <BookCover book={book} size="md" />
                </div>

                {form.childName.trim() && (
                  <div className="mt-5 rounded-2xl bg-brand-50 p-4 text-center">
                    <p className="text-xs text-brown-300">Главный герой</p>
                    <p className="mt-0.5 font-display text-lg font-extrabold text-brand-500">
                      {form.childName.trim()}
                    </p>
                  </div>
                )}

                <dl className="mt-5 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-brown-300">Страниц</dt>
                    <dd className="font-semibold text-brown-dark">{book.pageCount}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-brown-300">Обложка</dt>
                    <dd className="font-semibold text-brown-dark">Твёрдая</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-brown-300">Фото</dt>
                    <dd
                      className={
                        form.photoUrl
                          ? "font-semibold text-sage-500"
                          : "font-semibold text-brown-300"
                      }
                    >
                      {form.photoUrl ? "Загружено" : "Не добавлено"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-cream-200 pt-3">
                    <dt className="text-brown-300">Цена</dt>
                    <dd className="font-display text-lg font-extrabold text-brown-dark">
                      {formatPrice(book.price)}
                    </dd>
                  </div>
                </dl>
              </div>
            </aside>

            {/* ── Steps ── */}
            <div className="order-1 lg:order-2 lg:col-span-3">
              <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
                {/* Step 0 — confirm the chosen story */}
                {step === 0 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-brown-dark">
                        Вы выбрали историю
                      </h2>
                      <p className="mt-1.5 text-[15px] text-brown">
                        Проверьте книгу и продолжайте — дальше добавим имя и фото.
                      </p>
                    </div>

                    <div className="flex flex-col gap-5 rounded-3xl bg-cream-100 p-5 sm:flex-row sm:items-center">
                      <div className="w-32 shrink-0 self-center sm:w-36">
                        <BookCover book={book} size="sm" />
                      </div>
                      <div>
                        <p className="font-display text-lg font-extrabold leading-snug text-brown-dark">
                          {book.title}
                        </p>
                        <p className="mt-1 text-sm text-brown">
                          {book.ageRange} · {book.pageCount} страниц · твёрдая обложка
                        </p>
                        <p className="mt-2 font-display text-xl font-extrabold text-brown-dark">
                          {formatPrice(book.price)}
                        </p>
                      </div>
                    </div>

                    <Button onClick={() => setStep(1)} fullWidth size="lg">
                      Продолжить
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Step 1 — the child */}
                {step === 1 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-brown-dark">
                        Расскажите о ребёнке
                      </h2>
                      <p className="mt-1.5 text-[15px] text-brown">
                        Имя появится в тексте истории.
                      </p>
                    </div>

                    <Input
                      label="Имя ребёнка"
                      placeholder="Например: Максим"
                      value={form.childName}
                      inputMode="text"
                      autoComplete="given-name"
                      lang="ru"
                      onChange={(e) => {
                        const { value, rejected } = sanitizeChildName(
                          e.target.value
                        );
                        setNameRejected(rejected);
                        setForm((f) => ({ ...f, childName: value }));
                      }}
                      onBlur={() => setNameTouched(true)}
                      error={
                        nameRejected
                          ? NAME_ERROR_LATIN
                          : nameTouched && !nameValid
                            ? NAME_ERROR_SHORT
                            : undefined
                      }
                      hint={NAME_HINT}
                    />

                    <Input
                      label="Возраст"
                      type="number"
                      inputMode="numeric"
                      placeholder="5"
                      min={1}
                      max={14}
                      value={form.childAge ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          childAge: e.target.value ? +e.target.value : undefined,
                        }))
                      }
                    />

                    <div>
                      <label
                        htmlFor="dedication"
                        className="mb-1.5 block text-sm font-semibold text-brown-dark"
                      >
                        Посвящение{" "}
                        <span className="font-normal text-brown-300">(необязательно)</span>
                      </label>
                      <textarea
                        id="dedication"
                        rows={3}
                        placeholder="Дорогой Максим! Эта книга для тебя…"
                        value={form.dedication ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dedication: e.target.value }))
                        }
                        className="input-base resize-none"
                      />
                      <p className="mt-1.5 text-xs text-brown-300">
                        Напечатаем на первой странице
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(0)}>
                        <ArrowLeft className="h-4 w-4" />
                        Назад
                      </Button>
                      <Button onClick={() => setStep(2)} disabled={!nameValid} fullWidth>
                        Далее
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2 — the photo */}
                {step === 2 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-brown-dark">
                        Добавьте фотографию
                      </h2>
                      <p className="mt-1.5 text-[15px] text-brown">
                        По этому снимку художник нарисует героя книги. Имя уже
                        сохранили: {form.childName.trim()}.
                      </p>
                    </div>

                    <UploadBox
                      value={form.photoUrl}
                      onChange={handlePhotoChange}
                      busy={uploading}
                    />

                    {uploadError && (
                      <p
                        role="alert"
                        className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium leading-relaxed text-red-600"
                      >
                        {uploadError}
                      </p>
                    )}

                    <ul className="grid gap-2.5 sm:grid-cols-2">
                      {[
                        "Лицо крупным планом",
                        "Хорошее освещение",
                        "Светлый однотонный фон",
                        "Ребёнок смотрит в камеру",
                      ].map((tip) => (
                        <li
                          key={tip}
                          className="flex items-center gap-2.5 rounded-2xl bg-cream-100 px-4 py-3 text-sm text-brown"
                        >
                          <Check className="h-4 w-4 shrink-0 text-sage-500" strokeWidth={2.4} />
                          {tip}
                        </li>
                      ))}
                    </ul>

                    <p className="flex items-start gap-2.5 rounded-2xl bg-sage-50 px-4 py-3.5 text-sm leading-relaxed text-brown">
                      <ShieldCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-sage-500"
                        strokeWidth={2}
                      />
                      Фотография используется только для создания вашей книги. Мы не
                      передаём её третьим лицам и удаляем после выполнения заказа.
                    </p>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(1)}>
                        <ArrowLeft className="h-4 w-4" />
                        Назад
                      </Button>
                      <Button onClick={() => setStep(3)} fullWidth>
                        {form.photoUrl ? "Далее" : "Пропустить"}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3 — review */}
                {step === 3 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="font-display text-xl font-extrabold text-brown-dark">
                        Всё готово
                      </h2>
                      <p className="mt-1.5 text-[15px] text-brown">
                        Проверьте данные — дальше покажем предварительный макет.
                      </p>
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-3xl bg-cream-100 p-5 text-sm">
                      {[
                        { label: "Книга", value: book.shortTitle },
                        { label: "Имя", value: form.childName.trim() },
                        {
                          label: "Возраст",
                          value: form.childAge ? `${form.childAge}` : "—",
                        },
                        { label: "Фото", value: form.photoUrl ? "Загружено" : "Без фото" },
                        {
                          label: "Посвящение",
                          value: form.dedication?.trim() ? "Добавлено" : "—",
                        },
                        { label: "Обложка", value: "Твёрдая" },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <dt className="text-xs text-brown-300">{label}</dt>
                          <dd className="mt-0.5 truncate font-semibold text-brown-dark">
                            {value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div className="flex items-center justify-between rounded-3xl bg-brand-50 px-5 py-4">
                      <span className="text-[15px] font-semibold text-brown">К оплате</span>
                      <span className="font-display text-2xl font-extrabold text-brown-dark">
                        {formatPrice(book.price)}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(2)} disabled={loading}>
                        <ArrowLeft className="h-4 w-4" />
                        Назад
                      </Button>
                      <Button onClick={handleGenerate} isLoading={loading} fullWidth size="lg">
                        {!loading && (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Показать превью
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
