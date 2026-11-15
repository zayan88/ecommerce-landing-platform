import React from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/** Egyptian-dialect answers to the 4 core COD objections (scam fear, shipping, defects, difficulty). */
export const DEFAULT_FAQ: FaqItem[] = [
  {
    q: "الشحن بكام وهيوصل إمتى؟",
    a: "الشحن مجاني 100% لكل محافظات مصر لحد باب بيتك، والتوصيل بياخد من 5 لـ 7 أيام عمل.",
  },
  {
    q: "أقدر أفتح الشحنة وأفحص المنتج قبل ما أدفع؟",
    a: "طبعاً. بتفتح الشحنة وتعاين وتجرّب قدام المندوب، ولو مش مقتنع ماتدفعش ولا مليم.",
  },
  {
    q: "المنتج أصلي ولا هيجيلي حاجة تانية؟",
    a: "اللي هيوصلك هو نفس المنتج اللي في الصور. وعشان كده المعاينة قبل الدفع حقك، تتأكد بنفسك قبل ما تدفع.",
  },
  {
    q: "لو طلع فيه عيب صناعة أعمل إيه؟",
    a: "عندك ضمان 14 يوم باستبدال مجاني لحد باب البيت. كلمنا وهنبدّله لك من غير أي مصاريف.",
  },
  {
    q: "استخدامه صعب؟",
    a: "لأ خالص، بيشتغل في 3 خطوات بسيطة موضحة في الصفحة، وفي كتيب إرشادات جوه العلبة.",
  },
  {
    q: "هتتصلوا بيا إمتى؟",
    a: "بعد ما تسجّل الطلب، فريق التأكيد بيتصل بيك على رقمك خلال ساعات لتأكيد العنوان وميعاد التوصيل.",
  },
];

interface FaqAccordionProps {
  title?: string;
  items?: FaqItem[];
  defaultOpenIndex?: number;
}

export function FaqAccordion({ title, items, defaultOpenIndex = 0 }: FaqAccordionProps) {
  const titleId = React.useId();
  const list = items && items.length > 0 ? items.filter((i) => i?.q && i?.a) : DEFAULT_FAQ;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: list.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <section dir="rtl" aria-labelledby={titleId} className="bg-white rounded-3xl border border-slate-200/90 shadow-sm sm:shadow-md p-4 sm:p-6">
      <h2 id={titleId} className="text-xl sm:text-2xl font-black text-slate-900 font-heading text-center mb-4 leading-relaxed">
        {title || "أسئلة بتدور في بالك؟ جاوبنا عليها"}
      </h2>
      <div className="space-y-2.5">
        {list.map((item, idx) => (
          <details
            key={idx}
            open={idx === defaultOpenIndex}
            className="group rounded-2xl border border-slate-200 bg-slate-50/60 open:bg-white open:border-emerald-200 transition"
          >
            <summary className="flex items-center justify-between gap-3 min-h-[52px] p-3 sm:p-4 cursor-pointer list-none font-bold text-slate-900 text-sm sm:text-base leading-relaxed [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <ChevronDown className="w-5 h-5 shrink-0 text-emerald-600 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="px-3 sm:px-4 pb-4 text-sm sm:text-base text-slate-700 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
      {/* "<" is escaped so admin/AI-written text can never close the script tag */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
