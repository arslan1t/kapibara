"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Trash2, ArrowUp, ArrowDown, AlertCircle, Star } from "lucide-react";
import {
  addProductImage,
  deleteProductImageById,
  reorderProductImages,
} from "@/app/actions/admin";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
}

/**
 * Gallery management for one product.
 *
 * Reordering uses explicit up/down buttons rather than drag-and-drop: this runs
 * on touch screens too, and buttons are reachable by keyboard without any extra
 * work.
 */
export default function ProductGalleryManager({
  productId,
  images,
}: {
  productId: string;
  images: GalleryImage[];
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const disabled = busy || pending;

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function upload() {
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Выберите файл");
      return;
    }
    if (alt.trim().length < 3) {
      setError("Опишите изображение — это нужно для доступности");
      return;
    }

    setError(null);
    setBusy(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch("/api/admin/product-images", {
        method: "POST",
        body,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? "Не удалось загрузить файл");
        return;
      }

      const attached = await addProductImage({
        productId,
        key: data.key,
        alt,
      });
      if (!attached.ok) {
        setError(attached.error);
        return;
      }

      setAlt("");
      if (fileInput.current) fileInput.current.value = "";
      refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(imageId: string) {
    setError(null);
    setBusy(true);
    const result = await deleteProductImageById(imageId);
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
  }

  async function move(index: number, delta: number) {
    const next = [...images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target]!, next[index]!];

    setError(null);
    setBusy(true);
    const result = await reorderProductImages(
      productId,
      next.map((i) => i.id)
    );
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
  }

  return (
    <div>
      <h2 className="font-display text-lg font-extrabold text-brown-dark">
        Галерея
      </h2>
      <p className="mt-1 text-sm text-brown">
        Первое изображение используется как обложка в каталоге.
      </p>

      {images.length === 0 ? (
        <p className="mt-4 rounded-xl bg-cream-100 p-4 text-sm text-brown">
          Изображений пока нет. Загрузите первое ниже.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="rounded-xl bg-cream-50 p-3">
              <div className="relative">
                <Image
                  src={image.url}
                  alt={image.alt}
                  width={300}
                  height={300}
                  unoptimized
                  className="aspect-square w-full rounded-lg object-cover"
                />
                {image.isPrimary && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-brown-dark">
                    <Star className="h-3 w-3 fill-gold-300 text-gold-300" aria-hidden="true" />
                    Обложка
                  </span>
                )}
              </div>

              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-brown">
                {image.alt}
              </p>

              <div className="mt-2 flex items-center gap-1">
                <button
                  type="button"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Переместить выше"
                  className="rounded-lg bg-white p-1.5 text-brown-dark transition-opacity hover:opacity-70 disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled || index === images.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Переместить ниже"
                  className="rounded-lg bg-white p-1.5 text-brown-dark transition-opacity hover:opacity-70 disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(image.id)}
                  aria-label={`Удалить изображение: ${image.alt}`}
                  className="ml-auto rounded-lg bg-red-50 p-1.5 text-red-600 transition-opacity hover:opacity-70 disabled:opacity-40"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-xl border border-dashed border-cream-400 p-4">
        <label
          htmlFor={`gallery-alt-${productId}`}
          className="text-sm font-medium text-brown-dark"
        >
          Описание изображения
        </label>
        <input
          id={`gallery-alt-${productId}`}
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Например: разворот книги — мальчик и Колёсик в лесу"
          className="mt-1.5 w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-sm text-brown-dark focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />

        <label
          htmlFor={`gallery-file-${productId}`}
          className="mt-3 block text-sm font-medium text-brown-dark"
        >
          Файл
        </label>
        <input
          id={`gallery-file-${productId}`}
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1.5 w-full text-sm text-brown file:mr-3 file:rounded-full file:border-0 file:bg-cream-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brown-dark"
        />

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={upload}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-brown-dark px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          {busy ? "Загружаем…" : "Загрузить изображение"}
        </button>
      </div>
    </div>
  );
}
