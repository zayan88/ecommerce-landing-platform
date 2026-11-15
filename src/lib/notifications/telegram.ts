import { Order, Product } from "@/types";
import { dbStore } from "@/lib/db/store";

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
      const utmSource = order.tracking?.utm_source || "مباشر / Organic";
      const utmCampaign = order.tracking?.utm_campaign ? ` (${order.tracking.utm_campaign})` : "";
      const sourceDisplay = `${utmSource}${utmCampaign}`;

      // Beautiful Telegram HTML Message
      const messageText = `
🔔 <b>أوردر جديد نزل حالاً في ${settings.store_name || "RexRack"}! 🛒</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>رقم الطلب:</b> <code>#${order.order_number}</code>
👤 <b>العميل:</b> ${order.customer_name}
📞 <b>التليفون:</b> <code>${order.customer_phone}</code>
📍 <b>المحافظة:</b> ${order.governorate}
🏠 <b>العنوان:</b> ${order.address}
━━━━━━━━━━━━━━━━━━━━
📦 <b>المنتج:</b> ${productTitle}
🔢 <b>الكمية:</b> ${order.quantity} قطعة
💰 <b>المبلغ عند الاستلام:</b> <b>${order.final_amount} ج.م</b> (شحن مجاني 🚚)
💵 <b>طريقة الدفع:</b> الدفع نقدياً عند الاستلام (COD)
${order.notes ? `📝 <b>ملاحظات:</b> <i>${order.notes}</i>\n` : ""}━━━━━━━━━━━━━━━━━━━━
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
                        `أهلاً بحضرتك يا فندم! بخصوص طلبك #${order.order_number} من ${settings.store_name || "RexRack"}`
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
   * Send a test notification to verify bot setup from Admin Dashboard
   */
  static async sendTestNotification(customToken?: string, customChatId?: string): Promise<{ success: boolean; message: string }> {
    const settings = await dbStore.getSettings();
    const token = customToken || settings.telegram_bot_token || process.env.TELEGRAM_BOT_TOKEN;
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
📱 <b>المتجر:</b> ${settings.store_name || "RexRack"}

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
