import { NextResponse } from "next/server";
import { handlePaymeRpc } from "@/lib/payments/payme";
import { paymeGateway } from "@/lib/payments/payme";
import { PAYME_ERRORS } from "@/lib/payments/payme";

/**
 * Payme Merchant API endpoint.
 *
 * This is the URL registered in the Payme merchant cabinet. Every call is
 * JSON-RPC and every call is authenticated by the Basic header, checked inside
 * the handler in constant time; nothing here trusts the body before that.
 *
 * Always answers HTTP 200, even on failure. Payme reads the JSON-RPC error
 * from the body, and reports a non-200 as an unreachable endpoint — which
 * fails the integration test for a reason that has nothing to do with the
 * actual problem.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!paymeGateway.isConfigured()) {
    // Nothing can legitimately call an unconfigured provider's endpoint.
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: PAYME_ERRORS.parse,
          message: {
            ru: "Ошибка разбора запроса",
            uz: "Soʻrovni tahlil qilishda xato",
            en: "Parse error",
          },
        },
      },
      { status: 200 }
    );
  }

  const { status, body: response } = await handlePaymeRpc(
    body,
    request.headers.get("authorization")
  );

  return NextResponse.json(response, { status });
}

/** Payme probes the URL when it is registered. */
export function GET() {
  if (!paymeGateway.isConfigured()) {
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, provider: "payme" });
}
