"use client";

import { useRef, useState } from "react";
import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface UploadBoxProps {
  value?: string;
  onChange: (url: string | undefined, file?: File) => void;
  /** The file is on its way to storage. */
  busy?: boolean;
  className?: string;
}

export default function UploadBox({ value, onChange, busy, className }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onChange(url, file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  if (value) {
    return (
      <div className={cn("relative rounded-2xl overflow-hidden", className)}>
        <Image
          src={value}
          alt="Фото ребёнка"
          width={200}
          height={200}
          className="h-48 w-full object-cover"
        />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <p className="text-sm font-semibold text-brown-dark">Загружаем…</p>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent p-3">
          <button
            disabled={busy}
            onClick={() => onChange(undefined)}
            className="flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-brown-dark hover:bg-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Удалить фото
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 transition-all duration-200",
        dragging
          ? "border-accent bg-brand-50"
          : "border-cream-300 bg-cream-100 hover:border-brand-200 hover:bg-brand-50",
        className
      )}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
        {dragging ? (
          <Camera className="h-7 w-7 text-accent" />
        ) : (
          <Upload className="h-7 w-7 text-brand-500" />
        )}
      </div>
      <p className="text-sm font-semibold text-brown-dark">
        {dragging ? "Отпустите фото" : "Загрузите фото"}
      </p>
      <p className="mt-1 text-xs text-brown-400 text-center">
        Перетащите или нажмите, чтобы выбрать.
        <br />
        JPG, PNG · до 10 МБ
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
