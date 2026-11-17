import React from "react";
import type { Metadata } from "next";
import { getBrand } from "@/lib/brand";
import { getLang } from "@/lib/i18n-server";
import { LazyStorePopups, LazyStoreChat } from "@/components/shared/LazyExtras";
import { StoreHeader } from "@/components/shared/StoreHeader";

export const runtime = "edge";
export const metadata: Metadata = { title: "سياسة الاستبدال والاسترجاع" };

const SECTIONS: { title: string; body: string }[] = [
  { title: "الدفع عند الاستلام", body: "لا تدفع أي مبلغ مقدماً. تدفع ثمن المنتج للمندوب عند وصول الشحنة إلى باب بيتك." },
  { title: "المعاينة قبل الدفع", body: "من حقك فتح الشحنة وفحص المنتج وتجربته أمام المندوب قبل الدفع. إذا لم يكن المنتج مطابقاً لما طلبته يمكنك رفضه دون أي مسؤولية." },
  { title: "الاستبدال خلال 14 يوماً", body: "في حال وجود عيب صناعة أو تلف في المنتج، نستبدله لك خلال 14 يوماً من تاريخ الاستلام بدون أي تكلفة إضافية. يجب أن يكون المنتج بحالته الأصلية وبكامل ملحقاته." },
  { title: "الشحن المجاني", body: "الشحن مجاني لجميع محافظات مصر، ويصلك الطلب خلال أيام العمل المعتادة بعد تأكيده هاتفياً." },
  { title: "كيف تطلب الاستبدال؟", body: "تواصل معنا عبر الهاتف أو الواتساب المذكور أسفل الصفحة، واذكر رقم الطلب وسبب الاستبدال، وسيرتب فريقنا استلام المنتج وإرسال البديل." },
];

const SECTIONS_EN: { title: string; body: string }[] = [
  { title: "Cash on delivery", body: "You pay nothing in advance. You pay the courier when the parcel reaches your door." },
  { title: "Inspect before you pay", body: "You have the right to open the parcel, inspect and try the product in front of the courier before paying. If it is not what you ordered, you can refuse it with no obligation." },
  { title: "Exchange within 14 days", body: "If the product has a manufacturing defect or is damaged, we exchange it within 14 days of receipt at no extra cost. The product must be in its original condition with all accessories." },
  { title: "Free shipping", body: "Shipping is free to all governorates, and your order arrives within the usual working days after phone confirmation." },
  { title: "How do I request an exchange?", body: "Contact us by phone or WhatsApp (listed at the bottom of the page), give your order number and the reason, and our team will arrange the pickup and send the replacement." },
];

export default async function PolicyPage() {
  const brand = await getBrand();
  const lang = await getLang();
  const en = lang === "en";
  const sections = en ? SECTIONS_EN : SECTIONS;
  return (
    <>
    <StoreHeader />
    <main dir={en ? "ltr" : "rtl"} className="bg-white min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">{en ? "Exchange & return policy" : "سياسة الاستبدال والاسترجاع"}</h1>
        <p className="text-slate-600 leading-relaxed">{en ? `At ${brand.store_name} your comfort and trust come first. Our terms in brief:` : `في ${brand.store_name} راحتك وثقتك أولاً. هذه هي شروطنا باختصار:`}</p>
        {sections.map((s) => (
          <section key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-1">
            <h2 className="font-heading text-lg font-black text-emerald-800 leading-relaxed">{s.title}</h2>
            <p className="text-slate-700 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
    <LazyStorePopups />
    <LazyStoreChat />
    </>
  );
}
