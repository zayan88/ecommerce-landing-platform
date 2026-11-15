"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, RefreshCw, Package, AlertTriangle } from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";

/* ───────────── types ───────────── */
interface DailyPoint {
  date: string;
  sales: number;
  orders: number;
  avgOrder: number;
  visits: number;
  checkoutStarts: number;
}
interface StatsData {
  range: { from: string; to: string; days: number };
  totals: {
    sales: number;
    orders: number;
    validOrders: number;
    avgOrder: number;
    newOrders: number;
    lostOrders: number;
    lostRate: number;
    netProfit: number;
    profitComplete: boolean;
    visits: number;
    checkoutStarts: number;
  };
  daily: DailyPoint[];
  topProducts: { productId: string; title: string; image: string; quantity: number; revenue: number }[];
  lowStock: { id: string; title: string; image: string; stock: number }[];
}

type Preset = "today" | "7" | "30" | "month" | "custom";

/* ───────────── date helpers (Egypt time) ───────────── */
const cairoFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
function cairoToday(): string {
  const p = cairoFmt.formatToParts(new Date());
  const g = (t: string) => p.find((x) => x.type === t)?.value || "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}
function shiftDay(day: string, delta: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") + delta * 86400000).toISOString().slice(0, 10);
}
function presetRange(p: Preset): { from: string; to: string } {
  const today = cairoToday();
  if (p === "today") return { from: today, to: today };
  if (p === "30") return { from: shiftDay(today, -29), to: today };
  if (p === "month") return { from: today.slice(0, 8) + "01", to: today };
  return { from: shiftDay(today, -6), to: today };
}

const PRESETS: { key: Preset; label: string }[] = [
  { key: "today", label: "اليوم" },
  { key: "7", label: "آخر 7 أيام" },
  { key: "30", label: "آخر 30 يوم" },
  { key: "month", label: "هذا الشهر" },
  { key: "custom", label: "مخصص" },
];

// Western digits like the rest of the store (599 ج.م); the Arabic thousands separator looks like a zero.
const nf = (n: number) => (Number.isFinite(n) ? n : 0).toLocaleString("en-US");
const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n * 10) / 10);

/* ───────────── hand-written SVG area chart ───────────── */
function AreaChart({
  points,
  colorClass,
  format,
}: {
  points: { label: string; value: number }[];
  colorClass: string;
  format: (n: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const W = 600;
  const H = 220;
  const padL = 46;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const max = Math.max(...points.map((p) => p.value), 0);
  const hasData = points.length > 0 && max > 0;

  if (!hasData) {
    return (
      <div className="h-48 flex flex-col items-center justify-center gap-2 text-slate-400">
        <BarChart3 className="w-10 h-10" strokeWidth={1.5} />
        <span className="text-sm font-semibold">لا توجد بيانات لعرضها</span>
      </div>
    );
  }

  const top = max * 1.1;
  const n = points.length;
  const x = (i: number) => (n === 1 ? (padL + W - padR) / 2 : padL + (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => padT + (1 - v / top) * (H - padT - padB);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const ticks = [0, top / 2, top];
  const labelEvery = Math.max(1, Math.ceil(n / 5));

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const vx = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x(i) - vx);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    setHover(best);
  };

  return (
    <div className="relative" dir="ltr">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full h-auto select-none touch-pan-y ${colorClass}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="text-slate-200" stroke="currentColor" strokeWidth={1} strokeDasharray={i === 0 ? undefined : "4 4"} />
            <text x={padL - 6} y={y(t) + 5} textAnchor="end" fontSize={15} className="text-slate-400" fill="currentColor">
              {compact(t)}
            </text>
          </g>
        ))}
        <path d={area} fill="currentColor" opacity={0.12} />
        <path d={line} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={15} className="text-slate-400" fill="currentColor">
              {p.label}
            </text>
          ) : null
        )}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={y(0)} stroke="currentColor" strokeWidth={1} opacity={0.4} />
            <circle cx={x(hover)} cy={y(points[hover].value)} r={5} fill="currentColor" stroke="white" strokeWidth={2} />
          </g>
        )}
        {n <= 31 && hover === null && points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p.value)} r={2.5} fill="currentColor" />)}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-slate-900 text-white text-xs font-bold px-2.5 py-1.5 shadow-lg whitespace-nowrap"
          style={{ left: `${Math.min(88, Math.max(12, (x(hover) / W) * 100))}%` }}
          dir="rtl"
        >
          <span className="text-slate-300 font-medium">{points[hover].label}</span> · {format(points[hover].value)}
        </div>
      )}
    </div>
  );
}

