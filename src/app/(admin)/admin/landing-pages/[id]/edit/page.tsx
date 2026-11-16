"use client";

import { useConfirm } from "../../../_components/confirm";
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LandingPage, Product } from "@/types";
import {
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Power,
  RefreshCw,
  FileQuestion,
} from "lucide-react";
import StarterEditor from "@/components/editor/StarterEditor";
import { getLandingPageComponent, landingPageRegistry } from "@/landing-pages/registry";

export default function LandingPageDetailPage() {
  const confirmAsk = useConfirm();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(String(params?.id || ""));

  const [lp, setLp] = useState<LandingPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [lpRes, prodRes] = await Promise.all([fetch("/api/landing-pages"), fetch("/api/products")]);
      const lpJson = await lpRes.json();
      const prodJson = await prodRes.json();
      const products: Product[] = prodJson.success ? prodJson.products || [] : [];
      const listed: LandingPage | undefined = lpJson.success
        ? (lpJson.landingPages as LandingPage[]).find((x) => x.id === id)
        : undefined;
      // The list can hold a stale copy; the single-page endpoint reads the latest saved content
      // (same source as the public page), so editing never starts from outdated data.
      const freshJson = await fetch(`/api/landing-pages?id=${encodeURIComponent(id)}`)
        .then((r) => r.json())
        .catch(() => null);
      const fresh: LandingPage | undefined = freshJson?.success ? (freshJson.landingPage as LandingPage) : undefined;
      const found: LandingPage | undefined = fresh ? { ...(listed || {}), ...fresh } as LandingPage : listed;
      if (found) {
        const prod = found.product || products.find((p) => p.id === found.product_id);
        setLp({ ...found, product: prod });
      } else {
        setLp(null);
      }
    } catch (err) {
      console.error(err);
      setLp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopyUrl = () => {
    if (!lp) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/p/${lp.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleToggleStatus = async () => {
    if (!lp) return;
    const next = lp.status === "active" ? "paused" : "active";
    setBusy(true);
    try {
      const res = await fetch("/api/landing-pages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lp.id, status: next }),
      });
      const data = await res.json();
      if (data.success) setLp({ ...lp, status: next });
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!lp) return;
    if (!await confirmAsk({ title: "حذف صفحة الهبوط", message: `هتحذف الصفحة "${lp.title}" نهائياً. مش هتقدر ترجّعها.` })) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/landing-pages?id=${lp.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/landing-pages");
        return;
      }
    } catch (err) {
      console.error(err);
    }
    setBusy(false);
  };

  const backLink = (
    <Link
      href="/admin/landing-pages"
      className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-bold text-slate-600 hover:text-slate-900"
    >
      <ArrowRight className="w-4 h-4" />
      <span>صفحات الهبوط</span>
    </Link>
  );

  if (loading) {
    return (
      <div className="space-y-4 text-right font-sans" dir="rtl">
        {backLink}
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل صفحة الهبوط...</p>
        </div>
      </div>
    );
  }

  if (!lp) {
    return (
      <div className="space-y-4 text-right font-sans" dir="rtl">
        {backLink}
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto" />
          <h1 className="text-base font-bold text-slate-700">لم يتم العثور على صفحة الهبوط</h1>
          <p className="text-xs text-slate-400">ربما تم حذفها أو أن الرابط غير صحيح</p>
          <Link
            href="/admin/landing-pages"
            className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold"
          >
            العودة إلى القائمة
          </Link>
        </div>
      </div>
    );
  }

  // Landing pages rendered by the universal template get the live click-to-edit editor
  if (
    lp.product &&
    getLandingPageComponent(lp.component_key || lp.slug) === landingPageRegistry["starter-template"]
  ) {
    return (
      <StarterEditor
        lp={lp}
        onSaved={(patch) => setLp((prev) => (prev ? { ...prev, ...patch } : prev))}
        copied={copied}
        busy={busy}
        onCopyUrl={handleCopyUrl}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    );
  }

  // Old hand-written templates cannot be edited live. There is no old editor any more:
  // the merchant converts the page to the new template, then edits it visually.
  const handleConvert = async () => {
    if (!lp) return;
    if (
      !(await confirmAsk({
        title: "تحويل الصفحة",
        tone: "neutral",
        confirmText: "تحويل",
        message: "هيتحوّل شكل الصفحة للقالب الجديد القابل للتعديل المباشر، وهتاخد بيانات المنتج (الاسم والوصف والصور والعروض). تكمل؟",
      }))
    )
      return;
    setBusy(true);
    try {
      const { product: _product, ...rest } = lp as any;
      const res = await fetch("/api/landing-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, component_key: "starter-template" }),
      });
      const data = await res.json();
      if (data.success) {
        await load();
      } else {
        window.alert(data.error || "تعذر التحويل، حاول مرة أخرى");
      }
    } catch (err) {
      console.error(err);
      window.alert("تعذر التحويل، حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 text-right font-sans max-w-3xl mx-auto pb-16" dir="rtl">
      {backLink}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 font-heading leading-snug">{lp.title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            الصفحة دي مبنية على قالب قديم ما بيدعمش التعديل المباشر. حوّلها للقالب الجديد وتقدر تعدّل أي نص أو صورة
            أو لون بالضغط عليه مباشرة في الصفحة.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleConvert}
            disabled={busy}
            className="min-h-[48px] px-6 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-lg shadow-orange-500/25 disabled:opacity-60 cursor-pointer"
          >
            {busy ? "جاري التحويل..." : "تحويل للقالب الجديد وفتح المحرر"}
          </button>
          <a
            href={`/p/${lp.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] px-5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> فتح الصفحة الحالية
          </a>
        </div>
      </div>
    </div>
  );
}
