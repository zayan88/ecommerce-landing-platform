"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Layers,
  ArrowUpRight,
  ExternalLink,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  RefreshCw,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      const json = await res.json();
      if (json.success) {
        setData(json.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleStatus = async (lpId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lpId, status: newStatus }),
      });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            لوحة الإحصائيات والأداء
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            نظرة شاملة على مبيعات جميع صفحات الهبوط وأداء الحملات الإعلانية في مصر
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="py-2 px-3.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>تحديث البيانات</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">إجمالي المبيعات المؤكدة</span>
            <div className="text-2xl font-black text-emerald-700 mt-1 font-heading">
              {data?.totalRevenue?.toLocaleString("ar-EG") || 0} ج.م
            </div>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> أداء ممتاز
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">إجمالي الطلبات</span>
            <div className="text-2xl font-black text-gray-900 mt-1 font-heading">
              {data?.totalOrders || 0} طلب
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-1 block">
              {data?.deliveredOrders || 0} تم التوصيل | {data?.pendingOrders || 0} قيد المعالجة
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">متوسط قيمة الطلب (AOV)</span>
            <div className="text-2xl font-black text-gray-900 mt-1 font-heading">
              {data?.avgOrderValue || 0} ج.م
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-1 block">
              شامل العروض المتعددة
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500">صفحات الهبوط النشطة</span>
            <div className="text-2xl font-black text-gray-900 mt-1 font-heading">
              {data?.activeLandingPagesCount || 0} / {data?.landingPagesCount || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
              جاهزة لاستقبال الترافيك
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Landing Pages Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-heading">
              أداء صفحات الهبوط المستقلة
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              متابعة معدلات التحويل وحالة التفعيل لكل منتج على حدة
            </p>
          </div>

          <Link
            href="/admin/landing-pages"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>إدارة جميع الصفحات</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50/75 text-gray-500 text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">صفحة الهبوط</th>
                <th className="py-3 px-4">المنتج المرتبط</th>
                <th className="py-3 px-4">الرابط المباشر</th>
                <th className="py-3 px-4">الزيارات التقديرية</th>
                <th className="py-3 px-4">عدد الطلبات</th>
                <th className="py-3 px-4">معدل التحويل</th>
                <th className="py-3 px-4">الإيراد المحقق</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.lpPerformance?.map((lp: any) => (
                <tr key={lp.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{lp.title}</td>
                  <td className="py-3.5 px-4 text-gray-600 text-xs">{lp.productTitle}</td>
                  <td className="py-3.5 px-4 font-mono text-xs text-emerald-700">
                    <a
                      href={`/p/${lp.slug}`}
                      target="_blank"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>/p/{lp.slug}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 font-semibold">{lp.estimatedVisits}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">{lp.ordersCount} طلب</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">{lp.conversionRate}</td>
                  <td className="py-3.5 px-4 font-black text-gray-900">{lp.revenue} ج.م</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        lp.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {lp.status === "active" ? "نشط" : "متوقف"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(lp.id, lp.status)}
                      className="text-xs font-semibold text-gray-600 hover:text-emerald-700 underline cursor-pointer"
                    >
                      {lp.status === "active" ? "إيقاف مؤقت" : "تفعيل"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Governorates & Quick Deployment Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Governorates */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base font-heading flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> أكثر المحافظات طلباً
            </h3>
            <span className="text-xs text-gray-400">مصر</span>
          </div>

          <div className="space-y-3">
            {data?.topGovernorates?.length > 0 ? (
              data.topGovernorates.map((gov: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">{gov.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700">{gov.count} طلب</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">لا توجد بيانات كافية بعد</p>
            )}
          </div>
        </div>

        {/* AI Agent Quick Blueprint Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl border border-slate-700 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> بروتوكول الذكاء الاصطناعي
              </span>
              <span className="text-xs text-slate-400">Next.js App Router Architecture</span>
            </div>

            <h3 className="text-xl font-bold font-heading">
              كيف تضيف صفحة هبوط لمنتج جديد في 3 خطوات بسيطة؟
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              تم تصميم المنصة بحيث يمكنك إعطاء وكيل الذكاء الاصطناعي (AI Coding Agent) رابط المنتج أو الصور والنصوص، وسيقوم بإنشاء مجلد مخصص داخل <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono">src/landing-pages/[slug]</code> وتسجيلها فوراً، دون المساس بأي صفحة سابقة أو تكرار الباك إند!
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-700/80">
            <span className="text-xs text-slate-400">شامل التوصيل ببوابة صفقة و Meta Pixel تلقائياً</span>
            <Link
              href="/admin/ai-guide"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
            >
              <span>عرض دليل الوكيل والقالب الجاهز</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
