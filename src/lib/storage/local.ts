import "server-only";

import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { Bucket, StorageDriver, StoredObject } from "./types";

/**
 * Local filesystem storage.
 *
 * The default in development, because it makes the whole application runnable
 * with no cloud account. Usable in production only on a host with a real,
 * persistent disk — a VPS — and only with UPLOAD_DIR and PRODUCT_IMAGE_DIR
 * pointed outside the application tree, which the standalone build replaces on
 * every deploy. `assertStorageReady()` in ./index.ts checks exactly that and
 * refuses to start otherwise, so the mistake cannot be made silently.
 *
 * On a platform with an ephemeral or per-instance filesystem (Vercel, Cloud
 * Run, containers behind a load balancer) no path is durable and this driver
 * must not be used at all.
 *
 * For the Uzbek deployment it is the point rather than a compromise: a child's
 * photograph has to stay inside the country, and a disk in Tashkent does that.
 */

function dirFor(bucket: Bucket): string {
  const configured =
    bucket === "private"
      ? process.env.UPLOAD_DIR
      : process.env.PRODUCT_IMAGE_DIR;

  return path.resolve(
    process.cwd(),
    configured ?? (bucket === "private" ? "private-uploads" : "public-uploads")
  );
}

/** Keys are generated UUIDs; anything else is refused rather than joined. */
function safePath(bucket: Bucket, key: string): string | null {
  if (!/^[a-zA-Z0-9._-]+$/.test(key) || key.includes("..")) return null;

  const dir = dirFor(bucket);
  const full = path.resolve(dir, key);

  // Even with the pattern above, confirm the result stayed inside the
  // directory: this is the check that actually prevents traversal.
  return full.startsWith(dir + path.sep) ? full : null;
}

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

export const localDriver: StorageDriver = {
  id: "local",

  isConfigured() {
    return true;
  },

  /**
   * Confirms the storage root is actually writable.
   *
   * There is no credential to check, but a read-only or missing mount is a
   * real way for this driver to be broken, and it is silent until the first
   * upload. `assertStorageReady` separately refuses this driver in production.
   */
  async verify() {
    try {
      for (const bucket of ["private", "public"] as const) {
        const dir = dirFor(bucket);
        await mkdir(dir, { recursive: true });
        const probe = path.join(dir, ".write-probe");
        await writeFile(probe, "");
        await unlink(probe);
      }
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof Error
            ? `Каталог хранилища недоступен для записи: ${error.message}`
            : "Каталог хранилища недоступен для записи",
      };
    }
  },

  async put(bucket, key, bytes) {
    const full = safePath(bucket, key);
    if (!full) throw new Error("Invalid storage key");

    await mkdir(dirFor(bucket), { recursive: true });
    // Private objects are owner-only on disk; public ones are world-readable
    // because a static server will need to read them.
    await writeFile(full, bytes, { mode: bucket === "private" ? 0o600 : 0o644 });
  },

  async get(bucket, key): Promise<StoredObject | null> {
    const full = safePath(bucket, key);
    if (!full) return null;

    try {
      const bytes = await readFile(full);
      const ext = key.split(".").pop()?.toLowerCase() ?? "";
      return {
        bytes,
        contentType: CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  },

  async remove(bucket, key) {
    const full = safePath(bucket, key);
    if (!full) return;
    try {
      await unlink(full);
    } catch {
      // Already removed — nothing to do.
    }
  },

  async signedUrl() {
    // There is no way to sign a filesystem path. Callers fall back to streaming
    // through the authenticated route, which is the behaviour this driver had
    // before signed URLs existed.
    return null;
  },

  publicUrl(key) {
    return `/api/product-images/${key}`;
  },
};
