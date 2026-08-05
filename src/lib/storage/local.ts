import "server-only";

import { mkdir, writeFile, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import type { Bucket, StorageDriver, StoredObject } from "./types";

/**
 * Local filesystem storage — development only.
 *
 * Kept because it makes the whole application runnable with no cloud account,
 * which is worth a lot when onboarding or running tests. It is not suitable for
 * production: on any platform with an ephemeral or per-instance filesystem
 * (Vercel, Cloud Run, Fly machines, containers behind a load balancer) files
 * vanish on deploy or are invisible to the other instances.
 *
 * `assertStorageReady()` in ./index.ts refuses to start with this driver when
 * NODE_ENV is production, so the mistake cannot be made silently.
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
