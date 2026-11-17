import type { Metadata } from "next";
import { onlineProviders } from "@/lib/payments";
import CheckoutForm from "./CheckoutForm";
import { type LangParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { localeFromSegment } from "@/i18n/market";

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>;
}): Promise<Metadata> {
  const t = getDictionary(localeFromSegment((await params).lang));
  return {
    title: t.checkout.metaTitle,
    robots: { index: false, follow: false },
  };
}

// Which payment methods exist depends on configured credentials, so this page
// is resolved per request rather than baked in at build time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm providers={onlineProviders()} />;
}
