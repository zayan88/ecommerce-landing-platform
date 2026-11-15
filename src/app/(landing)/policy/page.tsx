import React from "react";
import type { Metadata } from "next";
import { getBrand } from "@/lib/brand";

export const runtime = "edge";
export const metadata: Metadata = { title: "سياسة الاستبدال والاسترجاع" };

const SECTIONS: { title: string; body: string }[] = [
  { title: "الدفع عند الاستلام", body: "لا تدفع أي مبلغ مقدماً. تدفع ثمن المنتج للمندوب عند وصول الشحنة إلى باب بيتك." },
  { title: "المعاينة قبل الدفع", body: "من حقك فتح الشحنة وفحص المنتج وتجربته أمام المندوب قبل الدفع. إذا لم يكن المنتج مطابقاً لما طلبته يمكنك رفضه دون أي مسؤولية." },
  { title: "الاستبدال خلال 14 يوماً", body: "في حال وجود عيب صناعة أو تلف في المنتج، نستبدله لك خلال 14 يوماً من تاريخ الاستلام بدون أي تكلفة إضافية. يجب أن يكون المنتج بحالته الأصلية وبكامل ملحقاته." },
  { title: "الشحن المجاني", body: "الشحن مجاني لجميع محافظات مصر، ويصلك الطلب خلال أيام العمل المعتادة بعد تأكيده هاتفياً." },
  { title: "كيف تطلب الاستبدال؟", body: "تواصل معنا عبر الهاتف أو الواتساب المذكور أسفل الصفحة، واذكر رقم الطلب وسبب الاستبدال، وسيرتب فريقنا استلام المنتج وإرسال البديل." },
];

export default async function PolicyPage() {
  const brand = await getBrand();
  return (
    <main dir="rtl" className="bg-white min-h-[60vh]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed">سياسة الاستبدال والاسترجاع</h1>
        <p className="text-slate-600 leading-relaxed">في {brand.store_name} راحتك وثقتك أولاً. هذه هي شروطنا باختصار:</p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-1">
            <h2 className="font-heading text-lg font-black text-emerald-800 leading-relaxed">{s.title}</h2>
            <p className="text-slate-700 leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
