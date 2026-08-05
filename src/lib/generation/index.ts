import "server-only";

import { db } from "@/lib/db";
import { saveGenerated } from "@/lib/storage";
import { GENERATION_MAX_ATTEMPTS, type GenerationStatus } from "@/lib/constants";
import { nanoBananaClient } from "./nano-banana";
import { requeueJob, failJob } from "./queue";
import { logger } from "@/lib/logger";
import { claimMatches } from "@/lib/claim";
import type { GenerationOutcome } from "./types";

export type { GenerationClient, GenerateRequest } from "./types";

/**
 * Illustration job lifecycle.
 *
 * The job row is the source of truth, not the request that created it: a page
 * reload, a slow provider or a server restart can all happen mid-generation,
 * and none of them should lose work. Results are written to private storage,
 * because a generated page contains a child's face just as the source photo
 * does.
 */

/** Pages we ask the provider to illustrate. */
const GENERATED_PAGES = [1, 7, 15, 23, 31];

const client = nanoBananaClient;

export function isGenerationEnabled(): boolean {
  return client.isConfigured();
}

export interface EnqueueInput {
  productId: string;
  childName: string;
  photoKey: string;
  /** Set once the job belongs to a placed order. */
  orderItemId?: string;
  userId?: string;
  /**
   * Hash of the claim token for an anonymous preview. Required whenever there
   * is no userId, so a job without an owner is still bound to one browser.
   */
  claimToken?: string;
}

export type EnqueueResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

/**
 * Creates a job and starts it.
 *
 * Returns as soon as the row exists so the caller can show progress
 * immediately; the provider call continues in the background.
 */
export async function enqueueGeneration(
  input: EnqueueInput
): Promise<EnqueueResult> {
  if (!isGenerationEnabled()) {
    return {
      ok: false,
      error: "Генерация иллюстраций пока недоступна",
    };
  }

  // One job per order line: re-running would bill twice for the same book.
  if (input.orderItemId) {
    const existing = await db.generationJob.findFirst({
      where: {
        orderItemId: input.orderItemId,
        status: { in: ["queued", "processing", "succeeded"] },
      },
      select: { id: true },
    });
    if (existing) return { ok: true, jobId: existing.id };
  }

  const job = await db.generationJob.create({
    data: {
      productId: input.productId,
      childName: input.childName,
      photoKey: input.photoKey,
      orderItemId: input.orderItemId ?? null,
      userId: input.userId ?? null,
      claimToken: input.claimToken ?? null,
      provider: client.id,
      status: "queued",
    },
    select: { id: true },
  });

  logger.info("generation.enqueued", {
    jobId: job.id,
    productId: input.productId,
    hasOrderItem: Boolean(input.orderItemId),
  });

  // Deliberately NOT run inline. A request cannot outlive itself on a
  // serverless platform, and the customer must be free to close the page. The
  // background worker claims this job from the queue — see scripts/worker.ts.
  return { ok: true, jobId: job.id };
}

/** Applies a provider outcome to the job row. */
async function applyOutcome(
  jobId: string,
  outcome: GenerationOutcome
): Promise<void> {
  if (outcome.status === "processing") {
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "processing",
        providerJobId: outcome.providerJobId,
        startedAt: new Date(),
      },
    });
    return;
  }

  if (outcome.status === "cancelled") {
    await db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "cancelled",
        lastError: outcome.error,
        completedAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        nextAttemptAt: null,
      },
    });
    logger.warn("generation.cancelled", { jobId, reason: outcome.error });
    return;
  }

  if (outcome.status === "failed") {
    const job = await db.generationJob.findUnique({
      where: { id: jobId },
      select: { attempts: true },
    });

    // A retryable failure that has attempts left goes back to the queue with
    // backoff; anything else is final, so a broken job stops burning quota.
    const exhausted = (job?.attempts ?? 0) >= GENERATION_MAX_ATTEMPTS;

    if (outcome.retryable && !exhausted) {
      await requeueJob(jobId, job?.attempts ?? 0, outcome.error);
    } else {
      await failJob(jobId, outcome.error);
    }
    return;
  }

  // Succeeded — persist each image to private storage first, so a half-written
  // job never reports success.
  const saved: { pageNumber: number; storageKey: string; width?: number; height?: number }[] =
    [];

  for (const image of outcome.images) {
    const result = await saveGenerated(image.data, image.contentType);
    if (!result.ok) continue;
    saved.push({
      pageNumber: image.pageNumber,
      storageKey: result.key,
      width: image.width,
      height: image.height,
    });
  }

  if (saved.length === 0) {
    await failJob(jobId, "Не удалось сохранить изображения");
    return;
  }

  await db.$transaction([
    db.generationResult.deleteMany({ where: { jobId } }),
    db.generationResult.createMany({
      data: saved.map((s) => ({
        jobId,
        pageNumber: s.pageNumber,
        storageKey: s.storageKey,
        width: s.width ?? null,
        height: s.height ?? null,
      })),
    }),
    db.generationJob.update({
      where: { id: jobId },
      data: {
        status: "succeeded",
        providerJobId: outcome.providerJobId ?? undefined,
        completedAt: new Date(),
        lastError: null,
        lockedAt: null,
        lockedBy: null,
        nextAttemptAt: null,
      },
    }),
  ]);

  logger.info("generation.succeeded", { jobId, pages: saved.length });
}

