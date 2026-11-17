// Tests for the WhatsApp order-confirmation message (src/lib/order-message.ts).
// Usage: node scripts/test-order-message.mjs
import assert from "node:assert/strict";
import { startTestKit } from "./lib/test-kit.mjs";

const { mod, test, finish } = await startTestKit({});
const { buildOrderWhatsappMessage: build } = await mod("lib/order-message.ts");

const ORDER = {
  order_number: "EG-261117-4639", customer_name: "منى علي", quantity: 2, unit_price: 300, total_amount: 600, shipping_fee: 0, discount_amount: 50,
  final_amount: 550, governorate: "الجيزة", city: "الجيزة", address: "٥ شارع الهرم", notes: "الخيارات: اللون: أحمر، المقاس: L | بعد العصر", payment_method: "cod",
};

await test("the message carries the order's details", () => {
  const m = build(ORDER, { storeName: "متجر النور", productTitle: "تيشيرت" });
  for (const part of ["منى علي", "متجر النور", "EG-261117-4639", "تيشيرت × 2", "اللون: أحمر، المقاس: L", "سعر القطعة: 300", "الخصم: 50", "الشحن: مجاني", "الإجمالي: 550", "الدفع عند الاستلام", "الجيزة - ٥ شارع الهرم", "تأكيد", "تعاين"]) {
    assert.ok(m.includes(part), part + "\n" + m);
  }
  assert.ok(!m.includes("الجيزة - الجيزة"), "the city is not repeated when it equals the governorate");
});

await test("paid shipping, transfer payments and missing fields are handled", () => {
  const m = build({ order_number: "X1", quantity: 1, shipping_fee: 60, final_amount: 360, payment_method: "instapay", governorate: "القاهرة", address: "شارع ١" }, { productTitle: "منتج" });
  assert.ok(m.includes("الشحن: 60 ج.م") && m.includes("تحويل إنستاباي") && !m.includes("سعر القطعة") && !m.includes("الخصم") && !m.includes("تعاين"));
  assert.ok(m.startsWith("أهلاً 👋") && m.includes("متجرنا"));
});

finish();
