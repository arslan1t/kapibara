import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { LOCALE_CONFIG, type Language } from "@/i18n/config";
import {
  MARKET,
  isMarketLanguage,
  marketDefaultLocale,
  marketLanguages,
} from "@/i18n/market";

/** Remembers the visitor's own choice of language. */
const LANGUAGE_COOKIE = "kapibara_lang";
/** A year: not something people revisit weekly. */
const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * The language of the current request, for the few server components that
 * cannot reach the route parameter.
 *
 * `not-found.tsx` is the reason this exists: Next renders it without params,
 * so a 404 inside the Uzbek site would otherwise come back in Russian.
 */
export const LANGUAGE_HEADER = "x-kapibara-lang";

/**
 * Picks a language for a visitor who has not asked for one.
 *
 * Only the language is in question — the country is decided by which domain
 * they typed, and this deployment serves exactly one. The cookie wins because
 * it records an explicit choice; after that there is only Accept-Language, and
 * anyone guessed wrong is one click from fixing it.
 */
function detectLanguage(request: NextRequest): Language {
  const available = marketLanguages();

  const saved = request.cookies.get(LANGUAGE_COOKIE)?.value;
  if (saved && isMarketLanguage(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase() ?? "")
    .filter(Boolean);

  for (const tag of tags) {
    const base = tag.split("-")[0] ?? "";
    if (isMarketLanguage(base)) return base;
  }

  return available[0] ?? LOCALE_CONFIG[marketDefaultLocale()].language;
}

/**
 * Routing for one market's site.
 *
 * Two jobs, in this order: make sure every request carries a language segment
 * this market actually serves, then gate the private areas. The auth gate is a
 * first line of defence for routing only — every page and server action
 * authorizes independently, because middleware alone is not a security
 * boundary.
 */
/**
 * Redirect to a path on this same site.
 *
 * `NextResponse.redirect` insists on an absolute URL, and behind a reverse
 * proxy the origin Next derives is the loopback address the Node process is
 * bound to — so the browser is handed `http://localhost:3100/ru` and the
 * request dies on the visitor's own machine. Nothing the proxy sets fixes it:
 * the origin is baked in before the Host header is ever consulted.
 *
 * Overwriting Location with the path alone sidesteps the question. A relative
 * Location has been legal since RFC 7231 §7.1.2 (2014), and every browser
 * resolves it against the address the visitor actually typed, which is the
 * only origin that is certainly right.
 */
function sameSiteRedirect(url: URL, status?: 307 | 308): NextResponse {
  const response =
    status === undefined
      ? NextResponse.redirect(url)
      : NextResponse.redirect(url, status);
  response.headers.set("location", `${url.pathname}${url.search}`);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const segments = pathname.split("/");
  const first = segments[1] ?? "";

  // ── No language in the path, or one this market does not serve ────────────
  //
  // The second case matters: /uz on capibara.su and /ru-uz anywhere are paths
  // that used to work when both markets shared a site. They are redirected
  // rather than 404'd so an old link still lands somewhere useful.
  if (!isMarketLanguage(first)) {
    const language = detectLanguage(request);
    const rest = isStaleLocaleSegment(first)
      ? `/${segments.slice(2).join("/")}`.replace(/\/+$/, "")
      : pathname === "/"
        ? ""
        : pathname;
    const url = new URL(`/${language}${rest}${search}`, request.url);
    const response = sameSiteRedirect(url, 308);
    response.cookies.set(LANGUAGE_COOKIE, language, {
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
      sameSite: "lax",
      path: "/",
    });
    return response;
  }

  const language = first;
  const path = `/${segments.slice(2).join("/")}`.replace(/\/+$/, "") || "/";

  // ── The back office is Russian and Russian only ───────────────────────────
  // It is an internal tool: translating it would double the surface for no
  // reader, and a language prefix on it would mean two URLs for one screen.
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  if (isAdmin && language !== "ru") {
    return sameSiteRedirect(new URL(`/ru${path}${search}`, request.url));
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isAuthed = Boolean(token?.uid);
  const isAdminUser = token?.role === "admin";
  const at = (target: string) => new URL(`/${language}${target}`, request.url);

  if (isAdmin) {
    if (!isAuthed) {
      const url = at("/login");
      url.searchParams.set("callbackUrl", pathname);
      return sameSiteRedirect(url);
    }
    if (!isAdminUser) return sameSiteRedirect(at("/no-access"));
    return remember(pass(request, language), language);
  }

  if (path === "/account" || path.startsWith("/account/")) {
    if (!isAuthed) {
      const url = at("/login");
      url.searchParams.set("callbackUrl", pathname);
      return sameSiteRedirect(url);
    }
    return remember(pass(request, language), language);
  }

  // Signed-in users have no reason to see the auth screens.
  if (isAuthed && (path === "/login" || path === "/register")) {
    return sameSiteRedirect(at("/account"));
  }

  return remember(pass(request, language), language);
}

/**
 * Locale segments from when both markets shared one site.
 *
 * Recognised so that capibara.uz/ru-uz/catalog redirects to /ru/catalog rather
 * than to /ru/ru-uz/catalog, which is what treating it as an ordinary path
 * would produce.
 */
function isStaleLocaleSegment(segment: string): boolean {
  return segment === "ru" || segment === "uz" || segment === "ru-uz";
}

function pass(request: NextRequest, language: Language): NextResponse {
  const headers = new Headers(request.headers);
  headers.set(LANGUAGE_HEADER, language);
  // Belt and braces for a shared cache in front of either site: the response
  // body differs by host, and a cache that ignores that would serve one
  // market's prices to the other.
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Vary", "Host, Accept-Language, Cookie");
  response.headers.set("X-Kapibara-Market", MARKET);
  return response;
}

/** Keeps the remembered language in step with the one actually being viewed. */
function remember(response: NextResponse, language: Language): NextResponse {
  response.cookies.set(LANGUAGE_COOKIE, language, {
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
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
     * POST loses its body, and the payment providers' callbacks are POSTs. The
     * rest of the exclusions are files served as themselves.
     */
    "/((?!api/|_next/|.*\\.[\\w]+$).*)",
  ],
};

export { LANGUAGE_COOKIE };
