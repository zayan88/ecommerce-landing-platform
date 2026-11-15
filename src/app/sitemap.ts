import type { MetadataRoute } from "next";
import { dbStore } from "@/lib/db/store";
import { getSiteUrl } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const entries: MetadataRoute.Sitemap = [{ url: site, changeFrequency: "weekly", priority: 0.5 }];
  try {
    const pages = await dbStore.getLandingPages();
    for (const lp of pages) {
      if (lp.status !== "active" || !lp.slug) continue;
      entries.push({
        url: `${site}/p/${lp.slug}`,
        lastModified: lp.updated_at ? new Date(lp.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  } catch (err) {
    console.warn("[sitemap] could not load landing pages", err);
  }
  return entries;
}
