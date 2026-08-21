import Link from "next/link";
import { LEGAL_UPDATED, OPERATOR, type LegalSection } from "@/lib/legal";

interface LegalDocumentProps {
  title: string;
  /** One sentence describing what the document governs. */
  intro: string;
  sections: LegalSection[];
}

/**
 * Shared shell for the site's legal documents.
 *
 * Numbering is generated rather than written into the text, so inserting a
 * clause cannot leave the document referring to the wrong paragraph.
 */
export default function LegalDocument({
  title,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-12 md:py-16">
      <article className="page-container mx-auto max-w-3xl">
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{intro}</p>

        <dl className="mt-8 grid gap-2 rounded-3xl bg-white/70 p-5 text-[15px] leading-relaxed text-brown sm:grid-cols-[auto,1fr] sm:gap-x-6 sm:p-6">
          <dt className="font-semibold text-brown-dark">Редакция</dt>
          <dd>{LEGAL_UPDATED}</dd>
          <dt className="font-semibold text-brown-dark">Действует для</dt>
          <dd>сайта {OPERATOR.site} и всех его страниц</dd>
        </dl>

        <div className="mt-10 space-y-10">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-extrabold text-brown-dark sm:text-xl">
                <span className="text-brand-500">{i + 1}.</span> {section.heading}
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
                      {clause.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 rounded-3xl bg-white/70 p-6 sm:p-7">
          <h2 className="font-display text-lg font-extrabold text-brown-dark">
            Реквизиты
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-[15px] leading-relaxed text-brown sm:grid-cols-[auto,1fr]">
            <dt className="font-semibold text-brown-dark">Оператор</dt>
            <dd>{OPERATOR.fullName}</dd>
            <dt className="font-semibold text-brown-dark">ИНН</dt>
            <dd>{OPERATOR.inn}</dd>
            <dt className="font-semibold text-brown-dark">ОГРНИП</dt>
            <dd>
              {OPERATOR.ogrnip} (присвоен {OPERATOR.registeredOn})
            </dd>
            <dt className="font-semibold text-brown-dark">Адрес</dt>
            <dd>{OPERATOR.address}</dd>
            <dt className="font-semibold text-brown-dark">Электронная почта</dt>
            <dd>
              <Link
                href={`mailto:${OPERATOR.email}`}
                className="underline decoration-brand-300 underline-offset-2 hover:text-brand-600"
              >
                {OPERATOR.email}
              </Link>
            </dd>
            <dt className="font-semibold text-brown-dark">Телефон</dt>
            <dd>
              <Link
                href={`tel:${OPERATOR.phoneHref}`}
                className="underline decoration-brand-300 underline-offset-2 hover:text-brand-600"
              >
                {OPERATOR.phone}
              </Link>
            </dd>
          </dl>
        </footer>
      </article>
    </div>
  );
}