/**
 * Submits a queued job to the provider.
 *
 * The attempt counter is incremented before the call, so a job that crashes
 * the process mid-flight still counts its try and cannot loop forever.
 */
export async function runJob(jobId: string): Promise<void> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    include: { product: { select: { slug: true } } },
  });

  if (!job || job.status === "succeeded" || job.status === "cancelled") return;
  if (job.attempts >= GENERATION_MAX_ATTEMPTS) {
    await db.generationJob.update({
      where: { id: jobId },
      data: { status: "failed", completedAt: new Date() },
    });
    return;
  }

  await db.generationJob.update({
    where: { id: jobId },
    data: { status: "processing", attempts: { increment: 1 }, startedAt: new Date() },
  });

  const outcome = await client.generate({
    photoKey: job.photoKey,
    childName: job.childName,
    productSlug: job.product.slug,
    pageNumbers: GENERATED_PAGES,
  });

  await applyOutcome(jobId, outcome);
}

/**
 * Polls an in-flight job.
 *
 * Called by the status endpoint, so progress advances while the customer is
 * watching even though there is no background worker in this deployment.
 */
export async function pollJob(jobId: string): Promise<void> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    select: { status: true, providerJobId: true },
  });

  if (!job) return;

  // A job that was requeued after a retryable failure gets resubmitted here.
  if (job.status === "queued") {
    await runJob(jobId);
    return;
  }

  if (job.status !== "processing" || !job.providerJobId) return;

  const outcome = await client.checkJob(job.providerJobId);
  await applyOutcome(jobId, outcome);
}

export interface JobView {
  id: string;
  status: GenerationStatus;
  attempts: number;
  /** Storage keys, served through the authorization-checked upload route. */
  pages: { pageNumber: number; storageKey: string }[];
}

/**
 * Reads a job, scoped to whoever is entitled to it.
 *
 * Two ways to be entitled: the job belongs to your account, or you hold the
 * claim cookie issued when you started an anonymous preview. A job id on its
 * own is never enough — it addresses illustrations of a named child.
 *
 * Returns null rather than throwing, so the endpoint answers identically for
 * "not yours" and "does not exist".
 */
export async function getJobForUser(
  jobId: string,
  userId: string | null,
  presentedClaim?: string
): Promise<JobView | null> {
  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      attempts: true,
      userId: true,
      claimToken: true,
      results: {
        orderBy: { pageNumber: "asc" },
        select: { pageNumber: true, storageKey: true },
      },
    },
  });

  if (!job) return null;

  const ownsByAccount = Boolean(job.userId) && job.userId === userId;
  const ownsByClaim = claimMatches(job.claimToken, presentedClaim);

  // A job with neither an owner nor a claim is unreachable by design: that
  // combination should not exist, and treating it as public would be exactly
  // the hole this check closes.
  if (!ownsByAccount && !ownsByClaim) return null;

  return {
    id: job.id,
    status: job.status as GenerationStatus,
    attempts: job.attempts,
    pages: job.results,
  };
}
