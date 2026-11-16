import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { buildFeed, renderCsv, renderXml } from "@/lib/feed/product-feed";

export const runtime = "edge";

/**
 * Public product catalog feed (no login: Meta / TikTok / Google fetch it on a schedule).
 *   /feed/products.xml   RSS 2.0 with the Google/Meta g: namespace (works for Meta Commerce, TikTok, Google Merchant)
 *   /feed/products.csv   same data as CSV
 * Only public product fields are emitted. Cached for 5 minutes so the schedule fetches cost nothing.
 */
export async function GET(req: NextRequest, { params }: { params: { file: string } }) {
  const file = (params.file || "").toLowerCase();
  if (file !== "products.xml" && file !== "products.csv") {
    return new NextResponse("Not found", { status: 404 });
  }

  const [brand, products] = await Promise.all([getBrand(), dbStore.getProducts()]);
  const base = (brand.site_domain || new URL(req.url).origin).replace(/\/+$/, "");
  const { items } = buildFeed(products, { base, brand: brand.store_name });

  const headers = {
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "X-Content-Type-Options": "nosniff",
  };

  if (file === "products.csv") {
    return new NextResponse(renderCsv(items), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" } });
  }
  const xml = renderXml(items, { title: brand.store_name, link: base, description: brand.tagline || brand.store_name });
  return new NextResponse(xml, { headers: { ...headers, "Content-Type": "application/xml; charset=utf-8" } });
}
