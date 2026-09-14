import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { sellerFor } from "@/lib/legal";
import { asLocale, LOCALE_CONFIG, type LocaleParams } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const t = getDictionary(asLocale((await params).locale));
  return { title: t.contact.metaTitle, description: t.contact.metaDescription };
}

/**
 * Real ways to reach a real seller.
 *
 * This page used to carry a placeholder telephone number, an address that was
 * not the registered one, a Telegram handle nobody owned, and a form whose
 * submit handler set a "message sent" flag and did nothing else. Every one of
 * those is a promise the shop could not keep, and the last is the worst kind:
 * a customer with a problem believes they have reported it.
 *
 * What is left is what can be honoured — the addresses in the register, taken
 * from the one place that holds them.
 */
export default async function ContactPage({
  params,
}: {
  params: Promise<LocaleParams>;
}) {
  const locale = asLocale((await params).locale);
  const t = getDictionary(locale);
  const { region } = LOCALE_CONFIG[locale];

  // A market whose seller is not registered yet has no contacts of its own.
  // The Russian entity's are real, the same people answer them, and the note
  // below says exactly whose they are.
  const seller = sellerFor(region);
  const contactable = seller.configured ? seller : sellerFor("RU");

  const cards = [
    {
      icon: Mail,
      title: t.contact.emailTitle,
      value: contactable.email,
      href: `mailto:${contactable.email}`,
      note: t.contact.emailNote,
      tone: "bg-sage-100 text-sage-500",
    },
    {
      icon: Phone,
      title: t.contact.phoneTitle,
      value: contactable.phone,
      href: `tel:${contactable.phoneHref}`,
      note: t.contact.phoneNote,
      tone: "bg-brand-100 text-brand-500",
    },
    {
      icon: MapPin,
      title: t.contact.addressTitle,
      value: contactable.address,
      href: null,
      note: t.contact.addressNote,
      tone: "bg-cream-200 text-brown",
    },
  ];

  return (
    <div className="py-12 md:py-16">
      <div className="page-container">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h1 className="section-title">{t.contact.heading}</h1>
          <p className="section-subtitle">{t.contact.lead}</p>
        </div>

        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {cards.map(({ icon: Icon, title, value, href, note, tone }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-soft"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-brown-300">{title}</p>
                {href ? (
                  <a
                    href={href}
                    className="font-display text-lg font-extrabold text-brown-dark transition-colors hover:text-brand-500"
                  >
                    {value}
                  </a>
                ) : (
                  <p className="font-semibold leading-snug text-brown-dark">{value}</p>
                )}
                <p className="mt-1 text-sm leading-relaxed text-brown-300">{note}</p>
              </div>
            </div>
          ))}

          {!seller.configured && (
            <p className="rounded-3xl bg-cream-100 px-5 py-4 text-sm leading-relaxed text-brown">
              {t.contact.uzNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
