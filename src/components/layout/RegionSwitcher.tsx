"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Check, ChevronDown, ExternalLink, Globe } from "lucide-react";
import { LOCALE_CONFIG, REGIONS, type Region } from "@/i18n/config";
import {
  MARKET,
  allMarketLocales,
  isMarketLanguage,
  marketLocales,
  segmentForLocale,
} from "@/i18n/market";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useLanguage } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Country first, then language.
 *
 * That order is not cosmetic. The country changes what the shop sells for and
 * how it reaches you; the language changes only the words. Presenting them as
 * one flat list would hide that, and someone would pick "Oʻzbekcha" expecting
 * a translation and find their price had changed.
 *
 * Since the markets became two sites, changing country is a link to the other
 * domain rather than a route change — marked as leaving, because it is. The
 * path is kept across the jump so a reader looking at the delivery page lands
 * on the other country's delivery page, not on its home page.
 */
export default function RegionSwitcher({ className }: { className?: string }) {
  const t = useDictionary();
  const language = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const countryName: Record<Region, string> = {
    RU: t.switcher.russia,
    UZ: t.switcher.uzbekistan,
  };

  // The path without its language segment, so it can be re-prefixed for
  // whichever language or site the reader picks.
  const [, first = "", ...rest] = pathname.split("/");
  const bare = isMarketLanguage(first)
    ? `/${rest.join("/")}`.replace(/\/+$/, "") || "/"
    : pathname;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function switchLanguage(next: string) {
    setOpen(false);
    if (next === language) return;
    // Written here as well as in middleware: the redirect that would otherwise
    // set it costs a round trip, and the choice should survive a navigation
    // that middleware passes straight through.
    document.cookie = `kapibara_lang=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.push(bare === "/" ? "/" : bare);
  }

  /** The other market's entry point for the page currently open. */
  const elsewhere = allMarketLocales().filter((entry) => entry.region !== MARKET);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.switcher.label}
        className="flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-semibold text-brown-dark transition-colors duration-300 hover:bg-cream-200"
      >
        <Globe className="h-[19px] w-[19px]" strokeWidth={1.9} />
        <span className="hidden sm:inline">{countryName[MARKET]}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
          strokeWidth={2.2}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-3xl border border-cream-200 bg-white p-2 shadow-elevated"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.14em] text-brown-300">
            {t.switcher.country}
          </p>

          {REGIONS.map((region) =>
            region === MARKET ? (
              <div key={region}>
                <div className="flex w-full items-center justify-between rounded-2xl bg-brand-50 px-3 py-2.5 text-left text-[15px] font-semibold text-brand-600">
                  {countryName[region]}
                  <Check className="h-4 w-4" strokeWidth={2.4} />
                </div>

                {/* Languages belong to the country they are read in, so they
                    sit under it. A country with one language shows none —
                    there is nothing to choose. */}
                {marketLocales().length > 1 && (
                  <div className="mb-1 ml-3 mt-1 border-l border-cream-200 pl-3">
                    {marketLocales().map((locale) => {
                      const segment = segmentForLocale(locale);
                      return (
                        <button
                          key={locale}
                          type="button"
                          role="menuitem"
                          onClick={() => switchLanguage(segment)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                            segment === language
                              ? "text-brand-600"
                              : "text-brown hover:bg-cream-100 hover:text-brown-dark"
                          )}
                        >
                          {LOCALE_CONFIG[locale].languageLabel}
                          {segment === language && (
                            <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <a
                key={region}
                role="menuitem"
                href={
                  elsewhere.find((entry) => entry.region === region)?.href(bare) ??
                  "#"
                }
                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-[15px] font-semibold text-brown-dark transition-colors hover:bg-cream-100"
              >
                {countryName[region]}
                <ExternalLink
                  className="h-3.5 w-3.5 text-brown-300"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </a>
            )
          )}

          <p className="border-t border-cream-200 px-3 pb-2 pt-3 text-xs leading-relaxed text-brown-300">
            {t.switcher.note}
          </p>
        </div>
      )}
    </div>
  );
}
