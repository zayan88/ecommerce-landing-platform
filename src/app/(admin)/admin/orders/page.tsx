"use client";

import React, { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types";
import {
  Search,
  Filter,
  RefreshCw,
  Phone,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  Eye,
  CreditCard,
  X,
  MapPin,
  Calendar,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = "/api/orders";
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("q", search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setOrders(json.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetrySafqa = async (orderId: string) => {
    try {
      setRetryingId(orderId);
      const res = await fetch(`/api/orders?id=${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry_safqa" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><Clock className="w-3 h-3" /> قيد المراجعة</span>;
      case "confirmed":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200"><CheckCircle2 className="w-3 h-3" /> تم التأكيد</span>;
      case "shipped":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200"><Truck className="w-3 h-3" /> تم الشحن</span>;
      case "delivered":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> تم التوصيل</span>;
      case "cancelled":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200"><XCircle className="w-3 h-3" /> ملغي</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-xs bg-gray-100">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">
            إدارة طلبات المبيعات
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سجل موحد لجميع الطلبات الواردة من كافة صفحات الهبوط مع حالة بوابة صفقة وتأكيد الواتساب
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="py-2 px-3.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، الهاتف، رقم الطلب، أو المحافظة..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
          />
          <button type="submit" className="absolute left-3 top-3 text-gray-400 hover:text-gray-600">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 text-xs font-bold">
          {[
            { id: "all", label: "الكل" },
            { id: "pending", label: "قيد المراجعة" },
            { id: "confirmed", label: "مؤكد" },
            { id: "shipped", label: "تم الشحن" },
            { id: "delivered", label: "تم التوصيل" },
            { id: "cancelled", label: "ملغي" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`py-2 px-3 rounded-xl transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">العميل والهاتف</th>
                <th className="py-3.5 px-4">المحافظة</th>
                <th className="py-3.5 px-4">صفحة الهبوط</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">حالة الطلب</th>
                <th className="py-3.5 px-4">بوابة صفقة</th>
                <th className="py-3.5 px-4">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>جاري تحميل الطلبات...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    لا توجد طلبات تطابق هذا البحث
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const whatsappLink = `https://wa.me/2${ord.customer_phone.replace(/^0/, "")}?text=${encodeURIComponent(
                    `أهلاً بحضرتك يا فندم، بنكلمك من متجرنا لتأكيد طلبك رقم (${ord.order_number}) الخاص بـ ${ord.product?.title_ar || "المنتج"}. العنوان: ${ord.governorate} - ${ord.address}. هل الميعاد مناسب للشحن؟`
                  )}`;

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-slate-800">
                        {ord.order_number}
                        <div className="text-[10px] text-gray-400 font-sans">
                          {new Date(ord.created_at).toLocaleDateString("ar-EG")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{ord.customer_name}</div>
                        <div className="text-xs text-gray-500 font-mono" dir="ltr">
                          {ord.customer_phone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                        {ord.governorate}
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {ord.landing_page_slug}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-gray-900">
                        {ord.final_amount} ج.م
                        <div className="text-[10px] text-gray-400 font-normal">
                          {ord.quantity} قطع
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                          className="text-xs font-bold rounded-lg border border-gray-200 py-1 px-2 bg-white outline-hidden cursor-pointer shadow-2xs"
                        >
                          <option value="pending">قيد المراجعة</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التوصيل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              ord.safqa_status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : ord.safqa_status === "pending"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ord.safqa_status === "paid"
                              ? "مدفوع Safqa"
                              : ord.safqa_status === "pending"
                              ? "فاتورة جاهزة"
                              : "غير متصل"}
                          </span>
                          {ord.safqa_status !== "paid" && (
                            <button
                              onClick={() => handleRetrySafqa(ord.id)}
                              disabled={retryingId === ord.id}
                              title="إعادة المحاولة والمزامنة مع صفقة"
                              className="text-gray-400 hover:text-emerald-600 transition"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${retryingId === ord.id ? "animate-spin" : ""}`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {/* WhatsApp button */}
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="مراسلة عبر واتساب"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>

                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                            title="عرض تفاصيل الطلب والتتبع"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-400 font-mono">تفاصيل الطلب:</span>
                <h3 className="text-xl font-black text-gray-900 font-heading">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                بيانات العميل والشحن
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">الاسم:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الهاتف الأساسي:</span>
                  <span className="font-bold text-gray-900 font-mono" dir="ltr">
                    {selectedOrder.customer_phone}
                  </span>
                </div>
                {selectedOrder.customer_phone2 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">هاتف بديل:</span>
                    <span className="font-bold text-gray-900 font-mono" dir="ltr">
                      {selectedOrder.customer_phone2}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">المحافظة:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.governorate}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-gray-500 block mb-1">العنوان بالتفصيل:</span>
                  <p className="font-semibold text-gray-900 leading-relaxed">
                    {selectedOrder.address}
                  </p>
                </div>
                {selectedOrder.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-500 block mb-1">ملاحظات التوصيل:</span>
                    <p className="text-amber-800 bg-amber-50 p-2 rounded-lg text-xs">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financials */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                الماليات وحساب الفاتورة
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">الكمية المطلوبة:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.quantity} قطعة</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">سعر المنتجات:</span>
                  <span className="font-bold text-gray-900">{selectedOrder.total_amount} ج.م</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">مصاريف الشحن:</span>
                  <span className="font-bold text-gray-900">
                    {selectedOrder.shipping_fee === 0 ? "مجاني" : `${selectedOrder.shipping_fee} ج.م`}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-extrabold text-emerald-700">
                  <span>المبلغ الإجمالي عند الاستلام:</span>
                  <span>{selectedOrder.final_amount} ج.م</span>
                </div>
              </div>
            </div>

            {/* Safqa & Tracking Attribution */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                التتبع والتسويق (UTM & Safqa)
              </h4>
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">المصدر (UTM Source):</span>
                  <span className="text-slate-900 font-bold">{selectedOrder.tracking?.utm_source || "direct"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">الحملة (Campaign):</span>
                  <span className="text-slate-900">{selectedOrder.tracking?.utm_campaign || "none"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">معرف الحدث (Event ID):</span>
                  <span className="text-slate-900">{selectedOrder.tracking?.event_id || "none"}</span>
                </div>
                {selectedOrder.safqa_invoice_id && (
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-gray-500">رقم فاتورة صفقة:</span>
                    <span className="text-emerald-700 font-bold">{selectedOrder.safqa_invoice_id}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
