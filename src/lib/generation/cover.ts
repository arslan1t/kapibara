import { SITE_URL_FALLBACK } from "@/lib/constants";

/**
 * The book's own cover, used as the reference image for generation.
 *
 * The provider is handed this exact file and asked to redraw only the child in
 * it, so the catalogue and the generator must never disagree about which cover
 * a product has. They cannot: both read `Product.coverImage`.
 *
 * It used to be derived from `childGender`, which held while there was one
 * series. With two, a girl's book from either series mapped to the same file —
 * meaning a customer could be shown a preview of a book they had not ordered.
 *
 * Cover art lives in /public and is served from our own domain: the provider
 * fetches it by URL, and it is our artwork, not anyone's photograph.
 */

/** Used when a caller has no product to hand. */
export const FALLBACK_COVER = "/images/books/kolesik-cover.png";

export function coverPathFor(coverImage: string | null | undefined): string {
  const value = coverImage?.trim();
  return value && value.length > 0 ? value : FALLBACK_COVER;
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
