"use client";

import React, { useState } from "react";
import { Order, OrderStatus, Product } from "@/types";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import { X, Save, AlertCircle, Package, User, MapPin, DollarSign } from "lucide-react";

interface EditOrderModalProps {
  order: Order;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

export function EditOrderModal({
  order,
  products,
  isOpen,
  onClose,
  onOrderUpdated,
}: EditOrderModalProps) {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState(order.customer_name);
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone);
  const [customerPhone2, setCustomerPhone2] = useState(order.customer_phone2 || "");
  const [governorate, setGovernorate] = useState(order.governorate);
  const [city, setCity] = useState(order.city || "");
  const [address, setAddress] = useState(order.address);
  const [notes, setNotes] = useState(order.notes || "");
  const [productId, setProductId] = useState(order.product_id || (products[0]?.id || ""));
  const [quantity, setQuantity] = useState<number>(order.quantity || 1);
  const [totalAmount, setTotalAmount] = useState<number>(order.total_amount || 0);
  const [shippingFee, setShippingFee] = useState<number>(order.shipping_fee || 0);
  const [finalAmount, setFinalAmount] = useState<number>(order.final_amount || 0);
  const [status, setStatus] = useState<OrderStatus>(order.status);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When product changes, recalculate default prices if user desires
  const handleProductChange = (newProductId: string) => {
    setProductId(newProductId);
    const selectedProd = products.find((p) => p.id === newProductId);
    if (selectedProd) {
      const matchingOffer = selectedProd.offers?.find((o) => o.quantity === quantity);
      const newPrice = matchingOffer ? matchingOffer.price : (selectedProd.base_price || 0) * quantity;
      setTotalAmount(newPrice);
      setFinalAmount(newPrice + shippingFee);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    setQuantity(newQty);
    const selectedProd = products.find((p) => p.id === productId);
    if (selectedProd) {
      const matchingOffer = selectedProd.offers?.find((o) => o.quantity === newQty);
      const newPrice = matchingOffer ? matchingOffer.price : (selectedProd.base_price || 0) * newQty;
      setTotalAmount(newPrice);
      setFinalAmount(newPrice + shippingFee);
    } else {
      setFinalAmount(totalAmount + shippingFee);
    }
  };

  const handleTotalAmountChange = (newTotal: number) => {
    setTotalAmount(newTotal);
    setFinalAmount(newTotal + shippingFee);
  };

  const handleShippingChange = (newShipping: number) => {
    setShippingFee(newShipping);
    setFinalAmount(totalAmount + newShipping);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("اسم العميل مطلوب");
      return;
    }
    if (!customerPhone.trim()) {
      setError("رقم هاتف العميل مطلوب");
      return;
    }
    if (!address.trim()) {
      setError("العنوان بالتفصيل مطلوب");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_phone2: customerPhone2.trim() || undefined,
        governorate,
        city: city.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
        product_id: productId,
        quantity,
        total_amount: totalAmount,
        shipping_fee: shippingFee,
        final_amount: finalAmount,
        status,
      };

      const res = await fetch(`/api/orders?id=${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.order) {
        onOrderUpdated(data.order);
        onClose();
      } else {
        setError(data.error || "فشل حفظ التعديلات");
      }
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 my-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              تعديل بيانات الطلب
            </span>
            <h3 className="text-xl font-black text-gray-900 font-heading mt-1">
              طلب رقم: {order.order_number}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Product & Quantity */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-orange-500" />
              <span>المنتج المطلوب والكمية</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المنتج
                </label>
                <select
                  value={productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-hidden font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title_ar}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الكمية (قطع)
                </label>
                <select
                  value={quantity}
                  onChange={(e) => handleQuantityChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-hidden font-bold"
                >
                  <option value={1}>1 قطعة (تجربة)</option>
                  <option value={2}>2 قطع (عرض التوفير)</option>
                  <option value={3}>3 قطع (عرض العائلة)</option>
                  <option value={4}>4 قطع</option>
                  <option value={5}>5 قطع</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Customer Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-500" />
              <span>بيانات العميل</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  اسم العميل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم الهاتف الأساسي <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-left font-bold"
                  dir="ltr"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  رقم هاتف بديل (اختياري)
                </label>
                <input
                  type="tel"
                  value={customerPhone2}
                  onChange={(e) => setCustomerPhone2(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-hidden font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Address & Location */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>العنوان والشحن</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المحافظة <span className="text-red-500">*</span>
                </label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden font-bold"
                >
                  {EGYPTIAN_GOVERNORATES.map((gov) => (
                    <option key={gov.id} value={gov.nameAr}>
                      {gov.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  المركز / المدينة / المنطقة
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="مثال: سموحة / الهرم / بنها"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  العنوان بالتفصيل (الشارع، رقم العمارة، علامة مميزة) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ملاحظات التوصيل للعميل
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  placeholder="مثال: الاتصال قبل الوصول / التوصيل بعد الساعة 4 مساءً"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Financials & Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>الأسعار وحالة الطلب</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-gray-200/80">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  سعر المنتجات (ج.م)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => handleTotalAmountChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الشحن (ج.م)
                </label>
                <input
                  type="number"
                  value={shippingFee}
                  onChange={(e) => handleShippingChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الإجمالي النهائي (ج.م)
                </label>
                <input
                  type="number"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-400 bg-emerald-50 text-emerald-900 font-mono font-black text-sm focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  min={0}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  حالة الطلب
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as OrderStatus)}
                  className="w-full px-2 py-2 rounded-xl border border-gray-300 text-xs bg-white font-bold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  <option value="pending">قيد المراجعة</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
