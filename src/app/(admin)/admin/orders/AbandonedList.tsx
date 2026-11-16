"use client";

import { useConfirm } from "../_components/confirm";
import React, { useCallback, useEffect, useState } from "react";
import { MessageCircle, Phone, Trash2, CheckCircle2, RefreshCw } from "lucide-react";

interface Item {
  id: string;
  phone: string;
  name: string;
  governorate: string | null;
  product_title: string | null;
  landing_slug: string | null;
  offer_title: string | null;
  amount: number;
  utm_source: string | null;
  status: "open" | "contacted" | "converted";
  updated_ms: number;
}
interface Counts {
  open: number;
  contacted: number;
  converted: number;
}

const FILTERS: { id: "open" | "contacted" | "converted"; label: string }[] = [
  { id: "open", label: "لسه ماتكلمش" },
  { id: "contacted", label: "اتكلمنا معاه" },
  { id: "converted", label: "كمّل الطلب" },
];

function timeAgo(ms: number): string {
  const m = Math.max(0, Math.round((Date.now() - ms) / 60000));
  if (m < 1) return "دلوقتي";
  if (m < 60) return `من ${m} دقيقة`;
  const h = Math.round(m / 60);
  if (h < 24) return `من ${h} ساعة`;
  return `من ${Math.round(h / 24)} يوم`;
}

/** Visitors who typed their name + phone in the checkout but did not place the order. */
export default function AbandonedList({ onCounts }: { onCounts?: (open: number) => void }) {
  const confirmAsk = useConfirm();
  const [status, setStatus] = useState<"open" | "contacted" | "converted">("open");
  const [items, setItems] = useState<Item[]>([]);
  const [counts, setCounts] = useState<Counts>({ open: 0, contacted: 0, converted: 0 });
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/abandoned?status=${status}&limit=100`, { cache: "no-store" });
      const j = await res.json();
      if (j.success) {
        setItems(j.items || []);
        setCounts(j.counts);
        setSupported(j.supported !== false);
        onCounts?.(j.counts?.open ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, onCounts]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (id: string, next: Item["status"]) => {
    await fetch("/api/admin/abandoned", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: next }),
    });
    load();
  };
  const remove = async (id: string) => {
    if (!await confirmAsk({ title: "حذف الطلب المفقود", message: "هتحذف الطلب ده من القايمة." })) return;
    await fetch("/api/admin/abandoned", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-100 space-y-3">
        <p className="text-xs text-gray-500 leading-relaxed">
          عملاء كتبوا اسمهم وموبايلهم في الفورم ومكمّلوش الطلب. كلّمهم وكمّل معاهم، ولو عملوا الطلب بيتقفل هنا لوحده. بتتمسح تلقائي بعد 30 يوم.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatus(f.id)}
              className={`min-h-[40px] px-3.5 rounded-xl text-xs font-bold cursor-pointer transition ${
                status === f.id ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label} <span className="font-black">{counts[f.id].toLocaleString("en-US")}</span>
            </button>
          ))}
          <button type="button" onClick={load} aria-label="تحديث" className="min-h-[40px] w-10 rounded-xl border border-gray-200 flex items-center justify-center cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!supported ? (
        <div className="p-8 text-center text-sm text-gray-500">الميزة دي بتشتغل مع قاعدة بيانات D1 بس.</div>
      ) : loading && items.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400">مفيش طلبات متروكة هنا.</div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((it) => (
            <li key={it.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-gray-950 truncate">{it.name || "بدون اسم"}</span>
                  {it.amount > 0 && <span className="font-black text-gray-900 whitespace-nowrap">{it.amount} ج.م</span>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                  <span dir="ltr" className="font-mono">{it.phone}</span>
                  {it.governorate && <span>{it.governorate}</span>}
                  <span>{timeAgo(it.updated_ms)}</span>
                </div>
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {it.product_title || it.landing_slug || "منتج غير محدد"}
                  {it.offer_title ? ` · ${it.offer_title}` : ""}
                  {it.utm_source ? ` · ${it.utm_source}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a href={`tel:${it.phone}`} aria-label="اتصال" className="h-11 w-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </a>
                <a
                  href={`https://wa.me/2${it.phone.replace(/^0/, "")}?text=${encodeURIComponent(
                    `أهلاً ${it.name || ""}، لاحظنا إنك بدأت طلب ${it.product_title || "منتج"} ومكمّلتوش. محتاج مساعدة نكمّله سوا؟`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => it.status === "open" && mark(it.id, "contacted")}
                  aria-label="واتساب"
                  className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
                {it.status === "open" && (
                  <button type="button" onClick={() => mark(it.id, "contacted")} title="اتكلمنا معاه" aria-label="اتكلمنا معاه" className="h-11 w-11 rounded-xl border border-gray-200 text-gray-600 flex items-center justify-center cursor-pointer">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button type="button" onClick={() => remove(it.id)} aria-label="حذف" className="h-11 w-11 rounded-xl text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
