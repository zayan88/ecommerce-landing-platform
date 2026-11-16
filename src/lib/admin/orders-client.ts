/**
 * Client-side helpers of the admin orders page (query building, CSV export paging, pulse timing).
 * Pure functions with the network injected, so scripts/test-orders-admin.mjs can exercise them.
 */
import type { Order } from "@/types";

export interface OrdersFilter {
  status?: string; // "all" or empty = no filter
  search?: string;
  governorate?: string;
  from?: string; // YYYY-MM-DD (Egypt time)
  to?: string;
}

export const ORDERS_PAGE_SIZES = [25, 50] as const;
/** Rows per request while exporting, and the most rows one export will fetch. */
export const EXPORT_PAGE_SIZE = 500;
export const EXPORT_MAX_ROWS = 5000;

export function ordersFilterParams(f: OrdersFilter): URLSearchParams {
  const p = new URLSearchParams();
  if (f.status && f.status !== "all") p.set("status", f.status);
  if (f.search && f.search.trim()) p.set("q", f.search.trim());
  if (f.governorate) p.set("gov", f.governorate);
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) p.set("from", f.from);
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) p.set("to", f.to);
  return p;
}

export function hasActiveFilter(f: OrdersFilter): boolean {
  return ordersFilterParams(f).toString() !== "";
}

/** URL of one page of the list. `withTotal: false` skips the server-side COUNT. */
export function ordersPageUrl(
  f: OrdersFilter,
  page: { page: number; pageSize: number; withTotal?: boolean; sync?: boolean }
): string {
  const p = ordersFilterParams(f);
  p.set("limit", String(page.pageSize));
  p.set("offset", String(Math.max(0, page.page) * page.pageSize));
  if (page.withTotal === false) p.set("total", "0");
  if (page.sync) p.set("sync", "true");
  return `/api/orders?${p.toString()}`;
}

type FetchLike = (url: string, init?: { cache?: RequestCache }) => Promise<{ ok: boolean; json(): Promise<any> }>;

/**
 * Every order of the current filter, fetched page by page (sequentially, never in parallel) up to
 * `maxRows`. `capped` is true when more orders exist than were fetched.
 */
export async function fetchOrdersForExport(
  fetchFn: FetchLike,
  f: OrdersFilter,
  opts: { pageSize?: number; maxRows?: number } = {}
): Promise<{ orders: Order[]; capped: boolean; requests: number }> {
  const pageSize = opts.pageSize ?? EXPORT_PAGE_SIZE;
  const maxRows = opts.maxRows ?? EXPORT_MAX_ROWS;
  const orders: Order[] = [];
  let requests = 0;
  for (let offset = 0; ; offset += pageSize) {
    const p = ordersFilterParams(f);
    p.set("limit", String(Math.min(pageSize, maxRows - orders.length)));
    p.set("offset", String(offset));
    p.set("export", "1");
    p.set("total", "0");
    const res = await fetchFn(`/api/orders?${p.toString()}`, { cache: "no-store" });
    requests++;
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success || !Array.isArray(json.orders)) {
      throw new Error(json?.error || "تعذر تحميل الطلبات للتصدير");
    }
    orders.push(...json.orders);
    if (!json.has_more || json.orders.length === 0) return { orders, capped: false, requests };
    if (orders.length >= maxRows) return { orders, capped: true, requests };
  }
}

/** Delay before the next pulse: the base interval, doubled per consecutive failure, at most 15 minutes. */
export function nextPulseDelayMs(baseMs: number, failures: number): number {
  const base = Math.max(30000, baseMs || 60000);
  return Math.min(base * 2 ** Math.min(Math.max(failures, 0), 6), 15 * 60 * 1000);
}
