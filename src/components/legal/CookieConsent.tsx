"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Cookie consent banner.
 *
 * Two things it deliberately does NOT do:
 *
 *   • It never sets an analytics cookie before a choice is made. A banner that
 *     tracks you while asking permission to track you is worse than no banner,
 *     and it is the failure most compliance checks look for first.
 *   • It gives "Только необходимые" the same weight as "Принять" — same size,
 *     same position, not a greyed-out afterthought. Consent that is awkward to
 *     refuse is not freely given.
 *
 * The choice itself is stored in localStorage rather than a cookie, so
 * declining does not require setting the very thing being declined.
 */

const STORAGE_KEY = "kapibara.cookie-consent";

export type CookieChoice = "all" | "necessary";

interface StoredChoice {
  choice: CookieChoice;
  /** ISO date, so a stale decision can be re-asked after the policy changes. */
  decidedAt: string;
  version: string;
}

/** Bump when the cookie policy changes materially — the banner asks again. */
const POLICY_VERSION = "2026-08-21";

/** Reading it is safe on the server: returns null until mounted. */
export function readCookieChoice(): StoredChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChoice;
    return parsed.version === POLICY_VERSION ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Forgets the stored decision and shows the banner again.
 *
 * A full reload is the simplest correct way to re-mount the banner from
 * anywhere on the site, and it also drops anything a previous "accept" had
 * already initialised in the page.
 */
export function clearCookieChoice(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable; the reload below still returns a clean state.
  }
  window.location.reload();
}

export default function CookieConsent() {
  // `null` means "not decided yet"; undefined means "not yet read from storage",
  // which keeps the banner from flashing on every page load for people who have
  // already answered.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!readCookieChoice()) setVisible(true);
  }, []);

  function decide(choice: CookieChoice) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          choice,
          decidedAt: new Date().toISOString(),
          version: POLICY_VERSION,
        } satisfies StoredChoice)
      );
    } catch {
      // Private mode with storage disabled. Hiding the banner for this page
      // view is the best available behaviour; nothing was enabled either way.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Использование файлов cookie"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md"
    >
      <div className="rounded-3xl bg-white p-5 shadow-elevated ring-1 ring-brown-900/10 sm:p-6">
        <p className="text-[15px] leading-relaxed text-brown">
          Мы используем файлы cookie, чтобы работали вход в аккаунт и корзина.
          Аналитические — только с вашего согласия.{" "}
          <Link
            href="/cookies"
            className="font-semibold text-brand-600 underline decoration-brand-300 underline-offset-2 hover:text-brand-700"
          >
            Подробнее
          </Link>
        </p>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => decide("all")}
            className="flex-1 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-300 hover:bg-brand-600"
          >
            Принять все
          </button>
          <button
            type="button"
            onClick={() => decide("necessary")}
            className="flex-1 rounded-full bg-cream-200 px-5 py-2.5 text-sm font-bold text-brown-dark transition-colors duration-300 hover:bg-cream-300"
          >
            Только необходимые
          </button>
        </div>
      </div>
    </div>
  );
}
