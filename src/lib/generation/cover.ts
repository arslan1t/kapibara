import { SITE_URL_FALLBACK } from "@/lib/constants";

/**
 * The book's own cover, used as the reference image for generation.
 *
 * This replaced a set of generic "age band" scenes. Those produced a
 * photorealistic child standing in a stock fantasy landscape — a picture that
 * had nothing to do with the book being sold. What a customer is buying a
 * preview of is *this cover*, with the character redrawn as their child, so the
 * cover itself is what the model is given to work from. Everything else in the
 * frame — title, car, forest, composition — then stays put, because it is
 * already there in the reference.
 *
 * Cover art lives in /public and is served from our own domain: the provider
 * fetches it by URL, and it is our artwork, not anyone's photograph.
 */

export type ChildGender = "boy" | "girl";

const COVERS: Record<ChildGender, string> = {
  boy: "/images/books/kolesik-cover.png",
  girl: "/images/books/girl-kolesik-cover.png",
};

/** Path under /public. Defaults to the boy cover, matching the catalogue. */
export function coverPathFor(childGender: string | null | undefined): string {
  return COVERS[childGender === "girl" ? "girl" : "boy"];
}

/**
 * Absolute URL for a cover.
 *
 * Absolute because the provider fetches it from its own servers, where a
 * site-relative path means nothing.
 */
export function absoluteCoverUrl(path: string): string {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL_FALLBACK
  ).replace(/\/$/, "");
  return `${base}${path}`;
}
