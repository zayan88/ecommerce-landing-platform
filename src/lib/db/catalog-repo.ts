/**
 * Catalog repository — products, offers, landing pages and admin settings on Cloudflare D1.
 * Schema: migrations/0004_catalog.sql. Design: docs/architecture-kv-d1.md ("Catalog on D1").
 *
 * Backend selection: env CATALOG_BACKEND = "kv" (default) | "d1". With "kv" nothing in this file runs
 * and dbStore keeps using KV exactly as before, so rolling back is one setting.
 * Images are NOT here: they stay in KV behind /api/media; rows only hold their URLs.
 *
 * SECURITY — rules every query in this file follows:
 *  - values are ALWAYS bound parameters (`?`), never concatenated into the SQL text;
 *  - the only dynamic SQL fragments are column names taken from the constant lists below
 *    (never from input) and generated `?` placeholder lists;
 *  - nothing here logs SQL parameters;
 *  - `landing_pages.meta_capi_token` and some `settings` values are secrets. This layer returns
 *    them to server code only; /p/[slug] strips the token and /api/settings masks the secrets.
 * Edge-safe: no Node APIs.
 */
import type { LandingPage, Product, ProductOffer } from "@/types";
import { getD1Client, D1UnavailableError, type SqlClient, type SqlParam, type SqlStatement } from "./d1";
import { currentStoreId } from "./orders-repo";

// ───────────────────────── Backend selection ─────────────────────────

export type CatalogBackend = "kv" | "d1";

/** Read per call (next-on-pages fills process.env per request). Anything but "d1" means KV. */
export function catalogBackend(): CatalogBackend {
  return (process.env.CATALOG_BACKEND || "").trim().toLowerCase() === "d1" ? "d1" : "kv";
}

/**
 * Verification period only: with CATALOG_BACKEND=d1 and CATALOG_KV_MIRROR=1 every catalog / settings
 * write is also copied (best effort) to the KV keys the KV backend reads, so switching back to KV
 * loses nothing. Costs the old KV writes again — leave it off once D1 is trusted.
 */
export function catalogKvMirrorEnabled(): boolean {
  return catalogBackend() === "d1" && (process.env.CATALOG_KV_MIRROR || "").trim() === "1";
}

// ───────────────────────── Read cache (per isolate) ─────────────────────────

/**
 * Short-lived in-memory cache of catalog reads, one per isolate.
 * - TTL: env CATALOG_CACHE_TTL_SECONDS (default 30, 0 disables, max 3600).
 * - Any catalog / settings write in THIS isolate clears it immediately.
 * - Trade-off: another isolate keeps serving its cached copy until its TTL ends, so after an admin
 *   save a visitor may see the previous version for up to the TTL (30 s by default). Admin screens
 *   that must read their own write run in the isolate that wrote, or wait one TTL.
 * - Values are cloned on the way in and out: callers may mutate what they get.
 */
const DEFAULT_CACHE_TTL_SECONDS = 30;
const CACHE_MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; value: unknown }>();
export const catalogCacheStats = { hits: 0, misses: 0 };

export function catalogCacheTtlMs(): number {
  const raw = (process.env.CATALOG_CACHE_TTL_SECONDS || "").trim();
  const n = raw === "" ? DEFAULT_CACHE_TTL_SECONDS : Number(raw);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_CACHE_TTL_SECONDS * 1000;
  return Math.min(n, 3600) * 1000;
}

const clone = <T>(value: T): T => (value === null || typeof value !== "object" ? value : structuredClone(value));

export async function cachedCatalogRead<T>(key: string, load: () => Promise<T>): Promise<T> {
  const ttl = catalogCacheTtlMs();
  if (ttl <= 0) return load();
  const k = `${currentStoreId()}|${key}`;
  const hit = cache.get(k);
  if (hit && Date.now() - hit.at < ttl) {
    catalogCacheStats.hits++;
    return clone(hit.value as T);
  }
  catalogCacheStats.misses++;
  const value = await load();
  if (cache.size >= CACHE_MAX_ENTRIES) cache.clear(); // bound memory (e.g. many unknown slugs)
  cache.set(k, { at: Date.now(), value: clone(value) });
  return value;
}

