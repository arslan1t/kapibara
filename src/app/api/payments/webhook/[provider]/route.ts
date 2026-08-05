import { NextResponse } from "next/server";
import { getGateway, applyProviderEvent } from "@/lib/payments";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/constants";

/**
 * Payment provider callback.
 *
 * Never trusts the request body on its own: the gateway checks any shared
 * secret and then re-reads the payment from the provider's API, so a forged
 * POST to this URL cannot mark an order paid.
 *
 * Always answers 200 for anything the provider might retry pointlessly (an
 * event about a payment we do not know), and non-200 only when the request
 * fails verification — providers back off on errors, and we do not want a
 * retry storm over an event that will never apply.
 */

export const dynamic = "force-dynamic";
// The raw body must survive verbatim for signature checks.
export const runtime = "nodejs";

interface Context {
  params: Promise<{ provider: string }>;
}

function isProvider(value: string): value is PaymentProvider {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export async function POST(request: Request, { params }: Context) {
  const { provider } = await params;

  if (!isProvider(provider)) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }

  const gateway = getGateway(provider);
  if (!gateway.isConfigured()) {
    // Nothing can legitimately call an unconfigured provider's endpoint.
    return NextResponse.json({ error: "not configured" }, { status: 404 });
  }

  const rawBody = await request.text();
  const parsed = await gateway.parseWebhook(rawBody, request.headers);

  if (!parsed.ok) {
    // Verification failed. Logged without the body, which may carry customer
    // data, and answered with a bare status.
    console.warn(`[payments] rejected ${provider} webhook: ${parsed.error}`);
    return NextResponse.json({ error: "rejected" }, { status: 400 });
  }

  const applied = await applyProviderEvent(parsed.value);

  if (!applied.ok) {
    console.warn(
      `[payments] could not apply ${provider} event ${parsed.value.providerPaymentId}: ${applied.error}`
    );
    // 200 on purpose: the event was authentic but is not actionable, and
    // retrying will not change that.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}

/** Providers probe the URL with GET when it is registered. */
export async function GET(_request: Request, { params }: Context) {
  const { provider } = await params;
  if (!isProvider(provider) || !getGateway(provider).isConfigured()) {
    return NextResponse.json({ error: "unknown provider" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, provider });
}
