import "server-only";

import { signedUrlFor } from "@/lib/storage";
import { sceneById, sceneUrl } from "./scenes";
import type {
  GenerateRequest,
  GenerationClient,
  GenerationOutcome,
  GeneratedImage,
} from "./types";

/**
 * Illustration provider — Nano Banana Pro, via kie.ai.
 *
 * Two images go in and one comes out:
 *
 *   image_input[0]  a reference scene, chosen by the child's age. Fixes the
 *                   world, the palette and the lighting, so books in a series
 *                   look like a series rather than four unrelated products.
 *   image_input[1]  the child's photograph. Fixes who the character is.
 *
 * The provider fetches both by URL rather than accepting an upload, which
 * decides how the photograph is passed: a signed link to the private object,
 * valid for minutes. The alternative — copying the child's photo somewhere
 * publicly readable — is not one.
 *
 * Shapes below were established against the live API, not from documentation:
 *
 *   POST /api/v1/jobs/createTask   -> {code, msg, data:{taskId, recordId}}
 *   GET  /api/v1/jobs/recordInfo   -> {code, msg, data:{state, resultJson,
 *                                      failCode, failMsg, ...}}
 *   state: waiting | queuing | generating | success | fail
 *   resultJson is a JSON *string* holding {resultUrls: [...]}.
 */

const DEFAULT_API_URL = "https://api.kie.ai/api/v1";
const DEFAULT_MODEL = "nano-banana-pro";

const SUBMIT_TIMEOUT_MS = 60_000;
const POLL_TIMEOUT_MS = 30_000;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_RESULT_BYTES = 25 * 1024 * 1024;

/** How long the provider gets to fetch the child's photograph. */
const PHOTO_LINK_TTL_SECONDS = 900;

const ACCEPTED_RESULT_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * The instruction that does the actual work.
 *
 * Written as two strict roles — Img 1 supplies the world, Img 2 supplies the
 * person — because without that separation the model blends both and returns a
 * child who resembles nobody. The realism clauses are what keep the result a
 * recognisable photograph of *this* child rather than a cartoon of a generic
 * one, which is the entire product.
 */
const COMPOSITION_PROMPT = `Use Img 1 (Pixar scene) STRICTLY for the stylized environment, background, fantasy props, and the entire lighting scheme — preserve the saturated rim lights, soft stylized fill light, magical glow, and vibrant color temperatures native to Pixar animation. Apply this Pixar lighting directly onto the human character so that they physically react to it.

Use Img 2 (real person) STRICTLY for the central character — identity, facial structure, hair, exact outfit, skin color, and clothing patterns.

The human must have fully realistic anatomy — natural skeletal structure, normal shoulder width, proper proportions, naturally shaped face. Absolutely NO oversized cartoon eyes, NO rubbery limbs, NO exaggerated expressions.

Skin texture must be photorealistic and flawless — visible natural micro-wrinkles, healthy subsurface scattering, and radiant glow, but completely clear: no acne, no pimples, no blackheads, no redness, no blemishes, no scars. Like a high-end beauty editorial — living skin at its absolute best.

Now integrate this hyper-realistic person into the Pixar fairy-tale world seamlessly and carefully:

Cast accurate soft contact shadows from the person onto the stylized cartoon ground, matching the Pixar light direction.

Apply strong ambient color bleeding (bounce light) from the vibrant Pixar environment onto the human's skin and clothing — e.g., green reflection from grass, warm orange from the sun, blue from the sky.

The human must catch those signature Pixar rim lights (backlighting) on their shoulders and hair.

Final result: a living, breathing real-world person with flawless skin and human proportions, carefully placed inside a colorful Pixar dreamscape, fully lit by its magic — blending gently through light, shadow, and color reflection. Keep shallow depth-of-field (bokeh) on the background to isolate the realistic subject.`;

interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
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
    model: process.env.NANO_BANANA_MODEL?.trim() || DEFAULT_MODEL,
  };
}

// ─── Response shapes ──────────────────────────────────────────────────────────

interface Envelope<T> {
  code?: number;
  msg?: string;
  data?: T;
}

interface CreateTaskData {
  taskId?: string;
  recordId?: string;
}

interface RecordInfoData {
  taskId?: string;
  state?: string;
  resultJson?: string | null;
  failCode?: string | number | null;
  failMsg?: string | null;
}

/** States that mean "still working". Anything unknown is treated as a failure. */
const PENDING_STATES = new Set(["waiting", "queuing", "queued", "generating", "processing"]);

/**
 * HTTP statuses worth trying again.
 *
 * 429 and 5xx are the provider being busy or broken. Everything else — a
 * rejected image, a malformed request, an exhausted balance — repeats
 * identically and only burns credits.
 */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

// ─── Client ───────────────────────────────────────────────────────────────────

