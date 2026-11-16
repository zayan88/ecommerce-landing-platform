import type { Product } from "@/types";

/**
 * Product catalog feed for Meta (Facebook/Instagram) Commerce, TikTok Catalog and Google Merchant Center.
 * Pure functions (no I/O) so they can be tested and used from both the public feed route and the admin status API.
 * Only PUBLIC product fields are read: cost price, supplier data (Safka) and stock numbers are never emitted.
 */

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image: string;
  extraImages: string[];
  price: string; // "400.00 EGP" (regular price)
  salePrice?: string; // "250.00 EGP" when a compare-at price is higher than the selling price
  availability: "in stock" | "out of stock";
  brand: string;
}

export interface FeedSkipped {
  id: string;
  title: string;
  reason: "no_price" | "no_image" | "inactive";
}

export interface FeedBuild {
  items: FeedItem[];
  skipped: FeedSkipped[];
}

const CURRENCY = "EGP";

const money = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2)} ${CURRENCY}`;

/** Makes a stored image path absolute (uploaded images are /api/media/<id>; products may also hold full URLs). */
export function absoluteImage(src: string, base: string): string {
  const s = String(src || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return "https:" + s;
  return base.replace(/\/+$/, "") + (s.startsWith("/") ? "" : "/") + s;
}

/** Plain text, no tags / control characters, collapsed whitespace, length-capped (cut on a word boundary). */
export function cleanText(input: unknown, max: number): string {
  const s = String(input ?? "")
    .replace(/<[^>]*>/g, " ")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > max * 0.6 ? cut.slice(0, sp) : cut).trim();
}

export function buildFeed(products: Product[], opts: { base: string; brand: string }): FeedBuild {
  const items: FeedItem[] = [];
  const skipped: FeedSkipped[] = [];
  const seen = new Set<string>();

  for (const p of products) {
    const title = cleanText(p.title_ar || p.title_en, 150);
    if (p.status !== "active") {
      skipped.push({ id: p.id, title, reason: "inactive" });
      continue;
    }
    const sell = Number(p.base_price);
    if (!Number.isFinite(sell) || sell <= 0) {
      skipped.push({ id: p.id, title, reason: "no_price" });
      continue;
    }
    const images = (Array.isArray(p.images) ? p.images : []).map((i) => absoluteImage(i, opts.base)).filter(Boolean);
    if (images.length === 0) {
      skipped.push({ id: p.id, title, reason: "no_image" });
      continue;
    }
    const id = cleanText(p.sku || p.id, 100) || p.id;
    if (seen.has(id)) continue; // ids must be unique inside a feed
    seen.add(id);

    const compare = Number(p.compare_at_price);
    const hasSale = Number.isFinite(compare) && compare > sell;
    const tracked = Boolean((p as any).track_stock);
    items.push({
      id,
      title: title || id,
      description: cleanText(p.description_ar, 5000) || title || id,
      link: `${opts.base.replace(/\/+$/, "")}/p/${encodeURIComponent(p.slug)}`,
      image: images[0],
      extraImages: images.slice(1, 11),
      price: money(hasSale ? compare : sell),
      ...(hasSale ? { salePrice: money(sell) } : {}),
      availability: tracked && Number(p.stock_quantity) <= 0 ? "out of stock" : "in stock",
      brand: cleanText(opts.brand, 70) || "Store",
    });
  }
  return { items, skipped };
}

// ───────────────────────── XML (RSS 2.0 + Google/Meta g: namespace) ─────────────────────────

const xmlEscape = (s: string) =>
  s
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function renderXml(items: FeedItem[], meta: { title: string; link: string; description: string }): string {
  const tag = (name: string, value: string) => `<g:${name}>${xmlEscape(value)}</g:${name}>`;
  const body = items
    .map(
      (i) =>
        "<item>" +
        tag("id", i.id) +
        tag("title", i.title) +
        tag("description", i.description) +
        tag("link", i.link) +
        tag("image_link", i.image) +
        i.extraImages.map((u) => tag("additional_image_link", u)).join("") +
        tag("availability", i.availability) +
        tag("condition", "new") +
        tag("price", i.price) +
        (i.salePrice ? tag("sale_price", i.salePrice) : "") +
        tag("brand", i.brand) +
        "</item>"
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel>` +
    `<title>${xmlEscape(meta.title)}</title><link>${xmlEscape(meta.link)}</link><description>${xmlEscape(meta.description)}</description>\n` +
    body +
    `\n</channel></rss>\n`
  );
}

// ───────────────────────── CSV ─────────────────────────

const csvCell = (v: string) => {
  let s = v;
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // never let a title run as a spreadsheet formula
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function renderCsv(items: FeedItem[]): string {
  const header = ["id", "title", "description", "availability", "condition", "price", "sale_price", "link", "image_link", "additional_image_link", "brand"];
  const rows = items.map((i) => [
    i.id,
    i.title,
    i.description,
    i.availability,
    "new",
    i.price,
    i.salePrice || "",
    i.link,
    i.image,
    i.extraImages.join(","),
    i.brand,
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
