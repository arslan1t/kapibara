import Image from "next/image";
import { Instagram, Send } from "lucide-react";
import Link from "@/i18n/navigation";
import { sellerFor } from "@/lib/legal";
import CookieSettingsLink from "@/components/legal/CookieSettingsLink";
import { getPublishedProducts } from "@/lib/products";
import { getDictionary } from "@/i18n/dictionary";
import { LOCALE_CONFIG, type Locale } from "@/i18n/config";
import { fill } from "@/i18n/format";

const INFO_LINKS = [
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/reviews", key: "reviews" },
  { href: "/delivery", key: "delivery" },
  { href: "/faq", key: "faq" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
] as const;

export default async function Footer({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const { region } = LOCALE_CONFIG[locale];
  const seller = sellerFor(region);

  // Linking to books that an administrator has actually published, so an
  // archived story never leaves a dead link in the footer.
  const catalogue = await getPublishedProducts(locale);

  const sections = [
    {
      key: "books",
      title: t.footer.booksHeading,
      links: [
        { href: "/catalog", label: t.nav.catalog },
        ...catalogue.map((b) => ({
          href: `/books/${b.slug}`,
          label: b.shortTitle,
        })),
      ],
    },
    {
      key: "info",
      title: t.footer.infoHeading,
      links: INFO_LINKS.map((item) => ({
        href: item.href,
        label: t.nav[item.key],
      })),
    },
    {
      key: "account",
      title: t.footer.accountHeading,
      links: [
        { href: "/account", label: t.header.account },
        { href: "/account/orders", label: t.header.myOrders },
        { href: "/login", label: t.header.signIn },
        { href: "/register", label: t.header.createAccount },
      ],
    },
  ];

  return (
    <footer className="relative overflow-hidden bg-brown-dark text-cream-200">
      {/* Soft warm glow, echoing the golden light in the book artwork. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-brand-500/12 blur-3xl"
      />

      <div className="page-container relative py-16 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block" aria-label={t.header.logoAria}>
              <Image
                src="/capybara-logo.svg"
                alt={t.common.brand}
                width={493}
                height={462}
                className="h-20 w-auto object-contain brightness-110"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-300/85">
              {t.footer.tagline}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-cream-200 transition-colors duration-300 hover:bg-brand-500 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-cream-200 transition-colors duration-300 hover:bg-brand-500 hover:text-white"
                aria-label="Telegram"
              >
                <Send className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.key}>
              <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-cream-400/90">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-300/85 transition-colors duration-300 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Seller identity. ЗОЗПП ст. 9 requires the name, address and state
            registration number to be available to the buyer, and a compliance
            check looks for them on every page — hence the footer.

            When the market's seller has not been registered yet, this says so
            rather than borrowing the other market's details. Quoting a Russian
            ИП as the seller of an Uzbek order would be a false statement about
            who the contract is with. */}
        <div className="mt-14 border-t border-white/10 pt-8 text-sm leading-relaxed text-cream-400/80">
          {seller.configured ? (
            <>
              <p>
                {seller.fullName}
                {/* 436-ФЗ: public content needs an age category. The books are
                    for preschool and early-school children and contain nothing
                    that restricts a younger audience, so 0+ is the honest
                    mark. */}
                <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-cream-200">
                  0+
                </span>
              </p>
              <p className="mt-1">
                {seller.taxIdLabel} {seller.taxId} · {seller.registrationIdLabel}{" "}
                {seller.registrationId}
              </p>
              <p className="mt-1">{seller.address}</p>
              <p className="mt-1">
                <a
                  href={`mailto:${seller.email}`}
                  className="transition-colors hover:text-white"
                >
                  {seller.email}
                </a>
                {" · "}
                <a
                  href={`tel:${seller.phoneHref}`}
                  className="transition-colors hover:text-white"
                >
                  {seller.phone}
                </a>
              </p>
            </>
          ) : (
            <p className="max-w-2xl">{t.footer.sellerPending}</p>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-cream-400/80">
            {fill(t.footer.rights, {
              year: new Date().getFullYear(),
              brand: t.common.brand,
            })}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-400/80">
            <Link href="/privacy" className="transition-colors hover:text-white">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              {t.footer.terms}
            </Link>
            <Link href="/offer" className="transition-colors hover:text-white">
              {t.footer.offer}
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              {t.footer.cookies}
            </Link>
            <CookieSettingsLink className="transition-colors hover:text-white" />
          </div>
        </div>
      </div>
    </footer>
  );
}
