import { Order, Product } from "@/types";
import { dbStore } from "@/lib/db/store";

/** Escape user-controlled text for Telegram parse_mode=HTML (prevents broken/injected messages). */
export function escapeTelegramHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const truncate = (v: unknown, max: number) => String(v ?? "").slice(0, max);

interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export class TelegramNotifier {
  /**
   * Send a rich, formatted instant sales notification to Telegram
   */
  static async sendOrderNotification(order: Order, product?: Product): Promise<TelegramSendResult[]> {
    try {
      const settings = await dbStore.getSettings();

      const botToken = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
      const chatIdsRaw = settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
      const isEnabled = settings.telegram_notifications_enabled ?? true;

      if (!isEnabled) {
        console.log("[Telegram Notification] Skipped (notifications disabled in settings)");
        return [{ success: false, error: "Notifications disabled in settings" }];
      }

      if (!botToken || !chatIdsRaw) {
        console.log("[Telegram Notification] Bot token or Chat ID not configured. Set them in /admin/notifications or env.");
        return [{ success: false, error: "Telegram credentials not configured" }];
      }

      // Support multiple comma-separated chat IDs (e.g. store owner + confirmations team + media buyer)
      const chatIds = chatIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (chatIds.length === 0) {
        return [{ success: false, error: "No valid Chat IDs provided" }];
      }

      const productTitle = product?.title_ar || "منتج من المتجر";
      const cleanPhone = order.customer_phone.replace(/\D/g, "");
      const intlPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;
      const orderDate = new Date().toLocaleString("ar-EG", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      });

      // Traffic source detection
      const esc = escapeTelegramHtml;
      const storeName = esc(settings.store_name || "المتجر");
      const utmSource = esc(order.tracking?.utm_source || "مباشر / Organic");
      const utmCampaign = order.tracking?.utm_campaign ? ` (${esc(order.tracking.utm_campaign)})` : "";
      const sourceDisplay = `${utmSource}${utmCampaign}`;

      const pay = order.tracking?.payment;
      const paymentLine = pay
        ? `${pay.method === "instapay" ? "تحويل إنستاباي" : "تحويل فودافون كاش"} — في انتظار التأكيد${pay.reference ? ` (رقم العملية: ${esc(pay.reference)})` : ""}`
        : "الدفع نقدياً عند الاستلام (COD)";

      // Beautiful Telegram HTML Message (every dynamic value is escaped)
      const messageText = `
🔔 <b>أوردر جديد نزل حالاً في ${storeName}! 🛒</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>رقم الطلب:</b> <code>#${esc(order.order_number)}</code>
👤 <b>العميل:</b> ${esc(order.customer_name)}
📞 <b>التليفون:</b> <code>${esc(order.customer_phone)}</code>
📍 <b>المحافظة:</b> ${esc(order.governorate)}
🏠 <b>العنوان:</b> ${esc(truncate(order.address, 500))}
━━━━━━━━━━━━━━━━━━━━
📦 <b>المنتج:</b> ${esc(productTitle)}
🔢 <b>الكمية:</b> ${esc(order.quantity)} قطعة
💰 <b>المبلغ عند الاستلام:</b> <b>${esc(order.final_amount)} ج.م</b> (شحن مجاني 🚚)
💵 <b>طريقة الدفع:</b> ${paymentLine}
${order.notes ? `📝 <b>ملاحظات:</b> <i>${esc(truncate(order.notes, 500))}</i>\n` : ""}━━━━━━━━━━━━━━━━━━━━
🎯 <b>مصدر الإعلان:</b> ${sourceDisplay}
⏰ <b>التوقيت:</b> ${orderDate}

✅ <i>تم تسجيل الأوردر في السيستم وتوجيهه لدروبشيبينغ صفقة!</i>
`.trim();

      const results: TelegramSendResult[] = [];

      for (const chatId of chatIds) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: messageText,
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "💬 واتساب العميل",
                      url: `https://wa.me/${intlPhone}?text=${encodeURIComponent(
                        `أهلاً بحضرتك يا فندم! بخصوص طلبك #${order.order_number} من ${settings.store_name || "المتجر"}`
                      )}`,
                    },
                    {
                      text: "📞 اتصال هاتفي",
                      url: `https://wa.me/${intlPhone}`,
                    },
                  ],
                ],
              },
            }),
          });

          const data = await res.json();
          if (res.ok && data.ok) {
            results.push({ success: true, messageId: data.result?.message_id });
            console.log(`[Telegram Notification] Successfully delivered to chat ${chatId}`);
          } else {
            console.error(`[Telegram Notification Error] chat ${chatId}:`, data.description);
            results.push({ success: false, error: data.description });
          }
        } catch (innerErr: any) {
          console.error(`[Telegram Notification Exception] chat ${chatId}:`, innerErr);
          results.push({ success: false, error: innerErr.message });
        }
      }

      return results;
    } catch (err: any) {
      console.error("[Telegram Notification General Error]", err);
      return [{ success: false, error: err.message }];
    }
  }

  /**
   * Forward unanswered customer inquiries and support escalations to Telegram
   */
  static async sendCustomerInquiryNotification(inquiry: {
    message: string;
    customerPhone?: string;
    productTitle?: string;
    source?: string;
  }): Promise<TelegramSendResult[]> {
    try {
      const settings = await dbStore.getSettings();

      const botToken = settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
      const chatIdsRaw = settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
      const isEnabled = settings.telegram_notifications_enabled ?? true;

      if (!isEnabled || !botToken || !chatIdsRaw) {
        return [{ success: false, error: "Telegram notifications not active" }];
      }

      const chatIds = chatIdsRaw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (chatIds.length === 0) {
        return [{ success: false, error: "No valid Chat IDs" }];
      }

      const esc = escapeTelegramHtml;
      const storeName = esc(settings.store_name || "المتجر");
      const timeNow = new Date().toLocaleString("ar-EG", {
        timeZone: "Africa/Cairo",
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      });

      const cleanPhone = inquiry.customerPhone ? inquiry.customerPhone.replace(/\D/g, "") : "";
      const intlPhone = cleanPhone ? (cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone) : "";

      const text = `
🚨 <b>استفسار عميل جديد غير مجاب (تنبيه خدمة عملاء)! 💬</b>
━━━━━━━━━━━━━━━━━━━━
🏪 <b>المتجر:</b> ${storeName}
❓ <b>نص السؤال:</b>
<blockquote>${esc(truncate(inquiry.message, 600))}</blockquote>
${inquiry.customerPhone ? `📱 <b>هاتف العميل:</b> <code>${esc(inquiry.customerPhone)}</code>\n` : "📱 <b>هاتف العميل:</b> <i>لم يتم إدخاله في الشات بعد</i>\n"}${inquiry.productTitle ? `📦 <b>الصفحة / المنتج:</b> ${esc(inquiry.productTitle)}\n` : ""}⏰ <b>التوقيت:</b> ${timeNow}
━━━━━━━━━━━━━━━━━━━━
⚠️ <i>هذا السؤال غير موجود في اسكربت الردود التلقائية، يُرجى المتابعة والرد على العميل فوراً.</i>
`.trim();

      const inlineKeyboard: any[][] = [];
      if (intlPhone) {
        inlineKeyboard.push([
          {
            text: "💬 فتح واتساب العميل",
            url: `https://wa.me/${intlPhone}?text=${encodeURIComponent(
              `أهلاً بحضرتك يا فندم! بخصوص استفسارك على متجر ${settings.store_name || "المتجر"}: "${inquiry.message.slice(0, 50)}"`
            )}`,
          },
          {
            text: "📞 اتصال هاتفي",
            url: `tel:${intlPhone}`,
          },
        ]);
      }

      const results: TelegramSendResult[] = [];
      for (const chatId of chatIds) {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text,
              parse_mode: "HTML",
              ...(inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : {}),
            }),
          });

          const data = await res.json();
          if (res.ok && data.ok) {
            results.push({ success: true, messageId: data.result?.message_id });
          } else {
            results.push({ success: false, error: data.description });
          }
        } catch (innerErr: any) {
          results.push({ success: false, error: innerErr.message });
        }
      }

      return results;
    } catch (err: any) {
      console.error("[Telegram Inquiry Escalation Error]", err);
      return [{ success: false, error: err.message }];
    }
  }

  /**
   * Send a test notification to verify bot setup from Admin Dashboard
   */
  static async sendTestNotification(customToken?: string, customChatId?: string): Promise<{ success: boolean; message: string }> {
    const settings = await dbStore.getSettings();
    // The admin form holds a masked token ("1234...abcd"); ignore it and use the stored one.
    const usableToken = customToken && !customToken.includes("...") ? customToken : undefined;
    const token = usableToken || settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = customChatId || settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return {
        success: false,
        message: "يرجى كتابة توكن البوت و Chat ID أولاً لإجراء الاختبار",
      };
    }

    try {
      const timeNow = new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
      const testText = `
🎉 <b>تم اختبار إشعارات المبيعات بنجاح!</b>
━━━━━━━━━━━━━━━━━━━━
🤖 البوت يعمل بكفاءة وجاهز لإرسال إشعارات الأوردرات فورياً.
⏰ <b>التوقيت:</b> ${timeNow}
📱 <b>المتجر:</b> ${escapeTelegramHtml(settings.store_name || "المتجر")}

كل ما عميل يسجل طلب، هيوصلك إشعار لحظي هنا بصوت الكاشير 💰!
`.trim();

      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId.split(",")[0].trim(),
          text: testText,
          parse_mode: "HTML",
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        return {
          success: true,
          message: "وصل الإشعار بنجاح إلى تليجرام! تفقد هاتفك الآن 📲",
        };
      } else {
        return {
          success: false,
          message: `فشل الإرسال: ${data.description || "تأكد من صحة التوكن و Chat ID، وأنك بدأت محادثة مع البوت بالضغط على /start"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `خطأ في الاتصال بتليجرام: ${err.message}`,
      };
    }
  }
}
