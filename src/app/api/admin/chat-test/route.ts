import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth/session";
import { dbStore } from "@/lib/db/store";
import { sendSupportHandoff } from "@/lib/chat-server";

export const runtime = "edge";

/** Admin only: sends a sample support message to the merchant's Telegram support bot so he can check it. */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 401 });
  const settings: any = await dbStore.getSettings();
  if (!settings.support_bot_token || !settings.support_chat_id) {
    return NextResponse.json({ success: false, error: "احفظ توكن البوت ومعرّف الشات الأول" }, { status: 400 });
  }
  const ok = await sendSupportHandoff(settings, {
    name: "رسالة تجربة",
    phone: "01000000000",
    message: "دي رسالة تجربة من إعدادات الشات. لو وصلتلك يبقى بوت الدعم شغال ✅",
    page: "/",
    storeName: settings.store_name || "المتجر",
  });
  return NextResponse.json(ok ? { success: true } : { success: false, error: "تليجرام رفض الرسالة. راجع التوكن ومعرّف الشات، وابدأ محادثة مع البوت." }, { status: ok ? 200 : 400 });
}
