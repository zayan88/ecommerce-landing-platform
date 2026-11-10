"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { CheckCircle2, PhoneCall, Clock, ShieldCheck, ArrowRight, Package } from "lucide-react";

function ThankYouContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "EG-ORD-PENDING";
  const customerName = searchParams.get("name") || "عميلنا العزيز";
  const customerPhone = searchParams.get("phone") || "";
  const customerGov = searchParams.get("gov") || "";
  const customerAddress = searchParams.get("address") || "";
  const total = searchParams.get("total") || "";

  useEffect(() => {
    // Fire confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-right flex items-center justify-center font-sans" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 md:p-10 border border-gray-200/80 shadow-xl text-center space-y-6">
        {/* Animated Checkmark Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            ✅ طلبك اتسجل بنجاح يا {customerName}!
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 mt-3.5 font-heading">
            شكراً يا {customerName}.. طلبك في إيدينا وبنجهزه 🙌
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
            استلمنا بياناتك وهيتواصل معاك فريق التأكيد على رقمك {customerPhone ? <span className="font-mono font-bold text-slate-800 dir-ltr inline-block">({customerPhone})</span> : ""} لتأكيد ميعاد التوصيل المناسب لك.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-gray-200 text-right space-y-3 text-sm">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <span className="text-gray-500 font-semibold flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" /> رقم الطلب:
            </span>
            <span className="font-mono font-black text-base text-gray-900 bg-gray-200/80 px-2.5 py-1 rounded-md">
              {orderNumber}
            </span>
          </div>

          <div className="flex justify-between items-center text-gray-600">
            <span>الاسم:</span>
            <span className="font-bold text-gray-900">{customerName}</span>
          </div>

          {customerPhone && (
            <div className="flex justify-between items-center text-gray-600">
              <span>رقم الهاتف المسجل:</span>
              <span className="font-semibold text-gray-900 font-mono" dir="ltr">{customerPhone}</span>
            </div>
          )}

          {customerGov && (
            <div className="flex justify-between items-center text-gray-600">
              <span>المحافظة:</span>
              <span className="font-semibold text-gray-800">{customerGov}</span>
            </div>
          )}

          {customerAddress && (
            <div className="flex justify-between items-center text-gray-600">
              <span>العنوان بالتفصيل:</span>
              <span className="font-semibold text-gray-800 max-w-[280px] truncate text-left">{customerAddress}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-gray-600">
            <span>تكلفة الشحن:</span>
            <span className="font-bold text-emerald-600">شحن مجاني 100% 🎁</span>
          </div>

          {total && (
            <div className="flex justify-between items-center text-gray-600 pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-800">المبلغ الإجمالي عند الاستلام:</span>
              <span className="text-xl font-black text-emerald-700 font-mono">{total} ج.م</span>
            </div>
          )}

          <div className="flex justify-between items-center text-gray-600">
            <span>طريقة الدفع:</span>
            <span className="font-bold text-gray-800">الدفع نقدياً عند الاستلام (معاينة قبل الدفع)</span>
          </div>
        </div>

        {/* Confirmation Notice - Optimized by Claude to prevent dropoffs */}
        <div className="p-4 rounded-2xl bg-amber-50/95 border border-amber-300 text-right flex items-center gap-3 shadow-xs">
          <div className="w-11 h-11 rounded-full bg-amber-200/90 flex items-center justify-center shrink-0 text-amber-900 animate-pulse">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-sm text-amber-950">📞 مهم جداً: ردّ على مكالمتنا عشان طلبك يتشحن فوراً</div>
            <div className="text-xs text-amber-900 mt-1 leading-relaxed">
              هيتصل بيك فريق التأكيد لتأكيد العنوان وميعاد الاستلام.. الرد السريع بيضمن خروج شحنتك فوراً لحد باب بيتك.
            </div>
          </div>
        </div>

        {/* Guarantees Box */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-700 pt-1 text-right font-medium">
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200/80 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>التوصيل من 3 إلى 5 أيام عمل</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200/80 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>افتح الشحنة وعاين قبل الدفع</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            href={`/p/${slug}`}
            className="text-sm font-bold text-gray-500 hover:text-emerald-700 inline-flex items-center gap-1.5 transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لصفحة المنتج</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">جاري تحميل بيانات الطلب...</div>}>
      <ThankYouContent slug={params.slug} />
    </Suspense>
  );
}
