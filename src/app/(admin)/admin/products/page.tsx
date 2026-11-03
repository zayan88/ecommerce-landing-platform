"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ExternalLink,
  Search,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
  const [imageUrl, setImageUrl] = useState("");
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
    setImageUrl("/images/hero-organizer.jpg");
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
    setImageUrl(prod.images?.[0] || "");
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

      const imagesArray = imageUrl.trim()
        ? [imageUrl.trim(), ...(editingProduct?.images?.slice(1) || [])]
        : editingProduct?.images || ["/images/hero-organizer.jpg"];

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

  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title_ar?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-right font-sans max-w-6xl mx-auto pb-16" dir="rtl">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold font-mono mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>كتالوج متجر RexRack</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-950 font-heading">
            إدارة المنتجات والأسعار وصفحات الهبوط
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            أضف منتجات جديدة، عدّل الأسعار والأسماء، احذف المنتجات، أو عاين صفحات الهبوط بضغطة زر
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-orange-600" : ""}`} />
          </button>

          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-initial py-2.5 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/25 transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-xs ${
            alertMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Search & Stats Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو الكود (SKU) أو الرابط..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-orange-500 bg-slate-50/50"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto justify-end">
          <span>إجمالي المنتجات:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-slate-900">
            {products.length}
          </span>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">جاري تحميل المنتجات...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="space-y-5">
          {filteredProducts.map((prod) => {
            const profitPerItem = Math.max(0, (prod.base_price || 0) - (prod.cost_price || 0));
            const lpUrl = `/p/${prod.slug}`;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-orange-300 transition-colors space-y-5"
              >
                {/* Top Row: Info & Actions */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-5 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                      {prod.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.title_ar}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = "/images/hero-organizer.jpg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          SKU: {prod.sku || "N/A"}
                        </span>
                        <span className="text-[11px] font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md font-bold">
                          /{prod.slug}
                        </span>
                        <span className="text-xs text-slate-400">
                          المخزون: {prod.stock_quantity || 100} قطعة
                        </span>
                      </div>

                      <h3 className="text-lg md:text-xl font-black text-slate-950 font-heading leading-tight">
                        {prod.title_ar}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                        {prod.description_ar?.replace(/<[^>]*>/g, "") || "لا يوجد وصف"}
                      </p>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400 block">سعر البيع</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-slate-950 font-mono">
                          {prod.base_price} ج.م
                        </span>
                        {prod.compare_at_price && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {prod.compare_at_price} ج.م
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="border-r border-slate-200 pr-5">
                      <span className="text-[11px] text-slate-400 block">سعر التكلفة</span>
                      <span className="text-base font-bold text-slate-700 font-mono">
                        {prod.cost_price || 0} ج.م
                      </span>
                    </div>

                    <div className="border-r border-slate-200 pr-5">
                      <span className="text-[11px] text-emerald-700 block font-bold">الربح الصافي للقطعة</span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        +{profitPerItem} ج.م
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions & Offers */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                  {/* Offers summary */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400">باقات الهبوط:</span>
                    {prod.offers?.slice(0, 3).map((off) => (
                      <span
                        key={off.id}
                        className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl"
                      >
                        {off.quantity}ق = {off.price} ج.م
                      </span>
                    ))}
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      href={lpUrl}
                      target="_blank"
                      className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-600" />
                      <span>معاينة صفحة الهبوط</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="py-2 px-3.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-orange-200/60"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل الاسم والسعر</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod)}
                      disabled={deletingId === prod.id}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer disabled:opacity-50"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 text-sm"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono font-bold text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر المقارنة / الشطب</label>
                  <input
                    type="number"
                    min={0}
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر التكلفة (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-sm"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs text-left"
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs text-left"
                  />
                </div>
              </div>

              {/* Image URL & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">رابط الصورة الرئيسية</label>
                  <input
                    type="url"
                    dir="ltr"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://.../product.jpg"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs text-left"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الكمية بالمخزن</label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 font-mono text-slate-900 text-xs"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 outline-hidden focus:ring-2 focus:ring-orange-500 text-slate-900 text-xs leading-relaxed"
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
