import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { normalizeEgyptPhone } from "@/lib/db/abandoned-repo";
import { getOrdersRepo } from "@/lib/db/orders-repo";
import { sanitizeChat } from "@/lib/chat";
import { askLlm, sendSupportHandoff } from "@/lib/chat-server";

export const runtime = "edge";

/**
 * Store chat, server part. The page answers the merchant's Q&A by itself (no request); it calls this only to
 *   - "ask": let the merchant's LLM try to answer (when one is connected), or
 *   - "handoff": forward the message + the customer's phone to the merchant's Telegram support bot.
 * Public, per-IP rate limited (20 / 10 min), always answers 200 with a small JSON.
 */
const noStore = { "Cache-Control": "no-store" };
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const fallbackHits = new Map<string, { n: number; start: number }>();

async function allowed(ip: string): Promise<boolean> {
  try {
    const r = await getOrdersRepo().consumeRateLimit(`chat:${ip}`, Date.now(), WINDOW_MS, MAX_PER_WINDOW);
    return r.count <= MAX_PER_WINDOW;
  } catch {
    // KV mode (no D1): a per-isolate counter is still a useful brake against floods
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
  const body = await req.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").trim().slice(0, 500) : "";
  if (!message) return NextResponse.json({ ok: false, error: "اكتب رسالتك" }, { status: 400, headers: noStore });

  const settings: any = await dbStore.getSettings();
  const cfg = sanitizeChat(settings.chat);
  if (!cfg.enabled) return NextResponse.json({ ok: false, error: "غير متاح" }, { status: 404, headers: noStore });

  const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim().slice(0, 64);
  if (!(await allowed(ip))) {
    return NextResponse.json({ ok: false, error: "رسائل كتير في وقت قصير، جرّب بعد شوية" }, { status: 429, headers: noStore });
  }

  // 1) Hand-off: a phone number was given
  if (body?.phone !== undefined) {
    const phone = normalizeEgyptPhone(body.phone);
    if (!phone) return NextResponse.json({ ok: false, error: "اكتب رقم موبايل صحيح (11 رقم يبدأ بـ 01)" }, { status: 400, headers: noStore });
    const name = typeof body.name === "string" ? body.name.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 60) : "";
    const page = typeof body.page === "string" ? body.page.slice(0, 200) : "";
    const sent = await sendSupportHandoff(settings, { name, phone, message, page, storeName: settings.store_name || "المتجر" });
    return NextResponse.json(
      sent
        ? { ok: true, handoff: true, reply: "وصلت رسالتك ✅ هنرد عليك على واتساب في أقرب وقت." }
        : { ok: true, handoff: false, reply: "تعذر إرسال الرسالة دلوقتي. كلمنا على واتساب مباشرة.", whatsapp: true },
      { headers: noStore }
    );
  }

  // 2) Ask the merchant's LLM (only when connected); otherwise the page shows the hand-off form
  const answer = await askLlm(settings, message);
  return NextResponse.json(answer ? { ok: true, reply: answer } : { ok: true, need_contact: true, reply: cfg.fallback }, { headers: noStore });
}
