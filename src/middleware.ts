import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_CONFIG,
  isLocale,
  type Locale,
} from "@/i18n/config";

/** Remembers the visitor's own choice from the region/language switcher. */
const LOCALE_COOKIE = "kapibara_locale";
/** A year: the choice of country is not something people revisit weekly. */
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Picks a locale for a visitor who has not asked for one.
 *
 * The cookie wins, because it records an explicit choice. After that there is
 * only Accept-Language to go on: this deployment sits behind Beget's shared
 * hosting, which passes no country header, so nothing here pretends to know
 * where the request came from. Anyone we guess wrong about is one click from
 * fixing it in the header, and that click is remembered.
 */
function detectLocale(request: NextRequest): Locale {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && isLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean);

  for (const tag of tags) {
    if (tag.startsWith("uz")) return "uz";
    // A Russian speaker in Uzbekistan reports ru-UZ. Worth honouring: it is
    // the one case where the browser actually knows the country.
    if (tag === "ru-uz") return "ru-uz";
    if (tag.startsWith("ru")) return "ru";
  }
  return DEFAULT_LOCALE;
}

/**
 * Routing for a site that exists in three versions.
 *
 * Two jobs, in this order: make sure every request carries a locale segment,
 * then gate the private areas. The auth gate is a first line of defence for
 * routing only — every page and server action authorizes independently,
 * because middleware alone is not a security boundary.
 */
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const segments = pathname.split("/");
  const first = segments[1] ?? "";

  // ── No locale in the path ──────────────────────────────────────────────────
  if (!isLocale(first)) {
    const locale = detectLocale(request);
    const url = new URL(`/${locale}${pathname === "/" ? "" : pathname}${search}`, request.url);
    const response = NextResponse.redirect(url);
    response.cookies.set(LOCALE_COOKIE, locale, {
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  const locale = first as Locale;
  const path = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "") || "/";

  // ── The back office is Russian and Russian only ────────────────────────────
  // It is an internal tool: translating it would double the surface for no
  // reader. A locale prefix on it would also mean two URLs for one screen.
  if (path === "/admin" || path.startsWith("/admin/")) {
    if (locale !== DEFAULT_LOCALE) {
      return NextResponse.redirect(
        new URL(`/${DEFAULT_LOCALE}${path}${search}`, request.url)
      );
    }
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isAuthed = Boolean(token?.uid);
  const isAdmin = token?.role === "admin";
  const at = (target: string) => new URL(`/${locale}${target}`, request.url);

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!isAuthed) {
      const url = at("/login");
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) return NextResponse.redirect(at("/no-access"));
    return withLocaleCookie(pass(request, locale), locale);
  }

  if (path === "/account" || path.startsWith("/account/")) {
    if (!isAuthed) {
      const url = at("/login");
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return withLocaleCookie(pass(request, locale), locale);
  }

  // Signed-in users have no reason to see the auth screens.
  if (isAuthed && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(at("/account"));
  }

  return withLocaleCookie(pass(request, locale), locale);
}

/**
 * The locale of the current request, for the few server components that cannot
 * reach the route parameter.
 *
 * `not-found.tsx` is the reason this exists: Next renders it without params,
 * so a 404 inside the Uzbek site would otherwise come back with a Russian
 * header and footer.
 */
export const LOCALE_HEADER = "x-kapibara-locale";

function pass(request: NextRequest, locale: Locale): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, locale);
  return NextResponse.next({ request: { headers } });
}

/** Keeps the remembered locale in step with the one actually being viewed. */
function withLocaleCookie(response: NextResponse, locale: Locale): NextResponse {
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export const config = {
  matcher: [
    /**
     * Everything a person can navigate to, and nothing else.
     *
     * API routes are locale-agnostic and must not be redirected — a redirected
     * POST loses its body. The rest of the exclusions are files served as
     * themselves: build output, the icons, and anything with an extension.
     */
    "/((?!api/|_next/|.*\\.[\\w]+$).*)",
  ],
};

export { LOCALE_COOKIE, LOCALES, LOCALE_CONFIG };
