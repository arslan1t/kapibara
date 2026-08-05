"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

/**
 * Product gallery.
 *
 * Mobile gets a native scroll-snap carousel, so swiping is the real browser
 * gesture rather than a JS reimplementation. Desktop gets a large stage with
 * thumbnails. Both share arrow keys, a counter and a fullscreen view.
 */
export default function ProductGallery({ images }: { images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const count = images.length;

  const go = useCallback(
    (next: number) => {
      const clamped = (next + count) % count;
      setIndex(clamped);
      // Keep the mobile scroller in step when navigation comes from elsewhere.
      const track = trackRef.current;
      if (track) {
        track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
      }
    },
    [count]
  );

  // Arrow keys work whenever the gallery (or the lightbox) has focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (zoomed && e.key === "Escape") {
        setZoomed(false);
        return;
      }
      const active = document.activeElement;
      const inside =
        zoomed || (stageRef.current?.contains(active as Node) ?? false);
      if (!inside) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(index + 1);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, zoomed, go]);

  // Lock background scrolling while the lightbox is open.
  useEffect(() => {
    document.body.style.overflow = zoomed ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [zoomed]);

  if (count === 0) return null;

  return (
    <div ref={stageRef}>
      {/* ── Mobile: real swipe via scroll-snap ── */}
      <div
        ref={trackRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          const next = Math.round(el.scrollLeft / el.clientWidth);
          if (next !== index) setIndex(next);
        }}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide rounded-4xl md:hidden"
        role="group"
        aria-roledescription="карусель"
        aria-label="Фотографии книги"
      >
        {images.map((img, i) => (
          <div
            key={img.id}
            className="w-full shrink-0 snap-center"
            role="group"
            aria-roledescription="слайд"
            aria-label={`${i + 1} из ${count}`}
          >
            <Image
              src={img.url}
              alt={img.alt}
              width={1254}
              height={1254}
              priority={i === 0}
              sizes="100vw"
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* ── Desktop: stage + thumbnails ── */}
      <div className="relative hidden overflow-hidden rounded-4xl bg-cream-100 md:block">
        <Image
          key={images[index].id}
          src={images[index].url}
          alt={images[index].alt}
          width={1254}
          height={1254}
          priority
          sizes="(min-width: 1024px) 40vw, 90vw"
          className="aspect-square w-full animate-fade-in object-cover"
        />

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Предыдущая фотография"
          className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown-dark shadow-soft backdrop-blur transition-transform hover:scale-105"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Следующая фотография"
          className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brown-dark shadow-soft backdrop-blur transition-transform hover:scale-105"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>

        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Открыть фотографию во весь экран"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-brown-dark shadow-soft backdrop-blur transition-transform hover:scale-105"
        >
          <Expand className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {/* ── Counter + dots (mobile) ── */}
      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex gap-1.5 md:hidden">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Перейти к фотографии ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-brand-500" : "w-2 bg-cream-400"
              )}
            />
          ))}
        </div>
        <p
          aria-live="polite"
          className="ml-auto text-sm font-semibold text-brown-400"
        >
          {index + 1} / {count}
        </p>
      </div>

      {/* ── Thumbnails (desktop) ── */}
      <ul className="mt-3 hidden grid-cols-6 gap-2 md:grid">
        {images.map((img, i) => (
          <li key={img.id}>
            <button
              type="button"
              onClick={() => go(i)}
              aria-label={`Показать фотографию ${i + 1}: ${img.alt}`}
              aria-current={i === index}
              className={cn(
                "block w-full overflow-hidden rounded-xl ring-2 transition-all duration-300",
                i === index
                  ? "ring-brand-500"
                  : "ring-transparent hover:ring-brand-200"
              )}
            >
              <Image
                src={img.url}
                alt=""
                width={200}
                height={200}
                sizes="120px"
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {/* ── Fullscreen ── */}
      {zoomed && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Просмотр фотографии"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-brown-dark/95 p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            type="button"
            onClick={() => setZoomed(false)}
            aria-label="Закрыть"
            autoFocus
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-brown-dark"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>

          <Image
            src={images[index].url}
            alt={images[index].alt}
            width={1254}
            height={1254}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-auto max-w-full rounded-2xl object-contain"
          />

          <p className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-brown-dark">
            {index + 1} / {count}
          </p>
        </div>
      )}
    </div>
  );
}
