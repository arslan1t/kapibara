import "server-only";

import type { Bucket, StorageDriver, StoredObject } from "./types";

/**
 * Supabase Storage.
 *
 * Uses the REST API directly rather than @supabase/supabase-js: this needs four
 * operations, and the dependency would otherwise pull a realtime client and an
 * auth client into a server bundle that uses neither.
 *
 * The service-role key is required to write and to sign URLs. It is read only
 * on the server and never reaches the browser — see the bundle audit in
 * scripts/check-client-secrets.mjs, which fails the build if it does.
 */

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
  privateBucket: string;
  publicBucket: string;
}

function readConfig(): SupabaseConfig | null {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const privateBucket = process.env.SUPABASE_PRIVATE_BUCKET?.trim();
  const publicBucket = process.env.SUPABASE_PUBLIC_BUCKET?.trim();

  if (!url || !serviceRoleKey || !privateBucket || !publicBucket) return null;

  return {
    url: url.replace(/\/$/, ""),
    serviceRoleKey,
    privateBucket,
    publicBucket,
  };
}

function bucketName(config: SupabaseConfig, bucket: Bucket): string {
  return bucket === "private" ? config.privateBucket : config.publicBucket;
}

function authHeaders(config: SupabaseConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.serviceRoleKey}`,
    apikey: config.serviceRoleKey,
  };
}

export const supabaseDriver: StorageDriver = {
  id: "supabase",

  isConfigured() {
    return readConfig() !== null;
  },

  /**
   * Reads the private bucket's own metadata.
   *
   * Chosen because it fails for exactly the two things worth catching:
   *
   *   • A key that is not service-role. Row-level security hides the bucket
   *     from anon and publishable keys, which report "Bucket not found" rather
   *     than a permission error. Pasting the publishable key here is an easy
   *     mistake — the names are adjacent in the Supabase dashboard — and
   *     without this probe it is only discovered when a customer's upload
   *     fails.
   *   • A private bucket that is not actually private. `public: true` would
   *     make every child's photograph readable by URL, with no other symptom.
   */
  async verify() {
    const config = readConfig();
    if (!config) return { ok: false as const, error: "Supabase не настроен" };

    try {
      const response = await fetch(
        `${config.url}/storage/v1/bucket/${config.privateBucket}`,
        { headers: authHeaders(config), signal: AbortSignal.timeout(10_000) }
      );

      if (!response.ok) {
        return {
          ok: false as const,
          error:
            `Бакет «${config.privateBucket}» недоступен (HTTP ${response.status}). ` +
            "Обычная причина — в SUPABASE_SERVICE_ROLE_KEY записан не тот ключ: " +
            "нужен service_role, а не publishable.",
        };
      }

      const bucket = (await response.json()) as { public?: boolean };
      if (bucket.public === true) {
        return {
          ok: false as const,
          error:
            `Бакет «${config.privateBucket}» помечен как публичный. ` +
            "Фотографии детей были бы доступны по прямой ссылке.",
        };
      }

      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error: error instanceof Error ? error.message : "Нет связи с хранилищем",
      };
    }
  },

  async put(bucket, key, bytes, contentType) {
    const config = readConfig();
    if (!config) throw new Error("Supabase storage is not configured");

    const response = await fetch(
      `${config.url}/storage/v1/object/${bucketName(config, bucket)}/${key}`,
      {
        method: "POST",
        headers: {
          ...authHeaders(config),
          "Content-Type": contentType,
          "Cache-Control":
            bucket === "public" ? "public, max-age=31536000, immutable" : "no-store",
        },
        body: new Uint8Array(bytes),
        signal: AbortSignal.timeout(30_000),
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase upload failed with HTTP ${response.status}`);
    }
  },

  async get(bucket, key): Promise<StoredObject | null> {
    const config = readConfig();
    if (!config) throw new Error("Supabase storage is not configured");

    try {
      const response = await fetch(
        `${config.url}/storage/v1/object/${bucketName(config, bucket)}/${key}`,
        {
          headers: authHeaders(config),
          signal: AbortSignal.timeout(30_000),
          cache: "no-store",
        }
      );
      if (!response.ok) return null;

      return {
        bytes: Buffer.from(await response.arrayBuffer()),
        contentType:
          response.headers.get("content-type") ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  },

  async remove(bucket, key) {
    const config = readConfig();
    if (!config) throw new Error("Supabase storage is not configured");

    await fetch(
      `${config.url}/storage/v1/object/${bucketName(config, bucket)}/${key}`,
      {
        method: "DELETE",
        headers: authHeaders(config),
        signal: AbortSignal.timeout(15_000),
      }
    ).catch(() => {
      // Already gone, or never written — deletion is idempotent by intent.
    });
  },

  async signedUrl(bucket, key, expiresInSeconds) {
    const config = readConfig();
    if (!config) return null;

    try {
      const response = await fetch(
        `${config.url}/storage/v1/object/sign/${bucketName(config, bucket)}/${key}`,
        {
          method: "POST",
          headers: { ...authHeaders(config), "Content-Type": "application/json" },
          body: JSON.stringify({ expiresIn: expiresInSeconds }),
          signal: AbortSignal.timeout(15_000),
        }
      );
      if (!response.ok) return null;

      const data = (await response.json()) as { signedURL?: string };
      if (!data.signedURL) return null;

      // The API returns a path relative to /storage/v1.
      return `${config.url}/storage/v1${data.signedURL}`;
    } catch {
      return null;
    }
  },

  publicUrl(key) {
    const config = readConfig();
    if (!config) return `/api/product-images/${key}`;
    return `${config.url}/storage/v1/object/public/${config.publicBucket}/${key}`;
  },
};
