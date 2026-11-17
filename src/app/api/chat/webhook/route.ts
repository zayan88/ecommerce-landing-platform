import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { sha256, timingSafeEqual } from "@/lib/crypto/sha256";
import { addLine, cidForTelegramMessage } from "@/lib/db/chat-repo";

export const runtime = "edge";

/**
 * Telegram webhook of the merchant's SUPPORT bot. When the merchant replies (Telegram "Reply") to a customer's
 * message, the reply is stored and the customer's chat window picks it up on its next poll.
 * Trust: Telegram sends the secret we registered in the X-Telegram-Bot-Api-Secret-Token header; only messages from
 * the merchant's own support chat are accepted. Always answers 200 so Telegram does not retry.
 */
export async function POST(req: NextRequest) {
  const settings: any = await dbStore.getSettings();
  const secret = typeof settings.support_webhook_secret === "string" ? settings.support_webhook_secret : "";
  const provided = req.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!secret || !provided || !timingSafeEqual(sha256(provided), sha256(secret))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  try {
    const update: any = await req.json();
    const msg = update?.message;
    const text = typeof msg?.text === "string" ? msg.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").trim().slice(0, 800) : "";
    const replyTo = msg?.reply_to_message?.message_id;
    if (text && typeof replyTo === "number" && String(msg?.chat?.id) === String(settings.support_chat_id)) {
      const cid = await cidForTelegramMessage(replyTo);
      if (cid) await addLine(cid, "shop", text);
    }
  } catch {
    // ignore malformed updates
  }
  return NextResponse.json({ ok: true });
}
