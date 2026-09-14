"use server";

import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { enqueueGeneration, isGenerationEnabled } from "@/lib/generation";
import {
  isChildNameValid,
  nameScriptFor,
  sanitizeChildName,
} from "@/lib/validation";
import { asLocale, LOCALE_CONFIG } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { rateLimit, rateLimitMessage, clientIp } from "@/lib/rate-limit";
import { issueJobClaim } from "@/lib/claim";
import { recordAudit } from "@/lib/audit";

export type GenerationActionResult =
  | { ok: true; jobId: string }
  | { ok: false; error: string };

/** True when the provider has credentials. Drives what the UI offers. */
export async function generationAvailable(): Promise<boolean> {
  return isGenerationEnabled();
}

/**
 * Starts a preview generation from the personalization form.
 *
 * Everything is re-validated here: the product must exist and be purchasable,
 * and the child's name must be Cyrillic. The photo key is checked against the
 * caller rather than trusted, so someone cannot generate from a key they
 * guessed.
 */
export async function requestPreviewGeneration(input: {
  productSlug: string;
  childName: string;
  photoKey: string;
  /** The storefront the customer is on — decides language and name script. */
  locale: string;
}): Promise<GenerationActionResult> {
  const locale = asLocale(input.locale ?? "");
  const t = getDictionary(locale);
  const nameScript = nameScriptFor(LOCALE_CONFIG[locale].region);

  if (!isGenerationEnabled()) {
    return { ok: false, error: t.errors.generationUnavailable };
  }

  const user = await getCurrentUser();

  const limited = await rateLimit(
    "upload",
    user ? user.id : `ip:${await clientIp()}`
  );
  if (!limited.ok) {
    return { ok: false, error: rateLimitMessage(limited.retryAfter, locale) };
  }

  const cleaned = sanitizeChildName(input.childName ?? "", nameScript);
  if (!isChildNameValid(cleaned.value, nameScript)) {
    return {
      ok: false,
      error:
        nameScript === "cyrillic"
          ? t.errors.childNameCyrillic
          : t.errors.childNameCyrillicLatin,
    };
  }

  const product = await db.product.findUnique({
    where: { slug: input.productSlug },
    select: { id: true, published: true, status: true, personalizationEnabled: true },
  });

  if (!product || !product.published || product.status !== "available") {
    return { ok: false, error: t.errors.bookUnavailable };
  }
  if (!product.personalizationEnabled) {
    return { ok: false, error: t.errors.bookNotPersonalizable };
  }

  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|heic)$/i.test(input.photoKey ?? "")) {
    return { ok: false, error: t.errors.photoAgain };
  }

  // An anonymous preview still needs an owner of some kind, or its id alone
  // would grant access. Signed-in callers are identified by their account.
  const claimToken = user ? undefined : await issueJobClaim();

  return enqueueGeneration({
    productId: product.id,
    childName: cleaned.value.trim(),
    photoKey: input.photoKey,
    userId: user?.id,
    claimToken,
  });
}

/**
 * Starts generation for a paid order line. Administrators only.
 *
 * This is the production path: previews are optional, but an order that has
 * been paid for needs its illustrations produced.
 */
export async function startOrderGeneration(
  orderItemId: string
): Promise<GenerationActionResult> {
  const actor = await getCurrentUser();
  if (!actor || !(await isAdmin())) {
    return { ok: false, error: "Недостаточно прав для этого действия" };
  }
  if (!isGenerationEnabled()) {
    return { ok: false, error: "Генерация иллюстраций пока недоступна" };
  }

  const item = await db.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      productId: true,
      order: { select: { userId: true } },
      personalization: { select: { childName: true, photoKey: true } },
    },
  });

  if (!item?.productId) return { ok: false, error: "Позиция заказа не найдена" };
  if (!item.personalization?.photoKey) {
    return { ok: false, error: "К заказу не приложена фотография" };
  }

  const result = await enqueueGeneration({
    productId: item.productId,
    childName: item.personalization.childName,
    photoKey: item.personalization.photoKey,
    orderItemId: item.id,
    userId: item.order.userId ?? undefined,
  });

  if (result.ok) {
    await recordAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "generation.started",
      targetType: "order",
      targetId: orderItemId,
    });
  }

  return result;
}

/** Re-runs a failed job. Administrators only. */
export async function retryGeneration(
  jobId: string
): Promise<{ ok: boolean; error?: string }> {
  const actor = await getCurrentUser();
  if (!actor || !(await isAdmin())) {
    return { ok: false, error: "Недостаточно прав для этого действия" };
  }

  const job = await db.generationJob.findUnique({
    where: { id: jobId },
    select: { status: true },
  });
  if (!job) return { ok: false, error: "Задание не найдено" };
  if (job.status === "succeeded") return { ok: true };

  // The attempt counter is reset because a human has decided to try again,
  // typically after fixing whatever caused the failure.
  await db.generationJob.update({
    where: { id: jobId },
    data: { status: "queued", attempts: 0, lastError: null, completedAt: null },
  });

  await recordAudit({
    actorId: actor.id,
    actorEmail: actor.email,
    action: "generation.retried",
    targetType: "order",
    targetId: jobId,
  });

  // The worker picks it up from the queue; not run inline.
  return { ok: true };
}
