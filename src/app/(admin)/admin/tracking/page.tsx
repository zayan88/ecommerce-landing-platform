"use client";

import React, { useEffect, useState } from "react";
import {
  Target,
  Users,
  Eye,
  MousePointerClick,
  Smartphone,
  Monitor,
  Activity,
  RefreshCw,
  Layers,
  CheckCircle2,
  ShoppingBag,
  Clock,
  FileText,
  TrendingUp,
  Sparkles,
  Lock,
  ArrowDownRight,
  Edit3,
  Globe,
  Radio,
} from "lucide-react";

export default function AdminTrackingPage() {
  const [activeTab, setActiveTab] = useState<"visitors" | "meta">("visitors");

  // Meta Settings State
  const [settings, setSettings] = useState<any>({
    default_meta_pixel_id: "",
    default_meta_capi_token: "",
    meta_test_event_code: "",
  });
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaSaveSuccess, setMetaSaveSuccess] = useState(false);

  // Live Visitor Analytics State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) {
        setAnalyticsData(json.summary);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.settings);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchSettings();
  }, []);

  // Live Auto-Refresh every 6 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || activeTab !== "visitors") return;
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMeta(true);
    setMetaSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setMetaSaveSuccess(true);
        setTimeout(() => setMetaSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const trackingInfo = analyticsData?.tracking || {};
  const totalVisitors = trackingInfo.uniqueVisitors || 0;
  const totalViews = trackingInfo.totalPageViews || 0;
  const todayVisitors = trackingInfo.todayVisitors || 0;
  const onlineVisitors = trackingInfo.onlineVisitors || 0;
  const funnel = trackingInfo.funnel || [];
  const recentActivity = trackingInfo.recentActivity || [];
  const deviceCounts = trackingInfo.deviceCounts || { mobile: 0, desktop: 0, tablet: 0 };
  const totalDevices = (deviceCounts.mobile || 0) + (deviceCounts.desktop || 0) + (deviceCounts.tablet || 0) || 1;
  const mobilePct = Math.round(((deviceCounts.mobile || 0) / totalDevices) * 100);
  const desktopPct = Math.round(((deviceCounts.desktop || 0) / totalDevices) * 100);

  const totalOrders = analyticsData?.totalOrders || 0;
  const overallConversion =
    totalVisitors > 0 ? ((totalOrders / totalVisitors) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-emerald-600" />
            <span>تتبع الزوار والنشاط المباشر</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سجل دقيق ومباشر لمعرفة عدد زوار موقعك وما الإجراءات التي يقومون بها خطوة بخطوة
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-gray-200 shadow-2xs">
          <button
            onClick={() => setActiveTab("visitors")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "visitors"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-950"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>نشاط الزوار والتحليلات</span>
          </button>
          <button
            onClick={() => setActiveTab("meta")}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "meta"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-950"
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>إعدادات Meta Pixel & CAPI</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE VISITORS & BEHAVIOR */}
      {activeTab === "visitors" && (
        <div className="space-y-6">
          {/* Quick Control Bar: Refresh & Live Status */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                <span>المتواجدون الآن: {onlineVisitors > 0 ? `${onlineVisitors} زائر` : "نشاط مستمر"}</span>
              </span>
              <span className="text-gray-400 text-[11px]">
                آخر تحديث: {lastRefreshedAt.toLocaleTimeString("ar-EG")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-gray-700 font-bold cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span>تحديث تلقائي حي (كل 6 ثوانٍ)</span>
              </label>

              <button
                onClick={fetchAnalytics}
                className="py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? "animate-spin" : ""}`} />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Unique Visitors */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">إجمالي الأشخاص (الزوار)</span>
                <div className="text-2xl font-black text-slate-950 mt-1 font-heading">
                  {totalVisitors.toLocaleString("ar-EG")}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                  <Sparkles className="w-3 h-3" /> زوار فريدين (Unique)
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Total Page Views */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">مشاهدات وزيارات الصفحات</span>
                <div className="text-2xl font-black text-blue-700 mt-1 font-heading">
                  {totalViews.toLocaleString("ar-EG")}
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">
                  إجمالي تفاعلات التصفح
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Today's Visitors */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">زوار اليوم (Today)</span>
                <div className="text-2xl font-black text-emerald-600 mt-1 font-heading">
                  {todayVisitors.toLocaleString("ar-EG")}
                </div>
                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                  اليوم من الساعة 12:00 ص
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Conversion Rate */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">معدل التحويل للطلب</span>
                <div className="text-2xl font-black text-orange-600 mt-1 font-heading">
                  {overallConversion}%
                </div>
                <span className="text-[11px] text-orange-600 font-bold mt-1 block">
                  {totalOrders} طلبات مؤكدة
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Behavior Funnel: ماذا فعل الناس في الموقع خطوة بخطوة */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-black text-gray-950 font-heading flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-emerald-600" />
                  <span>قمع سلوك الزوار (ماذا فعل الناس في الموقع بالتفصيل؟)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  تتبع خطوات العميل من لحظة فتح الرابط حتى إتمام الشراء لتحديد أين يتوقف الزوار
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                مسار الشراء المصري
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {funnel.map((step: any, idx: number) => {
                const maxCount = funnel[0]?.count || 1;
                const pctOfTop = Math.round((step.count / maxCount) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 text-[11px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        <span className="text-gray-900">{step.step}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-emerald-700">{step.count} إجراء</span>
                        <span className="text-gray-400 font-mono text-[11px] w-12 text-left">
                          ({pctOfTop}%)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pctOfTop, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Live Activity Feed + Devices & Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Activity Stream (سجل النشاط المباشر دقيقة بدقيقة) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-gray-950 font-heading flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <span>سجل النشاط الحي للزوار (لحظة بلحظة)</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    آخر الإجراءات والصفحات التي يتصفحها الزوار الآن
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-gray-500">
                  {recentActivity.length} أحداث مسجلة
                </span>
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-gray-300" />
                  <p className="text-xs">
                    لم يتم تسجيل نشاطات بعد. بمجرد دخول أي زائر للموقع ستظهر تحركاته هنا فوراً.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {recentActivity.map((act: any, idx: number) => {
                    const isPurchase = act.eventName === "Purchase";
                    const isOffer = act.eventName === "SelectOffer";
                    const isCTA = act.eventName === "ClickCTA";
                    const isForm = act.eventName === "FormInteraction";
                    const isScroll = act.eventName === "ScrollDepth";

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                          isPurchase
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : isCTA
                            ? "bg-orange-50/60 border-orange-200 text-orange-950"
                            : isOffer
                            ? "bg-blue-50/60 border-blue-200 text-blue-950"
                            : isForm
                            ? "bg-amber-50/60 border-amber-200 text-amber-950"
                            : "bg-slate-50 border-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                isPurchase
                                  ? "bg-emerald-600 text-white"
                                  : isCTA
                                  ? "bg-orange-600 text-white"
                                  : isOffer
                                  ? "bg-blue-600 text-white"
                                  : isForm
                                  ? "bg-amber-600 text-white"
                                  : isScroll
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-200 text-gray-700"
                              }`}
                            >
                              {act.eventName}
                            </span>

                            <span className="font-bold text-xs">
                              {act.arabicDescription}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-gray-500 font-mono">
                            <span className="flex items-center gap-1">
                              {act.deviceType === "mobile" ? (
                                <Smartphone className="w-3 h-3 text-gray-400" />
                              ) : (
                                <Monitor className="w-3 h-3 text-gray-400" />
                              )}
                              <span>{act.deviceType === "mobile" ? "موبايل" : "كمبيوتر"}</span>
                            </span>

                            <span>•</span>
                            <span>المصدر: {act.utmSource || "مباشر"}</span>

                            <span>•</span>
                            <span className="text-gray-400" dir="ltr">
                              {act.pageUrl}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-gray-400 font-mono shrink-0 whitespace-nowrap">
                          {new Date(act.createdAt).toLocaleTimeString("ar-EG")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Devices & Traffic Source Breakdown */}
            <div className="lg:col-span-4 space-y-4">
              {/* Devices Card */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
                <h4 className="text-sm font-black text-gray-950 font-heading flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>الأجهزة المستخدمة (Devices)</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Smartphone className="w-3.5 h-3.5" /> الهواتف المحمولة (Mobile)
                      </span>
                      <span className="font-mono text-emerald-700">{mobilePct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${mobilePct || 85}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="flex items-center gap-1.5 text-gray-700">
                        <Monitor className="w-3.5 h-3.5" /> أجهزة الكمبيوتر (Desktop)
                      </span>
                      <span className="font-mono text-blue-700">{desktopPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${desktopPct || 15}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Traffic Sources */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
                <h4 className="text-sm font-black text-gray-950 font-heading flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>مصادر الزيارات (Traffic Sources)</span>
                </h4>

                <div className="space-y-2 text-xs">
                  {Object.entries(trackingInfo.sourceCounts || { "مباشر (Direct)": 1 }).map(
                    ([source, count]: [string, any], i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-gray-100"
                      >
                        <span className="font-bold text-gray-800">{source}</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {count} زيارات
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: META PIXEL & CAPI SETTINGS */}
      {activeTab === "meta" && (
        <div className="space-y-6 max-w-4xl">
          {metaSaveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
              عندما يقوم العميل بإتمام الطلب، يقوم المتصفح بإرسال حدث{" "}
              <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-amber-300 font-mono">
                Purchase
              </code>{" "}
              لمعرف البيكسل مع{" "}
              <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                event_id
              </code>{" "}
              مشفر، وفي نفس اللحظة يرسل السيرفر نفس الحدث بنفس الـ{" "}
              <code className="bg-blue-800/80 px-1.5 py-0.5 rounded text-emerald-300 font-mono">
                event_id
              </code>{" "}
              وبيانات الهاتف المشفرة (SHA-256) إلى Meta Conversions API. تقوم خوارزمية ميتا
              بدمج الحدثين واحتساب عملية شراء واحدة بدقة بالغة حتى لو كان العميل يستخدم
              AdBlocker!
            </p>
          </div>

          {/* Main Settings Form */}
          <form
            onSubmit={handleSaveMeta}
            className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-8 shadow-xs space-y-6"
          >
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
                  onChange={(e) =>
                    setSettings({ ...settings, default_meta_pixel_id: e.target.value })
                  }
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
                  onChange={(e) =>
                    setSettings({ ...settings, default_meta_capi_token: e.target.value })
                  }
                  placeholder="EAABw..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 font-mono text-xs text-right outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  يمكن توليده من إعدادات Meta Events Manager &gt; Conversions API &gt; Generate
                  access token.
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
                  onChange={(e) =>
                    setSettings({ ...settings, meta_test_event_code: e.target.value })
                  }
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
                disabled={isSavingMeta}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {isSavingMeta ? "جاري الحفظ..." : "حفظ إعدادات التتبع"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
