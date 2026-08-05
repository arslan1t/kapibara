import { NextResponse } from "next/server";
import { readProductImage } from "@/lib/storage";

/**
 * Serves catalogue artwork uploaded through the admin panel.
 *
 * Deliberately unauthenticated: these are product photographs meant for the
 * public storefront, the same as anything in /public. Customer photographs and
 * generated illustrations go through /api/uploads/[key] instead, which checks
 * ownership on every request.
 */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const file = await readProductImage(key);
  if (!file) return new NextResponse(null, { status: 404 });

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": file.contentType,
      // Immutable: the key is a fresh UUID for every upload, so a changed
      // image is always a different URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