export const nanoBananaClient: GenerationClient = {
  id: "nano_banana",

  isConfigured() {
    return readConfig() !== null;
  },

  async generate(request: GenerateRequest): Promise<GenerationOutcome> {
    const config = readConfig();
    if (!config) {
      return { status: "failed", error: "Провайдер не настроен", retryable: false };
    }

    // A signed link rather than a copy: the provider fetches it once, and the
    // link stops working long before anyone could pass it on.
    const photoUrl = await signedUrlFor(request.photoKey, PHOTO_LINK_TTL_SECONDS);
    if (!photoUrl) {
      return {
        status: "failed",
        error: "Не удалось подготовить ссылку на фотографию",
        retryable: false,
      };
    }

    const scene = sceneById(request.sceneId);

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}/jobs/createTask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          input: {
            prompt: COMPOSITION_PROMPT,
            // Order matters: the prompt refers to them as Img 1 and Img 2.
            image_input: [sceneUrl(scene), photoUrl],
            aspect_ratio: "1:1",
            resolution: "2K",
            output_format: "png",
          },
        }),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Провайдер недоступен",
        retryable: true,
      };
    }

    if (!response.ok) {
      return {
        status: "failed",
        error: `Провайдер ответил ${response.status}`,
        retryable: isRetryableStatus(response.status),
      };
    }

    const body = (await response.json().catch(() => null)) as Envelope<CreateTaskData> | null;

    // The API answers 200 with a non-200 `code` for its own errors.
    if (!body || body.code !== 200) {
      return {
        status: "failed",
        error: body?.msg ?? "Провайдер отклонил задание",
        retryable: false,
      };
    }

    const taskId = body.data?.taskId ?? body.data?.recordId;
    if (!taskId) {
      return { status: "failed", error: "Провайдер не вернул идентификатор", retryable: true };
    }

    return { status: "processing", providerJobId: taskId };
  },

  async checkJob(providerJobId: string): Promise<GenerationOutcome> {
    const config = readConfig();
    if (!config) {
      return { status: "failed", error: "Провайдер не настроен", retryable: false };
    }

    let response: Response;
    try {
      response = await fetch(
        `${config.baseUrl}/jobs/recordInfo?taskId=${encodeURIComponent(providerJobId)}`,
        {
          headers: { Authorization: `Bearer ${config.apiKey}` },
          signal: AbortSignal.timeout(POLL_TIMEOUT_MS),
        }
      );
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "Провайдер недоступен",
        retryable: true,
      };
    }

    if (!response.ok) {
      return {
        status: "failed",
        error: `Провайдер ответил ${response.status}`,
        retryable: isRetryableStatus(response.status),
      };
    }

    const body = (await response.json().catch(() => null)) as Envelope<RecordInfoData> | null;
    if (!body || body.code !== 200 || !body.data) {
      return { status: "failed", error: body?.msg ?? "Некорректный ответ", retryable: true };
    }

    const state = body.data.state?.toLowerCase() ?? "";

    if (PENDING_STATES.has(state)) {
      return { status: "processing", providerJobId };
    }

    if (state !== "success") {
      // A rejected input repeats identically, so it is not retried. The reason
      // is kept because it is what the customer is eventually shown.
      return {
        status: "failed",
        error: body.data.failMsg ?? `Задание завершилось со статусом «${state || "?"}»`,
        retryable: false,
      };
    }

    const urls = parseResultUrls(body.data.resultJson);
    if (urls.length === 0) {
      return { status: "failed", error: "Провайдер не вернул изображений", retryable: true };
    }

    const images: GeneratedImage[] = [];
    for (const [index, url] of urls.entries()) {
      const image = await downloadResult(url, index + 1);
      if (!image) continue;
      images.push(image);
    }

    if (images.length === 0) {
      return {
        status: "failed",
        error: "Не удалось загрузить результат",
        retryable: true,
      };
    }

    return { status: "succeeded", images, providerJobId };
  },
};

/** `resultJson` is a JSON string, not an object — parsed defensively. */
function parseResultUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as { resultUrls?: unknown };
    if (!Array.isArray(parsed.resultUrls)) return [];
    return parsed.resultUrls.filter((u): u is string => typeof u === "string" && u.length > 0);
  } catch {
    return [];
  }
}

async function downloadResult(
  url: string,
  pageNumber: number
): Promise<GeneratedImage | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") ?? "")
      .split(";")[0]!
      .trim()
      .toLowerCase();

    // An SVG here would be stored and later served back to a browser, where it
    // can carry script. Only raster formats are accepted.
    if (!ACCEPTED_RESULT_TYPES.has(contentType)) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_RESULT_BYTES) return null;

    return { pageNumber, data: buffer, contentType };
  } catch {
    return null;
  }
}