/* ───────────── small UI parts ───────────── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm ${className}`}>{children}</div>;
}

function Kpi({
  label,
  value,
  note,
  tone = "text-slate-900",
  loading,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
  loading: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5 min-w-0">
      <div className="text-xs font-bold text-slate-500 leading-relaxed">{label}</div>
      {loading ? (
        <div className="h-7 w-24 mt-2 rounded-lg bg-slate-100 animate-pulse" />
      ) : (
        <div className={`text-xl sm:text-2xl font-black mt-1.5 font-heading break-words ${tone}`}>{value}</div>
      )}
      {note && !loading && <div className="text-[11px] font-semibold text-amber-600 mt-1">{note}</div>}
    </Card>
  );
}

function ChartCard({ title, note, loading, children }: { title: string; note?: string; loading: boolean; children: React.ReactNode }) {
  return (
    <Card className="p-4 sm:p-5 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="font-black text-slate-900 text-base font-heading">{title}</h3>
        {note && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">{note}</span>}
      </div>
      {loading ? <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" /> : children}
    </Card>
  );
}

function Thumb({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200" />
  ) : (
    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
      <Package className="w-5 h-5" />
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="py-8 flex flex-col items-center gap-2 text-slate-400">
      <Package className="w-9 h-9" strokeWidth={1.5} />
      <span className="text-sm font-semibold">{text}</span>
    </div>
  );
}

/* ───────────── page ───────────── */
export default function AdminOverviewPage() {
  const brand = useBrand();
  const cur = brand.currency || "ج.م";
  const money = useCallback((n: number) => `${nf(n)} ${cur}`, [cur]);

  const [preset, setPreset] = useState<Preset>("7");
  const [range, setRange] = useState(() => presetRange("7"));
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reqId = useRef(0);

  const load = useCallback(async (from: string, to: string) => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stats?from=${from}&to=${to}`, { cache: "no-store" });
      const json = await res.json().catch(() => null);
      if (id !== reqId.current) return;
      if (!res.ok || !json?.success) throw new Error(json?.error || "تعذر تحميل الإحصائيات");
      setData(json);
    } catch (e: any) {
      if (id !== reqId.current) return;
      setError(e?.message || "تعذر تحميل الإحصائيات");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (range.from && range.to && range.from <= range.to) load(range.from, range.to);
  }, [range, load]);

  const pick = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") setRange(presetRange(p));
  };

  const t = data?.totals;
  const conv = t && t.visits > 0 ? Math.min(100, (t.orders / t.visits) * 100) : 0;
  const pct = (n: number) => `${(Math.round(n * 10) / 10).toLocaleString("en-US")}%`;

  const series = useMemo(() => {
    const d = data?.daily || [];
    const lab = (s: string) => `${Number(s.slice(8))}/${Number(s.slice(5, 7))}`;
    const mk = (f: (p: DailyPoint) => number) => d.map((p) => ({ label: lab(p.date), value: f(p) }));
    return {
      sales: mk((p) => p.sales),
      orders: mk((p) => p.orders),
      avg: mk((p) => p.avgOrder),
      visits: mk((p) => p.visits),
    };
  }, [data]);

  const showSkeleton = loading && !data;
  const profitNote = t && !t.profitComplete ? "تقريبي" : undefined;
  const funnelBase = t?.visits || 0;
  const funnel = [
    { label: "زيارات", value: t?.visits || 0, tone: "bg-slate-400" },
    { label: "بدء الشراء", value: t?.checkoutStarts || 0, tone: "bg-amber-500" },
    { label: "إكمال الشراء", value: t?.orders || 0, tone: "bg-emerald-500" },
  ];

  return (
    <div className="space-y-6 text-right font-sans max-w-full" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">لوحة الإحصائيات</h1>
        <p className="text-sm text-slate-500 mt-1">اعرف أكثر عن أداء متجرك ومدى تقدمك</p>
      </div>

      {/* Date range */}
      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => pick(p.key)}
              className={`min-h-11 px-4 rounded-full text-sm font-bold border transition ${
                preset === p.key
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => load(range.from, range.to)}
            aria-label="تحديث"
            className="min-h-11 min-w-11 mr-auto rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-500 space-y-1 block">
              من
              <input
                type="date"
                value={range.from}
                max={range.to || undefined}
                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                className="block w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white"
              />
            </label>
            <label className="text-xs font-bold text-slate-500 space-y-1 block">
              إلى
              <input
                type="date"
                value={range.to}
                min={range.from || undefined}
                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                className="block w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white"
              />
            </label>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 text-rose-900 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => load(range.from, range.to)}
            className="min-h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shrink-0"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="إجمالي المبيعات" value={t ? money(t.sales) : ""} tone="text-emerald-700" loading={showSkeleton} />
        <Kpi label="الطلبات" value={t ? nf(t.orders) : ""} loading={showSkeleton} />
        <Kpi label="زيارات" value={t ? nf(t.visits) : ""} note="تقريبي" loading={showSkeleton} />
        <Kpi label="معدل التحويل" value={t ? pct(conv) : ""} tone="text-orange-600" note="تقريبي" loading={showSkeleton} />
      </div>

      {/* Extra KPIs */}
      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 font-heading">مؤشرات إضافية</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Kpi label="صافي الربح" value={t ? money(t.netProfit) : ""} tone="text-emerald-700" note={profitNote} loading={showSkeleton} />
          <Kpi label="متوسط سعر الطلب" value={t ? money(t.avgOrder) : ""} loading={showSkeleton} />
          <Kpi label="مرات بدء الشراء" value={t ? nf(t.checkoutStarts) : ""} note="تقريبي" loading={showSkeleton} />
          <Kpi label="الطلبات الجديدة" value={t ? nf(t.newOrders) : ""} tone="text-orange-600" loading={showSkeleton} />
          <Kpi label="الطلبات المفقودة" value={t ? nf(t.lostOrders) : ""} tone="text-rose-600" loading={showSkeleton} />
          <Kpi label="المعدل بالمفقودة" value={t ? pct(t.lostRate) : ""} tone="text-rose-600" loading={showSkeleton} />
          <Kpi label="مرات إضافة للسلة" value="—" tone="text-slate-400" loading={false} />
          <Kpi label="إضافة كروس سيل" value="—" tone="text-slate-400" loading={false} />
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="إجمالي المبيعات" loading={showSkeleton}>
          <AreaChart points={series.sales} colorClass="text-emerald-600" format={money} />
        </ChartCard>
        <ChartCard title="إجمالي الطلبات" loading={showSkeleton}>
          <AreaChart points={series.orders} colorClass="text-orange-500" format={nf} />
        </ChartCard>
        <ChartCard title="متوسط سعر الطلب" loading={showSkeleton}>
          <AreaChart points={series.avg} colorClass="text-amber-500" format={money} />
        </ChartCard>
        <ChartCard title="إجمالي الزيارات" note="تقريبي" loading={showSkeleton}>
          <AreaChart points={series.visits} colorClass="text-slate-600" format={nf} />
        </ChartCard>
      </div>

      <ChartCard title="معدلات التحويل" note="تقريبي" loading={showSkeleton}>
        {funnelBase > 0 ? (
          <div className="space-y-4">
            {funnel.map((f, i) => {
              const w = Math.min(100, (f.value / funnelBase) * 100);
              return (
                <div key={f.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold">
                    <span className="text-slate-700">{f.label}</span>
                    <span className="text-slate-900">
                      {nf(f.value)}
                      {i > 0 && <span className="text-slate-400 font-semibold"> · {pct(w)}</span>}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${f.tone}`} style={{ width: `${Math.max(w, f.value > 0 ? 2 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center gap-2 text-slate-400">
            <BarChart3 className="w-10 h-10" strokeWidth={1.5} />
            <span className="text-sm font-semibold">لا توجد بيانات لعرضها</span>
          </div>
        )}
      </ChartCard>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-slate-900 text-base font-heading">أوشك على النفاذ</h3>
            <Link href="/admin/products" className="min-h-11 inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800">
              عرض الكل
            </Link>
          </div>
          {showSkeleton ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : data && data.lowStock.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {data.lowStock.map((p) => (
                <li key={p.id}>
                  <Link href="/admin/products" className="flex items-center gap-3 py-2.5 min-h-11">
                    <Thumb src={p.image} />
                    <span className="flex-1 min-w-0 text-sm font-bold text-slate-900 truncate">{p.title}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        p.stock <= 0 ? "bg-rose-50 text-rose-900 border border-rose-200" : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {p.stock <= 0 ? "نفد" : `متبقي ${nf(p.stock)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBox text="لا توجد منتجات على وشك النفاذ" />
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <h3 className="font-black text-slate-900 text-base font-heading mb-3">المنتجات الأكثر مبيعاً</h3>
          {showSkeleton ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : data && data.topProducts.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {data.topProducts.map((p) => (
                <li key={p.productId} className="flex items-center gap-3 py-2.5 min-h-11">
                  <Thumb src={p.image} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{p.title}</div>
                    <div className="text-xs text-slate-500 font-semibold">{nf(p.quantity)} قطعة</div>
                  </div>
                  <span className="text-sm font-black text-emerald-700 shrink-0">{money(p.revenue)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBox text="لا توجد مبيعات في هذه الفترة" />
          )}
        </Card>
      </div>
    </div>
  );
}
