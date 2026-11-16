import type { SystemSettings } from "@/types";
import { META_PIXEL_RE, TIKTOK_PIXEL_RE, SNAP_PIXEL_RE, cleanIdList } from "./tag-ids";

/** Effective pixel lists: the new multi-pixel arrays win; the legacy single id keeps working. */
export function effectiveMetaPixelIds(s: Partial<SystemSettings>): string[] {
  const list = cleanIdList(s.meta_pixel_ids, META_PIXEL_RE);
  if (list.length) return list;
  return cleanIdList([s.default_meta_pixel_id], META_PIXEL_RE);
}
export const effectiveTiktokPixelIds = (s: Partial<SystemSettings>) => {
  const list = cleanIdList(s.tiktok_pixel_ids, TIKTOK_PIXEL_RE);
  return list.length ? list : cleanIdList([s.tiktok_pixel_id], TIKTOK_PIXEL_RE);
};
export const effectiveSnapPixelIds = (s: Partial<SystemSettings>) => cleanIdList(s.snap_pixel_ids, SNAP_PIXEL_RE);

export interface CapiTarget {
  pixel_id: string;
  token: string;
  test_code?: string;
}

/** Server-side Conversions API targets: one per configured entry; falls back to the legacy single pixel/token. */
export function capiTargets(s: Partial<SystemSettings>, env: { pixel?: string; token?: string; test?: string } = {}): CapiTarget[] {
  const out: CapiTarget[] = [];
  for (const e of s.meta_capi_entries || []) {
    if (e && META_PIXEL_RE.test(String(e.pixel_id)) && typeof e.token === "string" && e.token) {
      out.push({ pixel_id: e.pixel_id, token: e.token, test_code: e.test_code || undefined });
    }
  }
  if (out.length) return out;
  const pixel = s.default_meta_pixel_id || env.pixel || "";
  const token = s.default_meta_capi_token || env.token || "";
  if (META_PIXEL_RE.test(pixel) && token) return [{ pixel_id: pixel, token, test_code: s.meta_test_event_code || env.test || undefined }];
  return [];
}
