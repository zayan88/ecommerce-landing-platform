import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { sha256, timingSafeEqual } from "@/lib/crypto/sha256";
import { applyBostaWebhook } from "@/lib/shipping";

export const runtime = "edge";

/**
 * Bosta calls this when a delivery changes state. Bosta has no signature scheme, so the only check is the
 * shared key we asked it to send in the `Authorization` header (Settings > Shipping). Without a configured
 * key the endpoint refuses everything. It answers 200 {success:true} for any well-formed call (including
 * unknown orders) so nothing about which orders exist can be probed.
 */
export async function POST(req: NextRequest) {
  const settings = await dbStore.getSettings();
  const expected = (settings.bosta_webhook_key || "").trim();
  if (!expected) return NextResponse.json({ success: false }, { status: 503 });
  const provided = (req.headers.get("authorization") || "").trim();
  if (!provided || !timingSafeEqual(sha256(provided), sha256(expected))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ success: false }, { status: 400 });
  try {
    await applyBostaWebhook(body);
  } catch (err) {
    console.error("[bosta-webhook]", (err as Error)?.message);
  }
  return NextResponse.json({ success: true });
}
