import { Fragment, type ReactNode } from "react";
import Link from "@/i18n/navigation";
import { sellerFor } from "@/lib/legal";
import { formatDate } from "@/i18n/format";
import {
  legalDocument,
  legalFor,
  type LegalDocumentKey,
} from "@/lib/legal-docs";
import { LOCALE_CONFIG, type Locale } from "@/i18n/config";

/**
 * Shared shell for the site's legal documents.
 *
 * Numbering is generated rather than written into the text, so inserting a
 * clause cannot leave the document referring to the wrong paragraph.
 *
 * Clause bodies are strings with {placeholders}. Substituting them here rather
 * than in the documents means the same sentence serves a market whose seller
 * has a СТИР instead of an ИНН, and means a document can never quote the wrong
 * market's tax number — there is nothing in it to get wrong.
 */
export default function LegalDocument({
  locale,
  document,
}: {
  locale: Locale;
  document: LegalDocumentKey;
}) {
  const { region } = LOCALE_CONFIG[locale];
  const seller = sellerFor(region);
  const content = legalDocument(locale, document);
  const bundle = legalFor(locale);
  const { labels } = bundle;
  const edition = formatDate(bundle.version, locale);

  /**
   * A detail nobody has filled in is shown as such.
   *
   * The alternative is a sentence that reads "is a public offer of  (СТИР )",
   * which looks like a rendering bug rather than a disclosure — and a reader
   * skimming it would not notice they had not been told who the seller is.
   */
  const orNotSet = (value: string) => value || labels.notSet;

  const values: Record<string, ReactNode> = {
    seller: orNotSet(seller.fullName),
    sellerShort: orNotSet(seller.shortName),
    brand: seller.brand,
    taxId: orNotSet(seller.taxId),
    // From the bundle, not the seller: the seller record is written once per
    // market, and "СТИР (ИНН)" in the middle of an Uzbek sentence is the one
    // Cyrillic string a reader of the Uzbek document would trip over.
    taxIdLabel: labels.taxId,
    registrationId: orNotSet(seller.registrationId),
    registeredOn: orNotSet(seller.registeredOn),
    address: orNotSet(seller.address),
    site: seller.site,
    phone: orNotSet(seller.phone),
    updated: edition,
    email: seller.email ? (
      <Link
        href={`mailto:${seller.email}`}
        className="underline decoration-brand-300 underline-offset-2 hover:text-brand-600"
      >
        {seller.email}
      </Link>
    ) : (
      labels.notSet
    ),
  };

  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-12 md:py-16">
      <article className="page-container mx-auto max-w-3xl">
        <h1 className="section-title">{content.title}</h1>
        <p className="section-subtitle">{content.intro}</p>

        <dl className="mt-8 grid gap-2 rounded-3xl bg-white/70 p-5 text-[15px] leading-relaxed text-brown sm:grid-cols-[auto,1fr] sm:gap-x-6 sm:p-6">
          <dt className="font-semibold text-brown-dark">{labels.edition}</dt>
          <dd>{edition}</dd>
          <dt className="font-semibold text-brown-dark">{labels.appliesTo}</dt>
          <dd>{interpolate(content.scope, values)}</dd>
        </dl>

        {/* A market whose seller is not registered yet gets this before the
            first clause, not buried at the bottom. A reader deciding whether
            to order needs to know they have not been told who they would be
            contracting with. */}
        {!seller.configured && (
          <p className="mt-6 rounded-3xl border border-gold-200 bg-gold-100/60 px-5 py-4 text-[15px] leading-relaxed text-brown-dark">
            {labels.detailsPending}
          </p>
        )}

        <div className="mt-10 space-y-10">
          {content.sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-extrabold text-brown-dark sm:text-xl">
                <span className="text-brand-500">{i + 1}.</span>{" "}
                {section.heading}
              </h2>

              <div className="mt-3 space-y-3.5">
                {section.clauses.map((clause, j) => (
                  <div key={j}>
                    {clause.title && (
                      <h3 className="text-[15px] font-bold text-brown-dark">
                        {clause.title}
                      </h3>
                    )}
                    <p className="text-[15px] leading-relaxed text-brown">
                      <span className="mr-1.5 font-semibold text-brown-400">
                        {i + 1}.{j + 1}.
                      </span>
                      {interpolate(clause.body, values)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 rounded-3xl bg-white/70 p-6 sm:p-7">
          <h2 className="font-display text-lg font-extrabold text-brown-dark">
            {labels.detailsHeading}
          </h2>

          {seller.configured ? (
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-[15px] leading-relaxed text-brown sm:grid-cols-[auto,1fr]">
              <dt className="font-semibold text-brown-dark">{labels.seller}</dt>
              <dd>{seller.fullName}</dd>
              <dt className="font-semibold text-brown-dark">
                {seller.taxIdLabel}
              </dt>
              <dd>{seller.taxId}</dd>
              <dt className="font-semibold text-brown-dark">
                {labels.registrationId}
              </dt>
              <dd>
                {seller.registrationId} (
                {interpolate(labels.registeredOn, values)})
              </dd>
              <dt className="font-semibold text-brown-dark">
                {labels.address}
              </dt>
              <dd>{seller.address}</dd>
              <dt className="font-semibold text-brown-dark">{labels.email}</dt>
              <dd>{values.email}</dd>
              <dt className="font-semibold text-brown-dark">{labels.phone}</dt>
              <dd>
                <Link
                  href={`tel:${seller.phoneHref}`}
                  className="underline decoration-brand-300 underline-offset-2 hover:text-brand-600"
                >
                  {seller.phone}
                </Link>
              </dd>
            </dl>
          ) : (
            <p className="mt-4 text-[15px] leading-relaxed text-brown">
              {labels.detailsPending}
            </p>
          )}
        </footer>
      </article>
    </div>
  );
}

/** Splits a clause on {placeholders} and swaps each for its value. */
function interpolate(
  text: string,
  values: Record<string, ReactNode>,
): ReactNode {
  const parts = text.split(/(\{[a-zA-Z]+\})/g);
  return parts.map((part, i) => {
    const match = /^\{([a-zA-Z]+)\}$/.exec(part);
    if (!match) return <Fragment key={i}>{part}</Fragment>;
    const value = values[match[1]!];
    return <Fragment key={i}>{value ?? part}</Fragment>;
  });
}
