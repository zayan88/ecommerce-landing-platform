import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export const runtime = "edge";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/p/"],
        // Admin, API and the post-order page must never be indexed
        disallow: ["/admin", "/api/", "/p/*/thank-you"],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
