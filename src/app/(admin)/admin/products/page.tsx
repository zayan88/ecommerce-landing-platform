"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBrand } from "@/components/brand/BrandProvider";
import OffersPanel from "@/components/editor/OffersPanel";
import { buildDefaultOffers, sanitizeOffers } from "@/lib/offers";
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
} from "lucide-react";

export default function AdminProductsPage() {
  const router = useRouter();
  const brand = useBrand();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [skuQuery, setSkuQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

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
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
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
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (prod: Product) => {
    const confirmDelete = window.confirm(
      `هل أنت متأكد من حذف المنتج "${prod.title_ar}"؟\nسيتم حذف المنتج وصفحة الهبوط المرتبطة به فوراً.`
    );
    if (!confirmDelete) return;

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
      const finalOffers = sanitizeOffers(editingProduct?.id || "", effectiveOffers);
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
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        // New product in landing-page mode: go straight to the live editor of its page.
        if (!editingProduct && data.landing_page_id && brand.store_mode !== "catalog") {
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
        className="w-11 h-11 shrink-0 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40"
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

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-2.5 shadow-sm ${
            alertMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {searchInput(searchQuery, setSearchQuery, "بحث باسم المنتج")}
        {searchInput(skuQuery, setSkuQuery, "بحث بكود المنتج (SKU)")}
      </div>

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
                  <tr key={prod.id} className="h-16 hover:bg-orange-50/30 transition-colors">
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
              <div key={prod.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
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
                </section>

                <section className={cardCls}>
                  <h3 className={cardTitle}>الصور</h3>
                  <ImageGalleryEditor label="صور المنتج (الأولى هي الصورة الرئيسية)" value={images} onChange={setImages} />
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
                  <div>
                    <h3 className={cardTitle}>عروض الكمية (Upsell)</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {offersTouched
                        ? "العروض دي بتظهر في صفحة المنتج. تقدر تقفلها من محرر صفحة الهبوط."
                        : "عروض تلقائية متبنية من سعر البيع. عدّل أي رقم وهتتثبّت على المنتج."}
                    </p>
                  </div>
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
