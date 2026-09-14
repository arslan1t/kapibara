"use client";

import NextLink from "next/link";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { DEFAULT_LOCALE, isLocale, localePath, type Locale } from "./config";

/**
 * The locale the visitor is currently reading, taken from the URL.
 *
 * Deliberately read from the path rather than from a context: the path is the
 * single source of truth, it is available to every client component without a
 * provider somewhere above it, and it cannot drift out of step with what the
 * server rendered.
 */
export function useLocale(): Locale {
  const pathname = usePathname();
  const first = pathname.split("/")[1] ?? "";
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

type NextLinkProps = ComponentPropsWithoutRef<typeof NextLink>;

/**
 * A Link that stays inside the visitor's own version of the site.
 *
 * Every internal href in this codebase is written without a locale — "/cart",
 * "/catalog/…" — and this is what puts it back. A bare next/link works by
 * accident on the Russian site and throws a reader in Tashkent out of their
 * language, and usually out of their currency, on the first click.
 *
 * External URLs, anchors, mailto: and tel: pass through untouched.
 */
const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, ...rest },
  ref
) {
  const locale = useLocale();
  return <NextLink ref={ref} href={withLocale(href, locale)} {...rest} />;
});

export default Link;

function withLocale(href: NextLinkProps["href"], locale: Locale): NextLinkProps["href"] {
  if (typeof href !== "string") {
    // A UrlObject. Only its pathname needs prefixing; query and hash are ours
    // to leave alone.
    if (href && typeof href === "object" && typeof href.pathname === "string") {
      return { ...href, pathname: prefix(href.pathname, locale) };
    }
    return href;
  }
  return prefix(href, locale);
}

function prefix(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const first = path.split("/")[1] ?? "";
  if (isLocale(first)) return path;
  return localePath(locale, path);
}

/**
 * useRouter, with the same prefixing as Link.
 *
 * Only push and replace take a path; the rest of the router API is passed
 * through unchanged.
 */
export function useRouter() {
  const router = useNextRouter();
  const locale = useLocale();

  return {
    ...router,
    push: (href: string, options?: NavigateOptions) =>
      router.push(prefix(href, locale), options),
    replace: (href: string, options?: NavigateOptions) =>
      router.replace(prefix(href, locale), options),
    prefetch: (href: string) => router.prefetch(prefix(href, locale)),
  };
}
