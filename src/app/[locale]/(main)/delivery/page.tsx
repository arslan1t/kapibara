import type { Metadata } from "next";
import Link from "@/i18n/navigation";
import { Truck, Printer, CreditCard, ShieldCheck } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { BOOK_PAGE_COUNT } from "@/data/books";
import { isOnlinePaymentEnabled } from "@/lib/payments";
import { asLocale, LOCALE_CONFIG, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";
import { fill } from "@/i18n/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return { title: t.delivery.metaTitle, description: t.delivery.metaDescription };
}

/**
 * What the payment section says depends on what the shop can actually take.
 *
 * Online payment is not connected, and a page that lists card brands anyway is
 * making a promise the checkout cannot keep. This reads the gateway
 * configuration so the page changes by itself the day credentials are added.
 */
export const dynamic = "force-dynamic";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const { region } = LOCALE_CONFIG[locale];
  const regional = t.delivery.regions[region];

  const blocks = [
    {
      icon: Printer,
      title: t.delivery.printTitle,
      text: fill(t.delivery.printText, { pages: BOOK_PAGE_COUNT }),
    },
    {
      icon: Truck,
      title: t.delivery.deliveryTitle,
      text: regional.delivery,
    },
    {
      icon: CreditCard,
      title: t.delivery.paymentTitle,
      text: isOnlinePaymentEnabled()
        ? t.delivery.paymentOnline
        : t.delivery.paymentOnConfirmation,
    },
    {
      icon: ShieldCheck,
      title: t.delivery.defectTitle,
      text: t.delivery.defectText,
    },
  ];

  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{t.delivery.eyebrow}</span>
          <h1 className="section-title mt-5">{t.delivery.heading}</h1>
          <p className="section-subtitle">{regional.lead}</p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {blocks.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="flex h-full flex-col gap-4 rounded-4xl bg-white p-7 shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-brand-500">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  {title}
                </h2>
                <p className="text-[15px] leading-relaxed text-brown">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mx-auto mt-14 max-w-3xl text-center">
          <p className="text-[15px] leading-relaxed text-brown">
            {t.delivery.questionsLead}{" "}
            <Link href="/contact" className="font-bold text-brand-500 hover:underline">
              {t.delivery.questionsLink}
            </Link>{" "}
            {t.delivery.questionsTail}
          </p>
        </Reveal>
      </div>
    </div>
  );
}
