import type { Region } from "@/i18n/config";

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
export interface Seller {
  /** Full legal form, as it appears in the state register. */
  fullName: string;
  shortName: string;
  /** The trading name customers actually see. */
  brand: string;
  /**
   * Taxpayer number — ИНН in Russia, ПИНФЛ for an Uzbek self-employed person.
   *
   * A self-employed individual in Uzbekistan has no СТИР of their own: the
   * register identifies them by their personal number, which is what appears
   * on the certificate and what a buyer can check against it.
   */
  taxId: string;
  taxIdLabel: string;
  /** State registration number, with the label that country uses for it. */
  registrationId: string;
  registrationIdLabel: string;
  /** Date the registration number was assigned. */
  registeredOn: string;
  address: string;
  email: string;
  phone: string;
  /** Digits only, for tel: links. */
  phoneHref: string;
  site: string;
  /**
   * False while the details above are still placeholders.
   *
   * Nothing is invented for a seller we do not yet have papers for: the
   * documents say so in as many words rather than printing a number somebody
   * might act on. Set this true in the same commit that fills the fields in.
   */
  configured: boolean;
}

/**
 * Who is selling, in each market.
 *
 * Every document, the footer and the order confirmation quote these. Russian
 * consumer law (ЗОЗПП ст. 9) requires the seller's name, address and state
 * registration number to be available to the buyer, and 152-ФЗ ст. 18.1
 * requires the personal-data operator to be identified in a published policy;
 * Uzbek law asks for the equivalent. A shop whose tax number differs between
 * two pages has a real problem, not a typo, so there is exactly one of these
 * per market and everything reads from it.
 *
 * Banking details are deliberately absent: they belong on an invoice, not on a
 * public web page.
 */
export const SELLERS: Record<Region, Seller> = {
  RU: {
    fullName: "Индивидуальный предприниматель Шипулин Шухрат Юрьевич",
    shortName: "ИП Шипулин Ш. Ю.",
    brand: "Капибара",

    taxId: "504211606360",
    taxIdLabel: "ИНН",
    registrationId: "325774600675334",
    registrationIdLabel: "ОГРНИП",
    registeredOn: "07.10.2025",

    address: "115093, г. Москва, 1-й Щипковский переулок, д. 25, оф. 2",
    email: "Sshipulin-IP@bk.ru",
    phone: "+7 (910) 469-68-63",
    phoneHref: "+79104696863",

    site: "capibara.su",
    configured: true,
  },

  /**
   * Uzbekistan: a self-employed individual, registered through soliq.uz.
   *
   * Not a legal entity and not an ИП — in Uzbek law a self-employed person
   * trades under their own name and personal number, which is why the seller
   * here is a person rather than a company and why there is no СТИР.
   *
   * Contact details are the shared ones: the same team answers both markets,
   * and the alternative would be inventing a telephone number nobody picks up.
   */
  UZ: {
    fullName: "Ўзини ўзи банд қилган шахс ABDURAXMONOV ARSLAN SHUXRATOVICH",
    shortName: "ABDURAXMONOV A. SH.",
    brand: "Капибара",

    taxId: "50801066570024",
    taxIdLabel: "ПИНФЛ",
    registrationId: "0014908986",
    registrationIdLabel: "Справка о самозанятости №",
    registeredOn: "10.11.2026",

    // No trading premises: the books are printed to order and shipped, and a
    // self-employed person's registered address is their residence, which is
    // not something to publish. The buyer reaches the seller by the channels
    // below, which is what the law requires be available to them.
    address: "Республика Узбекистан, г. Ташкент",
    email: "Sshipulin-IP@bk.ru",
    phone: "+7 (910) 469-68-63",
    phoneHref: "+79104696863",

    site: "capibara.uz",
    configured: true,
  },
};

/** The seller for a market. */
export function sellerFor(region: Region): Seller {
  return SELLERS[region];
}

/**
 * The Russian seller, for the places that are Russia by definition — the back
 * office, and anything that predates the second market.
 */
export const OPERATOR = SELLERS.RU;

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
