import "server-only";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { Bucket, StorageDriver, StoredObject } from "./types";

/**
 * S3-compatible object storage.
 *
 * Works with AWS S3, Cloudflare R2, Backblaze B2, MinIO, Yandex Object Storage
 * and Supabase's S3 endpoint — anything speaking the S3 API. Two buckets are
 * configured separately so the private one can have public access blocked at
 * the bucket policy level, independently of the public one.
 *
 * Nothing here makes an object public: the private bucket must be private in
 * the provider's own configuration too. This code assumes that and mints
 * short-lived signed URLs rather than relying on obscurity.
 */

interface S3Config {
  region: string;
  endpoint: string | undefined;
  accessKeyId: string;
  secretAccessKey: string;
  privateBucket: string;
  publicBucket: string;
  /** Needed by R2, MinIO and most non-AWS providers. */
  forcePathStyle: boolean;
  /** CDN or bucket origin for public objects. */
  publicBaseUrl: string | undefined;
}

function readConfig(): S3Config | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();
  const privateBucket = process.env.S3_PRIVATE_BUCKET?.trim();
  const publicBucket = process.env.S3_PUBLIC_BUCKET?.trim();

  if (!accessKeyId || !secretAccessKey || !privateBucket || !publicBucket) {
    return null;
  }

  return {
    region: process.env.S3_REGION?.trim() || "auto",
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    accessKeyId,
    secretAccessKey,
    privateBucket,
    publicBucket,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.trim() || undefined,
  };
}

let cached: { key: string; client: S3Client } | null = null;

function getClient(config: S3Config): S3Client {
  const key = `${config.endpoint ?? "aws"}:${config.region}:${config.accessKeyId}`;
  if (cached?.key === key) return cached.client;

  const client = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  cached = { key, client };
  return client;
}

function bucketName(config: S3Config, bucket: Bucket): string {
  return bucket === "private" ? config.privateBucket : config.publicBucket;
}

export const s3Driver: StorageDriver = {
  id: "s3",

  isConfigured() {
    return readConfig() !== null;
  },

  /**
   * HEAD on both buckets: proves the credential is accepted and that each
   * bucket exists and is reachable by this identity. Cheap enough for a health
   * check, and catches a wrong key, a typo'd bucket name, and a missing policy
   * — none of which `isConfigured` can see.
   */
  async verify() {
    const config = readConfig();
    if (!config) return { ok: false as const, error: "S3 не настроен" };

    try {
      const client = getClient(config);
      for (const bucket of [config.privateBucket, config.publicBucket]) {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      }
      return { ok: true as const };
    } catch (error) {
      return {
        ok: false as const,
        error:
          error instanceof Error
            ? `Бакет недоступен: ${error.message}`
            : "Бакет недоступен",
      };
    }
  },

  async put(bucket, key, bytes, contentType) {
    const config = readConfig();
    if (!config) throw new Error("S3 storage is not configured");

    await getClient(config).send(
      new PutObjectCommand({
        Bucket: bucketName(config, bucket),
        Key: key,
        Body: bytes,
        ContentType: contentType,
        // Belt and braces: even if the bucket policy is wrong, an object
        // written here is not world-readable.
        ACL: bucket === "private" ? "private" : "public-read",
        // A key is a fresh UUID, so a given key's bytes never change.
        CacheControl:
          bucket === "public"
            ? "public, max-age=31536000, immutable"
            : "private, no-store",
      })
    );
  },

  async get(bucket, key): Promise<StoredObject | null> {
    const config = readConfig();
    if (!config) throw new Error("S3 storage is not configured");

    try {
      const response = await getClient(config).send(
        new GetObjectCommand({ Bucket: bucketName(config, bucket), Key: key })
      );
      if (!response.Body) return null;

      const bytes = Buffer.from(await response.Body.transformToByteArray());
      return {
        bytes,
        contentType: response.ContentType ?? "application/octet-stream",
      };
    } catch {
      // Missing object, or no permission to read it — indistinguishable to the
      // caller on purpose.
      return null;
    }
  },

  async remove(bucket, key) {
    const config = readConfig();
    if (!config) throw new Error("S3 storage is not configured");

    await getClient(config).send(
      new DeleteObjectCommand({ Bucket: bucketName(config, bucket), Key: key })
    );
  },

  async signedUrl(bucket, key, expiresInSeconds) {
    const config = readConfig();
    if (!config) return null;

    return getSignedUrl(
      getClient(config),
      new GetObjectCommand({ Bucket: bucketName(config, bucket), Key: key }),
      { expiresIn: expiresInSeconds }
    );
  },

  publicUrl(key) {
    const config = readConfig();
    if (!config) return `/api/product-images/${key}`;

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
    }
    if (config.endpoint) {
      const base = config.endpoint.replace(/\/$/, "");
      return config.forcePathStyle
        ? `${base}/${config.publicBucket}/${key}`
        : `${base.replace("://", `://${config.publicBucket}.`)}/${key}`;
    }
    return `https://${config.publicBucket}.s3.${config.region}.amazonaws.com/${key}`;
  },
};
