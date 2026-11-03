"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Product, ProductOffer } from "@/types";
import { Tag, Plus, Edit, Trash2, CheckCircle2, Package, Sparkles, X, Layers } from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [sku, setSku] = useState("");
  const [basePrice, setBasePrice] = useState(299);
  const [comparePrice, setComparePrice] = useState(450);
  const [costPrice, setCostPrice] = useState(110);
  const [stock, setStock] = useState(100);
  const [descriptionAr, setDescriptionAr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success) {
        setProducts(json.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        title_ar: titleAr.trim(),
        slug: slug.trim().toLowerCase(),
        sku: sku.trim().toUpperCase(),
        base_price: Number(basePrice),
        compare_at_price: Number(comparePrice),
        cost_price: Number(costPrice),
        stock_quantity: Number(stock),
        description_ar: descriptionAr.trim(),
        status: "active",
        images: ["/landing-pages/portable-urinal/images/hero_product.jpg"],
        offers: [
          {
            id: `off-${Date.now()}-1`,
            title_ar: "قطعة واحدة",
            quantity: 1,
            price: Number(basePrice),
            sort_order: 1,
            free_shipping: false,
          },
          {
            id: `off-${Date.now()}-2`,
            title_ar: "قطعتان (الأكثر طلباً)",
            quantity: 2,
            price: Math.round(Number(basePrice) * 1.65),
            discount_label: "خصم إضافي + شحن مجاني",
            is_popular: true,
            free_shipping: true,
            sort_order: 2,
          },
        ],
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setTitleAr("");
        setSlug("");
        setSku("");
        setDescriptionAr("");
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            المنتجات والعروض والأسعار
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة كتالوج المنتجات وتكوين باقات الكميات والتخفيضات (Offers & Bundles)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Products List */}
      <div className="space-y-6">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden border border-gray-200 flex-shrink-0">
                  {prod.images?.[0] ? (
                    <Image
                      src={prod.images[0]}
                      alt={prod.title_ar}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      SKU: {prod.sku}
                    </span>
                    <span className="text-xs text-gray-400">المخزون: {prod.stock_quantity} قطعة</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-950 font-heading mt-1">
                    {prod.title_ar}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{prod.description_ar}</p>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="flex items-center gap-6">
                <div className="text-left">
                  <span className="text-xs text-gray-400 block">سعر البيع الأساسي</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-emerald-700">{prod.base_price} ج.م</span>
                    {prod.compare_at_price && (
                      <span className="text-xs text-gray-400 line-through">
                        {prod.compare_at_price} ج.م
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-left border-r border-gray-100 pr-6">
                  <span className="text-xs text-gray-400 block">سعر التكلفة التقريبي</span>
                  <span className="text-lg font-bold text-gray-700">{prod.cost_price || 0} ج.م</span>
                </div>
              </div>
            </div>

            {/* Quantity Offers Breakdown */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                باقات وعروض الكمية المتاحة في صفحات الهبوط
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {prod.offers?.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-gray-200/80 relative"
                  >
                    {offer.is_popular && (
                      <span className="absolute -top-2.5 right-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                        العرض الأكثر طلباً ⭐
                      </span>
                    )}
                    <div className="font-bold text-gray-900 text-sm">{offer.title_ar}</div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-lg font-extrabold text-emerald-700">
                        {offer.price} ج.م
                      </span>
                      {offer.original_price && (
                        <span className="text-xs text-gray-400 line-through">
                          {offer.original_price} ج.م
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-200">
                      <span>الكمية: {offer.quantity} قطع</span>
                      <span className="text-emerald-600 font-semibold">
                        {offer.free_shipping ? "شحن مجاني" : "شحن عادي"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-black text-gray-900 font-heading">
                إضافة منتج جديد
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: وسادة طبية لتقويم الظهر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المعرف (Slug)</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="medical-pillow"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-right outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">كود الصنف (SKU)</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="PIL-001"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-right outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">سعر البيع (ج.م)</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">قبل الخصم (ج.م)</label>
                  <input
                    type="number"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المخزون</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">وصف المنتج</label>
                <textarea
                  rows={3}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  placeholder="وصف تسويقي للمنتج..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
                >
                  {isSubmitting ? "جاري الإضافة..." : "حفظ المنتج"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
