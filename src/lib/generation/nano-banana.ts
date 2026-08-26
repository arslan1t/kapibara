import "server-only";

import { signedUrlFor } from "@/lib/storage";
import { absoluteCoverUrl, coverPathFor } from "./cover";
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
 *   image_input[0]  the book's own cover. Fixes the world, the composition,
 *                   the lighting, the title lettering and the drawing style.
 *   image_input[1]  the child's photograph. Fixes who the character is.
 *
 * The instruction is a redraw, not a composite: the character is re-rendered in
 * the book's cartoon style carrying the child's face, and everything else in
 * the frame is left exactly as the cover already has it. Pasting the photograph
 * in would be visible instantly and is explicitly ruled out in the prompt.
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
 * Four things it insists on, each learned by looking at what comes back
 * without them:
 *
 *   • An exhaustive list of what must not change. Asked loosely, the model
 *     redraws the whole cover — different trees, different title lettering, a
 *     different car — and the result is no longer the book being sold.
 *   • "Do not make the character photorealistic." Without it the model drops a
 *     photographic child into cartoon artwork, which is precisely the
 *     cut-and-paste look this feature exists to avoid.
 *   • Likeness named as the priority, with the specific features to study
 *     listed one by one. Told merely to "use the child's identity" it drifts
 *     toward a generic cartoon child who happens to share a hair colour.
 *   • Clothing taken approximately from the photograph. Keeping the book's
 *     outfit was tidier and looked less like the child: a parent recognises
 *     their own kid partly by what they are wearing.
 *
 * Pose stays with the book, so the composition the cover was designed around
 * survives.
 */
const COMPOSITION_PROMPT = `Img 1 is a finished children's book cover. Img 2 is a photograph of a real child.

Redraw ONLY the child character in Img 1 so that it depicts the child from Img 2. Change nothing else in the image.

LIKENESS IS THE PRIORITY. Study the face in Img 2 closely and reproduce it as a cartoon character: the exact face shape and jawline, the width and spacing of the eyes, the eye colour, the shape and thickness of the eyebrows, the shape of the nose, the shape of the mouth and the exact smile, the ears, the skin tone, and any distinctive detail such as freckles, dimples, a gap between the front teeth or a particular hair parting. Someone who knows this child must recognise them instantly. Do not drift toward a generic cartoon child.

CLOTHING: dress the character in an outfit that approximately matches what the child is wearing in Img 2 — same garment type and same main colours — redrawn in the book's illustration style. Keep the character's shoes and the general silhouette consistent with the original character.

Keep identical to Img 1: the title text and its exact lettering, colours and position; the blue cartoon car and its face; the forest, path, bridge, waterfall, mushrooms and flowers; the lighting, shadows and colour grading; the camera angle and composition; the character's pose, gesture and position in the frame; and the 3D hardcover book mockup shape with its edge and drop shadow.

The character must stay entirely in the book's own 3D-animated illustration style: same rendering, same stylised cartoon proportions, same large expressive cartoon eyes, same soft shading and outline treatment as the original character. Do NOT make the character photorealistic. Do NOT paste or blend the photograph into the artwork.`;

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

    const coverUrl = absoluteCoverUrl(coverPathFor(request.childGender));

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
            image_input: [coverUrl, photoUrl],
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
