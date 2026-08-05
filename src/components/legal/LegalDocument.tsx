import { FileText } from "lucide-react";

export interface LegalSection {
  heading: string;
  /** Short description of what belongs in this section, for the legal team. */
  summary: string;
}

interface LegalDocumentProps {
  title: string;
  /** One sentence describing the document's purpose. */
  intro: string;
  sections: LegalSection[];
}

/**
 * Shared shell for the site's legal documents.
 *
 * The section structure is real, but the wording of each section is
 * deliberately left as a marked placeholder: binding legal text has to be
 * written and approved by the company, not drafted here.
 */
export default function LegalDocument({
  title,
  intro,
  sections,
}: LegalDocumentProps) {
  return (
    <div className="bg-gradient-to-b from-cream-100 to-parchment py-12 md:py-16">
      <div className="page-container mx-auto max-w-3xl">
        <h1 className="section-title">{title}</h1>
        <p className="section-subtitle">{intro}</p>

        {/* Unmissable marker so this is never mistaken for approved text. */}
        <div
          role="note"
          className="mt-8 flex gap-4 rounded-3xl border-2 border-dashed border-brand-300 bg-brand-50 p-5 sm:p-6"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-500">
            <FileText className="h-5 w-5" strokeWidth={1.9} />
          </span>
          <div>
            <p className="font-display text-base font-extrabold text-brown-dark">
              Документ готовится
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-brown">
              Ниже приведена структура документа. Итоговый юридический текст
              будет опубликован после согласования — до этого момента разделы
              заполнены пояснениями о том, что в них войдёт.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg font-extrabold text-brown-dark sm:text-xl">
                <span className="text-brand-500">{i + 1}.</span> {section.heading}
              </h2>
              <p className="mt-2.5 text-[15px] leading-relaxed text-brown">
                {section.summary}
              </p>
              <p className="mt-3 rounded-2xl bg-cream-100 px-4 py-3 text-sm italic leading-relaxed text-brown-400">
                Текст раздела будет добавлен после согласования.
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
