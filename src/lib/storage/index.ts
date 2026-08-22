import "server-only";

import { randomUUID } from "node:crypto";
import type { Bucket, StorageDriver, StorageVerification } from "./types";
import { localDriver } from "./local";
import { s3Driver } from "./s3";
import { supabaseDriver } from "./supabase";

export type { Bucket, StorageDriver, StoredObject, StorageVerification } from "./types";

/**
 * Storage facade.
 *
 * Everything in the application goes through here rather than touching a driver
 * directly, so switching between local disk, S3 and Supabase is a configuration
 * change. The rules that must hold regardless of driver live here too: what a
 * key may look like, what may be uploaded, and which bucket a given kind of
 * file belongs in.
 */

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

/** Only formats we can actually print from. */
export const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

const EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

/**
 * The shape every key we mint has: a UUID plus a known extension.
 *
 * Enforced on the way out (we only ever generate this) and on the way in
 * (anything else is refused before it reaches a driver), so a crafted key
 * cannot escape a bucket or address an unexpected object.
 */
const KEY_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp|heic)$/i;

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

/** How long a signed URL for private content stays valid. */
export const SIGNED_URL_TTL_SECONDS = 300;

// ─── Driver selection ─────────────────────────────────────────────────────────

const DRIVERS: Record<string, StorageDriver> = {
  local: localDriver,
  s3: s3Driver,
  supabase: supabaseDriver,
};

/**
 * Chosen by STORAGE_DRIVER, defaulting to whichever cloud driver is fully
 * configured. The explicit variable wins so a half-set S3 configuration cannot
 * silently take over from a working Supabase one.
 */
export function activeDriver(): StorageDriver {
  const requested = process.env.STORAGE_DRIVER?.trim();
  if (requested && DRIVERS[requested]) return DRIVERS[requested]!;

  if (supabaseDriver.isConfigured()) return supabaseDriver;
  if (s3Driver.isConfigured()) return s3Driver;
  return localDriver;
}

export interface StorageStatus {
  driver: StorageDriver["id"];
  configured: boolean;
  /** True when this driver is safe to run in production. */
  durable: boolean;
}

/**
 * Asks the active driver to prove its configuration actually works.
 *
 * Separate from `storageStatus` because this one costs a network round trip:
 * callers that only need to know which driver is selected should not pay for
 * it, and it must never sit on a customer request path.
 */
export async function verifyStorage(): Promise<StorageVerification> {
  return activeDriver().verify();
}

export function storageStatus(): StorageStatus {
  const driver = activeDriver();
  return {
    driver: driver.id,
    configured: driver.isConfigured(),
    durable: driver.id !== "local",
  };
}

/**
 * Fails fast on a misconfigured production deployment.
 *
 * Called from the health check and the worker entry point. Local storage in
 * production means customer photographs disappear on the next deploy, which is
 * worth refusing to start over rather than discovering from a support ticket.
 */
export function assertStorageReady(): void {
  const status = storageStatus();

  if (process.env.NODE_ENV === "production" && !status.durable) {
    throw new Error(
      "STORAGE_DRIVER=local cannot be used in production: uploaded files would " +
        "be lost on deploy. Configure Supabase Storage or S3 — see README §5."
    );
  }
  if (!status.configured) {
    throw new Error(
      `Storage driver "${status.driver}" is selected but not fully configured.`
    );
  }
}

// ─── Writing ──────────────────────────────────────────────────────────────────

export type UploadResult = { ok: true; key: string } | { ok: false; error: string };

interface FileCheck {
  ok: boolean;
  error?: string;
}

/**
 * Validates an uploaded file before a byte is written.
 *
 * The declared MIME type is checked against the real magic bytes: a browser
 * will happily label a PDF as image/png, and the illustration provider would
 * then reject the job after we had already stored and billed for it.
 */
export function checkUpload(file: File, bytes: Buffer): FileCheck {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: "Поддерживаются форматы JPG, PNG, WEBP и HEIC" };
  }
  if (bytes.byteLength === 0) return { ok: false, error: "Файл пустой" };
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "Файл больше 8 МБ — выберите фотографию поменьше" };
  }
  if (!sniffMatches(file.type, bytes)) {
    return {
      ok: false,
      error: "Файл не похож на изображение. Загрузите фотографию в JPG или PNG",
    };
  }
  return { ok: true };
}

