import { NextResponse } from "next/server";
import { handleClickPrepare, type ClickCallback } from "@/lib/payments/click";
import { clickGateway } from "@/lib/payments/click";
import { readClickCallback } from "@/lib/payments/click-request";

/**
 * Click SHOP API — Prepare.
 *
 * Registered in the Click merchant cabinet as the "Prepare URL". The body is
 * form-encoded, not JSON, and the signature covers the raw field values, so
 * they are read as strings and never coerced before the check.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!clickGateway.isConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  const params: ClickCallback = await readClickCallback(request);
  return NextResponse.json(await handleClickPrepare(params));
}
