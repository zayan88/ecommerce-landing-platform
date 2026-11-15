import { NextRequest } from "next/server";
import { kvStore } from "@/lib/db/kv";
import { MEDIA_ID_RE, MEDIA_PREFIX, base64ToBytes, type StoredMedia } from "@/lib/media";

export const runtime = "edge";

/** Public: serves an uploaded image. Only ids produced by our own uploader are accepted. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!MEDIA_ID_RE.test(id)) return new Response("Not found", { status: 404 });

  const rec = await kvStore.get<StoredMedia>(`${MEDIA_PREFIX}${id}`);
  if (!rec?.b64 || !/^image\/(jpeg|png|webp)$/.test(rec.ct)) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = base64ToBytes(rec.b64);
  return new Response(bytes.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": rec.ct,
      "Content-Length": String(bytes.length),
      // The id is random and the content never changes: cache for a year (also at the CDN)
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
