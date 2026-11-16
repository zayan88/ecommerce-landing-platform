/**
 * Strict formats for marketing tag ids. The ids end up inside inline scripts, so anything that does not
 * match is rejected (never interpolated): this is what keeps a typo (or a hostile value) from becoming script.
 */
export const META_PIXEL_RE = /^\d{6,20}$/;
export const TIKTOK_PIXEL_RE = /^[A-Za-z0-9]{8,32}$/;
export const GA4_RE = /^G-[A-Za-z0-9]{6,14}$/;
export const GTM_RE = /^GTM-[A-Za-z0-9]{4,10}$/;
export const META_TEST_CODE_RE = /^[A-Za-z0-9_-]{1,40}$/;

export const validMetaPixel = (v: unknown): v is string => typeof v === "string" && META_PIXEL_RE.test(v);
export const validTiktokPixel = (v: unknown): v is string => typeof v === "string" && TIKTOK_PIXEL_RE.test(v);
export const validGa4 = (v: unknown): v is string => typeof v === "string" && GA4_RE.test(v);
export const validGtm = (v: unknown): v is string => typeof v === "string" && GTM_RE.test(v);

/** Snapchat pixel ids are UUIDs. */
export const SNAP_PIXEL_RE = /^[0-9a-fA-F-]{20,40}$/;
export const validSnapPixel = (v: unknown): v is string => typeof v === "string" && SNAP_PIXEL_RE.test(v);

export const MAX_PIXELS_PER_PLATFORM = 5;

/** Trim, drop invalid/duplicate ids, cap the list. */
export function cleanIdList(input: unknown, re: RegExp, max: number = MAX_PIXELS_PER_PLATFORM): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    const v = typeof raw === "string" ? raw.trim() : "";
    if (v && re.test(v) && !out.includes(v)) out.push(v);
    if (out.length >= max) break;
  }
  return out;
}
