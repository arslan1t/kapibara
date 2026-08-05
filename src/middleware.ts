import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Gatekeeper for the private areas of the site.
 *
 * This is a first line of defence for routing only — every page and server
 * action performs its own authorization as well, because middleware alone is
 * not a sufficient security boundary.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const isAuthed = Boolean(token?.uid);
  const isAdmin = token?.role === "admin";

  if (pathname.startsWith("/admin")) {
    if (!isAuthed) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/no-access", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/account")) {
    if (!isAuthed) {
      const url = new URL("/login", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Signed-in users have no reason to see the auth screens.
  if (isAuthed && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
