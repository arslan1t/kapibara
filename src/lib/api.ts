/**
 * Client-side helpers for the personalization flow.
 *
 * Orders, accounts, products and admin operations all go through server
 * actions now (`src/app/actions/*`) — this file only holds the pieces the
 * browser genuinely needs before an order exists.
 */
import type { Book, GeneratedProject, PersonalizationData } from "@/types";

const PROJECTS_STORAGE_KEY = "kapibara-projects";

/**
 * Uploads a photo to private storage and returns its opaque key.
 * The file is never made publicly reachable.
 */
export async function uploadChildPhoto(
  file: File
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const body = new FormData();
  body.append("file", file);

  try {
    const response = await fetch("/api/upload", { method: "POST", body });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data?.error ?? "Не удалось загрузить файл" };
    }
    return { ok: true, key: data.key as string };
  } catch {
    return { ok: false, error: "Не удалось загрузить файл. Проверьте соединение" };
  }
}

/**
 * Stores the in-progress personalization so the preview screen can read it
 * back. This is a draft only — the order itself is written server-side.
 */
export async function createPersonalization(
  data: PersonalizationData,
  book: Book
): Promise<GeneratedProject> {
  const project: GeneratedProject = {
    id: `proj_${Date.now()}`,
    userId: "local",
    bookId: data.bookId,
    book,
    personalization: data,
    // No AI is connected yet, so there is no generated artwork to show.
    previewImages: [],
    status: "ready",
    createdAt: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
      const map = raw ? JSON.parse(raw) : {};
      map[project.id] = project;
      window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Storage unavailable — the flow still works for this session.
    }
  }

  return project;
}

export async function getPreview(
  projectId: string
): Promise<GeneratedProject | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw)[projectId] ?? null;
  } catch {
    return null;
  }
}
