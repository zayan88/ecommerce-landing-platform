"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";

export default function AdminProductsPage() {
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
  const [basePrice, setBasePrice] = useState<number | string>(540);
  const [comparePrice, setComparePrice] = useState<number | string>(780);
  const [costPrice, setCostPrice] = useState<number | string>(100);
  const [stock, setStock] = useState<number | string>(100);
  const [images, setImages] = useState<string[]>([]);
  const [descriptionAr, setDescriptionAr] = useState("");

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
    setSku(`REX-${Math.floor(1000 + Math.random() * 9000)}`);
    setBasePrice(499);
    setComparePrice(750);
    setCostPrice(120);
    setStock(100);
    setImages([]);
    setDescriptionAr("");
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
    setIsSubmitting(true);

    try {
      const numBase = Number(basePrice) || 0;
      const numCompare = Number(comparePrice) || Math.round(numBase * 1.45);
      const numCost = Number(costPrice) || 0;
      const numStock = Number(stock) || 50;

      // Generate offers automatically based on base price
      const offers: ProductOffer[] = [
        {
          id: `off-${Date.now()}-1`,
          product_id: editingProduct?.id || "",
          title_ar: "قطعة واحدة (تجربة)",
          quantity: 1,
          price: numBase,
          original_price: numCompare,
          discount_label: "خصم خاص",
          is_popular: false,
          free_shipping: false,
          sort_order: 1,
        },
        {
          id: `off-${Date.now()}-2`,
          product_id: editingProduct?.id || "",
          title_ar: "قطعتان (الأكثر طلباً)",
          quantity: 2,
          price: Math.round(numBase * 1.8),
          original_price: numCompare * 2,
          discount_label: "وفر أكثر + شحن مجاني",
          is_popular: true,
          free_shipping: true,
          sort_order: 2,
        },
        {
          id: `off-${Date.now()}-3`,
          product_id: editingProduct?.id || "",
          title_ar: "3 قطع (عرض التوفير العائلي)",
          quantity: 3,
          price: Math.round(numBase * 2.4),
          original_price: numCompare * 3,
          discount_label: "أقصى توفير + شحن مجاني",
          is_popular: false,
          free_shipping: true,
          sort_order: 3,
        },
      ];

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
        status: "active",
        images: imagesArray,
        offers,
      };

      const res = await fetch("/api/products", {
        method: editingProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
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

      {/* Modal: Add or Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-black text-slate-900 font-heading">
                  {editingProduct ? "تعديل المنتج والأسعار" : "إضافة منتج جديد لـ RexRack"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs font-sans">
              {/* Product Title */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنتج بالعربية *</label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: مسدس مساج فليكس برو الكهربائي"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 text-sm"
                />
              </div>

              {/* Prices Row: Base, Compare, Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر المقارنة / الشطب</label>
                  <input
                    type="number"
                    min={0}
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-sm"
                  />
                </div>
              </div>

              {/* Slug & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رابط صفحة الهبوط (Slug)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="rexrack-massage-gun"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs text-left"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    الرابط سيكون: /p/{slug || "example-product"}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">كود المنتج (SKU)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="REX-PROD-01"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs text-left"
                  />
                </div>
              </div>

              {/* Product images (uploaded from the merchant device; first = main image) */}
              <ImageGalleryEditor label="صور المنتج (الأولى هي الصورة الرئيسية)" value={images} onChange={setImages} />

              {/* Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف ومميزات المنتج</label>
                <textarea
                  rows={3}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="اكتب نقاط القوة والمميزات الرئيسية التي ستظهر في صفحة الهبوط..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 text-xs leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md shadow-orange-600/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? "حفظ التعديلات" : "إضافة المنتج وتوليد الصفحة"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
