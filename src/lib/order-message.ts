/**
 * The WhatsApp message the merchant sends to confirm an order: the order's details (product, pieces, color / size,
 * prices, shipping, total, how it is paid, address) and a clear question. One builder for the orders list, the order
 * details and the Telegram "WhatsApp the customer" button, so they all say the same thing.
 */
export interface OrderMessageInput {
  order_number: string;
  customer_name?: string;
  quantity?: number;
  unit_price?: number;
  total_amount?: number;
  shipping_fee?: number;
  discount_amount?: number;
  final_amount?: number;
  governorate?: string;
  city?: string;
  address?: string;
  /** Customer note + the chosen options ("الخيارات: اللون: أحمر، المقاس: L"). */
  notes?: string;
  payment_method?: string;
}

const money = (n: unknown) => {
  const v = Number(n);
  return Number.isFinite(v) ? Number(v.toFixed(2)).toLocaleString("en-US") : "0";
};

const PAY_LABEL: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  vodafone_cash: "تحويل فودافون كاش",
  instapay: "تحويل إنستاباي",
  card: "بطاقة",
  safqa: "دفع أونلاين",
};

export function buildOrderWhatsappMessage(order: OrderMessageInput, ctx: { storeName?: string; productTitle?: string } = {}): string {
  const store = (ctx.storeName || "").trim() || "متجرنا";
  const name = (order.customer_name || "").trim();
  const qty = Number(order.quantity) > 0 ? Number(order.quantity) : 1;
  const ship = Number(order.shipping_fee) || 0;
  const discount = Number(order.discount_amount) || 0;
  const total = order.final_amount ?? order.total_amount;
  const place = [order.governorate, order.city && order.city !== order.governorate ? order.city : "", order.address].filter((x) => x && String(x).trim()).join(" - ");
  const cod = !order.payment_method || order.payment_method === "cod";

  const lines = [
    `أهلاً ${name ? name + " " : ""}👋`,
    `معاك فريق ${store}، بنأكد طلبك رقم ${order.order_number}:`,
    "",
    `🛍️ ${ctx.productTitle || "المنتج"} × ${qty}`,
  ];
  if (order.notes && order.notes.trim()) lines.push(`📝 ${order.notes.trim()}`);
  lines.push("");
  if (order.unit_price !== undefined && qty > 1) lines.push(`💰 سعر القطعة: ${money(order.unit_price)} ج.م`);
  if (discount > 0) lines.push(`🏷️ الخصم: ${money(discount)} ج.م`);
  lines.push(`🚚 الشحن: ${ship > 0 ? money(ship) + " ج.م" : "مجاني"}`);
  lines.push(`✅ الإجمالي: ${money(total)} ج.م (${PAY_LABEL[order.payment_method || "cod"] || PAY_LABEL.cod})`);
  if (place) lines.push(`📍 العنوان: ${place}`);
  lines.push("");
  lines.push(
    cod
      ? "لو البيانات دي مظبوطة ابعتلنا «تأكيد» وهنجهز الشحنة. وتقدر تفتح الشحنة وتعاين المنتج قدام المندوب قبل ما تدفع."
      : "لو البيانات دي مظبوطة ابعتلنا «تأكيد» وهنجهز الشحنة."
  );
  return lines.join("\n");
}
