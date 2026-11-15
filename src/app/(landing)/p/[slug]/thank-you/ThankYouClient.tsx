"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { CheckCircle2, PhoneCall, Clock, ShieldCheck, ArrowRight, Package } from "lucide-react";

function ThankYouContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "EG-ORD-PENDING";

  const [customerName, setCustomerName] = useState("عميلنا العزيز");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerGov, setCustomerGov] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [total, setTotal] = useState("");

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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sf_last_order");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const isFresh =
        typeof parsed.savedAt === "number" &&
        Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000;

      if (parsed.orderNumber === orderNumber && isFresh) {
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.gov) setCustomerGov(parsed.gov);
        if (parsed.address) setCustomerAddress(parsed.address);
        if (parsed.total !== undefined && parsed.total !== null && parsed.total !== "") {
          setTotal(String(parsed.total));
        }
      }
    } catch {
      // Ignore parse or storage access errors
    }
  }, [orderNumber]);

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
          <div className="flex items-center justify-between pb-3 border-b border-gray-200">
            <span className="text-gray-500 text-xs">رقم الأوردر:</span>
            <span className="font-mono font-black text-slate-800 text-xs bg-white px-2 py-1 rounded-lg border border-gray-200">
              #{orderNumber}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xs">طريقة الدفع:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md text-xs border border-emerald-200">
              💵 الدفع نقداً عند الاستلام بعد المعاينة
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-xs">المحافظة:</span>
            <span className="font-bold text-slate-800 text-xs">{customerGov || "مصر"}</span>
          </div>

          {customerAddress && (
            <div className="flex items-start justify-between gap-4">
              <span className="text-gray-600 text-xs flex-shrink-0">عنوان التوصيل:</span>
              <span className="text-slate-700 text-xs text-left leading-relaxed">{customerAddress}</span>
            </div>
          )}

          {total && (
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-800 text-sm">إجمالي المبلغ المطلوب:</span>
              <span className="font-black text-emerald-600 text-base">{total} جنيه مصري</span>
            </div>
          )}
        </div>

        {/* Next Steps Card */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-right space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
            <PhoneCall className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>الخطوة التالية (مهم جداً):</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            يرجى إبقاء هاتفك متاحاً للرد على مكالمة ممثل خدمة العملاء خلال الـ 24 ساعة القادمة لتأكيد الشحن فوراً وتفادي إلغاء الطلب تلقائياً.
          </p>
        </div>

        {/* Guarantees Box */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-700 pt-1 text-right font-medium">
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-200/80 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>التوصيل من 5 إلى 7 أيام عمل</span>
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

export function ThankYouClient({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">جاري تحميل بيانات الطلب...</div>}>
      <ThankYouContent slug={slug} />
    </Suspense>
  );
}
