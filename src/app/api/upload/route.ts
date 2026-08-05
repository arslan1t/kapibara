import { NextResponse } from "next/server";
import { saveUpload, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, rateLimitMessage, clientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * Accepts a child's photograph and returns an opaque storage key.
 *
 * The key is meaningless on its own — reading the file back requires passing
 * the ownership check in /api/uploads/[key].
 *
 * Open to anonymous callers on purpose: a customer personalises a book before
 * signing in. Rate limiting therefore keys on the account when there is one and
 * the client address otherwise.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  const limited = await rateLimit(
    "upload",
    user ? user.id : `ip:${await clientIp()}`
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: rateLimitMessage(limited.retryAfter) },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  // Reject an oversized body from the declared length before buffering it.
  // The real check is on the parsed bytes below, since this header is a claim.
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES * 1.2) {
    return NextResponse.json(
      { error: "Файл больше 8 МБ — выберите фотографию поменьше" },
      { status: 413 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не получен" }, { status: 400 });
  }

  const result = await saveUpload(file);

  if (!result.ok) {
    // Size and declared type only — never the bytes, never the filename.
    logger.info("upload.rejected", {
      reason: result.error,
      declaredType: file.type,
      size: file.size,
    });
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  logger.info("upload.stored", { size: file.size, declaredType: file.type });
  return NextResponse.json({ key: result.key });
}
