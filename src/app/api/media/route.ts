import { NextRequest, NextResponse } from "next/server";
import { kvStore } from "@/lib/db/kv";
import { R2_KEY_PREFIX, getMediaBucket, mediaUrlFor } from "@/lib/media-r2";
import {
  MAX_MEDIA_BYTES,
  MEDIA_PREFIX,
  bytesToBase64,
  contentTypeFor,
  newMediaId,
  sniffImage,
  type StoredMedia,
} from "@/lib/media";

export const runtime = "edge";

/**
 * POST /api/media  (admin only: the middleware requires a valid admin cookie for everything under
 * /api that is not in its public allow-list). multipart/form-data with a `file` field.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ success: false, error: "لم يتم اختيار صورة" }, { status: 400 });
    }
    if (file.size > MAX_MEDIA_BYTES) {
      return NextResponse.json(
        { success: false, error: "حجم الصورة كبير بعد الضغط، جرّب صورة أصغر" },
        { status: 413 }
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = sniffImage(bytes);
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "نوع الملف غير مدعوم. ارفع صورة JPG أو PNG أو WebP" },
        { status: 415 }
      );
    }

    const id = newMediaId(ext);

    // R2 bucket bound (MEDIA): store the file there; with MEDIA_PUBLIC_URL the page loads it straight from
    // Cloudflare (no Function invocation). Falls back to KV when R2 is not bound or the write fails.
    const bucket = getMediaBucket();
    if (bucket) {
      try {
        await bucket.put(`${R2_KEY_PREFIX}${id}`, bytes, {
          httpMetadata: { contentType: contentTypeFor(ext), cacheControl: "public, max-age=31536000, immutable" },
        });
        return NextResponse.json({ success: true, url: mediaUrlFor(id), id, size: bytes.length, storage: "r2" });
      } catch (err) {
        console.error("[media upload] R2 put failed, using KV", (err as Error)?.message);
      }
    }
    const record: StoredMedia = {
      ct: contentTypeFor(ext),
      b64: bytesToBase64(bytes),
      size: bytes.length,
      created_at: new Date().toISOString(),
    };
    const ok = await kvStore.put(`${MEDIA_PREFIX}${id}`, record);
    if (!ok) {
      return NextResponse.json(
        { success: false, error: "تعذر حفظ الصورة، حاول مرة أخرى" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, url: `/api/media/${id}`, id, size: bytes.length });
  } catch (err) {
    console.error("[media upload error]", err);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء رفع الصورة" }, { status: 500 });
  }
}
