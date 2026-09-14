"use client";

import { useLocale } from "@/i18n/navigation";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { formatMoney } from "@/i18n/format";

/**
 * A catalogue price, in the currency of the market the reader is in.
 *
 * `amount` is null when the book has no price set for that market. Saying so
 * is the honest option: converting the other market's price at some rate would
 * quote a number nobody agreed to, and rounding it would quote a different one
 * tomorrow.
 */
export default function Price({ amount }: { amount: number | null }) {
  const locale = useLocale();
  const t = useDictionary();

  if (amount === null) return <>{t.common.priceOnRequest}</>;
  return <>{formatMoney(amount, locale)}</>;
}
