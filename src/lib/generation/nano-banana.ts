import "server-only";

import { readUpload } from "@/lib/storage";
import type {
  GenerateRequest,
  GenerationClient,
  GenerationOutcome,
  GeneratedImage,
} from "./types";

/**
 * Nano Banana illustration client.
 *
 * Complete against the documented REST shape — submit, poll, download. The
 * only missing piece is the credentials: set NANO_BANANA_API_KEY (and
 * NANO_BANANA_API_URL if the endpoint differs) and generation turns on.
 *
 * The source photograph is uploaded as multipart form data read from private
 * storage. We never hand the provider a URL to fetch, because that would mean
 * exposing a publicly reachable copy of a child's photo.
 */

const DEFAULT_API_URL = "https://api.nanobanana.ai/v1";

/** How long to wait for the provider to accept a job before giving up. */
const SUBMIT_TIMEOUT_MS = 60_000;
/** Status polls are cheap and should fail fast. */
const POLL_TIMEOUT_MS = 30_000;
/** Downloading one produced illustration. */
const DOWNLOAD_TIMEOUT_MS = 30_000;
/** Refuse a single result larger than this. */
const MAX_RESULT_BYTES = 25 * 1024 * 1024;

/** Result formats we are willing to store. */
const ACCEPTED_RESULT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

interface Config {
  apiKey: string;
  baseUrl: string;
  /** Optional style preset agreed with the provider for this book series. */
  styleId: string | null;
}

function readConfig(): Config | null {
  const apiKey = process.env.NANO_BANANA_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: (process.env.NANO_BANANA_API_URL?.trim() || DEFAULT_API_URL).replace(
      /\/$/,
      ""
    ),
    styleId: process.env.NANO_BANANA_STYLE_ID?.trim() || null,
  };
}

interface ProviderJobResponse {
  id?: string;
  status?: string;
  error?: string;
  images?: { page?: number; url?: string; width?: number; height?: number }[];
}

/** Provider vocabulary → ours. */
function mapStatus(
  status: unknown
): "processing" | "succeeded" | "failed" | "cancelled" {
  switch (status) {
    case "completed":
    case "succeeded":
      return "succeeded";
    case "queued":
    case "processing":
    case "running":
      return "processing";
    case "cancelled":
    case "canceled":
      // The provider gave up, or an operator stopped it on their side. Never
      // retried: repeating it would just be cancelled again.
      return "cancelled";
    default:
      return "failed";
  }
}

/**
 * A failure worth retrying: transport problems and provider-side capacity,
 * never a rejected input, which would fail identically every time.
 */
function isRetryable(httpStatus: number): boolean {
  return httpStatus === 408 || httpStatus === 429 || httpStatus >= 500;
}

/** Downloads the produced artwork so it lands in our own private storage. */
async function downloadImages(
  images: NonNullable<ProviderJobResponse["images"]>
): Promise<GeneratedImage[]> {
  const results: GeneratedImage[] = [];

  for (const image of images) {
    if (!image.url || typeof image.page !== "number") continue;

    const response = await fetch(image.url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) continue;

    // A provider that starts streaming an enormous file must not exhaust our
    // memory; the declared length is checked before the body is buffered.
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_RESULT_BYTES) continue;

    const data = Buffer.from(await response.arrayBuffer());
    if (data.byteLength === 0 || data.byteLength > MAX_RESULT_BYTES) continue;

    const contentType = (response.headers.get("content-type") ?? "image/png")
      .split(";")[0]!
      .trim();

    // Only formats our storage layer accepts. Anything else is dropped rather
    // than stored under a misleading extension.
    if (!ACCEPTED_RESULT_TYPES.has(contentType)) continue;

    results.push({
      pageNumber: image.page,
      data,
      contentType,
      width: image.width,
      height: image.height,
    });
  }

  return results;
}

async function toOutcome(
  payload: ProviderJobResponse
): Promise<GenerationOutcome> {
  const status = mapStatus(payload.status);

  if (status === "cancelled") {
    return {
      status: "cancelled",
      error: payload.error ?? "Задание отменено провайдером",
    };
  }

  if (status === "failed") {
    return {
      status: "failed",
      // Provider wording is stored on the job for the operator; the customer
      // sees a fixed Russian message.
      error: payload.error ?? "Провайдер отклонил задание",
      retryable: false,
    };
  }

  if (status === "processing") {
    if (!payload.id) {
      return { status: "failed", error: "Ответ без идентификатора", retryable: true };
    }
    return { status: "processing", providerJobId: payload.id };
  }

  const images = await downloadImages(payload.images ?? []);
  if (images.length === 0) {
    return {
      status: "failed",
      error: "Провайдер не вернул изображения",
      retryable: true,
    };
  }

  return { status: "succeeded", images, providerJobId: payload.id };
}

export const nanoBananaClient: GenerationClient = {
  id: "nano_banana",

  isConfigured() {
    return readConfig() !== null;
  },

  async generate(request: GenerateRequest): Promise<GenerationOutcome> {
    const config = readConfig();
    if (!config) {
      return {
        status: "failed",
        error: "Провайдер генерации не настроен",
        retryable: false,
      };
    }

    const photo = await readUpload(request.photoKey);
    if (!photo) {
      return {
        status: "failed",
        error: "Исходная фотография не найдена",
        retryable: false,
      };
    }

    const form = new FormData();
    form.append(
      "photo",
      new Blob([new Uint8Array(photo.bytes)], { type: photo.contentType }),
      "source"
    );
    form.append("child_name", request.childName);
    form.append("book", request.productSlug);
    form.append("pages", request.pageNumbers.join(","));
    if (config.styleId) form.append("style_id", config.styleId);

    try {
      const response = await fetch(`${config.baseUrl}/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}` },
        body: form,
        // Generation is slow; this timeout only covers acceptance of the job.
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
        cache: "no-store",
      });

      const payload = (await response
        .json()
        .catch(() => null)) as ProviderJobResponse | null;

      if (!response.ok) {
        return {
          status: "failed",
          error: payload?.error ?? `HTTP ${response.status}`,
          retryable: isRetryable(response.status),
        };
      }
      if (!payload) {
        return { status: "failed", error: "Пустой ответ провайдера", retryable: true };
      }

      return toOutcome(payload);
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Сетевая ошибка",
        retryable: true,
      };
    }
  },

  async checkJob(providerJobId: string): Promise<GenerationOutcome> {
    const config = readConfig();
    if (!config) {
      return {
        status: "failed",
        error: "Провайдер генерации не настроен",
        retryable: false,
      };
    }

    try {
      const response = await fetch(
        `${config.baseUrl}/generations/${encodeURIComponent(providerJobId)}`,
        {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
          cache: "no-store",
        }
      );

      const payload = (await response
        .json()
        .catch(() => null)) as ProviderJobResponse | null;

      if (!response.ok) {
        return {
          status: "failed",
          error: payload?.error ?? `HTTP ${response.status}`,
          retryable: isRetryable(response.status),
        };
      }
      if (!payload) {
        return { status: "failed", error: "Пустой ответ провайдера", retryable: true };
      }

      return toOutcome(payload);
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Сетевая ошибка",
        retryable: true,
      };
    }
  },
};
