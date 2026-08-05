import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { readUpload, signedUrlFor, isValidKey } from "@/lib/storage";
import { logger } from "@/lib/logger";
import { readJobClaim, claimMatches } from "@/lib/claim";

/**
 * Serves a private image — an uploaded photograph or a generated illustration.
 *
 * Both contain a child's face, so both are gated the same way: an administrator,
 * or the customer the file belongs to. Anyone else gets a 404 — deliberately not
 * a 403, so the endpoint cannot be used to discover which keys exist.
 *
 * When the storage driver can mint signed URLs, the response is a redirect to a
 * five-minute URL instead of a proxied stream: it keeps large images off the
 * application server and lets the storage CDN do the transfer. The
 * authorization decision happens here either way — the signed URL is only ever
 * issued after the same ownership check.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * May the holder of an anonymous preview claim read this object?
 *
 * Covers the visitor who started a preview before signing in: their own source
 * photograph and the illustrations produced from it. Scoped to the single job
 * the cookie identifies, so it grants nothing else.
 */
async function mayReadByClaim(key: string, presented: string | undefined): Promise<boolean> {
  if (!presented) return false;

  const job = await db.generationJob.findFirst({
    where: {
      claimToken: { not: null },
      OR: [{ photoKey: key }, { results: { some: { storageKey: key } } }],
    },
    select: { claimToken: true },
  });

  return claimMatches(job?.claimToken ?? null, presented);
}

/** Does this user have a legitimate claim to this object? */
async function mayRead(key: string, userId: string): Promise<boolean> {
  // Three ways a file can belong to this customer: the photo on one of their
  // orders, the source photo of one of their generation jobs, or an
  // illustration produced by such a job.
  const [ownedPhoto, ownedSource, ownedResult] = await Promise.all([
    db.personalization.findFirst({
      where: { photoKey: key, orderItem: { order: { userId } } },
      select: { id: true },
    }),
    db.generationJob.findFirst({
      where: { photoKey: key, userId },
      select: { id: true },
    }),
    db.generationResult.findFirst({
      where: { storageKey: key, job: { userId } },
      select: { id: true },
    }),
  ]);

  return Boolean(ownedPhoto || ownedSource || ownedResult);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  // Refuse a malformed key before it reaches a storage driver.
  if (!isValidKey(key)) return new NextResponse(null, { status: 404 });

  const [user, presentedClaim] = await Promise.all([
    getCurrentUser(),
    readJobClaim(),
  ]);

  // Three ways to be entitled, checked cheapest first.
  const admin = user ? await isAdmin() : false;
  const entitled =
    admin ||
    (user ? await mayRead(key, user.id) : false) ||
    (await mayReadByClaim(key, presentedClaim));

  if (!entitled) {
    // Logged so a pattern of probing is visible. The key is not recorded: it
    // is the address of a child's photograph.
    logger.warn("uploads.denied", { hasSession: Boolean(user) });
    return new NextResponse(null, { status: 404 });
  }

  // Preferred path: hand the client a short-lived URL and let storage serve it.
  const signed = await signedUrlFor(key);
  if (signed) {
    return NextResponse.redirect(signed, {
      status: 302,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Fallback for drivers that cannot sign (local filesystem in development).
  const file = await readUpload(key);
  if (!file) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      // Private: must never be cached by a shared proxy.
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
