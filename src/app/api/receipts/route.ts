import { NextRequest, NextResponse } from "next/server";
import { getOrdersRepo } from "@/lib/db/orders-repo";
import { MAX_RECEIPT_BYTES, saveReceipt } from "@/lib/db/receipts-repo";
import { sniffImage } from "@/lib/media";

export const runtime = "edge";

/**
 * POST /api/receipts — PUBLIC: a customer attaches the screenshot of their Vodafone Cash / InstaPay transfer.
 * Real images only (JPG / PNG / WebP by magic bytes), small (the page compresses it first), 6 uploads per 10 minutes
 * per address. Returns an unguessable id the order then carries. Only the admin can ever read the image back, and it is
 * deleted when the merchant decides the order.
 */
const noStore = { "Cache-Control": "no-store" };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const fallbackHits = new Map<string, { n: number; start: number }>();

async function allowed(ip: string): Promise<boolean> {
  try {
    const r = await getOrdersRepo().consumeRateLimit(`receipt:${ip}`, Date.now(), WINDOW_MS, MAX_PER_WINDOW);
    return r.count <= MAX_PER_WINDOW;
  } catch {
    const now = Date.now();
    const cur = fallbackHits.get(ip);
    if (!cur || now - cur.start > WINDOW_MS) {
      fallbackHits.set(ip, { n: 1, start: now });
      if (fallbackHits.size > 5000) fallbackHits.clear();
      return true;
    }
    cur.n++;
    return cur.n <= MAX_PER_WINDOW;
  }
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);
  if (!(await allowed(ip))) {
    return NextResponse.json({ success: false, error: "محاولات كتير، جرّب بعد شوية" }, { status: 429, headers: noStore });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ success: false, error: "اختار صورة التحويل" }, { status: 400, headers: noStore });
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ success: false, error: "الصورة كبيرة، جرّب صورة أصغر" }, { status: 413, headers: noStore });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImage(bytes);
  if (!ext) {
    return NextResponse.json({ success: false, error: "ارفع صورة JPG أو PNG أو WebP" }, { status: 415, headers: noStore });
  }
  try {
    const id = await saveReceipt(bytes, ext);
    if (!id) return NextResponse.json({ success: false, error: "تعذر حفظ الصورة، جرّب تاني" }, { status: 500, headers: noStore });
    return NextResponse.json({ success: true, id }, { headers: noStore });
  } catch (e) {
    console.error("[receipt upload]", (e as Error)?.message);
    return NextResponse.json({ success: false, error: "تعذر حفظ الصورة، جرّب تاني" }, { status: 500, headers: noStore });
  }
}