/** Called after every catalog / settings write in this isolate. */
export function invalidateCatalogCache(): void {
  cache.clear();
}

// ───────────────────────── Column maps (whitelists) ─────────────────────────

const PRODUCT_INSERT_COLS = [
  "store_id", "id", "slug", "sku", "title_ar", "title_en", "base_price", "compare_at_price", "cost_price",
  "stock_quantity", "track_stock", "stock_set_at", "images", "description_ar", "status", "extra",
  "created_at", "updated_at", "created_ms",
] as const;
/** Keys of a Product object that have their own column (everything else goes to `extra`). */
const PRODUCT_KNOWN = new Set<string>([
  "id", "slug", "sku", "title_ar", "title_en", "base_price", "compare_at_price", "cost_price", "stock_quantity",
  "track_stock", "stock_set_at", "images", "description_ar", "status", "created_at", "updated_at", "offers",
]);
const PRODUCT_UPSERT_SQL =
  `INSERT INTO products (${PRODUCT_INSERT_COLS.join(", ")}) VALUES (${PRODUCT_INSERT_COLS.map(() => "?").join(", ")}) ` +
  `ON CONFLICT (store_id, id) DO UPDATE SET ` +
  PRODUCT_INSERT_COLS.filter((c) => c !== "store_id" && c !== "id").map((c) => `${c} = excluded.${c}`).join(", ");

const OFFER_INSERT_COLS = [
  "store_id", "product_id", "id", "title_ar", "quantity", "price", "original_price", "discount_label",
  "is_popular", "free_shipping", "sort_order", "position", "extra",
] as const;
const OFFER_KNOWN = new Set<string>([
  "id", "product_id", "title_ar", "quantity", "price", "original_price", "discount_label", "is_popular", "free_shipping", "sort_order",
]);
const OFFER_INSERT_SQL =
  `INSERT OR REPLACE INTO product_offers (${OFFER_INSERT_COLS.join(", ")}) VALUES (${OFFER_INSERT_COLS.map(() => "?").join(", ")})`;

const LP_INSERT_COLS = [
  "store_id", "id", "slug", "product_id", "title", "component_key", "status", "custom_domain", "meta_pixel_id",
  "meta_capi_token", "head_scripts", "custom_css", "content_config", "sections_config", "deployment_url",
  "deployment_status", "last_published_at", "extra", "created_at", "updated_at", "created_ms",
] as const;
const LP_KNOWN = new Set<string>([
  "id", "slug", "product_id", "title", "component_key", "status", "custom_domain", "meta_pixel_id", "meta_capi_token",
  "head_scripts", "custom_css", "content_config", "sections_config", "deployment_url", "deployment_status",
  "last_published_at", "created_at", "updated_at", "product",
]);
const LP_INSERT_HEAD = `INSERT INTO landing_pages (${LP_INSERT_COLS.join(", ")}) VALUES (${LP_INSERT_COLS.map(() => "?").join(", ")}) `;
/** Full replace of an existing page with the same id. */
const LP_UPSERT_BY_ID_SQL =
  LP_INSERT_HEAD +
  `ON CONFLICT (store_id, id) DO UPDATE SET ` +
  LP_INSERT_COLS.filter((c) => c !== "store_id" && c !== "id").map((c) => `${c} = excluded.${c}`).join(", ") +
  ` RETURNING *`;
/**
 * Save without an id: a page with this slug keeps its id and creation date, and keeps every optional
 * field the caller did not provide (NULL in the insert values).
 */
