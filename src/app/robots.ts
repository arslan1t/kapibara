import type { MetadataRoute } from "next";
import { SITE_URL_FALLBACK } from "@/lib/constants";
import { LOCALES } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? SITE_URL_FALLBACK;

/**
 * Paths that must never be indexed, in any language.
 *
 * Each is expanded across the locale prefixes as well as the bare form, since
 * the bare form still exists as a redirect and a crawler will follow it.
 */
const PRIVATE_PATHS = [
  "/admin",
  "/account",
  "/cart",
  "/checkout",
  "/order-success",
  "/preview",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export default function robots(): MetadataRoute.Robots {
  const disallow = PRIVATE_PATHS.flatMap((path) => [
    path,
    ...LOCALES.map((locale) => `/${locale}${path}`),
  ]);

  return {
    rules: { userAgent: "*", allow: "/", disallow },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
