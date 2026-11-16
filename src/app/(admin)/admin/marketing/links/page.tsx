"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Link2, Copy, Check } from "lucide-react";

interface Offer {
  id: string;
  title_ar: string;
  quantity: number;
  price: number;
}
interface Prod {
  id: string;
  title_ar: string;
  slug: string;
  status: string;
  offers?: Offer[];
}

const PLATFORMS: { key: string; label: string; source: string; medium: string }[] = [
  { key: "facebook", label: "فيسبوك", source: "facebook", medium: "paid_social" },
  { key: "instagram", label: "إنستجرام", source: "instagram", medium: "paid_social" },
  { key: "tiktok", label: "تيك توك", source: "tiktok", medium: "paid_social" },
  { key: "snapchat", label: "سناب شات", source: "snapchat", medium: "paid_social" },
  { key: "google", label: "جوجل", source: "google", medium: "cpc" },
  { key: "whatsapp", label: "واتساب", source: "whatsapp", medium: "chat" },
  { key: "custom", label: "مخصص", source: "", medium: "" },
];

const input =
  "w-full min-h-[48px] rounded-xl border border-slate-300 bg-white px-3.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500";

/** UTM values: lowercase letters/digits/_-. only, so a pasted name cannot break the URL. */
const clean = (v: string) => v.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9؀-ۿ_.\-]/g, "").slice(0, 80);

export default function AdLinksPage() {
  const [products, setProducts] = useState<Prod[]>([]);
  const [base, setBase] = useState("");
  const [loading, setLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [direct, setDirect] = useState(false);
  const [platform, setPlatform] = useState("facebook");
  const [source, setSource] = useState("facebook");
  const [medium, setMedium] = useState("paid_social");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [metaMacros, setMetaMacros] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, s] = await Promise.all([fetch("/api/products").then((r) => r.json()), fetch("/api/settings").then((r) => r.json())]);
        const list: Prod[] = (p.products || []).filter((x: Prod) => x.status === "active");
        setProducts(list);
        if (list[0]) setProductId(list[0].id);
        const site = String(s.settings?.site_domain || "").replace(/\/+$/, "");
        setBase(site || window.location.origin);
      } catch {
        setBase(window.location.origin);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const product = products.find((x) => x.id === productId);
  const isMeta = platform === "facebook" || platform === "instagram";

  const url = useMemo(() => {
    if (!product) return "";
    const params: string[] = [];
    if (offerId) params.push(`offer=${encodeURIComponent(offerId)}`);
    if (direct) params.push("go=checkout");
    if (clean(source)) params.push(`utm_source=${encodeURIComponent(clean(source))}`);
    if (clean(medium)) params.push(`utm_medium=${encodeURIComponent(clean(medium))}`);
    if (isMeta && metaMacros) {
      // Meta replaces these macros with the real names: they must stay literal (not URL-encoded)
      params.push("utm_campaign={{campaign.name}}", "utm_content={{ad.name}}", "utm_term={{adset.name}}");
    } else {
      if (clean(campaign)) params.push(`utm_campaign=${encodeURIComponent(clean(campaign))}`);
      if (clean(content)) params.push(`utm_content=${encodeURIComponent(clean(content))}`);
    }
    return `${base}/p/${encodeURIComponent(product.slug)}${params.length ? "?" + params.join("&") : ""}`;
  }, [product, offerId, direct, source, medium, campaign, content, isMeta, metaMacros, base]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const pickPlatform = (key: string) => {
    const p = PLATFORMS.find((x) => x.key === key)!;
    setPlatform(key);
    if (key !== "custom") {
      setSource(p.source);
      setMedium(p.medium);
    }
  };

  const card = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-5";
  const label = "block text-sm font-black text-slate-900 mb-1.5";

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center text-slate-500" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 space-y-5" dir="rtl">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Link2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-heading text-slate-950">روابط الإعلانات</h1>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            اعمل رابط جاهز لإعلانك: بيفتح صفحة المنتج (أو عرض معيّن أو الفورم مباشرة)، ومعاه علامات تتبع عشان تعرف كل طلب جه من أنهي حملة.
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-500">مفيش منتجات نشطة لسه. ضيف منتج الأول.</p>
      ) : (
        <>
          <section className={card}>
            <div>
              <label className={label} htmlFor="lk-prod">المنتج</label>
              <select
                id="lk-prod"
                className={input}
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setOfferId("");
                }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title_ar}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={label} htmlFor="lk-offer">العرض اللي يتحدد تلقائيًا</label>
              <select id="lk-offer" className={input} value={offerId} onChange={(e) => setOfferId(e.target.value)}>
                <option value="">من غير تحديد (العميل يختار)</option>
                {(product?.offers || []).map((o) => (
                  <option key={o.id} value={o.id}>{o.title_ar} — {o.price} ج.م</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2.5 min-h-[44px] text-sm font-bold text-slate-800 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 accent-emerald-600" checked={direct} onChange={(e) => setDirect(e.target.checked)} />
              افتح على فورم الطلب مباشرة
            </label>
          </section>

          <section className={card}>
            <div>
              <p className={label}>المنصة</p>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => pickPlatform(p.key)}
                    aria-pressed={platform === p.key}
                    className={`min-h-[44px] px-4 rounded-xl text-sm font-bold border cursor-pointer transition ${
                      platform === p.key ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="lk-src">المصدر (utm_source)</label>
                <input id="lk-src" dir="ltr" className={input + " font-mono"} value={source} onChange={(e) => setSource(e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="lk-med">الوسيلة (utm_medium)</label>
                <input id="lk-med" dir="ltr" className={input + " font-mono"} value={medium} onChange={(e) => setMedium(e.target.value)} />
              </div>
            </div>

            {isMeta && (
              <label className="flex items-start gap-2.5 min-h-[44px] text-sm text-slate-800 cursor-pointer">
                <input type="checkbox" className="w-5 h-5 accent-emerald-600 mt-0.5" checked={metaMacros} onChange={(e) => setMetaMacros(e.target.checked)} />
                <span>
                  <strong>استخدم متغيرات فيسبوك التلقائية</strong>
                  <span className="block text-xs text-slate-500 leading-relaxed mt-0.5">
                    فيسبوك بيحط اسم الحملة والإعلان والمجموعة تلقائيًا في كل نقرة، فمش محتاج تكتبهم.
                  </span>
                </span>
              </label>
            )}

            {!(isMeta && metaMacros) && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className={label} htmlFor="lk-camp">اسم الحملة (utm_campaign)</label>
                  <input id="lk-camp" dir="ltr" className={input + " font-mono"} value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="ramadan_offer" />
                </div>
                <div>
                  <label className={label} htmlFor="lk-cont">الإعلان (utm_content)</label>
                  <input id="lk-cont" dir="ltr" className={input + " font-mono"} value={content} onChange={(e) => setContent(e.target.value)} placeholder="video_1" />
                </div>
              </div>
            )}
          </section>

          <section className={card} aria-label="الرابط الناتج">
            <p className={label}>رابط إعلانك</p>
            <code dir="ltr" className="block rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs font-mono text-slate-900 break-all leading-relaxed">{url}</code>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copy}
                className="min-h-[48px] px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "تم النسخ" : "نسخ الرابط"}
              </button>
              <a
                href={url.replace(/\{\{[^}]*\}\}/g, "test")}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[48px] px-5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-800 hover:bg-slate-50 flex items-center"
              >
                افتح للتجربة
              </a>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              العلامات دي بتتسجل مع كل طلب، وبتشوفها في تفاصيل الطلب. لازم تحط الرابط ده في خانة «الرابط/Website URL» في الإعلان.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
