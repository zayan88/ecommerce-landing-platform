/**
 * Optional R2 storage for uploaded images.
 *
 * Why: an image served by GET /api/media/<id> is one Pages Function invocation (100k/day on the free
 * plan). Images in an R2 bucket with a public URL are served by Cloudflare directly and cost no
 * invocation at all.
 *
 * Off by default: it only turns on when the Pages project has an R2 binding called MEDIA. Without it
 * everything keeps working from KV exactly as before. With the binding but without MEDIA_PUBLIC_URL,
 * images are stored in R2 and still served through /api/media/<id> (no cost saving, only bigger storage).
 * Edge-safe: only Web APIs.
 */
export interface R2Like {
  put(key: string, value: ArrayBuffer | Uint8Array, options?: { httpMetadata?: { contentType?: string; cacheControl?: string } }): Promise<unknown>;
  get(key: string): Promise<{ arrayBuffer(): Promise<ArrayBuffer>; httpMetadata?: { contentType?: string } } | null>;
}

export const R2_KEY_PREFIX = "media/";

export function getMediaBucket(): R2Like | null {
  try {
    const ctx = (globalThis as any)[Symbol.for("__cloudflare-request-context__")];
    const b = ctx?.env?.MEDIA || (globalThis as any)?.MEDIA;
    return b && typeof b.put === "function" && typeof b.get === "function" ? (b as R2Like) : null;
  } catch {
    return null;
  }
}

/** Public base URL of the bucket (https only, no trailing slash), or "" when not configured. */
export function mediaPublicBase(): string {
  const v = (process.env.MEDIA_PUBLIC_URL || "").trim().replace(/\/+$/, "");
  return /^https:\/\/[a-z0-9.\-]+(:\d+)?(\/[A-Za-z0-9._\-\/]*)?$/i.test(v) ? v : "";
}

/** URL the page should use for an image that was stored in R2. */
export function mediaUrlFor(id: string): string {
  const base = mediaPublicBase();
  return base ? `${base}/${R2_KEY_PREFIX}${id}` : `/api/media/${id}`;
}
