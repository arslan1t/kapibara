/**
 * Legal documents as data, not markup.
 *
 * They used to be JSX inside the pages that rendered them, which was fine
 * while there was one jurisdiction and one language. There are now two of each,
 * and a clause that exists in three versions has to be something a person can
 * diff.
 *
 * Bodies are plain strings with {placeholders}; the renderer substitutes the
 * seller's details and turns the address and telephone into links. Nothing in a
 * document may hardcode a name, a number or a law — which market's law applies
 * is exactly what varies.
 */
export interface LegalClause {
  /** Optional sub-heading inside a section. */
  title?: string;
  body: string;
}

export interface LegalSection {
  heading: string;
  clauses: LegalClause[];
}

export interface LegalDocumentContent {
  title: string;
  /** One sentence describing what the document governs. */
  intro: string;
  /** Shown under the title, e.g. "the site capibara.su and all its pages". */
  scope: string;
  sections: LegalSection[];
}

export type LegalDocumentKey = "privacy" | "terms" | "offer" | "cookies";

export type LegalBundle = Record<LegalDocumentKey, LegalDocumentContent> & {
  /**
   * ISO date of this bundle's wording, stamped onto every consent given
   * against it.
   *
   * Per bundle, not global: the three sets of documents are different texts
   * under different law and change on their own schedules, and a consent has
   * to record the version of the document the person actually read.
   */
  version: string;
  /** Labels the shell needs — they differ by language, not by jurisdiction. */
  labels: {
    edition: string;
    appliesTo: string;
    detailsHeading: string;
    seller: string;
    taxId: string;
    registrationId: string;
    registeredOn: string;
    address: string;
    email: string;
    phone: string;
    /** Shown instead of the details when the seller is not registered yet. */
    detailsPending: string;
    /** Stands in for a detail that has not been filled in, inside a clause. */
    notSet: string;
  };
};
