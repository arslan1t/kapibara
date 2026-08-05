import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveProductImage, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * Uploads catalogue artwork.
 *
 * Administrators only, checked before a single byte is written. A non-admin
 * gets 404 rather than 403 so the endpoint's existence is not advertised.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Файл больше 8 МБ" }, { status: 413 });
  }

  const result = await saveProductImage(file);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ key: result.key });
}
