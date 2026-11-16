/**
 * One-time (repeatable) copy of the catalog from KV to D1: products + offers, landing pages and the
 * admin settings overrides. Idempotent: an item already in D1 is skipped unless the KV copy is newer;
 * settings already in D1 are kept unless `overwriteSettings` is set. KV is only READ here.
 *
 * Source of truth = what the admin lists show: the arrays `custom_products_all` / `custom_lps_all`
 * (for each entry the per-key record `prod:<id>` / `lp:<id>` wins when it is newer, because the list
 * write can lag behind). Keys that are in no list (`prod:*` / `lp:*` leftovers of renamed or deleted
 * items, or demo pages edited in place) are only counted, and imported on request (`includeOrphans`),
 * since importing them blindly could bring deleted products back.
 * The built-in demo arrays are code, not data: they are never imported.
 *
 * Paging: `offset` / `limit` over products, then landing pages (then orphans). One call stays far
 * below the Workers limits (about 2 D1 queries per 10 items; 50 queries per invocation allowed).
 */
import type { LandingPage, Product } from "@/types";
import { kvStore } from "./kv";
import { isD1Available } from "./d1";
import { catalogBackend, getCatalogRepo, invalidateCatalogCache, type CatalogCounts, type CatalogImportOutcome } from "./catalog-repo";

export const CATALOG_IMPORT_PAGE_DEFAULT = 40;
export const CATALOG_IMPORT_PAGE_MAX = 100;
const PRODUCTS_LIST_KEY = "custom_products_all";
const LPS_LIST_KEY = "custom_lps_all";
const SETTINGS_KEY = "system_settings_overrides";

export class CatalogImportError extends Error {}

