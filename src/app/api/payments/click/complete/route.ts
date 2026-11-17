import { NextResponse } from "next/server";
import { handleClickComplete, type ClickCallback } from "@/lib/payments/click";
import { clickGateway } from "@/lib/payments/click";
import { readClickCallback } from "@/lib/payments/click-request";

/**
 * Click SHOP API — Complete.
 *
 * Registered in the Click merchant cabinet as the "Complete URL". Quotes back
 * the prepare id we minted, which is the only thing tying this call to the
 * Prepare that preceded it.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!clickGateway.isConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  const params: ClickCallback = await readClickCallback(request);
  return NextResponse.json(await handleClickComplete(params));
}