const LP_KEEP_WHEN_NULL = [
  "custom_domain", "meta_pixel_id", "meta_capi_token", "head_scripts", "custom_css", "content_config", "sections_config", "extra",
] as const;
const LP_UPSERT_BY_SLUG_SQL =
  LP_INSERT_HEAD +
  `ON CONFLICT (store_id, slug) DO UPDATE SET ` +
  ["product_id", "title", "component_key", "status", "deployment_url", "deployment_status", "last_published_at", "updated_at"]
    .map((c) => `${c} = excluded.${c}`)
    .concat(LP_KEEP_WHEN_NULL.map((c) => `${c} = COALESCE(excluded.${c}, landing_pages.${c})`))
    .join(", ") +
  ` RETURNING *`;
/**
 * Product → landing page sync (product create / edit): creates the page of the product's slug when it
 * does not exist; otherwise only refreshes what follows the product (title, product, status, URL) and
 * leaves the page's content, sections, component and pixel settings alone.
 */
const LP_SYNC_SQL =
  LP_INSERT_HEAD +
  `ON CONFLICT (store_id, slug) DO UPDATE SET ` +
  ["product_id", "title", "status", "deployment_url", "deployment_status", "last_published_at", "updated_at"]
    .map((c) => `${c} = excluded.${c}`)
    .join(", ") +
  ` RETURNING *`;

/** Columns PATCH /api/landing-pages may change one at a time. */
const LP_PATCHABLE: Record<string, "json" | "text"> = { sections_config: "json", content_config: "json", status: "text" };

// ───────────────────────── Row mapping ─────────────────────────

const text = (v: unknown, fallback = ""): string => (v === undefined || v === null ? fallback : String(v));
const optText = (v: unknown): string | null => (v === undefined || v === null ? null : String(v));
const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) && v !== null && v !== "" && v !== undefined ? n : fallback;
};
const optNum = (v: unknown): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const optBool = (v: unknown): number | null => (v === undefined || v === null ? null : v ? 1 : 0);
const json = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  try {
    return JSON.stringify(v);
  } catch {
    return null;
  }
};
function parseJson(textValue: unknown): any {
  if (typeof textValue !== "string" || !textValue) return undefined;
  try {
    return JSON.parse(textValue);
  } catch {
    return undefined;
  }
}
function extraOf(obj: Record<string, any>, known: Set<string>): string | null {
  const extra: Record<string, any> = {};
  for (const key of Object.keys(obj)) if (!known.has(key) && obj[key] !== undefined) extra[key] = obj[key];
  return Object.keys(extra).length > 0 ? json(extra) : null;
}
const plainObject = (v: any): Record<string, any> => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
const ms = (iso: unknown): number => Date.parse(String(iso || "")) || Date.now();

function productParams(store: string, p: Product): SqlParam[] {
  const o = p as Product & Record<string, any>;
  return [
    store, text(o.id), text(o.slug), text(o.sku), text(o.title_ar), optText(o.title_en), num(o.base_price),
    optNum(o.compare_at_price), optNum(o.cost_price), Math.trunc(num(o.stock_quantity)), o.track_stock ? 1 : 0,
    optText(o.stock_set_at), json(Array.isArray(o.images) ? o.images : []) || "[]", text(o.description_ar),
    text(o.status, "active"), extraOf(o, PRODUCT_KNOWN), text(o.created_at), text(o.updated_at), ms(o.created_at),
  ];
}

function offerParams(store: string, productId: string, offer: ProductOffer, position: number): SqlParam[] {
  const o = offer as ProductOffer & Record<string, any>;
  return [
    store, productId, text(o.id, `off-${position + 1}`), text(o.title_ar), Math.trunc(num(o.quantity, 1)), num(o.price),
    optNum(o.original_price), optText(o.discount_label), optBool(o.is_popular), optBool(o.free_shipping),
    Math.trunc(num(o.sort_order)), position, extraOf(o, OFFER_KNOWN),
  ];
}

