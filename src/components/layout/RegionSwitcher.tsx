"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Globe } from "lucide-react";
import {
  LOCALE_CONFIG,
  REGIONS,
  REGION_CONFIG,
  stripLocale,
  type Locale,
  type Region,
} from "@/i18n/config";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useLocale } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Country first, then language.
 *
 * That order is not cosmetic. The country changes what the shop sells for and
 * how it reaches you; the language changes only the words. Presenting them as
 * one flat list of three options hides that, and someone would pick "Oʻzbekcha"
 * expecting a translation and find their price had changed.
 *
 * Switching keeps the reader where they were: the path survives, only its
 * prefix changes. Being thrown to the home page for changing language is a
 * small thing that makes a site feel like two sites.
 */
export default function RegionSwitcher({ className }: { className?: string }) {
  const t = useDictionary();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const current = LOCALE_CONFIG[locale];
  const countryName: Record<Region, string> = {
    RU: t.switcher.russia,
    UZ: t.switcher.uzbekistan,
  };

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

  function go(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // Written here as well as in middleware: the redirect that would otherwise
    // set it costs a round trip, and the choice should survive even if the
    // next navigation is a static page that middleware passes straight through.
    document.cookie = `kapibara_locale=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    router.push(`/${next}${stripLocale(pathname).path}`);
  }

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
        <span className="hidden sm:inline">{countryName[current.region]}</span>
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
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-3xl border border-cream-200 bg-white p-2 shadow-elevated"
        >
          <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-[0.14em] text-brown-300">
            {t.switcher.country}
          </p>

          {REGIONS.map((region) => {
            const config = REGION_CONFIG[region];
            const isCurrent = region === current.region;
            return (
              <div key={region}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => go(config.defaultLocale)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-[15px] font-semibold transition-colors",
                    isCurrent
                      ? "bg-brand-50 text-brand-600"
                      : "text-brown-dark hover:bg-cream-100"
                  )}
                >
                  {countryName[region]}
                  {isCurrent && <Check className="h-4 w-4" strokeWidth={2.4} />}
                </button>

                {/* Languages belong to the country they are read in, so they
                    sit under it rather than in a list of their own. A country
                    with one language shows none — there is nothing to choose. */}
                {isCurrent && config.locales.length > 1 && (
                  <div className="mb-1 ml-3 mt-1 border-l border-cream-200 pl-3">
                    {config.locales.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="menuitem"
                        onClick={() => go(option)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors",
                          option === locale
                            ? "text-brand-600"
                            : "text-brown hover:bg-cream-100 hover:text-brown-dark"
                        )}
                      >
                        {LOCALE_CONFIG[option].languageLabel}
                        {option === locale && (
                          <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <p className="border-t border-cream-200 px-3 pb-2 pt-3 text-xs leading-relaxed text-brown-300">
            {t.switcher.note}
          </p>
        </div>
      )}
    </div>
  );
}
