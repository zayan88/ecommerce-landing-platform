"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, RefreshCw, Package, AlertTriangle, Plus, ExternalLink, CheckCircle2, Circle, X, ArrowLeft, ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
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

/* ───────────── dashboard parts (Shopify / EasyOrders style) ───────────── */
interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  governorate: string;
  final_amount: number;
  status: string;
  created_at: string;
}

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  confirmed: { label: "تم التأكيد", cls: "bg-sky-50 text-sky-800 border-sky-200" },
  shipped: { label: "تم الشحن", cls: "bg-violet-50 text-violet-800 border-violet-200" },
  delivered: { label: "تم التوصيل", cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  cancelled: { label: "ملغي", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  returned: { label: "مرتجع", cls: "bg-slate-100 text-slate-700 border-slate-200" },
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { timeZone: "Africa/Cairo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** ▲ / ▼ percentage against the previous period of the same length. */
function Delta({ now, before }: { now: number; before: number | null }) {
  if (before === null) return null;
  if (before === 0) return now > 0 ? <span className="text-[11px] font-bold text-emerald-700">جديد</span> : null;
  const p = ((now - before) / before) * 100;
  if (Math.abs(p) < 0.5) return <span className="text-[11px] font-bold text-slate-400">بدون تغيير</span>;
  const up = p > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${up ? "text-emerald-700" : "text-rose-600"}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(Math.round(p))}%
    </span>
  );
}

interface SetupStep {
  key: string;
  title: string;
  hint: string;
  href: string;
  done: boolean;
}

function SetupChecklist({ steps, onDismiss }: { steps: SetupStep[]; onDismiss: () => void }) {
  const done = steps.filter((s) => s.done).length;
  const pctDone = Math.round((done / steps.length) * 100);
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-black text-slate-950 text-lg font-heading">جهّز متجرك</h2>
          <p className="text-xs text-slate-500 mt-0.5">خلّصت {done} من {steps.length} خطوات</p>
        </div>
        <button onClick={onDismiss} aria-label="إخفاء" className="min-h-11 min-w-11 -m-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mt-3" role="progressbar" aria-valuenow={pctDone} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pctDone}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-slate-100">
        {steps.map((s) => (
          <li key={s.key}>
            <Link href={s.href} className="flex items-center gap-3 py-2.5 min-h-11 group">
              {s.done ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" aria-label="تم" />
              ) : (
                <Circle className="w-5 h-5 text-slate-300 shrink-0" aria-label="لسه" />
              )}
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-bold ${s.done ? "text-slate-400 line-through" : "text-slate-900 group-hover:text-emerald-700"}`}>{s.title}</span>
                {!s.done && <span className="block text-xs text-slate-500 leading-relaxed">{s.hint}</span>}
              </span>
              {!s.done && <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function AttentionCard({
  href,
  value,
  label,
  tone,
  loading,
}: {
  href: string;
  value: number;
  label: string;
  tone: "amber" | "rose" | "slate";
  loading: boolean;
}) {
  const cls = {
    amber: "border-amber-200 bg-amber-50/70 text-amber-900",
    rose: "border-rose-200 bg-rose-50/70 text-rose-900",
    slate: "border-slate-200 bg-white text-slate-800",
  }[tone];
  return (
    <Link href={href} className={`rounded-2xl border p-3.5 sm:p-4 flex items-center gap-3 min-h-[64px] hover:shadow-sm transition ${cls}`}>
      <span className="text-2xl font-black font-heading leading-none">{loading ? "…" : nf(value)}</span>
      <span className="text-sm font-bold leading-snug flex-1">{label}</span>
      <ArrowLeft className="w-4 h-4 opacity-60 shrink-0" />
    </Link>
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
  const [prev, setPrev] = useState<StatsData["totals"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState<"sales" | "orders" | "avg" | "visits">("sales");
  const [recent, setRecent] = useState<RecentOrder[] | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [steps, setSteps] = useState<SetupStep[] | null>(null);
  const [setupHidden, setSetupHidden] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const reqId = useRef(0);

  const load = useCallback(async (from: string, to: string) => {
    const id = ++reqId.current;
    setLoading(true);
    setError("");
    try {
      // previous period of the same length (for the ▲/▼ comparison); a failure there must not break the page
      const days = Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
      const prevTo = shiftDay(from, -1);
      const prevFrom = shiftDay(prevTo, -(days - 1));
      const [res, prevRes] = await Promise.all([
        fetch(`/api/admin/stats?from=${from}&to=${to}`, { cache: "no-store" }),
        fetch(`/api/admin/stats?from=${prevFrom}&to=${prevTo}`, { cache: "no-store" }).catch(() => null),
      ]);
      const json = await res.json().catch(() => null);
      if (id !== reqId.current) return;
      if (!res.ok || !json?.success) throw new Error(json?.error || "تعذر تحميل الإحصائيات");
      setData(json);
      const pj = prevRes && prevRes.ok ? await prevRes.json().catch(() => null) : null;
      setPrev(pj?.success ? pj.totals : null);
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

  // Recent orders, pending count and the setup checklist: one request each, when the page opens
  const loadSide = useCallback(async () => {
    const j = (u: string) => fetch(u, { cache: "no-store" }).then((r) => r.json()).catch(() => null);
    const [ord, pulse, settings, products, domain] = await Promise.all([
      j("/api/orders?limit=8&offset=0"),
      j("/api/admin/orders-pulse"),
      j("/api/settings"),
      j("/api/products"),
      j("/api/admin/domain"),
    ]);
    setRecent(Array.isArray(ord?.orders) ? ord.orders : []);
    setPending(pulse?.success && pulse.supported !== false && typeof pulse.pending_count === "number" ? pulse.pending_count : null);

    const s = settings?.settings || {};
    const hasProducts = Array.isArray(products?.products) && products.products.some((p: any) => p.status === "active");
    const hasPixel = (Array.isArray(s.meta_pixel_ids) && s.meta_pixel_ids.length > 0) || !!s.default_meta_pixel_id || (Array.isArray(s.tiktok_pixel_ids) && s.tiktok_pixel_ids.length > 0) || (Array.isArray(s.snap_pixel_ids) && s.snap_pixel_ids.length > 0);
    setSteps([
      { key: "product", title: "ضيف أول منتج", hint: "المنتج بيعمل صفحة هبوط تلقائيًا جاهزة للإعلان.", href: "/admin/products", done: hasProducts },
      { key: "brand", title: "خصّص هوية متجرك", hint: "الاسم واللوجو والألوان.", href: "/admin/settings", done: !!(s.logo_url || s.onboarding_done) },
      { key: "whatsapp", title: "ضيف رقم واتساب وخدمة العملاء", hint: "بيظهر للعملاء في آخر الصفحات.", href: "/admin/settings", done: !!(s.support_whatsapp || s.support_phone) },
      { key: "telegram", title: "فعّل إشعارات الطلبات على تليجرام", hint: "تعرف بالطلب الجديد في نفس اللحظة.", href: "/admin/settings/notifications", done: !!s.telegram_bot_token },
      { key: "pixel", title: "اربط بيكسل الإعلانات", hint: "فيسبوك أو تيك توك أو سناب.", href: "/admin/marketing/pixels", done: hasPixel },
      { key: "domain", title: "اربط دومينك", hint: "رابط متجرك الخاص.", href: "/admin/settings/domain", done: !!s.site_domain },
    ]);
    try {
      setSetupHidden(localStorage.getItem("setup_checklist_hidden") === "1");
    } catch {
      setSetupHidden(false);
    }
  }, []);

  useEffect(() => {
    loadSide();
  }, [loadSide]);

  const hideSetup = () => {
    setSetupHidden(true);
    try {
      localStorage.setItem("setup_checklist_hidden", "1");
    } catch {}
  };

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
  const METRICS = [
    { key: "sales" as const, label: "المبيعات", color: "text-emerald-600", fmt: money },
    { key: "orders" as const, label: "الطلبات", color: "text-orange-500", fmt: nf },
    { key: "avg" as const, label: "متوسط الطلب", color: "text-amber-500", fmt: money },
    { key: "visits" as const, label: "الزيارات", color: "text-slate-600", fmt: nf },
  ];
  const activeMetric = METRICS.find((m) => m.key === metric)!;
  const pendingCount = pending ?? t?.newOrders ?? 0;
  const lowCount = data?.lowStock.length ?? 0;
  const showSetup = !setupHidden && steps && steps.some((s) => !s.done);

  return (
    <div className="space-y-5 text-right font-sans max-w-full" dir="rtl">
      {/* Header: greeting + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">أهلًا في {brand.store_name}</h1>
          <p className="text-sm text-slate-500 mt-1">ده ملخص متجرك النهارده.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products" className="min-h-11 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black flex items-center gap-2 shadow-sm shadow-orange-500/25">
            <Plus className="w-4 h-4" /> إضافة منتج
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer" className="min-h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-sm font-bold flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> معاينة المتجر
          </a>
        </div>
      </div>

      {showSetup && steps && <SetupChecklist steps={steps} onDismiss={hideSetup} />}

      {/* Needs attention */}
      {(pendingCount > 0 || lowCount > 0 || (t && t.lostOrders > 0)) && (
        <section aria-label="المطلوب منك" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pendingCount > 0 && <AttentionCard href="/admin/orders" value={pendingCount} label="طلب جديد منتظر التأكيد" tone="amber" loading={false} />}
          {lowCount > 0 && <AttentionCard href="/admin/products" value={lowCount} label="منتج على وشك النفاذ" tone="amber" loading={false} />}
          {t && t.lostOrders > 0 && <AttentionCard href="/admin/orders" value={t.lostOrders} label={`طلب ملغي أو مرتجع في الفترة (${pct(t.lostRate)})`} tone="rose" loading={false} />}
        </section>
      )}

      {/* Date range */}
      <Card className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => pick(p.key)}
              className={`min-h-11 px-4 rounded-full text-sm font-bold border transition cursor-pointer ${
                preset === p.key ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => {
              load(range.from, range.to);
              loadSide();
            }}
            aria-label="تحديث"
            className="min-h-11 min-w-11 mr-auto rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {preset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-500 space-y-1 block">
              من
              <input type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="block w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white" />
            </label>
            <label className="text-xs font-bold text-slate-500 space-y-1 block">
              إلى
              <input type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="block w-full min-h-11 rounded-xl border border-slate-200 px-3 text-sm text-slate-900 bg-white" />
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
          <button onClick={() => load(range.from, range.to)} className="min-h-11 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shrink-0 cursor-pointer">
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Main KPIs with comparison to the previous period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-5 min-w-0">
          <div className="text-xs font-bold text-slate-500">إجمالي المبيعات</div>
          {showSkeleton ? <div className="h-7 w-24 mt-2 rounded-lg bg-slate-100 animate-pulse" /> : <div className="text-xl sm:text-2xl font-black mt-1.5 font-heading text-emerald-700 break-words">{t ? money(t.sales) : ""}</div>}
          {t && <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><Delta now={t.sales} before={prev ? prev.sales : null} /> عن الفترة اللي قبلها</div>}
        </Card>
        <Card className="p-4 sm:p-5 min-w-0">
          <div className="text-xs font-bold text-slate-500">الطلبات</div>
          {showSkeleton ? <div className="h-7 w-16 mt-2 rounded-lg bg-slate-100 animate-pulse" /> : <div className="text-xl sm:text-2xl font-black mt-1.5 font-heading text-slate-900">{t ? nf(t.orders) : ""}</div>}
          {t && <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500"><Delta now={t.orders} before={prev ? prev.orders : null} /> عن الفترة اللي قبلها</div>}
        </Card>
        <Kpi label="متوسط سعر الطلب" value={t ? money(t.avgOrder) : ""} loading={showSkeleton} />
        <Kpi label="معدل التحويل" value={t ? pct(conv) : ""} tone="text-orange-600" note="تقريبي" loading={showSkeleton} />
      </div>

      {/* One chart with tabs */}
      <Card className="p-4 sm:p-5 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-black text-slate-900 text-base font-heading">الأداء</h3>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="نوع الرسم">
            {METRICS.map((m) => (
              <button
                key={m.key}
                role="tab"
                aria-selected={metric === m.key}
                onClick={() => setMetric(m.key)}
                className={`min-h-10 px-3.5 rounded-full text-xs font-bold border cursor-pointer transition ${
                  metric === m.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {showSkeleton ? <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" /> : <AreaChart points={series[metric]} colorClass={activeMetric.color} format={activeMetric.fmt} />}
      </Card>

      {/* Recent orders + top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-slate-900 text-base font-heading">أحدث الطلبات</h3>
            <Link href="/admin/orders" className="min-h-11 inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800">عرض كل الطلبات</Link>
          </div>
          {recent === null ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : recent.length === 0 ? (
            <EmptyBox text="لسه مفيش طلبات. أول طلب هيظهر هنا." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((o) => {
                const chip = STATUS_CHIP[o.status] || { label: o.status, cls: "bg-slate-100 text-slate-700 border-slate-200" };
                return (
                  <li key={o.id}>
                    <Link href="/admin/orders" className="flex items-center gap-3 py-2.5 min-h-12">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{o.customer_name}</div>
                        <div className="text-[11px] text-slate-500 font-semibold truncate">
                          <span dir="ltr">{o.order_number}</span> · {o.governorate} · <span dir="ltr">{formatWhen(o.created_at)}</span>
                        </div>
                      </div>
                      <div className="text-left shrink-0 space-y-1">
                        <div className="text-sm font-black text-slate-900">{money(o.final_amount)}</div>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${chip.cls}`}>{chip.label}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
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

      {/* Low stock + funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-slate-900 text-base font-heading">أوشك على النفاذ</h3>
            <Link href="/admin/products" className="min-h-11 inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800">عرض الكل</Link>
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${p.stock <= 0 ? "bg-rose-50 text-rose-900 border border-rose-200" : "bg-amber-100 text-amber-900"}`}>
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

        <ChartCard title="مسار الشراء" note="تقريبي" loading={showSkeleton}>
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
      </div>

      {/* Extra numbers, collapsed */}
      <section className="space-y-3">
        <button onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} className="min-h-11 inline-flex items-center gap-2 text-sm font-black text-slate-700 hover:text-slate-950 cursor-pointer">
          مؤشرات إضافية
          <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? "rotate-180" : ""}`} />
        </button>
        {showMore && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Kpi label="صافي الربح" value={t ? money(t.netProfit) : ""} tone="text-emerald-700" note={profitNote} loading={showSkeleton} />
            <Kpi label="مرات بدء الشراء" value={t ? nf(t.checkoutStarts) : ""} note="تقريبي" loading={showSkeleton} />
            <Kpi label="الطلبات الجديدة" value={t ? nf(t.newOrders) : ""} tone="text-orange-600" loading={showSkeleton} />
            <Kpi label="الطلبات المفقودة" value={t ? nf(t.lostOrders) : ""} tone="text-rose-600" loading={showSkeleton} />
          </div>
        )}
      </section>
    </div>
  );
}
