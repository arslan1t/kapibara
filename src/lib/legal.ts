import type { ReactNode } from "react";

/**
 * Legal identity of the operator, in one place.
 *
 * Every document, the footer and the order confirmation quote these. Russian
 * consumer law (ЗОЗПП ст. 9) requires the seller's name, address and state
 * registration number to be available to the buyer, and 152-ФЗ ст. 18.1
 * requires the personal-data operator to be identified in a published policy.
 * Both are the same person here, so both read from this object — a shop whose
 * ИНН differs between two pages has a real problem, not a typo.
 *
 * Banking details are deliberately absent: they belong on an invoice, not on a
 * public web page.
 */
export const OPERATOR = {
  /** Full legal form, as it appears in the ЕГРИП record. */
  fullName: "Индивидуальный предприниматель Шипулин Шухрат Юрьевич",
  shortName: "ИП Шипулин Ш. Ю.",
  /** The trading name customers actually see. */
  brand: "Капибара",

  inn: "504211606360",
  ogrnip: "325774600675334",
  /** Date the ОГРНИП was assigned. */
  registeredOn: "07.10.2025",

  address: "115093, г. Москва, 1-й Щипковский переулок, д. 25, оф. 2",
  email: "Sshipulin-IP@bk.ru",
  phone: "+7 (910) 469-68-63",
  /** Digits only, for tel: links. */
  phoneHref: "+79104696863",

  site: "capibara.su",
} as const;

/**
 * Version stamped onto every consent a user gives.
 *
 * Bump this whenever the wording of a document changes in a way that affects
 * what someone is agreeing to. Consents already stored keep their old version,
 * which is the entire point: it records what the person actually saw.
 */
export const LEGAL_VERSION = "2026-08-21";

/** Human-readable date of the current wording, shown at the top of each document. */
export const LEGAL_UPDATED = "21 августа 2026 г.";

export interface LegalClause {
  /** Optional sub-heading inside a section. */
  title?: string;
  body: ReactNode;
}

export interface LegalSection {
  heading: string;
  clauses: LegalClause[];
}