function rowToOffer(row: Record<string, any>, prefix = ""): ProductOffer {
  const g = (name: string) => row[prefix + name];
  const offer: Record<string, any> = { ...plainObject(parseJson(g("extra"))) };
  offer.id = g("id");
  offer.product_id = prefix ? row.id : g("product_id");
  offer.title_ar = g("title_ar");
  offer.quantity = g("quantity");
  offer.price = g("price");
  if (g("original_price") !== null && g("original_price") !== undefined) offer.original_price = g("original_price");
  if (g("discount_label") !== null && g("discount_label") !== undefined) offer.discount_label = g("discount_label");
  if (g("is_popular") !== null && g("is_popular") !== undefined) offer.is_popular = Boolean(g("is_popular"));
  if (g("free_shipping") !== null && g("free_shipping") !== undefined) offer.free_shipping = Boolean(g("free_shipping"));
  offer.sort_order = g("sort_order");
  return offer as ProductOffer;
}

export function rowToProduct(row: Record<string, any>, offers: ProductOffer[]): Product {
  const p: Record<string, any> = { ...plainObject(parseJson(row.extra)) };
  p.id = row.id;
  p.title_ar = row.title_ar;
  if (row.title_en !== null && row.title_en !== undefined) p.title_en = row.title_en;
  p.slug = row.slug;
  p.sku = row.sku;
  p.base_price = row.base_price;
  if (row.compare_at_price !== null && row.compare_at_price !== undefined) p.compare_at_price = row.compare_at_price;
  if (row.cost_price !== null && row.cost_price !== undefined) p.cost_price = row.cost_price;
  const images = parseJson(row.images);
  p.images = Array.isArray(images) ? images : [];
  p.description_ar = row.description_ar;
  p.stock_quantity = row.stock_quantity;
  p.status = row.status;
  if (row.track_stock) p.track_stock = true;
  if (row.stock_set_at) p.stock_set_at = row.stock_set_at;
  p.created_at = row.created_at;
  p.updated_at = row.updated_at;
  p.offers = offers;
  return p as Product;
}

function landingPageParams(store: string, lp: LandingPage): SqlParam[] {
  const o = lp as LandingPage & Record<string, any>;
  return [
    store, text(o.id), text(o.slug), text(o.product_id), text(o.title), text(o.component_key, "starter-template"),
    text(o.status, "active"), optText(o.custom_domain), optText(o.meta_pixel_id), optText(o.meta_capi_token),
    optText(o.head_scripts), optText(o.custom_css), json(o.content_config), json(o.sections_config),
    optText(o.deployment_url), optText(o.deployment_status), optText(o.last_published_at), extraOf(o, LP_KNOWN),
    text(o.created_at), text(o.updated_at), ms(o.created_at),
  ];
}

/** The stored page, WITHOUT relations (`product`) and WITHOUT default sections: dbStore adds both. */
export function rowToLandingPage(row: Record<string, any>): LandingPage {
  const lp: Record<string, any> = { ...plainObject(parseJson(row.extra)) };
  lp.id = row.id;
  lp.product_id = row.product_id;
  lp.title = row.title;
  lp.slug = row.slug;
  lp.component_key = row.component_key;
  lp.status = row.status;
  for (const c of ["custom_domain", "meta_pixel_id", "meta_capi_token", "head_scripts", "custom_css", "deployment_url", "deployment_status", "last_published_at"]) {
    if (row[c] !== null && row[c] !== undefined) lp[c] = row[c];
  }
  const sections = parseJson(row.sections_config);
  if (Array.isArray(sections)) lp.sections_config = sections;
  const content = parseJson(row.content_config);
  if (content && typeof content === "object") lp.content_config = content;
  lp.created_at = row.created_at;
  lp.updated_at = row.updated_at;
  return lp as LandingPage;
}

// ───────────────────────── Public types ─────────────────────────

export type CatalogImportOutcome = "inserted" | "updated" | "unchanged" | "conflict";
export interface CatalogCounts {
  products: number;
  offers: number;
  landing_pages: number;
  settings: number;
}

