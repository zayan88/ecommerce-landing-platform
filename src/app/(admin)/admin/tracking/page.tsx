"use client";

import React, { useEffect, useState } from "react";
import {
  Target,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ExternalLink,
  Zap,
  Info,
} from "lucide-react";

export default function AdminTrackingPage() {
  const [settings, setSettings] = useState<any>({
    default_meta_pixel_id: "",
    default_meta_capi_token: "",
    meta_test_event_code: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans max-w-4xl" dir="rtl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading flex items-center gap-2.5">
          <Target className="w-8 h-8 text-blue-600" />
          <span>إعدادات تتبع ميتا وبيكسل (Meta Pixel & CAPI)</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          تتبع دقيق بنسبة 100% لإعلانات فيسبوك وإنستغرام مع خاصية منع احتساب التكرار (Deduplication)
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>تم حفظ بيانات التتبع وبيكسل ميتا بنجاح</span>
        </div>
      )}

      {/* Deduplication Architecture Callout */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
            نظام التتبع المزدوج المتقدم (Redundant Event Match)
          </span>
        </div>
        <h3 className="text-lg font-black font-heading">
          كيف يعمل منع التكرار (Event Deduplication) في منصتنا؟
        </h3>
        <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
          عندما يقوم العميل بإتمام الطلب، يقوم المتصفح بإرسال حدث <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-amber-300 font-mono">Purchase</code> لمعرف البيكسل مع <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono">event_id</code> مشفر، وفي نفس اللحظة يرسل السيرفر نفس الحدث بنفس الـ <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono">event_id</code> وبيانات الهاتف المشفرة (SHA-256) إلى Meta Conversions API. تقوم خوارزمية ميتا بدمج الحدثين واحتساب عملية شراء واحدة بدقة بالغة حتى لو كان العميل يستخدم AdBlocker!
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xs space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 font-heading">
              بيانات البيكسل والـ Access Token
            </h3>
            <span className="text-xs text-gray-400 flex items-center gap-1 font-mono">
              <Lock className="w-3.5 h-3.5 text-blue-600" /> يتم التشفير قبل الإرسال
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              معرف بيكسل ميتا الافتراضي (Pixel ID)
            </label>
            <input
              type="text"
              dir="ltr"
              value={settings.default_meta_pixel_id || ""}
              onChange={(e) => setSettings({ ...settings, default_meta_pixel_id: e.target.value })}
              placeholder="123456789012345"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-sm text-right outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              يمكنك تخصيص بيكسل مختلف لكل صفحة هبوط مستقلة من صفحة إدارة صفحات الهبوط.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              رمز الوصول إلى واجهة التحويلات (Conversions API Access Token)
            </label>
            <textarea
              rows={3}
              dir="ltr"
              value={settings.default_meta_capi_token || ""}
              onChange={(e) => setSettings({ ...settings, default_meta_capi_token: e.target.value })}
              placeholder="EAABw..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-xs text-right outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              يمكن توليده من إعدادات Meta Events Manager &gt; Conversions API &gt; Generate access token.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              كود اختبار الأحداث (Test Event Code - اختياري)
            </label>
            <input
              type="text"
              dir="ltr"
              value={settings.meta_test_event_code || ""}
              onChange={(e) => setSettings({ ...settings, meta_test_event_code: e.target.value })}
              placeholder="TEST12345"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-sm text-right outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              يستخدم لرؤية الأحداث المباشرة داخل تبويب Test Events في مدير أحداث فيسبوك.
            </span>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-gray-100">
          <button
            type="submit"
            disabled={isSaving}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ إعدادات التتبع"}
          </button>
        </div>
      </form>
    </div>
  );
}
