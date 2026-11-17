/**
 * Server side of the store chat: the Telegram support-bot hand-off and the optional LLM call.
 * Secrets (bot token, LLM key) are only read here, sent only to Telegram / the merchant's LLM host, and
 * never logged or echoed back. Edge-safe: fetch only.
 */
import { escapeTelegramHtml } from "@/lib/notifications/telegram";
import { leaksSecrets, llmSystemPrompt, looksLikeInjection, safeLlmBaseUrl, sanitizeChat } from "@/lib/chat";

export interface HandoffInput {
  name: string;
  phone: string; // 01xxxxxxxxx
  message: string;
  page?: string;
  storeName: string;
  /** The reply can come back into the customer's chat window (live chat is available). */
  live?: boolean;
}

/** Sends the customer's message to the merchant's support chat with a "reply on WhatsApp" button. */
export async function sendSupportHandoff(settings: any, input: HandoffInput): Promise<{ ok: boolean; messageId: number | null }> {
  const token = typeof settings.support_bot_token === "string" ? settings.support_bot_token : "";
  const chatId = typeof settings.support_chat_id === "string" ? settings.support_chat_id : "";
  if (!token || !chatId) return { ok: false, messageId: null };
  const esc = escapeTelegramHtml;
  const wa = `https://wa.me/2${input.phone.replace(/^0/, "")}?text=${encodeURIComponent(`أهلاً ${input.name || ""}، بخصوص رسالتك لـ ${input.storeName}:`)}`;
  const text = [
    `💬 <b>رسالة دعم جديدة — ${esc(input.storeName)}</b>`,
    "━━━━━━━━━━━━━━",
    `👤 <b>الاسم:</b> ${esc(input.name || "—")}`,
    `📞 <b>الموبايل:</b> <code>${esc(input.phone)}</code>`,
    input.page ? `🔗 <b>الصفحة:</b> ${esc(input.page.slice(0, 200))}` : "",
    "━━━━━━━━━━━━━━",
    esc(input.message.slice(0, 800)),
    ...(input.live ? ["━━━━━━━━━━━━━━", "↩️ اعمل Reply على الرسالة دي عشان الرد يوصل للعميل في الشات."] : []),
  ]
    .filter(Boolean)
    .join("\n");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: "ردّ على واتساب", url: wa }]] },
      }),
    });
    const j: any = await res.json().catch(() => null);
    return { ok: res.ok, messageId: typeof j?.result?.message_id === "number" ? j.result.message_id : null };
  } catch {
    return { ok: false, messageId: null };
  }
}

/** A follow-up line of an ongoing conversation (the customer typed again). Returns the Telegram message id, or null. */
export async function sendSupportFollowUp(settings: any, input: { name: string; phone: string; text: string }): Promise<number | null> {
  const token = typeof settings.support_bot_token === "string" ? settings.support_bot_token : "";
  const chatId = typeof settings.support_chat_id === "string" ? settings.support_chat_id : "";
  if (!token || !chatId) return null;
  const esc = escapeTelegramHtml;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `💬 <b>${esc(input.name || "عميل")}</b> <code>${esc(input.phone)}</code>\n${esc(input.text.slice(0, 800))}`,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const j: any = await res.json().catch(() => null);
    return res.ok && typeof j?.result?.message_id === "number" ? j.result.message_id : null;
  } catch {
    return null;
  }
}

/** Registers this site's webhook with the merchant's support bot so his Telegram replies reach the chat. */
export async function registerSupportWebhook(token: string, url: string, secret: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, secret_token: secret, allowed_updates: ["message"], drop_pending_updates: true }),
    });
    const j: any = await res.json().catch(() => null);
    return res.ok && j?.ok ? { ok: true } : { ok: false, error: typeof j?.description === "string" ? j.description.slice(0, 200) : "رفض تليجرام الطلب" };
  } catch {
    return { ok: false, error: "تعذر الاتصال بتليجرام" };
  }
}

/** One question to the merchant's LLM. Returns the answer, or null when it cannot / will not answer (then: hand off). */
export async function askLlm(settings: any, message: string): Promise<string | null> {
  const cfg = sanitizeChat(settings.chat);
  const key = typeof settings.llm_api_key === "string" ? settings.llm_api_key : "";
  const base = safeLlmBaseUrl(cfg.llm_base_url);
  if (!cfg.llm_enabled || !key || !base || !cfg.llm_model) return null;
  if (looksLikeInjection(message)) return null; // steering / extraction attempts go to the merchant, never to the model
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 12000);
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: cfg.llm_model,
        max_tokens: 250,
        temperature: 0.3,
        messages: [
          { role: "system", content: llmSystemPrompt(settings.store_name || "المتجر", cfg.llm_prompt) },
          { role: "user", content: message.slice(0, 500) },
        ],
      }),
      signal: ctl.signal,
    });
    if (!res.ok) return null;
    const j: any = await res.json().catch(() => null);
    const text = typeof j?.choices?.[0]?.message?.content === "string" ? j.choices[0].message.content.trim() : "";
    if (!text || /^handoff\b/i.test(text)) return null;
    // never let a secret or the prompt itself out, whatever the model produced
    if (leaksSecrets(text, [key, typeof settings.support_bot_token === "string" ? settings.support_bot_token : "", typeof settings.telegram_bot_token === "string" ? settings.telegram_bot_token : ""])) return null;
    return text.slice(0, 600);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
