import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kapibara.ru";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/account",
        "/cart",
        "/checkout",
        "/order-success",
        "/preview",
        "/login",
        "/register",
        "/forgot-password",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
