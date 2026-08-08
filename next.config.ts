import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * `'unsafe-inline'` on style-src is unavoidable today: Next.js injects inline
 * <style> for CSS-in-JS and route transitions, and Tailwind's runtime-inserted
 * rules arrive the same way. Nonces cannot be applied to those without ejecting
 * from the framework's styling pipeline.
 *
 * `'unsafe-inline'` on script-src is likewise required by the App Router's
 * inline bootstrap and flight payloads. Next supports nonces only via a
 * middleware that rewrites every response, which would force every page to be
 * dynamic — a real cost for a storefront whose catalogue pages are otherwise
 * cacheable. The policy below is therefore not XSS-proof on its own; the actual
 * defence is that no user input is ever rendered as HTML (React escapes
 * everything, and there is no dangerouslySetInnerHTML in this codebase).
 *
 * Everything else is locked down: no framing, no plugins, no arbitrary
 * connections, forms only to ourselves.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  // blob: is needed for the local preview of a photo the customer just picked,
  // before it is uploaded.
  "img-src 'self' data: blob:",
  "media-src 'self'",
  // Same-origin only. The payment provider is reached server-side, never from
  // the browser, so no provider host belongs here.
  "connect-src 'self'",
  // Upgrades any stray http:// subresource rather than blocking the page.
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  // Redundant with frame-ancestors for modern browsers, kept for older ones.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site but the full path same-site: enough for our own
  // analytics, never leaks an order id or a reset link to a third party.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site asks for none of these; denying them means a compromised script
  // cannot either.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  // Isolates the browsing context from anything it opens or that opens it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/**
 * HSTS is applied only in production. In development the site runs over plain
 * HTTP on localhost, and a stray HSTS header there would pin the browser to
 * https://localhost for months.
 */
const productionOnlyHeaders =
  process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : [];

const nextConfig: NextConfig = {
  // Standalone output bundles only the files needed to run the server.
  // This keeps the Docker image small (no full node_modules in the final stage).
  output: "standalone",

  // Build in a single process.
  //
  // "Collecting page data" normally forks a worker per CPU. Beget's shared
  // hosting refuses those forks — the build dies with a bare `spawn EPERM`
  // that names nothing — and the production host is the one machine where the
  // build absolutely has to work.
  //
  // Applied everywhere rather than behind a flag, so that the build a
  // developer runs is the build that ships. The output is byte-for-byte the
  // same either way; only the parallelism of page-data collection changes, and
  // for a project this size that is a few seconds.
  experimental: { workerThreads: false, cpus: 1 },

  // Header values are compiled into the build; do not put secrets here.
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Every route, including API routes and static assets.
        source: "/:path*",
        headers: [...securityHeaders, ...productionOnlyHeaders],
      },
      {
        // Private endpoints must never be held by a shared cache, even if a
        // proxy ignores the response's own Cache-Control.
        source: "/api/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/account/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          // Belt and braces: the admin panel must never be indexed.
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // `/promo-rules` was the earlier path for the same document. Keeping a
      // permanent redirect avoids two indexable URLs with identical content.
      { source: "/promo-rules", destination: "/promotion-rules", permanent: true },
    ];
  },

  images: {
    // No remote image hosts are allowed: every image is either bundled in
    // /public or served from the authorization-checked /api/uploads route.
    // Adding a host here would also let it be proxied through /_next/image.
    remotePatterns: [],

    // Capped deliberately. A lazy image that is off-screen or inside a hidden
    // desktop-only container has no layout width when the browser picks from
    // the srcset, so it takes the largest candidate — which meant a phone
    // downloading the 3840 variant (279 KB) of a book cover displayed at
    // 280 px, where the 640 variant (93 KB) is indistinguishable. Nothing on
    // this site is ever displayed wider than about 770 CSS px, so 1920 covers
    // a retina desktop with room to spare and bounds the worst case.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],

    // Source artwork is photographic; AVIF is markedly smaller than WebP here
    // and every browser we support that lacks it falls back automatically.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