/** Magic-byte check for the formats we accept. */
function sniffMatches(declared: string, bytes: Buffer): boolean {
  if (bytes.length < 12) return false;

  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng =
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47;
  const isRiff = bytes.subarray(0, 4).toString("ascii") === "RIFF";
  const isWebp = isRiff && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  // HEIC and friends are ISO-BMFF: a "ftyp" box at offset 4.
  const isHeic = bytes.subarray(4, 8).toString("ascii") === "ftyp";

  switch (declared) {
    case "image/jpeg":
      return isJpeg;
    case "image/png":
      return isPng;
    case "image/webp":
      return isWebp;
    case "image/heic":
      return isHeic;
    default:
      return false;
  }
}

async function putFile(
  bucket: Bucket,
  file: File
): Promise<UploadResult> {
  const bytes = Buffer.from(await file.arrayBuffer());

  const check = checkUpload(file, bytes);
  if (!check.ok) return { ok: false, error: check.error! };

  // The name is generated, never derived from user input, so a crafted
  // filename cannot escape the bucket or end in an executable extension.
  const key = `${randomUUID()}.${EXTENSION[file.type]}`;

  try {
    await activeDriver().put(bucket, key, bytes, file.type);
    return { ok: true, key };
  } catch {
    return { ok: false, error: "Не удалось загрузить файл. Попробуйте ещё раз" };
  }
}

/** Stores a customer's photograph. Private bucket. */
export function saveUpload(file: File): Promise<UploadResult> {
  return putFile("private", file);
}

/** Stores catalogue artwork. Public bucket. */
export function saveProductImage(file: File): Promise<UploadResult> {
  return putFile("public", file);
}

/**
 * Stores bytes the application produced — currently generated illustrations.
 * Private, for the same reason as the source photograph: it contains a face.
 */
export async function saveGenerated(
  bytes: Buffer,
  contentType: string
): Promise<UploadResult> {
  const extension = EXTENSION[contentType];
  if (!extension) return { ok: false, error: "Неподдерживаемый формат" };
  if (bytes.byteLength === 0) return { ok: false, error: "Пустой файл" };
  if (bytes.byteLength > MAX_UPLOAD_BYTES * 4) {
    return { ok: false, error: "Изображение слишком большое" };
  }

  const key = `${randomUUID()}.${extension}`;

  try {
    await activeDriver().put("private", key, bytes, contentType);
    return { ok: true, key };
  } catch {
    return { ok: false, error: "Не удалось сохранить изображение" };
  }
}

// ─── Reading ──────────────────────────────────────────────────────────────────

/**
 * Reads a private object.
 *
 * Callers MUST have established that the requester is allowed to see it; this
 * function performs no authorization of its own.
 */
export async function readUpload(key: string) {
  if (!isValidKey(key)) return null;
  return activeDriver().get("private", key);
}

export async function readProductImage(key: string) {
  if (!isValidKey(key)) return null;
  return activeDriver().get("public", key);
}

export async function deleteProductImage(key: string): Promise<void> {
  if (!isValidKey(key)) return;
  await activeDriver().remove("public", key);
}

export async function deleteUpload(key: string): Promise<void> {
  if (!isValidKey(key)) return;
  await activeDriver().remove("private", key);
}

/**
 * Short-lived URL for a private object, or null when the driver cannot sign.
 *
 * Same rule as `readUpload`: authorize first. A signed URL is a bearer token
 * for that one object, so it is only ever handed to a requester already proven
 * to be entitled to it, and expires in five minutes.
 */
export async function signedUrlFor(
  key: string,
  /**
   * Override the default lifetime. The illustration provider needs longer than
   * a browser does: it fetches the image on its own schedule, and a link that
   * expires mid-queue fails the job for no good reason. Keep it as short as the
   * caller can tolerate.
   */
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!isValidKey(key)) return null;
  return activeDriver().signedUrl("private", key, ttlSeconds);
}

/** Where a public object lives. Used when recording a product image. */
export function publicUrlFor(key: string): string {
  return activeDriver().publicUrl(key);
}