export interface CatalogRepo {
  listProducts(): Promise<Product[]>;
  /** By id or slug (id wins). ONE query: the product row joined with its offers. */
  getProduct(idOrSlug: string): Promise<Product | null>;
  /**
   * Upserts the product and replaces its offers in ONE transaction. A different product that holds
   * the same slug is replaced (as on KV, where the slug key and list entry are overwritten).
   * With `landingPage`, the product's page is created / refreshed in the same transaction.
   */
  saveProduct(product: Product, landingPage?: LandingPage): Promise<{ product: Product; landingPage: LandingPage | null }>;
  /** Deletes the product, its offers and its landing pages. Returns how many products were removed. */
  deleteProduct(idOrSlug: string): Promise<number>;

  listLandingPages(): Promise<LandingPage[]>;
  /** By slug or id (slug wins). One indexed query. */
  getLandingPage(slugOrId: string): Promise<LandingPage | null>;
  /** `idProvided`: full replace by id. Otherwise: upsert on the slug, keeping what was not provided. */
  saveLandingPage(lp: LandingPage, idProvided: boolean): Promise<LandingPage>;
  /** Changes one of sections_config / content_config / status. null when the page is not stored. */
  patchLandingPage(slugOrId: string, patch: Partial<Pick<LandingPage, "sections_config" | "content_config" | "status">>): Promise<LandingPage | null>;
  deleteLandingPage(slugOrId: string): Promise<number>;

  getSettingsOverrides(): Promise<Record<string, any>>;
  /** Upserts the given fields only (one row each), atomically. `undefined` values are skipped. */
  setSettings(patch: Record<string, any>): Promise<void>;

  importProducts(products: Product[]): Promise<Record<string, CatalogImportOutcome>>;
  importLandingPages(pages: LandingPage[]): Promise<Record<string, CatalogImportOutcome>>;
  /** `overwrite: false` keeps values already in D1 (re-running the import never clobbers newer edits). */
  importSettings(overrides: Record<string, any>, overwrite: boolean): Promise<{ written: number; kept: number }>;
  counts(): Promise<CatalogCounts>;
}

// ───────────────────────── D1 implementation ─────────────────────────

const chunk = <T>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};
const marks = (n: number) => Array.from({ length: n }, () => "?").join(", ");
const validKey = (v: unknown): v is string => typeof v === "string" && v.length > 0 && v.length <= 200;
const SETTINGS_KEY_RE = /^[a-z][a-z0-9_]{0,63}$/i;

const OFFER_JOIN_COLS = ["id", "title_ar", "quantity", "price", "original_price", "discount_label", "is_popular", "free_shipping", "sort_order", "extra"]
  .map((c) => `o.${c} AS o_${c}`)
  .join(", ");

