"use client";

import { clearCookieChoice } from "./CookieConsent";
import { useDictionary } from "@/i18n/DictionaryProvider";

/**
 * Lets someone change their cookie decision after the fact.
 *
 * Consent that cannot be withdrawn as easily as it was given is not consent,
 * and the cookie policy promises this link exists — a document describing a
 * control the site does not have is worse than one that says nothing.
 */
export default function CookieSettingsLink({
  className,
}: {
  className?: string;
}) {
  const t = useDictionary();
  return (
    <button type="button" onClick={clearCookieChoice} className={className}>
      {t.misc.cookieSettings}
    </button>
  );
}
