/**
 * Built-in media store (no external image host needed). Images are compressed in the browser,
 * validated here by their real file signature (never by the client's content-type), and kept in the
 * merchant's own Cloudflare KV as `media:<id>`. Served by GET /api/media/<id> with long cache headers.
 * Edge-safe: only Web APIs.
 */
export const MEDIA_PREFIX = "media:";
export const MAX_MEDIA_BYTES = 1_500_000; // after client-side compression a 1600px WebP is ~100-300KB

export type MediaExt = "jpg" | "png" | "webp";
const CONTENT_TYPES: Record<MediaExt, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export function contentTypeFor(ext: MediaExt): string {
  return CONTENT_TYPES[ext];
}

/** Only ids we generated are accepted (blocks path tricks and key enumeration). */
export const MEDIA_ID_RE = /^[a-f0-9]{16}\.(jpg|png|webp)$/;

/** Detects the real image type from magic bytes. SVG/GIF/HTML etc. are rejected on purpose (script risk). */
export function sniffImage(bytes: Uint8Array): MediaExt | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "png";
  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(bin);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function newMediaId(ext: MediaExt): string {
  const b = new Uint8Array(8);
  crypto.getRandomValues(b);
  let hex = "";
  for (let i = 0; i < b.length; i++) hex += b[i].toString(16).padStart(2, "0");
  return `${hex}.${ext}`;
}

export interface StoredMedia {
  ct: string; // content type
  b64: string;
  size: number;
  created_at: string;
}
