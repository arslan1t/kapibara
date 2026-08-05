import type { Metadata } from "next";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Оформление заказа",
  robots: { index: false, follow: false },
};

// Which payment methods exist depends on configured credentials, so this page
// is resolved per request rather than baked in at build time.
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm onlinePaymentEnabled={isOnlinePaymentEnabled()} />;
}
