import { notFound } from "next/navigation";

/**
 * Anything under a language that no other route claims.
 *
 * A not-found boundary is only reached when a route matches and then calls
 * notFound(). A URL that matches nothing never enters the tree at all, and
 * Next answers it with its own built-in page: "404: This page could not be
 * found", in English, with no header, no footer and no sign of the shop —
 * shown to readers who came here for Russian and Uzbek.
 *
 * Catch-all segments rank below every static and dynamic route, so this
 * cannot shadow a real page; it only picks up what would otherwise fall
 * through. Living inside (main) puts the site's own layout around the 404.
 */
export default function UnknownPage() {
  notFound();
}
