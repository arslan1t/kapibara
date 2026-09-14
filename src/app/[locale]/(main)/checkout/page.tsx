import type { Metadata } from "next";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import CheckoutForm from "./CheckoutForm";
import { asLocale, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return {
    title: t.checkout.metaTitle,
    robots: { index: false, follow: false },
  };
}

// Which payment methods exist depends on configured credentials, so this page
// is resolved per request rather than baked in at build time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm onlinePaymentEnabled={isOnlinePaymentEnabled()} />;
}