type Tally = { inserted: number; updated: number; unchanged: number };
export interface CatalogImportReport {
  dry_run: boolean;
  source: {
    products: number;
    landing_pages: number;
    settings_keys: number;
    /** Keys outside the lists; null when they were not listed (only listed on the first page or with include_orphans). */
    orphan_product_keys: number | null;
    orphan_landing_page_keys: number | null;
    total: number;
  };
  page: { offset: number; limit: number; processed: number };
  products: Tally;
  landing_pages: Tally;
  /** Ids whose slug already belongs to another id in D1 (nothing was overwritten). */
  conflicts: string[];
  /** Orphan keys skipped because their item is already in a list (stale copies). */
  skipped_stale: number;
  failed_reads: string[];
  settings: { written: number; kept: number } | null;
  d1: CatalogCounts;
  next_offset: number;
  done: boolean;
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

const time = (v: unknown) => Date.parse(String(v || "")) || 0;
const usable = (v: any): v is { id: string; slug: string } =>
  v && typeof v === "object" && typeof v.id === "string" && v.id !== "" && typeof v.slug === "string" && v.slug !== "";

async function readList<T>(key: string): Promise<T[]> {
  const res = await kvStore.read<unknown>(key);
  if (res.status === "error") throw new CatalogImportError(`KV key ${key} could not be read — nothing was imported`);
  return res.status === "found" && Array.isArray(res.value) ? (res.value.filter(usable) as T[]) : [];
}

type Item = { kind: "product" | "lp"; id: string; listed?: Product | LandingPage; key?: string };

export async function importKvCatalogToD1(
  opts: { offset?: number; limit?: number; dryRun?: boolean; includeOrphans?: boolean; overwriteSettings?: boolean } = {}
): Promise<CatalogImportReport> {
  const dryRun = Boolean(opts.dryRun);
  const offset = Math.max(Math.floor(Number(opts.offset) || 0), 0);
  const limit = Math.min(Math.max(Math.floor(Number(opts.limit) || CATALOG_IMPORT_PAGE_DEFAULT), 1), CATALOG_IMPORT_PAGE_MAX);
  const repo = getCatalogRepo(); // throws D1UnavailableError when D1 is not bound

  // 1. The lists (one KV read each) and the settings overrides.
  const [listedProducts, listedLps, settingsRead] = await Promise.all([
    readList<Product>(PRODUCTS_LIST_KEY),
    readList<LandingPage>(LPS_LIST_KEY),
    kvStore.read<Record<string, any>>(SETTINGS_KEY),
  ]);
  if (settingsRead.status === "error") throw new CatalogImportError("KV settings could not be read — nothing was imported");
  const settings =
    settingsRead.status === "found" && settingsRead.value && typeof settingsRead.value === "object" && !Array.isArray(settingsRead.value)
      ? settingsRead.value
      : {};

  const items: Item[] = [
    ...listedProducts.map((p): Item => ({ kind: "product", id: p.id, listed: p })),
    ...listedLps.map((l): Item => ({ kind: "lp", id: l.id, listed: l })),
  ];

  // 2. Keys that are in no list (listing costs KV list operations: first page / on request only).
  let orphanProducts: number | null = null;
  let orphanLps: number | null = null;
  if (offset === 0 || opts.includeOrphans) {
    const [prodKeys, lpKeys] = await Promise.all([kvStore.listAll("prod:"), kvStore.listAll("lp:")]);
    if (!prodKeys.ok || !lpKeys.ok) throw new CatalogImportError("KV key listing failed — nothing was imported");
    const orphans = (keys: { name: string }[], prefix: string, listed: { id: string; slug: string }[]) => {
      const known = new Set(listed.flatMap((x) => [x.id, x.slug]));
      return keys.map((k) => k.name).filter((name) => !known.has(name.slice(prefix.length))).sort();
    };
    const po = orphans(prodKeys.keys, "prod:", listedProducts);
    const lo = orphans(lpKeys.keys, "lp:", listedLps);
    orphanProducts = po.length;
    orphanLps = lo.length;
    if (opts.includeOrphans) {
      items.push(...po.map((key): Item => ({ kind: "product", id: key, key })), ...lo.map((key): Item => ({ kind: "lp", id: key, key })));
    }
  }

  // 3. Read this page (per-key record of a listed item wins when it is newer).
  const pageItems = items.slice(offset, offset + limit);
  const failedReads: string[] = [];
  let skippedStale = 0;
  const listedProductIds = new Set(listedProducts.map((p) => p.id));
  const listedLpIds = new Set(listedLps.map((l) => l.id));
  const loaded = await mapLimit(pageItems, 6, async (item): Promise<{ kind: Item["kind"]; value: any } | null> => {
    const prefix = item.kind === "product" ? "prod:" : "lp:";
    if (item.listed) {
      const res = await kvStore.read<any>(prefix + item.id);
      const record = res.status === "found" && usable(res.value) && res.value.id === item.id ? res.value : null;
      return { kind: item.kind, value: record && time((record as any).updated_at) > time((item.listed as any).updated_at) ? record : item.listed };
    }
    const res = await kvStore.read<any>(item.key as string);
    if (res.status !== "found" || !usable(res.value)) {
      if (res.status === "error") failedReads.push(item.key as string);
      return null;
    }
    if ((item.kind === "product" ? listedProductIds : listedLpIds).has(res.value.id)) {
      skippedStale++; // an old-slug copy of an item that is in the list
      return null;
    }
    return { kind: item.kind, value: res.value };
  });

  const products: Product[] = [];
  const lps: LandingPage[] = [];
  const seen = new Set<string>();
  for (const entry of loaded) {
    if (!entry) continue;
    const tag = `${entry.kind}:${entry.value.id}`;
    if (seen.has(tag)) continue; // an orphan reachable through both its id key and its slug key
    seen.add(tag);
    if (entry.kind === "product") products.push({ ...entry.value, offers: Array.isArray(entry.value.offers) ? entry.value.offers : [] });
    else {
      const { product: _relation, ...page } = entry.value; // relations are never stored
      lps.push(page as LandingPage);
    }
  }

  // 4. Write.
  const tally = { products: { inserted: 0, updated: 0, unchanged: 0 }, landing_pages: { inserted: 0, updated: 0, unchanged: 0 } };
  const conflicts: string[] = [];
  const count = (bucket: Tally, ids: string[], outcomes: Record<string, CatalogImportOutcome>) => {
    for (const id of ids) {
      const outcome = outcomes[id];
      if (!outcome || outcome === "conflict") conflicts.push(id);
      else bucket[outcome]++;
    }
  };
  let settingsResult: { written: number; kept: number } | null = null;
  if (!dryRun) {
    if (products.length > 0) count(tally.products, products.map((p) => p.id), await repo.importProducts(products));
    if (lps.length > 0) count(tally.landing_pages, lps.map((l) => l.id), await repo.importLandingPages(lps));
    if (offset === 0) settingsResult = await repo.importSettings(settings, Boolean(opts.overwriteSettings));
    invalidateCatalogCache();
  }

  const nextOffset = offset + pageItems.length;
  return {
    dry_run: dryRun,
    source: {
      products: listedProducts.length,
      landing_pages: listedLps.length,
      settings_keys: Object.keys(settings).length,
      orphan_product_keys: orphanProducts,
      orphan_landing_page_keys: orphanLps,
      total: items.length,
    },
    page: { offset, limit, processed: pageItems.length },
    products: tally.products,
    landing_pages: tally.landing_pages,
    conflicts,
    skipped_stale: skippedStale,
    failed_reads: failedReads,
    settings: settingsResult,
    d1: await repo.counts(),
    next_offset: nextOffset,
    done: nextOffset >= items.length,
  };
}

/** Read-only totals of both stores, to compare before / after the import and before switching. */
export async function catalogStorageStatus() {
  const d1Available = isD1Available();
  const [products, lps, settings] = await Promise.all([
    kvStore.read<unknown[]>(PRODUCTS_LIST_KEY),
    kvStore.read<unknown[]>(LPS_LIST_KEY),
    kvStore.read<Record<string, any>>(SETTINGS_KEY),
  ]);
  const size = (r: { status: string; value?: any }) => (r.status === "found" && Array.isArray(r.value) ? r.value.filter(usable).length : 0);
  return {
    backend: catalogBackend(),
    d1: { available: d1Available, ...(d1Available ? await getCatalogRepo().counts() : {}) },
    kv: {
      available: kvStore.isAvailable(),
      products: size(products),
      landing_pages: size(lps),
      settings_keys: settings.status === "found" && settings.value && typeof settings.value === "object" ? Object.keys(settings.value).length : 0,
    },
  };
}
