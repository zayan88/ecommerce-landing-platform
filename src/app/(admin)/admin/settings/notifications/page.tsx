"use client";

import { useBrand } from "@/components/brand/BrandProvider";
import React, { useState, useEffect } from "react";
import {
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Users,
} from "lucide-react";

export default function AdminNotificationsPage() {
  const brand = useBrand();
  const [settings, setSettings] = useState<any>({
    telegram_bot_token: "",
    telegram_chat_id: "",
    telegram_notifications_enabled: true,
    store_name: brand.store_name,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.settings) {
        setSettings({
          telegram_bot_token: json.settings.telegram_bot_token || "",
          telegram_chat_id: json.settings.telegram_chat_id || "",
          telegram_notifications_enabled: json.settings.telegram_notifications_enabled ?? true,
          store_name: json.settings.store_name || brand.store_name,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_bot_token: settings.telegram_bot_token.trim(),
          telegram_chat_id: settings.telegram_chat_id.trim(),
          telegram_notifications_enabled: settings.telegram_notifications_enabled,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(json.error || "فشل حفظ الإعدادات");
      }
    } catch (err: any) {
      setSaveError(err.message || "حدث خطأ في الاتصال");
    } finally {
      setSaving(false);
    }
  };

  const handleTestAlert = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/notifications/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.telegram_bot_token.trim(),
          chatId: settings.telegram_chat_id.trim(),
        }),
      });

      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `خطأ في الاتصال: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const isConfigured = Boolean(
    settings.telegram_bot_token && settings.telegram_chat_id && settings.telegram_notifications_enabled
  );

  return (
    <div className="space-y-8 text-right font-sans max-w-5xl mx-auto" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
              إشعارات المبيعات على الموبايل
            </h1>
            <span className="bg-sky-500/10 text-sky-600 border border-sky-500/20 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Send className="w-3 h-3" /> Telegram Bot
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            إرسال إشعار فوري لحظي بصوت الكاشير 💰 لموبايلك أو موبايل العميل أو جروب التأكيدات عند تسجيل كل أوردر جديد!
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConfigured ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>الإشعارات نشطة وشغالة</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>في انتظار ربط التوكن</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Form Column */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-slate-900 text-base">إعدادات بوت التليجرام</h3>
                  <p className="text-xs text-gray-500">ربط مباشر مجاني بدون أي وسيط أو تكلفة رسائل</p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.telegram_notifications_enabled}
                  onChange={(e) =>
                    setSettings({ ...settings, telegram_notifications_enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Token Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span>توكن البوت (Bot Token):</span>
                <span className="text-gray-400 font-normal">من @BotFather</span>
              </label>
              <input
                type="text"
                value={settings.telegram_bot_token}
                onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-mono text-left direction-ltr transition"
              />
              <p className="text-[11px] text-gray-400">
                التوكن السري الخاص بالبوت الذي أنشأته على تليجرام.
              </p>
            </div>

            {/* Chat ID Input */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span>معرف المحادثة أو الجروب (Chat ID):</span>
                <span className="text-gray-400 font-normal">من @userinfobot</span>
              </label>
              <input
                type="text"
                value={settings.telegram_chat_id}
                onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                placeholder="مثال: 987654321 أو للجروبات: -100123456789"
                className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-xs font-mono text-left direction-ltr transition"
              />
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                <span>
                  يمكنك وضع أكثر من ID مفصولين بفواصل <code>,</code> لإرسال الإشعار لعدة أشخاص أو جروبات معاً!
                </span>
              </p>
            </div>

            {/* Feedback Alerts */}
            {saveSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>تم حفظ إعدادات إشعارات التليجرام بنجاح!</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>حفظ الإعدادات</span>
              </button>

              <button
                type="button"
                onClick={handleTestAlert}
                disabled={testing || !settings.telegram_bot_token || !settings.telegram_chat_id}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>إرسال إشعار تجريبي للموبايل 📲</span>
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
                  testResult.success
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                    : "bg-red-50 border border-red-200 text-red-900"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{testResult.message}</p>
                </div>
              </div>
            )}
          </form>

          {/* Quick Step by Step Setup Guide */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
              <HelpCircle className="w-4 h-4 text-sky-600" />
              <span>كيفية تفعيل البوت في دقيقة واحدة:</span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 font-medium leading-relaxed pr-1">
              <li>
                افتح تطبيق تليجرام وابحث عن <strong>@BotFather</strong>.
              </li>
              <li>
                أرسل له الأمر <code>/newbot</code> ثم اكتب اسم البوت واسم المستخدم (ينتهي بـ bot)، وسيعطيك الـ <strong>API Token</strong> مباشرة.
              </li>
              <li>
                ابحث في تليجرام عن <strong>@userinfobot</strong> واضغط Start، سيعطيك الـ <strong>Id</strong> الخاص بك (ضعه في خانة Chat ID).
              </li>
              <li>
                <strong>خطوة هامة:</strong> افتح البوت الذي أنشأته واضغط على زر <strong>Start</strong> لكي يستطيع إرسال الرسائل لك، ثم اضغط على زر الاختبار أعلاه!
              </li>
            </ol>
          </div>
        </div>

        {/* Live Mock Preview Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-black text-slate-200">معاينة الإشعار على شاشة الموبايل</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Telegram Live</span>
            </div>

            {/* Telegram Message Bubble Mock */}
            <div className="bg-[#182533] p-4 rounded-2xl border border-slate-700 text-xs font-sans space-y-2 text-right shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-black border-b border-slate-700/80 pb-1.5">
                <span>🔔 أوردر جديد نزل حالاً في {settings.store_name || brand.store_name}! 🛒</span>
                <span className="text-[10px] text-slate-400">04:30 م</span>
              </div>

              <div className="space-y-1 text-slate-200 text-[11px] leading-relaxed pt-1">
                <p>
                  📌 <strong>رقم الطلب:</strong> <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">#ORD-582914</code>
                </p>
                <p>
                  👤 <strong>العميل:</strong> أحمد محمود السيد
                </p>
                <p>
                  📞 <strong>التليفون:</strong> <code className="text-emerald-400">01012345678</code>
                </p>
                <p>
                  📍 <strong>المحافظة:</strong> المنصورة - الدقهلية
                </p>
                <p>
                  🏠 <strong>العنوان:</strong> شارع الجيش برج الأمل الدور الرابع
                </p>
                <div className="border-t border-slate-700/60 my-1 pt-1" />
                <p>
                  📦 <strong>المنتج:</strong> جهاز استنشاق البخار النيبولايزر
                </p>
                <p>
                  🔢 <strong>الكمية:</strong> قطعتين (عرض التوفير)
                </p>
                <p className="text-orange-400 font-black">
                  💰 <strong>المبلغ عند الاستلام:</strong> 550 ج.م (شحن مجاني 🚚)
                </p>
                <p>
                  💵 <strong>طريقة الدفع:</strong> الدفع نقدياً عند الاستلام (COD)
                </p>
                <div className="border-t border-slate-700/60 my-1 pt-1" />
                <p className="text-[10px] text-slate-400">
                  🎯 <strong>مصدر الإعلان:</strong> TikTok Ads (حملة الخصم الصيفي)
                </p>
              </div>

              {/* Inline Action Buttons Mock */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  className="py-1.5 px-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 rounded-xl text-[10px] font-bold text-center border border-emerald-500/30"
                >
                  💬 واتساب العميل
                </button>
                <button
                  type="button"
                  className="py-1.5 px-2 bg-sky-600/30 hover:bg-sky-600/40 text-sky-300 rounded-xl text-[10px] font-bold text-center border border-sky-500/30"
                >
                  📞 اتصال هاتفي
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center font-medium">
              💡 العميل أو المسوق يقدر يضغط فوراً على زرار الواتساب أو الاتصال للتأكيد المباشر مع المشتري في ثواني!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
