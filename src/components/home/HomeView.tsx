"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Star,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Sparkles,
  BadgePercent,
  Check,
  X,
  HelpCircle,
  HeartHandshake,
} from "lucide-react";
import { useBrand } from "@/components/brand/BrandProvider";
import { useLang } from "@/components/i18n/LangProvider";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { EText, EImage } from "@/components/editor/Editable";
import { useEdit } from "@/components/editor/EditContext";
import { ERemove, EAdd } from "@/components/editor/EditTools";
import type { HomeContent, HomeSection } from "@/lib/home-content";

export interface HomeProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  compare_at_price: number;
  landingSlug: string;
  discountPercentage: number;
}
export interface HomeReview {
  name: string;
  place?: string;
  comment: string;
  rating?: number;
}

const TRUST_ICONS = [ShieldCheck, Truck, RotateCcw, Headphones];
const TRUST_TINTS = ["bg-orange-50 text-orange-600", "bg-blue-50 text-blue-600", "bg-amber-50 text-amber-600", "bg-purple-50 text-purple-600"];
const FEATURE_TINTS = ["bg-emerald-100 text-orange-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700"];
const FEATURE_ICONS = [ShieldCheck, Truck, RotateCcw];

// Links do nothing inside the editor
function Lk({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const { editMode } = useEdit();
  return editMode ? <span className={className}>{children}</span> : <Link prefetch={false} href={href} className={className}>{children}</Link>;
}
function Anchor({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const { editMode } = useEdit();
  return editMode ? <span className={className}>{children}</span> : <a href={href} className={className}>{children}</a>;
}
/** A removable section: the red × hides it (it can be shown again from the side panel). */
function SectionX({ id }: { id: HomeSection }) {
  const { setField } = useEdit();
  const { lang } = useLang();
  return <ERemove onRemove={() => setField(`hide.${id}`, true)} label={lang === "en" ? "Delete section" : "حذف القسم"} className="!top-3 !start-3" />;
}

/**
 * The store's home page. ONE component for the public site and for the live editor: in the editor every text is
 * editable in place (EText) and elements get a red × (delete) / "+" (add); on the public site it renders plain markup.
 */
export function HomeView({ hc, products, reviews, adminLink = true }: { hc: HomeContent; products: HomeProduct[]; reviews: HomeReview[]; adminLink?: boolean }) {
  const brand = useBrand();
  const { lang, t } = useLang();
  const { editMode, setField } = useEdit();
  const en = lang === "en";
  const L = (ar: string, e: string) => (en ? e : ar);
  const cur = t("currency");
  const brandName = brand.store_name;
  const hide = hc.hide || {};
  const sectionTitle = "text-2xl sm:text-4xl font-black font-heading text-slate-900";
  const badgeCls = "inline-flex items-center gap-1.5 text-xs font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200";

  const removeAt = <T,>(key: string, list: T[], i: number) => setField(key, list.filter((_, k) => k !== i));
  const addTo = <T,>(key: string, list: T[], item: T) => setField(key, [...list, item]);
  const newText = L("نص جديد", "New text");

  /** A single optional text: shown with a × when it has text, or a "+ add" when it was removed (editor only). */
  const optional = (field: keyof HomeContent, node: React.ReactNode, addLabel: string, fallbackText: string) => {
    const v = hc[field] as string;
    if (v) {
      return (
        <div className="relative inline-block max-w-full">
          {node}
          <ERemove onRemove={() => setField(field as string, "")} />
        </div>
      );
    }
    return editMode ? <EAdd onAdd={() => setField(field as string, fallbackText)} label={addLabel} /> : null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white font-sans">
      {/* Header */}
      <header className={`${editMode ? "" : "sticky top-0 z-40"} bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
          <Lk href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-tr from-slate-950 to-indigo-900 text-white font-black text-2xl flex items-center justify-center shadow-lg overflow-hidden">
              {brand.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo_url} alt={brandName} className="w-full h-full p-1 object-contain rounded-xl bg-white" />
              ) : (
                (brandName || "M").trim().charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xl sm:text-2xl font-black font-heading text-slate-900 tracking-tight block truncate">{brandName}</span>
              <EText field="tagline" value={hc.tagline} as="span" className="text-[11px] font-bold text-gray-500 block -mt-0.5 truncate" />
            </div>
          </Lk>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <Anchor href="#products" className="hover:text-orange-600 transition">{L("المنتجات والعروض", "Products & offers")}</Anchor>
            {!hide.features && <Anchor href="#features" className="hover:text-orange-600 transition">{L("لماذا نحن", "Why us")}</Anchor>}
            {!hide.faq && <Anchor href="#faq" className="hover:text-orange-600 transition">{L("الأسئلة الشائعة", "FAQ")}</Anchor>}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {!editMode && <LanguageSwitcher />}
            <Anchor href="#products" className="py-2.5 px-4 sm:px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 transition">
              <ShoppingBag className="w-4 h-4" />
              <span>{L("تصفح المنتجات", "Browse products")}</span>
            </Anchor>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-orange-50/20 py-16 md:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {optional(
              "hero_badge",
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs md:text-sm font-extrabold border border-emerald-200">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <EText field="hero_badge" value={hc.hero_badge} as="span" />
              </div>,
              L("إضافة شارة", "Add badge"),
              L("منتجات عصرية وذكية تثق فيها", "Smart, modern products you can trust")
            )}

            {hc.hero_image ? (
              <div className="relative mx-auto w-full max-w-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hc.hero_image} alt={brandName} className="mx-auto w-full max-h-80 object-contain rounded-3xl" />
                <EImage field="hero_image" value={hc.hero_image} label={L("تغيير الصورة", "Change image")} />
                <ERemove onRemove={() => setField("hero_image", "")} label={L("حذف الصورة", "Remove image")} />
              </div>
            ) : (
              editMode && (
                <div className="relative mx-auto w-full max-w-xl h-28 rounded-3xl border-2 border-dashed border-sky-300 flex items-center justify-center text-sky-700 text-sm font-bold">
                  {L("أضف صورة للصفحة", "Add an image")}
                  <EImage field="hero_image" value="" label={L("إضافة صورة", "Add image")} />
                </div>
              )
            )}

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-heading text-slate-900 leading-tight tracking-tight">
              <EText field="hero_title" value={hc.hero_title} as="span" />
              {hc.hero_highlight ? (
                <>
                  {" "}
                  <span className="relative inline-block max-w-full">
                    <EText field="hero_highlight" value={hc.hero_highlight} as="span" className="bg-gradient-to-r from-slate-950 via-indigo-950 to-orange-600 bg-clip-text text-transparent" />
                    <ERemove onRemove={() => setField("hero_highlight", "")} />
                  </span>
                </>
              ) : editMode ? (
                <>
                  {" "}
                  <EAdd onAdd={() => setField("hero_highlight", L("بأعلى جودة", "at the best quality"))} label={L("إضافة جزء ملوّن", "Add highlighted part")} />
                </>
              ) : null}
            </h1>

            {hc.hero_text || editMode ? (
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
                <EText field="hero_text" value={hc.hero_text} multiline as="span" />
              </p>
            ) : null}

            {optional(
              "hero_cta",
              <span className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition">
                <ShoppingBag className="w-5 h-5" />
                <EText field="hero_cta" value={hc.hero_cta} as="span" />
              </span>,
              L("إضافة زرار", "Add button"),
              L("شاهد منتجاتنا وعروضنا", "See our products and offers")
            )}

            {!hide.trust && (hc.trust.length > 0 || editMode) && (
              <div className="relative">
                <SectionX id="trust" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-start">
                  {hc.trust.map((tr, i) => {
                    const Icon = TRUST_ICONS[i % 4];
                    return (
                      <div key={i} className="relative bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${TRUST_TINTS[i % 4]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <EText field={`trust.${i}.title`} value={tr.title} as="h4" className="text-xs font-black text-slate-900" />
                          <EText field={`trust.${i}.desc`} value={tr.desc} as="p" className="text-[11px] text-gray-500" />
                        </div>
                        <ERemove onRemove={() => removeAt("trust", hc.trust, i)} />
                      </div>
                    );
                  })}
                </div>
                {hc.trust.length < 4 && <EAdd onAdd={() => addTo("trust", hc.trust, { title: newText, desc: newText })} label={L("إضافة مربع", "Add box")} className="mt-3" />}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          {optional(
            "products_badge",
            <div className={badgeCls}>
              <BadgePercent className="w-4 h-4" /> <EText field="products_badge" value={hc.products_badge} as="span" />
            </div>,
            L("إضافة شارة", "Add badge"),
            L("العروض والمنتجات المتاحة الآن", "Offers and products available now")
          )}
          <EText field="products_title" value={hc.products_title} as="h2" className={sectionTitle} />
          {hc.products_sub || editMode ? <EText field="products_sub" value={hc.products_sub} multiline as="p" className="text-sm text-gray-600" /> : null}
        </div>

        {products.length === 0 && editMode && (
          <p className="text-center text-sm font-bold text-slate-500 border-2 border-dashed border-slate-300 rounded-2xl p-8">
            {L("هنا بتظهر منتجاتك النشطة. أضف منتج من صفحة المنتجات.", "Your active products show here. Add a product from the Products page.")}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-3xl border border-gray-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group">
              <div className="relative w-full h-64 sm:h-72 bg-slate-100 overflow-hidden">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                )}
                {p.discountPercentage > 0 && (
                  <span className="absolute top-3 end-3 px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs shadow-md">
                    {L("خصم", "Save")} {p.discountPercentage}%
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-orange-600 transition">{p.title}</h3>
                  {p.description && <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{p.description}</p>}
                </div>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    {p.compare_at_price ? <span className="text-xs text-gray-400 block line-through">{p.compare_at_price} {cur}</span> : null}
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-heading text-orange-600">{p.price}</span>
                      <span className="text-xs font-bold text-gray-600">{cur}</span>
                    </div>
                  </div>
                  <Lk href={`/p/${p.landingSlug}`} className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center gap-2">
                    <span>{L("اطلب الآن", "Order now")}</span>
                    <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </Lk>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      {!hide.features && (hc.features.length > 0 || editMode) && (
        <section id="features" className="relative py-20 bg-white border-y border-gray-200">
          <SectionX id="features" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              {optional("features_badge", <span className={badgeCls}><EText field="features_badge" value={hc.features_badge} as="span" /></span>, L("إضافة شارة", "Add badge"), L("ضماناتنا", "Our guarantees"))}
              <EText field="features_title" value={hc.features_title} as="h2" className={sectionTitle} />
              {hc.features_sub || editMode ? <EText field="features_sub" value={hc.features_sub} multiline as="p" className="text-sm text-gray-600" /> : null}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {hc.features.map((f, i) => {
                const Icon = FEATURE_ICONS[i % 3];
                return (
                  <div key={i} className="relative bg-slate-50 p-8 rounded-3xl border border-gray-200 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${FEATURE_TINTS[i % 3]}`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <EText field={`features.${i}.title`} value={f.title} as="h3" className="text-lg font-black font-heading text-slate-900" />
                    <EText field={`features.${i}.desc`} value={f.desc} multiline as="p" className="text-sm text-gray-600 leading-relaxed" />
                    <ERemove onRemove={() => removeAt("features", hc.features, i)} />
                  </div>
                );
              })}
            </div>
            {hc.features.length < 3 && <EAdd onAdd={() => addTo("features", hc.features, { title: newText, desc: newText })} label={L("إضافة ضمان", "Add guarantee")} className="mt-4" />}
          </div>
        </section>
      )}

      {/* Comparison */}
      {!hide.compare && (hc.compare_old.length > 0 || hc.compare_new.length > 0 || editMode) && (
        <section className="relative py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionX id="compare" />
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            {optional("compare_badge", <span className={badgeCls}><EText field="compare_badge" value={hc.compare_badge} as="span" /></span>, L("إضافة شارة", "Add badge"), L("المقارنة الحقيقية", "The real comparison"))}
            <EText field="compare_title" value={hc.compare_title} as="h2" className={sectionTitle} />
            {hc.compare_sub || editMode ? <EText field="compare_sub" value={hc.compare_sub} multiline as="p" className="text-sm text-gray-600" /> : null}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-red-200 shadow-sm space-y-4">
              <h3 className="font-black font-heading text-red-700 flex items-center gap-2">
                <X className="w-5 h-5" /> <EText field="compare_old_title" value={hc.compare_old_title} as="span" />
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {hc.compare_old.map((pt, i) => (
                  <li key={i} className="relative flex items-start gap-2">
                    <X className="w-4 h-4 text-red-500 mt-1 shrink-0" />
                    <EText field={`compare_old.${i}`} value={pt} multiline as="span" />
                    <ERemove onRemove={() => removeAt("compare_old", hc.compare_old, i)} />
                  </li>
                ))}
              </ul>
              {hc.compare_old.length < 6 && <EAdd onAdd={() => addTo("compare_old", hc.compare_old, newText)} label={L("إضافة نقطة", "Add point")} />}
            </div>
            <div className="bg-white p-6 rounded-3xl border-2 border-emerald-300 shadow-md space-y-4">
              <h3 className="font-black font-heading text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> <EText field="compare_new_title" value={hc.compare_new_title} as="span" />
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
                {hc.compare_new.map((pt, i) => (
                  <li key={i} className="relative flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                    <EText field={`compare_new.${i}`} value={pt} multiline as="span" />
                    <ERemove onRemove={() => removeAt("compare_new", hc.compare_new, i)} />
                  </li>
                ))}
              </ul>
              {hc.compare_new.length < 6 && <EAdd onAdd={() => addTo("compare_new", hc.compare_new, newText)} label={L("إضافة نقطة", "Add point")} />}
            </div>
          </div>
        </section>
      )}

      {/* Steps */}
      {!hide.steps && (hc.steps.length > 0 || editMode) && (
        <section className="relative py-20 bg-white border-y border-gray-200">
          <SectionX id="steps" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              {optional("steps_badge", <span className={badgeCls}><EText field="steps_badge" value={hc.steps_badge} as="span" /></span>, L("إضافة شارة", "Add badge"), L("تجربة تسوق مريحة", "A comfortable shopping experience"))}
              <EText field="steps_title" value={hc.steps_title} as="h2" className={sectionTitle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {hc.steps.map((s, i) => (
                <div key={i} className="relative bg-slate-50 p-6 rounded-3xl border border-gray-200 shadow-sm text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 text-white font-black text-lg flex items-center justify-center">{i + 1}</div>
                  <EText field={`steps.${i}.title`} value={s.title} as="h3" className="font-heading font-black text-base text-slate-900" />
                  <EText field={`steps.${i}.desc`} value={s.desc} multiline as="p" className="text-xs text-gray-500 leading-relaxed" />
                  <ERemove onRemove={() => removeAt("steps", hc.steps, i)} />
                </div>
              ))}
            </div>
            {hc.steps.length < 3 && <EAdd onAdd={() => addTo("steps", hc.steps, { title: newText, desc: newText })} label={L("إضافة خطوة", "Add step")} />}
          </div>
        </section>
      )}

      {/* Warranty */}
      {!hide.warranty && (hc.warranty_title || editMode) && (
        <section className="relative py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionX id="warranty" />
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 shadow-lg text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <EText field="warranty_title" value={hc.warranty_title} as="h2" className="text-2xl sm:text-3xl font-black font-heading text-slate-900" />
            {hc.warranty_text || editMode ? <EText field="warranty_text" value={hc.warranty_text} multiline as="p" className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl mx-auto" /> : null}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-emerald-800">
              {hc.warranty_chips.map((c, i) => (
                <span key={i} className="relative px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                  <EText field={`warranty_chips.${i}`} value={c} as="span" />
                  <ERemove onRemove={() => removeAt("warranty_chips", hc.warranty_chips, i)} className="!-top-3 !w-6 !h-6" />
                </span>
              ))}
              {hc.warranty_chips.length < 4 && <EAdd onAdd={() => addTo("warranty_chips", hc.warranty_chips, "✓ " + newText)} label={L("إضافة", "Add")} />}
            </div>
          </div>
        </section>
      )}

      {/* Customer reviews (written in Settings > Store) */}
      {!hide.reviews && reviews.length > 0 && (
        <section id="reviews" className="relative py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionX id="reviews" />
          <div className="text-center space-y-3 mb-12">
            <EText field="reviews_title" value={hc.reviews_title} as="h2" className={sectionTitle} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-1 text-amber-400" aria-label={`${r.rating || 5} / 5`}>
                  {[...Array(5)].map((_, k) => (
                    <Star key={k} className={`w-4 h-4 ${k < (r.rating || 5) ? "fill-amber-400" : "text-slate-300"}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">"{r.comment}"</p>
                <div className="pt-4 border-t border-gray-100">
                  <span className="font-bold text-sm text-slate-900 block">{r.name}</span>
                  {r.place && <span className="text-xs text-gray-500">{r.place}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {!hide.faq && (hc.faq.length > 0 || editMode) && (
        <section id="faq" className="relative py-20 bg-white border-t border-gray-200">
          <SectionX id="faq" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center space-y-3">
              {optional("faq_badge", <span className={badgeCls}><HelpCircle className="w-4 h-4" /> <EText field="faq_badge" value={hc.faq_badge} as="span" /></span>, L("إضافة شارة", "Add badge"), L("إجابات سريعة", "Quick answers"))}
              <EText field="faq_title" value={hc.faq_title} as="h2" className={sectionTitle} />
            </div>
            <div className="space-y-4">
              {hc.faq.map((f, i) => (
                <div key={i} className="relative p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
                  <EText field={`faq.${i}.q`} value={f.q} as="h3" className="font-heading font-black text-slate-900" />
                  <EText field={`faq.${i}.a`} value={f.a} multiline as="p" className="text-sm text-gray-700 leading-relaxed" />
                  <ERemove onRemove={() => removeAt("faq", hc.faq, i)} />
                </div>
              ))}
              {hc.faq.length < 8 && <EAdd onAdd={() => addTo("faq", hc.faq, { q: L("سؤال جديد؟", "New question?"), a: L("الإجابة هنا", "Answer here") })} label={L("إضافة سؤال", "Add question")} />}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center overflow-hidden">
                {brand.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brand.logo_url} alt={brandName} className="w-full h-full p-1 object-contain rounded-xl bg-white" />
                ) : (
                  (brandName || "M").trim().charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <span className="font-black font-heading text-xl text-white">{brandName}</span>
                {hc.footer_text || editMode ? <EText field="footer_text" value={hc.footer_text} as="p" className="text-xs text-slate-400" /> : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 font-bold">
              {hc.footer_chips.map((c, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>•</span>}
                  <span className="relative">
                    <EText field={`footer_chips.${i}`} value={c} as="span" />
                    <ERemove onRemove={() => removeAt("footer_chips", hc.footer_chips, i)} className="!-top-3 !w-6 !h-6" />
                  </span>
                </React.Fragment>
              ))}
              {hc.footer_chips.length < 4 && <EAdd onAdd={() => addTo("footer_chips", hc.footer_chips, newText)} label={L("إضافة", "Add")} />}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>
              © {new Date().getFullYear()} {brandName}. {L("جميع الحقوق محفوظة.", "All rights reserved.")}
            </p>
            <div className="flex items-center gap-4">
              <Lk href="/policy" className="text-slate-400 hover:text-white transition text-xs font-bold">
                {L("سياسة الاستبدال والاسترجاع", "Exchange & return policy")}
              </Lk>
              {adminLink && (
                <>
                  <span className="text-slate-700">•</span>
                  <Lk href="/admin" className="text-slate-600 hover:text-slate-400 flex items-center gap-1 transition text-[11px]">
                    <Lock className="w-3 h-3" />
                    <span>{L("لوحة التحكم", "Dashboard")}</span>
                  </Lk>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
