"use client";

import React, { useState } from "react";
import { Bot, Copy, Check, Sparkles, Terminal, FileCode, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";

export default function AdminAiGuidePage() {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const samplePrompt = `# أمر وكيل الذكاء الاصطناعي (AI Coding Agent Prompt)
# أنشئ صفحة هبوط جديدة لمنتج مخصص

أريدك أن تنشئ صفحة هبوط مستقلة جديدة بالكامل داخل منصة صفحات الهبوط.

بيانات المنتج:
- اسم المنتج: [اكتب اسم المنتج هنا، مثلاً: حزام تصحيح القوام الطبي الذكي]
- المعرف (Slug): posture-corrector
- السعر الأساسي: 349 ج.م (قبل الخصم: 550 ج.م)
- العروض:
  1. قطعة واحدة بسعر 349 ج.م (+ مصاريف الشحن حسب المحافظة)
  2. قطعتان بسعر 549 ج.م (الأكثر طلباً + شحن مجاني)
  3. 3 قطع بسعر 749 ج.م (شحن مجاني)
- الفئة المستهدفة: مصر (الدفع عند الاستلام COD)

المطلوب تنفيذه بدقة:
1. أنشئ مجلد جديد: \`src/landing-pages/posture-corrector/\`
2. ضع نصوص التسويق والمواصفات والصور والأسئلة الشائعة في: \`src/landing-pages/posture-corrector/config.ts\`
3. أنشئ مكون الواجهة بالكامل في: \`src/landing-pages/posture-corrector/page.tsx\`
   - استخدم مكون النموذج المشترك \`EgyptianCheckoutForm\`
   - استخدم شريط الطلب السفلي للهواتف \`StickyBuyBar\`
   - اجعل التصميم متجاوباً وعصرياً باللغة العربية RTL
4. سجل المكون الجديد في \`src/landing-pages/registry.ts\` بإضافة:
   \`"posture-corrector": PostureCorrectorPage\`
5. لا تعدل أي صفحة هبوط موجودة سابقاً ولا تعدل الباك إند المركزي.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(samplePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="space-y-8 text-right font-sans max-w-4xl" dir="rtl">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold border border-emerald-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" /> بروتوكول التوسع عبر وكلاء الذكاء الاصطناعي
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading flex items-center gap-2.5">
          <Bot className="w-8 h-8 text-emerald-600" />
          <span>دليل إنشاء صفحات الهبوط بالذكاء الاصطناعي (AI Agent Protocol)</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          كيف تستخدم الذكاء الاصطناعي لإنشاء وتصميم صفحة هبوط جديدة تماماً لأي منتج خلال دقائق دون لمس الكود الأساسي
        </p>
      </div>

      {/* 3 Step Card Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
            1
          </div>
          <h3 className="font-bold text-gray-900 text-base font-heading">
            إنشاء مجلد الصفحة
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            يقوم الوكيل بإنشاء مجلد معزول في <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-700 font-mono">src/landing-pages/[slug]/</code> لكتابة التصميم والنصوص الخاصة بالمنتج.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
            2
          </div>
          <h3 className="font-bold text-gray-900 text-base font-heading">
            ربط النموذج المشترك
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            استدعاء <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-700 font-mono">&lt;EgyptianCheckoutForm /&gt;</code> الذي يربط المحافظات المصرية وبوابة صفقة تلقائياً.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-sm">
            3
          </div>
          <h3 className="font-bold text-gray-900 text-base font-heading">
            التسجيل في Registry
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            إضافة سطر واحد فقط في <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-700 font-mono">registry.ts</code> لتصبح الصفحة متاحة فوراً على الرابط <code className="bg-gray-100 px-1 py-0.5 rounded text-emerald-700 font-mono">/p/[slug]</code>.
          </p>
        </div>
      </div>

      {/* Copy-Paste Prompt Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-slate-200">
              قالب الأمر الجاهز لنسخه إلى الذكاء الاصطناعي (Prompt Template)
            </span>
          </div>

          <button
            onClick={handleCopy}
            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>تم النسخ بنجاح</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ الأمر</span>
              </>
            )}
          </button>
        </div>

        <pre className="text-xs text-slate-300 font-mono overflow-x-auto p-4 bg-slate-950/70 rounded-2xl border border-slate-800/80 leading-relaxed whitespace-pre-wrap text-right" dir="rtl">
          {samplePrompt}
        </pre>
      </div>

      {/* Development & Architecture Rules Recap */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xs space-y-4">
        <h3 className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>قواعد الأمان وعدم تعارض الصفحات (Isolation Rules)</span>
        </h3>

        <ul className="space-y-2.5 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>عزل تام للتصميم:</strong> لا يتم تعديل أي ملف في صفحات سابقة إطلاقاً عند إضافة منتج جديد.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>باك إند موحد:</strong> جميع الطلبات تصب في نفس جدول <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">orders</code> مع وسم معرف الصفحة <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">landing_page_slug</code>.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>تكامل Safqa و Meta CAPI تلقائي:</strong> كل صفحة جديدة تستفيد فوراً من التشفير والتحويلات المالية والتتبع دون إعادة كتابة حرف واحد في الباك إند.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
