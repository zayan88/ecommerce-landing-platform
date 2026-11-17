import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { normalizeEgyptPhone } from "@/lib/db/abandoned-repo";
import { getOrdersRepo } from "@/lib/db/orders-repo";
import { buildProductInfo, sanitizeChat } from "@/lib/chat";
import { askLlm, sendSupportFollowUp, sendSupportHandoff, sendSupportLive } from "@/lib/chat-server";
import { CID_RE, addLine, chatLiveAvailable, getConv, listLines, mapTelegramMessage, upsertConv } from "@/lib/db/chat-repo";

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

  // 0) Live start: the customer waits on the site, the merchant is pinged on Telegram first (no phone yet)
  if (body?.live_start === true && typeof body?.cid === "string" && CID_RE.test(body.cid)) {
    const live = chatLiveAvailable() && Boolean(settings.support_webhook_secret) && Boolean(settings.support_bot_token) && Boolean(settings.support_chat_id);
    if (live) {
      const page = typeof body.page === "string" ? body.page.slice(0, 200) : "";
      const waitS = cfg.reply_wait_seconds;
      const id = await sendSupportLive(settings, { message, page, storeName: settings.store_name || "المتجر", waitMinutes: Math.max(1, Math.round(waitS / 60)) });
      if (id) {
        try {
          if (!(await getConv(body.cid))) await upsertConv({ cid: body.cid, name: "", phone: "", page });
          await addLine(body.cid, "me", message);
          await mapTelegramMessage(id, body.cid);
        } catch {
          // already in Telegram; only the live reply may not work
        }
        return NextResponse.json({ ok: true, live: true, waiting: true, wait_seconds: waitS }, { headers: noStore });
      }
    }
    // live is not available (or Telegram refused): the page falls back to asking for a number
    return NextResponse.json({ ok: true, need_contact: true, reply: cfg.fallback }, { headers: noStore });
  }

  // 1) Hand-off: a phone number was given
  if (body?.phone !== undefined) {
    const phone = normalizeEgyptPhone(body.phone);
    if (!phone) return NextResponse.json({ ok: false, error: "اكتب رقم موبايل صحيح (11 رقم يبدأ بـ 01)" }, { status: 400, headers: noStore });
    const name = typeof body.name === "string" ? body.name.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, 60) : "";
    const page = typeof body.page === "string" ? body.page.slice(0, 200) : "";
    const cid = typeof body.cid === "string" && CID_RE.test(body.cid) ? body.cid : "";
    const live = Boolean(cid) && chatLiveAvailable() && Boolean(settings.support_webhook_secret);
    const existing = cid ? await getConv(cid).catch(() => null) : null;
    const sent = await sendSupportHandoff(settings, { name, phone, message, page, storeName: settings.store_name || "المتجر", live, late: Boolean(existing) });
    if (sent.ok && live) {
      try {
        await upsertConv({ cid, name, phone, page });
        if (!existing) await addLine(cid, "me", message);
        if (sent.messageId) await mapTelegramMessage(sent.messageId, cid);
      } catch {
        // the message already reached Telegram; the live reply just will not work for this one
      }
    }
    return NextResponse.json(
      sent.ok
        ? { ok: true, handoff: true, live, reply: live ? "وصلت رسالتك ✅ هنرد عليك هنا في الشات في أقرب وقت (وممكن نكلمك على واتساب)." : "وصلت رسالتك ✅ هنرد عليك على واتساب في أقرب وقت." }
        : { ok: true, handoff: false, reply: "تعذر إرسال الرسالة دلوقتي. كلمنا على واتساب مباشرة.", whatsapp: true },
      { headers: noStore }
    );
  }

  // 1b) Follow-up inside an ongoing live conversation: forward to Telegram again (same customer)
  if (typeof body?.cid === "string" && CID_RE.test(body.cid)) {
    const conv = await getConv(body.cid);
    if (conv) {
      const id = await sendSupportFollowUp(settings, { name: conv.name, phone: conv.phone, text: message });
      if (id) {
        await addLine(conv.cid, "me", message);
        await mapTelegramMessage(id, conv.cid);
      }
      return NextResponse.json({ ok: true, live: true, sent: Boolean(id) }, { headers: noStore });
    }
  }

  // 2) Ask the merchant's LLM (only when connected); otherwise the page shows the hand-off form
  // The product facts (public fields only) so the assistant can answer about price, offers, colors and sizes
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : "";
  const products = await dbStore.getProducts().catch(() => []);
  const answer = await askLlm(settings, message, buildProductInfo(products as any[], page));
  return NextResponse.json(answer ? { ok: true, reply: answer } : { ok: true, need_contact: true, reply: cfg.fallback }, { headers: noStore });
}

/** Poll for the conversation's messages after an id (the customer's browser, every few seconds while the chat is open). */
export async function GET(req: NextRequest) {
  const cid = req.nextUrl.searchParams.get("cid") || "";
  const after = Number(req.nextUrl.searchParams.get("after") || 0);
  if (!CID_RE.test(cid)) return NextResponse.json({ ok: false }, { status: 400, headers: noStore });
  const lines = await listLines(cid, after);
  return NextResponse.json({ ok: true, lines: lines || [] }, { headers: noStore });
}
