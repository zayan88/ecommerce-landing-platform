import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { getBrand } from "@/lib/brand";
import { buildFeed } from "@/lib/feed/product-feed";

export const runtime = "edge";

// Admin-only (the /api default in middleware): how many products are in the catalog feed and why others are left out.
export async function GET(req: NextRequest) {
  const [brand, products] = await Promise.all([getBrand(), dbStore.getProducts()]);
  const base = (brand.site_domain || new URL(req.url).origin).replace(/\/+$/, "");
  const { items, skipped } = buildFeed(products, { base, brand: brand.store_name });
  return NextResponse.json(
    {
      success: true,
      base,
      urls: { xml: `${base}/feed/products.xml`, csv: `${base}/feed/products.csv` },
      included: items.length,
      skipped: skipped.filter((s) => s.reason !== "inactive").slice(0, 50),
      inactive: skipped.filter((s) => s.reason === "inactive").length,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
