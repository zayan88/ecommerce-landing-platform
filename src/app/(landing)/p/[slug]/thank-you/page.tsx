"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import Link from "next/link";
import { CheckCircle2, MessageCircle, PhoneCall, Clock, ShieldCheck, ArrowRight, Package } from "lucide-react";

export default function ThankYouPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "EG-ORD-PENDING";
  const customerName = searchParams.get("name") || "عميلنا العزيز";
  const customerPhone = searchParams.get("phone") || "";
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

  const whatsappMessage = encodeURIComponent(
    `مرحباً، قمت بطلب المنتج من الموقع برقم طلب: ${orderNumber}، أرجو تأكيد الشحن السريع.`
  );
  const whatsappUrl = `https://wa.me/201000000000?text=${whatsappMessage}`;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 text-right flex items-center justify-center font-sans" dir="rtl">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 md:p-10 border border-gray-200/80 shadow-xl text-center space-y-6">
        {/* Animated Checkmark Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            تم تسجيل طلبك بنجاح 🎉
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 mt-3 font-heading">
            شكراً لثقتك بنا يا {customerName}!
          </h1>
          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
            استلمنا بيانات طلبك وسيقوم فريق المبيعات والتوصيل بالتواصل معك على رقم هاتفك للتأكيد ومتابعة الشحنة.
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

          {customerPhone && (
            <div className="flex justify-between items-center text-gray-600">
              <span>رقم الهاتف المسجل:</span>
              <span className="font-semibold text-gray-900" dir="ltr">{customerPhone}</span>
            </div>
          )}

          {total && (
            <div className="flex justify-between items-center text-gray-600">
              <span>المبلغ الإجمالي عند الاستلام:</span>
              <span className="text-lg font-black text-emerald-700">{total} ج.م</span>
            </div>
          )}

          <div className="flex justify-between items-center text-gray-600">
            <span>طريقة الدفع:</span>
            <span className="font-bold text-gray-800">الدفع نقدياً عند الاستلام (COD)</span>
          </div>
        </div>

        {/* Quick WhatsApp Action */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-right flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-emerald-900">
            <div className="font-bold text-sm">هل تود تأكيد طلبك فوراً لتسريع الشحن؟</div>
            <span>تواصل مباشرة عبر واتساب مع خدمة العملاء</span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تأكيد عبر واتساب</span>
          </a>
        </div>

        {/* Guarantees Box */}
        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 pt-2 text-right">
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>توصيل خلال 24 - 48 ساعة</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-gray-100 flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>معاينة كاملة قبل الدفع للمندوب</span>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            href={`/p/${params.slug}`}
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
