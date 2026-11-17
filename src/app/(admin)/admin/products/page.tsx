"use client";

import { Toast } from "../_components/toast";
import { useConfirm } from "../_components/confirm";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/components/brand/BrandProvider";
import OffersPanel from "@/components/editor/OffersPanel";
import DescriptionAiHelper from "@/components/admin/DescriptionAiHelper";
import { sanitizeProductOptions, MAX_OPTIONS } from "@/lib/product-options";
import { buildDefaultOffers, sanitizeOffers, singleBaseOffer } from "@/lib/offers";
import { ImageGalleryEditor } from "@/components/admin/ImageUploader";
import TablePagination from "@/components/admin/TablePagination";
import { Product, ProductOffer } from "@/types";
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Package,
  Sparkles,
  X,
  Layers,
  Search,
  Copy,
  AlertCircle,
  RefreshCw,
  Eye,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export default function AdminProductsPage() {
  const router = useRouter();
  const confirmAsk = useConfirm();
  const brand = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skuQuery, setSkuQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState<number | string>("");
  const [comparePrice, setComparePrice] = useState<number | string>("");
  const [costPrice, setCostPrice] = useState<number | string>("");
  const [stock, setStock] = useState<number | string>(100);
  const [images, setImages] = useState<string[]>([]);
  const [descriptionAr, setDescriptionAr] = useState("");
  const [productActive, setProductActive] = useState(true);
  const [upsellOpen, setUpsellOpen] = useState(false);
  // Quantity offers (Upsell) on/off. Off = the page sells ONE piece at the base price with a plain form (no package boxes).
  const [upsellEnabled, setUpsellEnabled] = useState(false);
  // Questions & answers the store chat uses on this product's page (stored in settings.chat_products[id])
  // Color / size ... (values typed separated by commas)
  const [optionRows, setOptionRows] = useState<{ name: string; values: string }[]>([]);
  const [chatFaq, setChatFaq] = useState<{ q: string; keywords: string; answer: string }[]>([]);
  const [allChatFaq, setAllChatFaq] = useState<Record<string, any[]>>({});
  // This product's own shipping fee (empty = the store's governorate / default fee). Kept in settings.shipping_config.product_fees.
  const [shipCfg, setShipCfg] = useState<any>(null);
  const [productShipFee, setProductShipFee] = useState("");
  // Quantity tiers. Until the merchant touches them they follow the price (defaults).
  const [offers, setOffers] = useState<ProductOffer[]>([]);
  const [offersTouched, setOffersTouched] = useState(false);
  const effectiveOffers: ProductOffer[] = offersTouched
    ? offers
    : buildDefaultOffers({
        id: editingProduct?.id || "",
        base_price: Number(basePrice) || 0,
        compare_at_price: Number(comparePrice) || 0,
      });

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success && json.products) {
        setProducts(json.products);
      }
    } catch (err) {
      console.error("[Fetch Products Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setTitleAr("");
    setSlug("");
    setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    setBasePrice("");
    setComparePrice("");
    setCostPrice("");
    setStock(100);
    setImages([]);
    setDescriptionAr("");
    setProductActive(true);
    setOffers([]);
    setOffersTouched(false);
    setUpsellOpen(false);
    setUpsellEnabled(false);
    setOptionRows([]);
    setChatFaq([]);
    setProductShipFee("");
    loadChatFaq();
    setIsModalOpen(true);
  };

  const loadChatFaq = async () => {
    try {
      const j = await (await fetch("/api/settings")).json();
      const all = (j?.settings?.chat_products || {}) as Record<string, any[]>;
      setAllChatFaq(all);
      // A store that never opened the shipping settings has no saved config yet: start from an empty one (otherwise the fee field stays locked)
      const ship = j?.settings?.shipping_config || { default_fee: 0, free_over: 0, min_order: 0, product_fees: {}, governorate_fees: {} };
      setShipCfg(ship);
      return { all, ship };
    } catch {
      return { all: {} as Record<string, any[]>, ship: null };
    }
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setOptionRows(sanitizeProductOptions((prod as any).options).map((o) => ({ name: o.name, values: o.values.join("، ") })));
    setChatFaq([]);
    setProductShipFee("");
    loadChatFaq().then(({ all, ship }) => {
      setChatFaq((all[prod.id] || []).map((x: any) => ({ q: x.q, keywords: (x.keywords || []).join("، "), answer: x.answer })));
      const fee = ship?.product_fees?.[prod.id];
      setProductShipFee(fee === undefined || fee === null ? "" : String(fee));
    });
    setTitleAr(prod.title_ar || "");
    setSlug(prod.slug || "");
    setSku(prod.sku || "");
    setBasePrice(prod.base_price || 0);
    setComparePrice(prod.compare_at_price || 0);
    setCostPrice(prod.cost_price || 0);
    setStock(prod.stock_quantity || 100);
    setImages(prod.images || []);
    setDescriptionAr(prod.description_ar || "");
    setProductActive(prod.status === "active");
    const saved = prod.offers && prod.offers.length > 0;
    setOffers(saved ? JSON.parse(JSON.stringify(prod.offers)) : []);
    setOffersTouched(!!saved);
    setUpsellEnabled(Boolean(prod.offers && prod.offers.length > 1));
    setUpsellOpen(false);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!await confirmAsk({ title: "حذف المنتج", message: `هتحذف المنتج "${prod.title_ar}" وصفحة الهبوط المرتبطة بيه. مش هتقدر ترجّعهم.` })) return;

    setDeletingId(prod.id);
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(prod.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        setAlertMessage({ type: "success", text: `تم حذف المنتج "${prod.title_ar}" بنجاح!` });
        setTimeout(() => setAlertMessage(null), 4000);
      } else {
        alert(data.error || "تعذر حذف المنتج");
      }
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(Number(basePrice) > 0)) {
      alert("اكتب سعر البيع أولاً");
      return;
    }
    setIsSubmitting(true);

    try {
      const numBase = Number(basePrice) || 0;
      const numCompare = Number(comparePrice) || Math.round(numBase * 1.45);
      const numCost = Number(costPrice) || 0;
      const numStock = Number(stock) || 50;

      // Offers: what the merchant edited, or defaults derived from the price (see lib/offers.ts)
      const finalOffers = !upsellEnabled || effectiveOffers.length === 0 ? singleBaseOffer({ id: editingProduct?.id || "", base_price: Number(basePrice) || 0, compare_at_price: Number(comparePrice) || 0 }) : sanitizeOffers(editingProduct?.id || "", effectiveOffers);
      if (finalOffers.some((o) => !(o.price > 0))) {
        alert("سعر كل عرض لازم يكون أكبر من صفر");
        setIsSubmitting(false);
        return;
      }

      const cleanSlug = (slug || titleAr)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF\-_]/g, "-")
        .replace(/-+/g, "-");

      const imagesArray = images.length > 0 ? images : ["/images/hero-organizer.jpg"];

      const payload = {
        id: editingProduct?.id,
        title_ar: titleAr.trim(),
        title_en: editingProduct?.title_en || "",
        slug: cleanSlug,
        sku: sku.trim().toUpperCase(),
        base_price: numBase,
        compare_at_price: numCompare,
        cost_price: numCost,
        stock_quantity: numStock,
        description_ar: descriptionAr.trim(),
        status: productActive ? "active" : "draft",
        images: imagesArray,
        offers: finalOffers,
        options: sanitizeProductOptions(optionRows),
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        const pid = data.product?.id || editingProduct?.id;
        if (pid) {
          const next = { ...allChatFaq };
          if (chatFaq.some((f) => f.q.trim() && f.answer.trim())) next[pid] = chatFaq as any;
          else delete next[pid];
          fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
              chat_products: next,
              ...(shipCfg
                ? {
                    shipping_config: {
                      ...shipCfg,
                      product_fees: (() => {
                        const fees = { ...(shipCfg.product_fees || {}) };
                        if (productShipFee.trim() === "") delete fees[pid];
                        else fees[pid] = Math.max(0, Math.round(Number(productShipFee) || 0));
                        return fees;
                      })(),
                    },
                  }
                : {}),
            }),
          }).catch(() => {});
        }
        setIsModalOpen(false);
        // New product in landing-page mode: go straight to the live editor of its page.
        if (!editingProduct && data.landing_page_id) {
          router.push(`/admin/landing-pages/${data.landing_page_id}/edit`);
          return;
        }
        setAlertMessage({
          type: "success",
          text: editingProduct
            ? `تم تحديث المنتج "${payload.title_ar}" والأسعار بنجاح!`
            : `تم إضافة المنتج "${payload.title_ar}" وتوليد صفحة الهبوط فوراً!`,
        });
        setTimeout(() => setAlertMessage(null), 4000);
        fetchProducts();
      } else {
        alert(data.error || "حدث خطأ أثناء حفظ المنتج");
      }
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateProduct = async (prod: Product) => {
    if (duplicatingId) return;
    setDuplicatingId(prod.id);
    try {
      const takenSlugs = new Set(products.map((p) => p.slug));
      const takenSkus = new Set(products.map((p) => (p.sku || "").toUpperCase()));
      const baseSlug = `${prod.slug}-copy`;
      let newSlug = baseSlug;
      let n = 2;
      while (takenSlugs.has(newSlug)) newSlug = `${baseSlug}-${n++}`;
      const baseSku = `${prod.sku || "SKU"}-COPY`.toUpperCase();
      let newSku = baseSku;
      let m = 2;
      while (takenSkus.has(newSku)) newSku = `${baseSku}-${m++}`;

      const stamp = Date.now();
      const payload = {
        // no id: the store generates a fresh one
        title_ar: `${prod.title_ar} (نسخة)`,
        title_en: prod.title_en || "",
        slug: newSlug,
        sku: newSku,
        base_price: prod.base_price,
        compare_at_price: prod.compare_at_price,
        cost_price: prod.cost_price,
        stock_quantity: prod.stock_quantity,
        description_ar: prod.description_ar,
        status: "draft",
        images: prod.images || [],
        offers: (prod.offers || []).map((o, i) => ({ ...o, id: `off-${stamp}-${i + 1}`, product_id: "" })),
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage({ type: "success", text: `تم إنشاء نسخة "${payload.title_ar}" (مخفية حتى تفعّلها)` });
        setTimeout(() => setAlertMessage(null), 4000);
        await fetchProducts();
      } else {
        setAlertMessage({ type: "error", text: data.error || "تعذر استنساخ المنتج" });
        setTimeout(() => setAlertMessage(null), 4000);
      }
    } catch {
      setAlertMessage({ type: "error", text: "تعذر استنساخ المنتج" });
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setDuplicatingId(null);
    }
  };

  const toggleOne = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const flashMsg = (type: "success" | "error", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 4000);
  };

  const bulkDelete = async () => {
    if (selected.length === 0 || bulkBusy) return;
    if (!await confirmAsk({ title: "مسح المنتجات", message: `هتمسح ${selected.length} منتج مع صفحات الهبوط بتاعتهم. مش هتقدر ترجّعهم.` })) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      const j = await res.json();
      if (j.success) {
        setProducts((prev) => prev.filter((x) => !selected.includes(x.id)));
        setSelected([]);
        flashMsg("success", `تم مسح ${j.deleted} منتج`);
      } else flashMsg("error", j.error || "تعذر المسح");
    } finally {
      setBulkBusy(false);
    }
  };

  const bulkStatus = async (status: "active" | "draft") => {
    if (selected.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status }),
      });
      const j = await res.json();
      if (j.success) {
        setProducts((prev) => prev.map((x) => (selected.includes(x.id) ? { ...x, status } : x)));
        setSelected([]);
        flashMsg("success", status === "active" ? `اتفعّل ${j.updated} منتج` : `اتخبّى ${j.updated} منتج`);
      } else flashMsg("error", j.error || "تعذر التحديث");
    } finally {
      setBulkBusy(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const nameQ = searchQuery.trim().toLowerCase();
    const skuQ = skuQuery.trim().toLowerCase();
    if (nameQ && !(p.title_ar?.toLowerCase().includes(nameQ) || p.title_en?.toLowerCase().includes(nameQ))) return false;
    if (skuQ && !(p.sku?.toLowerCase().includes(skuQ) || p.slug?.toLowerCase().includes(skuQ))) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  };

  const cardCls = "bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 space-y-4";
  const cardTitle = "text-base font-black text-slate-950 font-heading";
  const lbl = "block text-sm font-bold text-slate-800 mb-1.5";
  const inputCls =
    "w-full min-h-[48px] px-3.5 rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-orange-500 text-sm text-slate-900";

  const iconBtn =
    "w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const thumb = (prod: Product) => (
    <div className="relative w-11 h-11 shrink-0 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
      {prod.images?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={prod.images[0]}
          alt=""
          width={44}
          height={44}
          className="w-full h-full object-cover"
          onError={(e: any) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <Package className="w-5 h-5 text-slate-400" />
      )}
    </div>
  );

  const statusPill = (prod: Product) => (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
        prod.status === "active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
      }`}
    >
      {prod.status === "active" ? "نشط" : "مخفي"}
    </span>
  );

  const priceCell = (prod: Product) => (
    <span className="inline-flex items-baseline gap-1.5 font-mono">
      <span className="font-black text-slate-900">{prod.base_price} ج.م</span>
      {!!prod.compare_at_price && prod.compare_at_price > prod.base_price && (
        <span className="text-xs text-slate-400 line-through">{prod.compare_at_price}</span>
      )}
    </span>
  );

  const actions = (prod: Product) => (
    <div className="flex items-center gap-1 justify-end">
      <button
        type="button"
        onClick={() => openEditModal(prod)}
        className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        title="تعديل"
        aria-label="تعديل"
      >
        <Edit3 className="w-4 h-4" />
        <span>تعديل</span>
      </button>
      <button
        type="button"
        onClick={() => handleDuplicateProduct(prod)}
        disabled={duplicatingId === prod.id}
        className={iconBtn}
        title="استنساخ"
        aria-label="استنساخ"
      >
        <Copy className="w-4 h-4 text-emerald-700" />
      </button>
      {prod.slug ? (
        <a href={`/p/${prod.slug}`} target="_blank" rel="noopener noreferrer" className={iconBtn} title="مشاهدة" aria-label="مشاهدة">
          <Eye className="w-4 h-4" />
        </a>
      ) : (
        <span className={`${iconBtn} opacity-40 cursor-not-allowed`} title="لا توجد صفحة هبوط" aria-disabled="true">
          <Eye className="w-4 h-4" />
        </span>
      )}
      <button
        type="button"
        onClick={() => handleDeleteProduct(prod)}
        disabled={deletingId === prod.id}
        className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer disabled:opacity-40"
        title="حذف المنتج"
        aria-label="حذف المنتج"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  const searchInput = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className="relative w-full sm:w-72">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setPage(1);
        }}
        placeholder={placeholder}
        className="w-full pr-9 pl-3.5 min-h-[44px] rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-orange-500 bg-white"
      />
      <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );

  return (
    <div className="space-y-6 text-right font-sans max-w-6xl mx-auto pb-16" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">المنتجات</h1>
          <p className="text-sm text-slate-500 mt-1">أضف منتجاتك وعدّل أسعارها ومخزونها وصورها.</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href="/admin/marketing/catalog"
            className="hidden sm:inline-flex min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-sm font-bold text-slate-700 items-center cursor-pointer"
          >
            Product Feed
          </a>
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="w-11 h-11 flex items-center justify-center rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="تحديث القائمة"
            aria-label="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-initial min-h-[44px] py-2.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج</span>
          </button>
        </div>
      </div>

      <Toast message={alertMessage ? { ok: alertMessage.type === "success", text: alertMessage.text } : null} onClose={() => setAlertMessage(null)} />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {searchInput(searchQuery, setSearchQuery, "بحث باسم المنتج")}
        {searchInput(skuQuery, setSkuQuery, "بحث بكود المنتج (SKU)")}
      </div>

      {selected.length > 0 && (
        <div className="rounded-2xl bg-slate-900 text-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-bold">تم تحديد {selected.length} منتج</span>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => bulkStatus("active")} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer disabled:opacity-50">إظهار</button>
            <button onClick={() => bulkStatus("draft")} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer disabled:opacity-50">إخفاء</button>
            <button onClick={bulkDelete} disabled={bulkBusy} className="min-h-[40px] px-3 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
              <Trash2 className="w-4 h-4" /> {bulkBusy ? "جاري..." : "مسح المحدد"}
            </button>
            <button onClick={() => setSelected([])} className="min-h-[40px] px-3 rounded-lg hover:bg-white/10 text-xs font-bold cursor-pointer">إلغاء التحديد</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل المنتجات...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3.5 w-10">
                    <input
                      type="checkbox"
                      aria-label="تحديد كل منتجات الصفحة"
                      checked={pagedProducts.length > 0 && pagedProducts.every((x) => selected.includes(x.id))}
                      onChange={(e) =>
                        setSelected((cur) =>
                          e.target.checked ? Array.from(new Set([...cur, ...pagedProducts.map((x) => x.id)])) : cur.filter((id) => !pagedProducts.some((x) => x.id === id))
                        )
                      }
                      className="w-4 h-4 cursor-pointer accent-orange-600"
                    />
                  </th>
                  <th className="px-5 py-3.5">المنتج</th>
                  <th className="px-4 py-3.5">الحالة</th>
                  <th className="px-4 py-3.5">المخزون</th>
                  <th className="px-4 py-3.5">السعر</th>
                  <th className="px-4 py-3.5">تاريخ الإنشاء</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedProducts.map((prod) => (
                  <tr key={prod.id} className={`h-16 hover:bg-orange-50/30 transition-colors ${selected.includes(prod.id) ? "bg-orange-50/50" : ""}`}>
                    <td className="px-4 py-2">
                      <input type="checkbox" aria-label="تحديد المنتج" checked={selected.includes(prod.id)} onChange={() => toggleOne(prod.id)} className="w-4 h-4 cursor-pointer accent-orange-600" />
                    </td>
                    <td className="px-5 py-2">
                      <div className="flex items-center gap-3">
                        {thumb(prod)}
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 leading-snug truncate max-w-[280px]">{prod.title_ar}</div>
                          <div className="text-[11px] font-mono text-slate-400" dir="ltr">
                            SKU · {prod.sku || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">{statusPill(prod)}</td>
                    <td className="px-4 py-2 font-mono font-bold text-slate-700">{prod.stock_quantity ?? 0}</td>
                    <td className="px-4 py-2">{priceCell(prod)}</td>
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">{formatDate(prod.created_at)}</td>
                    <td className="px-3 py-2">{actions(prod)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked rows */}
          <div className="lg:hidden space-y-3">
            {pagedProducts.map((prod) => (
              <div key={prod.id} className={`bg-white rounded-3xl border shadow-sm p-4 space-y-3 ${selected.includes(prod.id) ? "border-orange-400" : "border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" aria-label="تحديد المنتج" checked={selected.includes(prod.id)} onChange={() => toggleOne(prod.id)} className="w-5 h-5 cursor-pointer accent-orange-600 shrink-0" />
                  {thumb(prod)}
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 leading-snug">{prod.title_ar}</div>
                    <div className="text-[11px] font-mono text-slate-400" dir="ltr">
                      SKU · {prod.sku || "—"}
                    </div>
                  </div>
                  {statusPill(prod)}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  {priceCell(prod)}
                  <span>
                    المخزون <span className="font-mono font-bold text-slate-700">{prod.stock_quantity ?? 0}</span>
                  </span>
                  <span>{formatDate(prod.created_at)}</span>
                </div>
                {actions(prod)}
              </div>
            ))}
          </div>

          <TablePagination
            total={filteredProducts.length}
            page={currentPage}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">لم يتم العثور على أي منتجات مطابقة</h3>
          <p className="text-xs text-slate-400">يمكنك إضافة منتج جديد أو مسح كلمة البحث</p>
        </div>
      )}

      {/* Full-page product editor (opens over the list) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto" role="dialog" aria-label="محرر المنتج">
          <form id="product-form" onSubmit={handleSaveProduct} className="min-h-full text-right font-sans" dir="rtl">
            {/* Sticky top bar */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    aria-label="رجوع"
                    className="w-11 h-11 shrink-0 rounded-xl border border-slate-200 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                  >
                    <ArrowRight className="w-5 h-5 text-slate-700" />
                  </button>
                  <h2 className="text-base sm:text-lg font-black text-slate-950 font-heading truncate">
                    {editingProduct ? titleAr || "تعديل المنتج" : "منتج جديد"}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="hidden sm:block min-h-[44px] px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[44px] px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black shadow-md shadow-orange-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري الحفظ...</span>
                      </>
                    ) : (
                      <span>{editingProduct ? "حفظ" : "إضافة المنتج"}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
              {/* Main column */}
              <div className="lg:col-span-2 space-y-5">
                <section className={cardCls}>
                  <h3 className={cardTitle}>بيانات المنتج الأساسية</h3>
                  <div>
                    <label className={lbl}>اسم المنتج *</label>
                    <input
                      type="text"
                      required
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="مثال: مسدس مساج فليكس برو الكهربائي"
                      className={inputCls + " font-bold"}
                    />
                  </div>
                  <div>
                    <label className={lbl}>وصف ومميزات المنتج</label>
                    <textarea
                      rows={5}
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                      placeholder="اكتب نقاط القوة والمميزات الرئيسية اللي هتظهر في صفحة المنتج..."
                      className={inputCls + " py-3 leading-relaxed"}
                    />
                  </div>
                  <DescriptionAiHelper
                    title={titleAr}
                    price={Number(basePrice) || undefined}
                    brandName={brand.store_name}
                    notes={descriptionAr}
                    onApply={(c) => {
                      if (c.title) setTitleAr(c.title);
                      if (c.description) setDescriptionAr(c.description);
                      if (c.faq.length > 0) {
                        // keep the questions the merchant already wrote; add the AI ones (no repeats, up to 15)
                        setChatFaq((cur) => {
                          const kept = cur.filter((f) => f.q.trim() && f.answer.trim());
                          const have = new Set(kept.map((f) => f.q.trim()));
                          return [...kept, ...c.faq.filter((f) => !have.has(f.q))].slice(0, 15);
                        });
                      }
                    }}
                  />
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>الخيارات (اللون / المقاس)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">اختياري. العميل لازم يختار كل خيار قبل ما يطلب، والاختيار بيتكتب في ملاحظات الأوردر وفي إشعار تيليجرام.</p>
                  {optionRows.map((row, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[160px_1fr_auto] gap-2 items-center">
                      <input type="text" value={row.name} maxLength={30} onChange={(e) => setOptionRows((r) => r.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} placeholder="الاسم (اللون)" className={inputCls} />
                      <input type="text" value={row.values} onChange={(e) => setOptionRows((r) => r.map((x, k) => (k === i ? { ...x, values: e.target.value } : x)))} placeholder="القيم مفصولة بفاصلة: أحمر، أزرق، أسود" className={inputCls} />
                      <button type="button" onClick={() => setOptionRows((r) => r.filter((_, k) => k !== i))} className="min-h-[44px] px-3 rounded-xl border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 cursor-pointer">حذف</button>
                    </div>
                  ))}
                  {optionRows.length < MAX_OPTIONS && (
                    <div className="flex flex-wrap gap-2">
                      {[["اللون", "أحمر، أزرق، أسود"], ["المقاس", "S، M، L، XL"], ["", ""]].map(([n, v], k) => (
                        <button key={k} type="button" onClick={() => setOptionRows((r) => [...r, { name: n, values: v }])} className="min-h-[40px] px-3 rounded-xl border-2 border-dashed border-sky-400 text-sky-700 hover:bg-sky-50 text-xs font-bold cursor-pointer">
                          {n ? `+ ${n}` : "+ خيار آخر"}
                        </button>
                      ))}
                    </div>
                  )}
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>الصور</h3>
                  <ImageGalleryEditor label="صور المنتج (الأولى هي الصورة الرئيسية)" value={images} onChange={setImages} />
                  <p className="text-xs text-slate-500 leading-relaxed">أول 4 صور بس هي اللي بتظهر في صفحة الهبوط. كل صورة بتستهلك من حد الزيارات في الخطة المجانية، فالأفضل 4 إلى 5 صور بالكتير للصفحة كلها.</p>
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>التسعير</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className={lbl}>سعر البيع (ج.م) *</label>
                      <input type="number" required min={1} value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className={inputCls + " font-mono font-bold"} />
                    </div>
                    <div>
                      <label className={lbl}>سعر قبل الخصم (المشطوب)</label>
                      <input type="number" min={0} value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className={inputCls + " font-mono"} />
                    </div>
                    <div>
                      <label className={lbl}>تكلفة المنتج</label>
                      <input type="number" min={0} value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={inputCls + " font-mono"} />
                    </div>
                  </div>
                  {Number(basePrice) > 0 && Number(costPrice) > 0 && (
                    <p className="text-xs text-slate-500">
                      الربح للقطعة:{" "}
                      <span className="font-mono font-black text-emerald-700">{(Number(basePrice) - Number(costPrice)).toLocaleString("en-US")} ج.م</span>
                    </p>
                  )}
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>الظهور في محركات البحث</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>رابط الصفحة (Slug)</label>
                      <input type="text" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="massage-gun" className={inputCls + " font-mono text-left"} />
                      <span className="text-[11px] text-slate-400 mt-1 block" dir="ltr">/p/{slug || "example-product"}</span>
                    </div>
                    <div>
                      <label className={lbl}>كود المنتج (SKU)</label>
                      <input type="text" dir="ltr" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="REX-PROD-01" className={inputCls + " font-mono text-left"} />
                    </div>
                  </div>
                </section>

                <section className={cardCls}>
                  <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
                    <span>
                      <span className={cardTitle + " block"}>عروض الكمية (Upsell)</span>
                      <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                        {upsellEnabled
                          ? `مفعّل: ${effectiveOffers.length} باقات بتظهر للعميل`
                          : "مقفول: صفحة المنتج بتعرض قطعة واحدة بسعرها، وفورم عادي من غير باقات"}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      checked={upsellEnabled}
                      onChange={(e) => {
                        setUpsellEnabled(e.target.checked);
                        setUpsellOpen(e.target.checked);
                      }}
                      className="w-5 h-5 accent-emerald-600 shrink-0"
                      aria-label="تفعيل عروض الكمية"
                    />
                  </label>
                  {upsellEnabled && (
                    <button
                      type="button"
                      onClick={() => setUpsellOpen((v) => !v)}
                      aria-expanded={upsellOpen}
                      className="w-full flex items-center justify-between gap-3 text-right cursor-pointer min-h-[44px] rounded-xl bg-slate-50 border border-slate-200 px-3"
                    >
                      <span className="text-sm font-bold text-slate-800">{upsellOpen ? "إخفاء الباقات" : "عرض وتعديل الباقات"}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-500 shrink-0 transition-transform ${upsellOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                  {upsellEnabled && upsellOpen && (
                  <OffersPanel
                    offers={effectiveOffers}
                    currency={brand.currency}
                    hint="بتتحفظ مع المنتج وبتظهر في صفحة الهبوط."
                    onChange={(next) => {
                      setOffers(next);
                      setOffersTouched(true);
                    }}
                    onReset={() => {
                      setOffers([]);
                      setOffersTouched(false);
                    }}
                  />
                  )}
                </section>

                <section className={cardCls}>
                  <div>
                    <h3 className={cardTitle}>أسئلة وأجوبة الشات للمنتج ده</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">الشات في صفحة المنتج بيرد منها لوحده من غير أي مصاريف (اكتب الكلمات المفتاحية مفصولة بفاصلة)، وبيقترح على العميل يطلب.</p>
                  </div>
                  {chatFaq.map((f, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                      <input className={inputCls} maxLength={80} placeholder="السؤال (مثال: بيشتغل بالبطارية؟)" value={f.q} onChange={(e) => setChatFaq((l) => l.map((x, k) => (k === i ? { ...x, q: e.target.value } : x)))} />
                      <input className={inputCls} placeholder="كلمات مفتاحية: بطارية، شحن" value={f.keywords} onChange={(e) => setChatFaq((l) => l.map((x, k) => (k === i ? { ...x, keywords: e.target.value } : x)))} />
                      <textarea className={inputCls + " py-3 leading-relaxed"} rows={2} maxLength={600} placeholder="الإجابة" value={f.answer} onChange={(e) => setChatFaq((l) => l.map((x, k) => (k === i ? { ...x, answer: e.target.value } : x)))} />
                      <button type="button" onClick={async () => { if (await confirmAsk({ title: "حذف السؤال", message: "هتحذف السؤال ده وإجابته." })) setChatFaq((l) => l.filter((_, k) => k !== i)); }} className="min-h-[44px] px-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-bold cursor-pointer">حذف</button>
                    </div>
                  ))}
                  {chatFaq.length < 15 && (
                    <button type="button" onClick={() => setChatFaq((l) => [...l, { q: "", keywords: "", answer: "" }])} className="min-h-[48px] w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-400 text-slate-700 font-bold text-sm cursor-pointer">+ إضافة سؤال</button>
                  )}
                </section>
              </div>

              {/* Side column */}
              <div className="space-y-5 lg:sticky lg:top-24">
                <section className={cardCls}>
                  <h3 className={cardTitle}>التنظيم</h3>
                  <label className="flex items-center justify-between gap-3 min-h-[44px] cursor-pointer">
                    <span>
                      <span className="block text-sm font-bold text-slate-900">المنتج ظاهر للعملاء</span>
                      <span className="block text-xs text-slate-500 mt-0.5">لو قفلته المنتج بيتخفي من المتجر وصفحته تقفل.</span>
                    </span>
                    <input type="checkbox" checked={productActive} onChange={(e) => setProductActive(e.target.checked)} className="w-5 h-5 accent-emerald-600 shrink-0" />
                  </label>
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>الشحن</h3>
                  <div>
                    <label className={lbl}>سعر شحن المنتج ده ({brand.currency})</label>
                    <input
                      type="number"
                      min={0}
                      value={productShipFee}
                      onChange={(e) => setProductShipFee(e.target.value)}
                      placeholder="تكلفة المتجر"
                      className={inputCls + " font-mono"}
                      disabled={!shipCfg}
                    />
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      سيب الخانة فاضية عشان المنتج ياخد تكلفة شحن المتجر (حسب المحافظة). اكتب 0 لشحن مجاني للمنتج ده. تكلفة المتجر والمحافظات من الإعدادات &gt; الشحن.
                    </p>
                  </div>
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>المخزون</h3>
                  <div>
                    <label className={lbl}>الكمية المتاحة</label>
                    <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls + " font-mono"} />
                  </div>
                </section>

                {editingProduct?.slug && (
                  <a
                    href={`/p/${editingProduct.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[48px] rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-sm font-bold text-slate-800 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> معاينة صفحة المنتج
                  </a>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
