import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { dbStore } from "@/lib/db/store";
import { registerSupportWebhook } from "@/lib/chat-server";
import { chatLiveAvailable } from "@/lib/db/chat-repo";

export const runtime = "edge";

const randomHex = (bytes: number) => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, "0")).join("");

/** Admin only: connects the support bot to this site so Telegram replies come back into the customer's chat. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
  const s: any = await dbStore.getSettings();
  if (!s.support_bot_token || !s.support_chat_id) {
    return NextResponse.json({ success: false, error: "احفظ توكن البوت ومعرّف الشات الأول" }, { status: 400 });
  }
  if (!chatLiveAvailable()) {
    return NextResponse.json({ success: false, error: "الرد من تليجرام محتاج قاعدة بيانات D1 (غير متاحة هنا)." }, { status: 400 });
  }
  const origin = new URL(req.url).origin;
  if (!origin.startsWith("https://")) {
    return NextResponse.json({ success: false, error: "الربط بيشتغل على الموقع المنشور (https) بس، مش على الجهاز المحلي." }, { status: 400 });
  }
  const secret = typeof s.support_webhook_secret === "string" && s.support_webhook_secret ? s.support_webhook_secret : randomHex(24);
  const r = await registerSupportWebhook(s.support_bot_token, `${origin}/api/chat/webhook`, secret);
  if (!r.ok) return NextResponse.json({ success: false, error: r.error || "تعذر الربط" }, { status: 400 });
  await dbStore.updateSettings({ support_webhook_secret: secret } as any);
  return NextResponse.json({ success: true });
}

/** Whether the connection was made (never the secret itself). */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
  const s: any = await dbStore.getSettings();
  return NextResponse.json({ success: true, connected: Boolean(s.support_webhook_secret), available: chatLiveAvailable() });
}