export function createD1CatalogRepo(db: SqlClient, store: string = "default"): CatalogRepo {
  /** Product row + offers replacement, as statements for a batch. */
  const productStatements = (p: Product): SqlStatement[] => {
    const offers = Array.isArray(p.offers) ? p.offers : [];
    return [
      { sql: PRODUCT_UPSERT_SQL, params: productParams(store, p) },
      { sql: "DELETE FROM product_offers WHERE store_id = ? AND product_id = ?", params: [store, p.id] },
      ...offers.map((o, i) => ({ sql: OFFER_INSERT_SQL, params: offerParams(store, p.id, o, i) })),
    ];
  };
  /** Removes OTHER products holding this slug (and their offers), so the unique slug can move. */
  const releaseProductSlug = (p: Product): SqlStatement[] => [
    {
      sql:
        "DELETE FROM product_offers WHERE store_id = ? AND product_id IN " +
        "(SELECT id FROM products WHERE store_id = ? AND slug = ? AND id <> ?)",
      params: [store, store, p.slug, p.id],
    },
    { sql: "DELETE FROM products WHERE store_id = ? AND slug = ? AND id <> ?", params: [store, p.slug, p.id] },
  ];

  const repo: CatalogRepo = {
    async listProducts() {
      const res = await db.batch([
        { sql: "SELECT * FROM products WHERE store_id = ? ORDER BY created_ms DESC, id DESC", params: [store] },
        { sql: "SELECT * FROM product_offers WHERE store_id = ? ORDER BY product_id, position", params: [store] },
      ]);
      const byProduct = new Map<string, ProductOffer[]>();
      for (const row of res[1].rows) {
        const list = byProduct.get(row.product_id) || [];
        list.push(rowToOffer(row));
        byProduct.set(row.product_id, list);
      }
      return res[0].rows.map((row) => rowToProduct(row, byProduct.get(row.id) || []));
    },

    async getProduct(idOrSlug) {
      if (!validKey(idOrSlug)) return null;
      const res = await db.query(
        `SELECT p.*, ${OFFER_JOIN_COLS} FROM products p ` +
          "LEFT JOIN product_offers o ON o.store_id = p.store_id AND o.product_id = p.id " +
          "WHERE p.store_id = ? AND p.id = " +
          "(SELECT id FROM products WHERE store_id = ? AND (id = ? OR slug = ?) ORDER BY (id = ?) DESC LIMIT 1) " +
          "ORDER BY o.position",
        [store, store, idOrSlug, idOrSlug, idOrSlug]
      );
      if (res.rows.length === 0) return null;
      const offers = res.rows.filter((r) => r.o_id !== null && r.o_id !== undefined).map((r) => rowToOffer(r, "o_"));
      return rowToProduct(res.rows[0], offers);
    },

    async saveProduct(product, landingPage) {
      const statements: SqlStatement[] = [...releaseProductSlug(product), ...productStatements(product)];
      let lpIndex = -1;
      if (landingPage) {
        lpIndex = statements.length;
        statements.push({ sql: LP_SYNC_SQL, params: landingPageParams(store, landingPage) });
      }
      const res = await db.batch(statements);
      const lpRow = lpIndex >= 0 ? res[lpIndex].rows[0] : null;
      return { product, landingPage: lpRow ? rowToLandingPage(lpRow) : null };
    },

    async deleteProduct(idOrSlug) {
      if (!validKey(idOrSlug)) return 0;
      const ids = "(SELECT id FROM products WHERE store_id = ? AND (id = ? OR slug = ?))";
      const p: SqlParam[] = [store, store, idOrSlug, idOrSlug];
      const res = await db.batch([
        { sql: `DELETE FROM product_offers WHERE store_id = ? AND product_id IN ${ids}`, params: p },
        { sql: `DELETE FROM landing_pages WHERE store_id = ? AND product_id IN ${ids}`, params: p },
        { sql: "DELETE FROM products WHERE store_id = ? AND (id = ? OR slug = ?) RETURNING id", params: [store, idOrSlug, idOrSlug] },
      ]);
      return res[2].rows.length;
    },

    async listLandingPages() {
      const res = await db.query("SELECT * FROM landing_pages WHERE store_id = ? ORDER BY created_ms DESC, id DESC", [store]);
      return res.rows.map(rowToLandingPage);
    },

    async getLandingPage(slugOrId) {
      if (!validKey(slugOrId)) return null;
      const res = await db.query(
        "SELECT * FROM landing_pages WHERE store_id = ? AND (slug = ? OR id = ?) ORDER BY (slug = ?) DESC LIMIT 1",
        [store, slugOrId, slugOrId, slugOrId]
      );
      return res.rows[0] ? rowToLandingPage(res.rows[0]) : null;
    },

    async saveLandingPage(lp, idProvided) {
      const statements: SqlStatement[] = [];
      if (idProvided) {
        // Another page holding this slug is replaced (KV: its slug key and list entry were overwritten).
        statements.push({ sql: "DELETE FROM landing_pages WHERE store_id = ? AND slug = ? AND id <> ?", params: [store, lp.slug, lp.id] });
        statements.push({ sql: LP_UPSERT_BY_ID_SQL, params: landingPageParams(store, lp) });
      } else {
        statements.push({ sql: LP_UPSERT_BY_SLUG_SQL, params: landingPageParams(store, lp) });
      }
      const res = await db.batch(statements);
      const row = res[res.length - 1].rows[0];
      return row ? rowToLandingPage(row) : lp;
    },

    async patchLandingPage(slugOrId, patch) {
      if (!validKey(slugOrId)) return null;
      const sets: string[] = [];
      const params: SqlParam[] = [];
      for (const [column, kind] of Object.entries(LP_PATCHABLE)) {
        const value = (patch as Record<string, any>)[column];
        if (value === undefined) continue;
        sets.push(`${column} = ?`);
        params.push(kind === "json" ? json(value) : text(value));
      }
      if (sets.length === 0) return repo.getLandingPage(slugOrId);
      sets.push("updated_at = ?");
      params.push(new Date().toISOString());
      const res = await db.query(
        `UPDATE landing_pages SET ${sets.join(", ")} WHERE store_id = ? AND id = ` +
          "(SELECT id FROM landing_pages WHERE store_id = ? AND (id = ? OR slug = ?) ORDER BY (id = ?) DESC LIMIT 1) RETURNING *",
        [...params, store, store, slugOrId, slugOrId, slugOrId]
      );
      return res.rows[0] ? rowToLandingPage(res.rows[0]) : null;
    },

    async deleteLandingPage(slugOrId) {
      if (!validKey(slugOrId)) return 0;
      const res = await db.query("DELETE FROM landing_pages WHERE store_id = ? AND (id = ? OR slug = ?) RETURNING id", [
        store, slugOrId, slugOrId,
      ]);
      return res.rows.length;
    },

    async getSettingsOverrides() {
      const res = await db.query<{ key: string; value: string }>("SELECT key, value FROM settings WHERE store_id = ?", [store]);
      const out: Record<string, any> = {};
      for (const row of res.rows) {
        const value = parseJson(row.value);
        if (value !== undefined) out[row.key] = value;
      }
      return out;
    },

    async setSettings(patch) {
      const now = new Date().toISOString();
      const statements: SqlStatement[] = [];
      for (const key of Object.keys(patch || {})) {
        const value = json(patch[key]);
        if (!SETTINGS_KEY_RE.test(key) || patch[key] === undefined || value === null) continue;
        statements.push({
          sql:
            "INSERT INTO settings (store_id, key, value, updated_at) VALUES (?, ?, ?, ?) " +
            "ON CONFLICT (store_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
          params: [store, key, value, now],
        });
      }
      if (statements.length > 0) await db.batch(statements);
    },

    /**
     * Idempotent bulk import (KV → D1). Per product: inserted, updated (the incoming copy is newer),
     * unchanged, or conflict (its slug belongs to another product id — nothing is overwritten).
     */
    async importProducts(products) {
      const outcome: Record<string, CatalogImportOutcome> = {};
      const time = (v: unknown) => Date.parse(String(v || "")) || 0;
      for (const group of chunk(products.filter((p) => validKey(p?.id) && validKey(p?.slug)), 10)) {
        const ids = group.map((p) => p.id);
        const slugs = group.map((p) => p.slug);
        const existing = await db.query<{ id: string; slug: string; updated_at: string }>(
          `SELECT id, slug, updated_at FROM products WHERE store_id = ? AND (id IN (${marks(ids.length)}) OR slug IN (${marks(slugs.length)}))`,
          [store, ...ids, ...slugs]
        );
        const byId = new Map(existing.rows.map((r) => [r.id, r]));
        const slugOwner = new Map(existing.rows.map((r) => [r.slug, r.id]));
        const statements: SqlStatement[] = [];
        for (const p of group) {
          if (outcome[p.id]) continue; // the same id twice in one import
          const owner = slugOwner.get(p.slug);
          if (owner !== undefined && owner !== p.id) {
            outcome[p.id] = "conflict";
            continue;
          }
          const stored = byId.get(p.id);
          if (stored && time(p.updated_at) <= time(stored.updated_at)) {
            outcome[p.id] = "unchanged";
            continue;
          }
          outcome[p.id] = stored ? "updated" : "inserted";
          if (stored) slugOwner.delete(stored.slug);
          slugOwner.set(p.slug, p.id);
          statements.push(...productStatements(p));
        }
        if (statements.length > 0) await db.batch(statements);
      }
      return outcome;
    },

    async importLandingPages(pages) {
      const outcome: Record<string, CatalogImportOutcome> = {};
      const time = (v: unknown) => Date.parse(String(v || "")) || 0;
      for (const group of chunk(pages.filter((l) => validKey(l?.id) && validKey(l?.slug)), 10)) {
        const ids = group.map((l) => l.id);
        const slugs = group.map((l) => l.slug);
        const existing = await db.query<{ id: string; slug: string; updated_at: string }>(
          `SELECT id, slug, updated_at FROM landing_pages WHERE store_id = ? AND (id IN (${marks(ids.length)}) OR slug IN (${marks(slugs.length)}))`,
          [store, ...ids, ...slugs]
        );
        const byId = new Map(existing.rows.map((r) => [r.id, r]));
        const slugOwner = new Map(existing.rows.map((r) => [r.slug, r.id]));
        const statements: SqlStatement[] = [];
        for (const lp of group) {
          if (outcome[lp.id]) continue;
          const owner = slugOwner.get(lp.slug);
          if (owner !== undefined && owner !== lp.id) {
            outcome[lp.id] = "conflict";
            continue;
          }
          const stored = byId.get(lp.id);
          if (stored && time(lp.updated_at) <= time(stored.updated_at)) {
            outcome[lp.id] = "unchanged";
            continue;
          }
          outcome[lp.id] = stored ? "updated" : "inserted";
          if (stored) slugOwner.delete(stored.slug);
          slugOwner.set(lp.slug, lp.id);
          statements.push({ sql: LP_UPSERT_BY_ID_SQL, params: landingPageParams(store, lp) });
        }
        if (statements.length > 0) await db.batch(statements);
      }
      return outcome;
    },

    async importSettings(overrides, overwrite) {
      const now = new Date().toISOString();
      const statements: SqlStatement[] = [];
      for (const key of Object.keys(overrides || {})) {
        const value = json(overrides[key]);
        if (!SETTINGS_KEY_RE.test(key) || value === null) continue;
        statements.push({
          sql:
            "INSERT INTO settings (store_id, key, value, updated_at) VALUES (?, ?, ?, ?) " +
            (overwrite
              ? "ON CONFLICT (store_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at "
              : "ON CONFLICT (store_id, key) DO NOTHING ") +
            "RETURNING key",
          params: [store, key, value, now],
        });
      }
      if (statements.length === 0) return { written: 0, kept: 0 };
      const res = await db.batch(statements);
      const written = res.filter((r) => r.rows.length === 1).length;
      return { written, kept: statements.length - written };
    },

    async counts() {
      const res = await db.batch(
        ["products", "product_offers", "landing_pages", "settings"].map((table) => ({
          sql: `SELECT COUNT(*) AS n FROM ${table} WHERE store_id = ?`,
          params: [store],
        }))
      );
      const n = (i: number) => Number(res[i].rows[0]?.n) || 0;
      return { products: n(0), offers: n(1), landing_pages: n(2), settings: n(3) };
    },
  };
  return repo;
}

/** The repository for this request. Throws D1UnavailableError when CATALOG_BACKEND=d1 but D1 is not bound. */
export function getCatalogRepo(): CatalogRepo {
  const db = getD1Client();
  if (!db) throw new D1UnavailableError();
  return createD1CatalogRepo(db, currentStoreId());
}
