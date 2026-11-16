"use client";

import { useConfirm } from "../_components/confirm";
import React, { useEffect, useRef, useState } from "react";
import { Order, OrderStatus, Product } from "@/types";
import { EditOrderModal } from "./EditOrderModal";
import { toCsv, downloadCsv } from "@/lib/csv";
import { SAFKA_ENABLED } from "@/lib/features";
import { EGYPTIAN_GOVERNORATES } from "@/lib/constants/governorates";
import {
  EXPORT_MAX_ROWS,
  ORDERS_PAGE_SIZES,
  fetchOrdersForExport,
  hasActiveFilter,
  nextPulseDelayMs,
  ordersPageUrl,
  type OrdersFilter,
} from "@/lib/admin/orders-client";
import {
  Download,
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
  Trash2,
  Pencil,
  Package,
  Volume2,
  VolumeX,
  Bell,
} from "lucide-react";

export default function AdminOrdersPage() {
  const confirmAsk = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [syncingSafka, setSyncingSafka] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  // Server-side pagination + filters
  const [appliedSearch, setAppliedSearch] = useState("");
  const [govFilter, setGovFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<number>(ORDERS_PAGE_SIZES[0]);
  const [total, setTotal] = useState<number | null>(null);
  const [totalCapped, setTotalCapped] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pendingCount, setPendingCount] = useState<{ n: number; capped: boolean } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [statusCounts, setStatusCounts] = useState<Record<string, number> | null>(null);
  const [bulkStatusBusy, setBulkStatusBusy] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [shipProvider, setShipProvider] = useState<"none" | "bosta">("none");
  const [shipBusy, setShipBusy] = useState(false);
  const requestSeq = useRef(0);
  const totalRef = useRef<number | null>(null);

  const currentFilter: OrdersFilter = {
    status: statusFilter,
    search: appliedSearch,
    governorate: govFilter,
    from: dateFrom,
    to: dateTo,
  };
  const flash = (message: string, ms = 4000) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(null), ms);
  };

  // Play satisfying cash-register sound when a new order drops
  const playChaChing = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15);

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(1975.53, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.35);
      osc2.stop(ctx.currentTime + 0.35);
    } catch {}
  };

  /**
   * Loads ONE page. `withTotal` asks the server to count (only on filter changes / manual refresh);
   * `detectNew` (KV backend refresh) rings when the total grew since the previous load.
   */
  const fetchOrders = async (
    opts: { page?: number; sync?: boolean; background?: boolean; withTotal?: boolean; detectNew?: boolean } = {}
  ) => {
    const target = opts.page ?? page;
    const seq = ++requestSeq.current;
    try {
      if (!opts.background) setLoading(true);
      if (opts.sync) setSyncingSafka(true);
      const res = await fetch(
        ordersPageUrl(currentFilter, { page: target, pageSize, withTotal: opts.withTotal === true, sync: opts.sync }),
        { cache: "no-store" }
      );
      const json = await res.json();
      if (seq !== requestSeq.current) return; // a newer request superseded this one
      if (json.success && Array.isArray(json.orders)) {
        if (json.orders.length === 0 && target > 0) {
          // the page emptied (deletes): step back
          setPage(target - 1);
          fetchOrders({ ...opts, page: target - 1 });
          return;
        }
        if (typeof json.total === "number") {
          if (opts.detectNew && totalRef.current !== null && json.total > totalRef.current) {
            playChaChing();
            flash("🎉 وصل أوردر جديد حالاً في المتجر!", 5000);
          }
          totalRef.current = json.total;
          setTotal(json.total);
          setTotalCapped(Boolean(json.total_capped));
        } else if (opts.withTotal) {
          totalRef.current = null;
          setTotal(null);
          setTotalCapped(false);
        }
        if (json.status_counts && typeof json.status_counts === "object") setStatusCounts(json.status_counts);
        setHasMore(Boolean(json.has_more));
        setOrders(json.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (seq === requestSeq.current) {
        if (!opts.background) setLoading(false);
        setSyncingSafka(false);
      }
    }
  };

  const goToPage = (p: number) => {
    const next = Math.max(0, p);
    setPage(next);
    setSelectedOrderIds([]);
    fetchOrders({ page: next });
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (json.success && json.products) {
        setProducts(json.products);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    }
  };

  // Any filter / page-size change: back to the first page, with a fresh total.
  useEffect(() => {
    setPage(0);
    setSelectedOrderIds([]);
    fetchOrders({ page: 0, withTotal: true });
  }, [statusFilter, appliedSearch, govFilter, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    fetchProducts();
    fetch("/api/admin/shipping", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j?.success && j.configured && setShipProvider(j.provider === "bosta" ? "bosta" : "none"))
      .catch(() => {});
  }, []);

  /**
   * New-order "pulse" instead of re-downloading the list: every 60 s (the server names the interval)
   * one tiny request, only while this tab is visible; paused when hidden; backs off on errors.
   * D1: /api/admin/orders-pulse says how many orders arrived since the last pulse. KV: the pulse is
   * not supported (it would cost a KV list per poll), so the first page is refreshed every 5 minutes.
   */
  const live = useRef({ onNewOrders: (_n: number) => {}, kvRefresh: () => {} });
  live.current = {
    onNewOrders: (n: number) => {
      playChaChing();
      flash(n > 1 ? `🎉 وصل ${n} أوردر جديد حالاً في المتجر!` : "🎉 وصل أوردر جديد حالاً في المتجر!", 5000);
      if (!hasActiveFilter(currentFilter) && totalRef.current !== null) {
        totalRef.current += n;
        setTotal(totalRef.current);
      }
      if (page === 0) fetchOrders({ page: 0, background: true }); // first page only, no COUNT
    },
    kvRefresh: () => {
      if (page === 0) fetchOrders({ page: 0, background: true, withTotal: true, detectNew: true });
    },
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let baseMs = 60000;
    let failures = 0;
    let since: number | null = null;
    let supported = true;
    let lastRun = 0;
    let running = false;

    const schedule = (ms: number) => {
      if (timer) clearTimeout(timer);
      if (!stopped && document.visibilityState === "visible") timer = setTimeout(tick, ms);
    };
    const tick = async () => {
      if (stopped || running || document.visibilityState !== "visible") return;
      running = true;
      lastRun = Date.now();
      try {
        if (supported) {
          const res = await fetch(`/api/admin/orders-pulse${since !== null ? `?since=${since}` : ""}`, { cache: "no-store" });
          const json = await res.json().catch(() => null);
          if (!res.ok || !json?.success) throw new Error("pulse failed");
          baseMs = (Number(json.poll_interval_sec) || 60) * 1000;
          if (json.supported === false) {
            supported = false;
          } else {
            setPendingCount({ n: Number(json.pending_count) || 0, capped: Boolean(json.pending_capped) });
            if (since !== null && Number(json.new_count) > 0) live.current.onNewOrders(Number(json.new_count));
            since = Math.max(since ?? 0, Number(json.latest_created_ms) || 0, 1);
          }
        } else {
          live.current.kvRefresh();
        }
        failures = 0;
      } catch {
        failures++;
      } finally {
        running = false;
      }
      schedule(nextPulseDelayMs(baseMs, failures));
    };
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        if (timer) clearTimeout(timer); // hidden tab: no requests at all
        return;
      }
      schedule(Math.max(0, lastRun + nextPulseDelayMs(baseMs, failures) - Date.now()));
    };
    document.addEventListener("visibilitychange", onVisibility);
    tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const handleOrderUpdated = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === updatedOrder.id ? updatedOrder : ord))
    );
    if (selectedOrder && selectedOrder.id === updatedOrder.id) {
      setSelectedOrder(updatedOrder);
    }
    setActionMessage(`✓ تم تحديث بيانات الطلب (${updatedOrder.order_number}) بنجاح`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim() === appliedSearch) fetchOrders({ page: 0, withTotal: true });
    else setAppliedSearch(search.trim()); // the filter effect loads page 1
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

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!await confirmAsk({ title: "حذف الطلب", message: `هتحذف الطلب (${orderNumber}) نهائياً. مش هتقدر ترجّعه.` })) {
      return;
    }
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/orders?id=${orderId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
        if (totalRef.current !== null) setTotal((totalRef.current = Math.max(0, totalRef.current - 1)));
        fetchOrders({ background: true });
        if (selectedOrder?.id === orderId) setSelectedOrder(null);
        setActionMessage(`✓ تم حذف الطلب (${orderNumber}) بنجاح`);
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        alert(data.error || "فشل حذف الطلب");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء محاولة حذف الطلب");
    } finally {
      setIsDeleting(false);
    }
  };

  /** Sends orders to the connected courier; shows what worked and the courier's reason for what did not. */
  const sendToShipping = async (ids: string[]) => {
    if (ids.length === 0 || shipBusy) return;
    setShipBusy(true);
    try {
      const res = await fetch("/api/admin/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_ids: ids }),
      });
      const j = await res.json();
      if (!j.success) {
        alert(j.error || "تعذر الإرسال لشركة الشحن");
        return;
      }
      const failed = (j.results || []).filter((r: any) => !r.ok);
      flash(`✓ اتبعت ${j.sent} طلب لشركة الشحن${failed.length ? ` — فشل ${failed.length}` : ""}`, 6000);
      if (failed.length) alert(failed.slice(0, 5).map((r: any) => `${r.order_number}: ${r.error}`).join("\n"));
      setSelectedOrderIds([]);
      fetchOrders({ withTotal: true });
      if (selectedOrder) {
        const fresh = await fetch(`/api/orders?id=${encodeURIComponent(selectedOrder.id)}`).then((r) => r.json()).catch(() => null);
        if (fresh?.order) setSelectedOrder(fresh.order);
      }
    } finally {
      setShipBusy(false);
    }
  };

  /** Plain courier file (works with any courier): one row per selected order. */
  const exportCourierFile = () => {
    const list = orders.filter((o) => selectedOrderIds.includes(o.id));
    if (list.length === 0) return;
    const headers = ["رقم الطلب", "اسم العميل", "الموبايل", "موبايل آخر", "المحافظة", "المدينة", "العنوان", "المبلغ المطلوب تحصيله", "عدد القطع", "المنتج", "ملاحظات"];
    const rows = list.map((o) => [
      o.order_number, o.customer_name, o.customer_phone, o.customer_phone2, o.governorate, o.city, o.address,
      o.final_amount, o.quantity, o.product?.title_ar || "", o.notes,
    ]);
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    downloadCsv(`shipping-${day}.csv`, toCsv(headers, rows));
  };

  const handleBulkStatus = async (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    if (!await confirmAsk({ title: "تغيير الحالة", tone: "neutral", confirmText: "تغيير", message: "تغيير حالة (" + selectedOrderIds.length + ") طلب إلى «" + STATUS_AR[status] + "»؟" })) return;
    setBulkStatusBusy(true);
    let ok = 0;
    try {
      for (const id of selectedOrderIds) {
        const res = await fetch("/api/orders?id=" + encodeURIComponent(id), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        const j = await res.json().catch(() => null);
        if (j?.success) ok++;
      }
    } finally {
      setBulkStatusBusy(false);
    }
    setSelectedOrderIds([]);
    fetchOrders({ withTotal: true });
    flash("✓ تم تحديث حالة " + ok + " طلب");
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!await confirmAsk({ title: "مسح الطلبات", message: `هتمسح ${selectedOrderIds.length} طلب نهائياً. مش هتقدر ترجّعهم.` })) {
      return;
    }
    try {
      setIsDeleting(true);
      const res = await fetch("/api/orders", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedOrderIds }),
      });
      const data = await res.json();
      if (data.success) {
        const deletedSet = new Set(selectedOrderIds);
        setOrders((prev) => prev.filter((o) => !deletedSet.has(o.id)));
        const count = selectedOrderIds.length;
        setSelectedOrderIds([]);
        if (totalRef.current !== null) setTotal((totalRef.current = Math.max(0, totalRef.current - count)));
        fetchOrders({ background: true });
        setActionMessage(`✓ تم مسح (${count}) طلبات بنجاح`);
        setTimeout(() => setActionMessage(null), 3500);
      } else {
        alert(data.error || "فشل حذف الطلبات المحددة");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء محاولة حذف الطلبات");
    } finally {
      setIsDeleting(false);
    }
  };

  const STATUS_AR: Record<string, string> = {
    pending: "قيد المراجعة",
    confirmed: "تم التأكيد",
    shipped: "تم الشحن",
    delivered: "تم التوصيل",
    cancelled: "ملغي",
    returned: "مرتجع",
  };

  // Excel/CSV export: the selected rows, or EVERY order of the current filter (all pages, fetched
  // sequentially, at most EXPORT_MAX_ROWS).
  const exportOrdersCsv = async () => {
    let list: Order[];
    let capped = false;
    if (selectedOrderIds.length > 0) {
      list = orders.filter((o) => selectedOrderIds.includes(o.id));
    } else {
      try {
        setExporting(true);
        const res = await fetchOrdersForExport((url, init) => fetch(url, init), currentFilter);
        list = res.orders;
        capped = res.capped;
      } catch (err: any) {
        alert(err?.message || "تعذر تحميل الطلبات للتصدير");
        return;
      } finally {
        setExporting(false);
      }
    }
    if (list.length === 0) {
      alert("لا توجد طلبات للتصدير");
      return;
    }
    const headers = [
      "رقم الطلب", "التاريخ", "الاسم", "الموبايل", "موبايل آخر", "المحافظة", "المدينة", "العنوان",
      "الكمية", "الإجمالي", "الشحن", "الصافي", "الحالة", "طريقة الدفع", "ملاحظات", "الصفحة",
    ];
    const rows = list.map((o) => [
      o.order_number,
      o.created_at ? new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Africa/Cairo" }) : "",
      o.customer_name,
      o.customer_phone,
      o.customer_phone2,
      o.governorate,
      o.city,
      o.address,
      o.quantity,
      o.total_amount,
      o.shipping_fee,
      o.final_amount,
      STATUS_AR[o.status] || o.status,
      o.payment_method === "cod" ? "الدفع عند الاستلام" : o.payment_method,
      o.notes,
      o.landing_page_slug,
    ]);
    const day = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
    downloadCsv(`orders-${day}.csv`, toCsv(headers, rows));
    if (capped) {
      alert(
        `تم تصدير أول ${EXPORT_MAX_ROWS.toLocaleString("en-US")} طلب فقط (الحد الأقصى للتصدير الواحد).\nلتصدير الباقي ضيّق الفلتر (التاريخ أو الحالة أو المحافظة) ثم صدّر مرة أخرى.`
      );
    } else {
      flash(`✓ تم تصدير ${list.length.toLocaleString("en-US")} طلب`);
    }
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length && orders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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

  const TABS: { id: string; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "pending", label: "قيد المراجعة" },
    { id: "confirmed", label: "مؤكد" },
    { id: "shipped", label: "تم الشحن" },
    { id: "delivered", label: "تم التوصيل" },
    { id: "cancelled", label: "ملغي" },
  ];
  const tabCount = (id: string): number | null => {
    if (!statusCounts) return null;
    if (id === "all") return Object.values(statusCounts).reduce((x, y) => x + y, 0);
    return statusCounts[id] ?? 0;
  };
  const activeFilters = [govFilter, dateFrom, dateTo].filter(Boolean).length;
  const btnGhost =
    "h-10 px-3.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50";

  return (
    <div className="space-y-5 text-right font-sans" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-black text-gray-950 font-heading">الطلبات</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChaChing();
            }}
            title={soundEnabled ? "كتم صوت إشعار الطلبات" : "تشغيل صوت إشعار الطلبات"}
            className={btnGhost}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            <span>{soundEnabled ? "الصوت شغال" : "الصوت مكتوم"}</span>
          </button>
          {SAFKA_ENABLED && (
            <button
              onClick={() => {
                setPage(0);
                setSelectedOrderIds([]);
                fetchOrders({ page: 0, sync: true, withTotal: true });
              }}
              disabled={syncingSafka}
              className={btnGhost}
            >
              <RefreshCw className={`w-4 h-4 ${syncingSafka ? "animate-spin" : ""}`} />
              <span>مزامنة صفقة</span>
            </button>
          )}
          <button onClick={exportOrdersCsv} disabled={exporting} className={btnGhost} title="تصدير الطلبات المحددة أو كل نتائج الفلتر">
            <Download className="w-4 h-4" />
            <span>{exporting ? "جاري التصدير..." : "تصدير"}</span>
          </button>
          <button onClick={() => fetchOrders({ withTotal: true })} className={btnGhost}>
            <RefreshCw className={`w-4 h-4 ${loading && !syncingSafka ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs + search + filters in one card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto px-2 border-b border-gray-100" role="tablist" aria-label="حالة الطلب">
          {TABS.map((tab) => {
            const n = tabCount(tab.id);
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.id)}
                className={`relative whitespace-nowrap px-3.5 py-3.5 text-sm font-bold cursor-pointer transition ${
                  active ? "text-slate-950" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {tab.label}
                  {n !== null && (
                    <span
                      className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black inline-flex items-center justify-center ${
                        active ? "bg-slate-900 text-white" : tab.id === "pending" && n > 0 ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {n.toLocaleString("en-US")}
                    </span>
                  )}
                </span>
                {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-slate-900" />}
              </button>
            );
          })}
        </div>

        <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2.5">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الموبايل أو رقم الطلب..."
              className="w-full h-11 pr-4 pl-10 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <button type="submit" aria-label="بحث" className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="h-11 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            <span>فلاتر</span>
            {activeFilters > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-black inline-flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
        </div>

        {(showFilters || activeFilters > 0) && (
          <div className="px-3 sm:px-4 pb-4 flex flex-wrap items-end gap-3 text-xs font-bold text-gray-600">
            <label className="flex flex-col gap-1 w-full sm:w-auto">
              <span>المحافظة</span>
              <select
                value={govFilter}
                onChange={(e) => setGovFilter(e.target.value)}
                className="h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">كل المحافظات</option>
                {EGYPTIAN_GOVERNORATES.map((g) => (
                  <option key={g.nameAr} value={g.nameAr}>{g.nameAr}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[9rem] sm:flex-none">
              <span>من تاريخ</span>
              <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)} className="h-11 px-3 rounded-xl border border-gray-200 text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
            <label className="flex flex-col gap-1 flex-1 min-w-[9rem] sm:flex-none">
              <span>إلى تاريخ</span>
              <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="h-11 px-3 rounded-xl border border-gray-200 text-sm font-normal text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500" />
            </label>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => {
                  setGovFilter("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="h-11 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        )}

        {/* Bulk actions bar */}
        {selectedOrderIds.length > 0 && (
          <div className="mx-3 sm:mx-4 mb-4 p-3 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold">تم تحديد {selectedOrderIds.length} طلب</span>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="تغيير حالة المحدد"
                disabled={bulkStatusBusy}
                value=""
                onChange={(e) => e.target.value && handleBulkStatus(e.target.value as OrderStatus)}
                className="h-10 px-2 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white outline-none cursor-pointer"
              >
                <option value="" className="text-gray-900">{bulkStatusBusy ? "جاري التحديث..." : "تغيير الحالة إلى..."}</option>
                <option value="confirmed" className="text-gray-900">مؤكد</option>
                <option value="shipped" className="text-gray-900">تم الشحن</option>
                <option value="delivered" className="text-gray-900">تم التوصيل</option>
                <option value="cancelled" className="text-gray-900">ملغي</option>
                <option value="pending" className="text-gray-900">قيد المراجعة</option>
              </select>
              {shipProvider === "bosta" && (
                <button
                  onClick={() => sendToShipping(selectedOrderIds)}
                  disabled={shipBusy}
                  className="h-10 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Truck className="w-4 h-4" /> {shipBusy ? "جاري الإرسال..." : "إرسال للشحن"}
                </button>
              )}
              <button onClick={exportCourierFile} className="h-10 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Truck className="w-4 h-4" /> ملف شحن
              </button>
              <button onClick={exportOrdersCsv} className="h-10 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Download className="w-4 h-4" /> تصدير المحدد
              </button>
              <button onClick={handleBulkDelete} disabled={isDeleting} className="h-10 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Trash2 className="w-4 h-4" /> {isDeleting ? "جاري المسح..." : "حذف"}
              </button>
              <button onClick={() => setSelectedOrderIds([])} className="h-10 px-3 rounded-lg hover:bg-white/10 text-xs font-bold cursor-pointer">إلغاء التحديد</button>
            </div>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Mobile: one card per order */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading && orders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">جاري تحميل الطلبات...</div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">لا توجد طلبات تطابق هذا البحث</div>
          ) : (
            orders.map((ord) => {
              const isChecked = selectedOrderIds.includes(ord.id);
              return (
                <div key={ord.id} className={`p-4 space-y-3 ${isChecked ? "bg-slate-50" : ""}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      aria-label="تحديد الطلب"
                      checked={isChecked}
                      onChange={() => toggleSelectOrder(ord.id)}
                      className="w-5 h-5 mt-1 rounded border-gray-300 cursor-pointer"
                    />
                    <button type="button" onClick={() => setSelectedOrder(ord)} className="flex-1 min-w-0 text-right cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-gray-950 truncate">{ord.customer_name}</span>
                        <span className="font-black text-gray-950 whitespace-nowrap">{ord.final_amount} ج.م</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1 text-xs text-gray-500">
                        <span dir="ltr" className="font-mono">{ord.customer_phone}</span>
                        <span>{ord.governorate}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1.5 text-[11px] text-gray-400">
                        <span className="font-mono truncate">{ord.order_number}</span>
                        <span>{new Date(ord.created_at).toLocaleDateString("ar-EG")} · {ord.quantity} قطع</span>
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(ord.status)}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${ord.customer_phone}`}
                        aria-label="اتصال"
                        className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <a
                        href={`https://wa.me/2${ord.customer_phone.replace(/^0/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="واتساب"
                        className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <select
                        aria-label="تغيير الحالة"
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                        className="h-10 text-xs font-bold rounded-xl border border-gray-200 px-2 bg-white outline-none"
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
              );
            })
          )}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
                <th className="py-3.5 px-4">رقم الطلب</th>
                <th className="py-3.5 px-4">العميل والهاتف</th>
                <th className="py-3.5 px-4">المحافظة</th>
                <th className="py-3.5 px-4 min-w-[220px]">المنتج والباقة المطلوبة</th>
                <th className="py-3.5 px-4">المبلغ</th>
                <th className="py-3.5 px-4">حالة الطلب</th>
                {SAFKA_ENABLED && <th className="py-3.5 px-4">بوابة صفقة</th>}
                <th className="py-3.5 px-4 text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={SAFKA_ENABLED ? 9 : 8} className="py-8 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>جاري تحميل الطلبات...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={SAFKA_ENABLED ? 9 : 8} className="py-12 text-center text-gray-400">
                    لا توجد طلبات تطابق هذا البحث
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const whatsappLink = `https://wa.me/2${ord.customer_phone.replace(/^0/, "")}?text=${encodeURIComponent(
                    `أهلاً بحضرتك يا فندم، بنكلمك من متجرنا لتأكيد طلبك رقم (${ord.order_number}) الخاص بـ ${ord.product?.title_ar || "المنتج"}. العنوان: ${ord.governorate} - ${ord.address}. هل الميعاد مناسب للشحن؟`
                  )}`;

                  const isChecked = selectedOrderIds.includes(ord.id);

                  return (
                    <tr key={ord.id} className={`hover:bg-slate-50/70 transition ${isChecked ? "bg-red-50/40" : ""}`}>
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOrder(ord.id)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                      </td>

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
                        <div className="flex items-center gap-2.5">
                          {ord.product?.images?.[0] ? (
                            <img
                              src={ord.product.images[0]}
                              alt={ord.product.title_ar}
                              className="w-10 h-10 rounded-xl object-cover border border-gray-200 shrink-0 shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-gray-200">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-[220px]">
                            <div className="font-bold text-gray-900 truncate" title={ord.product?.title_ar || "منتج غير محدد"}>
                              {ord.product?.title_ar || "منتج غير محدد"}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                {ord.quantity === 1
                                  ? "قطعة واحدة"
                                  : ord.quantity === 2
                                  ? "قطعتين (عرض خاص)"
                                  : ord.quantity === 3
                                  ? "3 قطع (توفير)"
                                  : `${ord.quantity} قطع`}
                              </span>
                              <span className="font-mono text-gray-400 text-[10px] truncate">
                                /p/{ord.landing_page_slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-gray-900">
                        {ord.final_amount} ج.م
                        <div className="text-[10px] text-gray-400 font-normal">
                          {ord.quantity} قطع
                        </div>
                        {ord.tracking?.payment && (
                          <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.tracking.payment.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {ord.tracking.payment.method === "instapay" ? "إنستاباي" : "فودافون كاش"} · {ord.tracking.payment.status === "paid" ? "وصل" : "منتظر"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                          className="text-xs font-bold rounded-lg border border-gray-200 py-1 px-2 bg-white outline-none cursor-pointer shadow-sm"
                        >
                          <option value="pending">قيد المراجعة</option>
                          <option value="confirmed">مؤكد</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التوصيل</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </td>

                      {SAFKA_ENABLED && (
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
                      )}

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
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

                          {/* Edit Order Button */}
                          <button
                            onClick={() => setEditingOrder(ord)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition cursor-pointer"
                            title="تعديل بيانات الطلب (المنتج، العنوان، السعر)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Details Button */}
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            title="عرض تفاصيل الطلب والتتبع"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete Order Button */}
                          <button
                            onClick={() => handleDeleteOrder(ord.id, ord.order_number)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition cursor-pointer"
                            title="مسح / حذف هذا الطلب نهائياً"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pager (server-side pagination) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-xs font-bold text-gray-600">
          <div className="flex items-center gap-3">
            <span>
              {orders.length === 0
                ? "لا توجد نتائج"
                : `عرض ${(page * pageSize + 1).toLocaleString("en-US")}–${(page * pageSize + orders.length).toLocaleString("en-US")}` +
                  (total !== null ? ` من ${total.toLocaleString("en-US")}${totalCapped ? "+" : ""} طلب` : "")}
            </span>
            <label className="flex items-center gap-1.5">
              <span>في الصفحة</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-11 px-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none"
              >
                {ORDERS_PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 0 || loading}
              className="h-11 min-w-[5.5rem] px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="px-2 whitespace-nowrap">
              صفحة {(page + 1).toLocaleString("en-US")}
              {total !== null && !totalCapped ? ` من ${Math.max(1, Math.ceil(total / pageSize)).toLocaleString("en-US")}` : ""}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={!hasMore || loading}
              className="h-11 min-w-[5.5rem] px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Order Details Drawer / Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end"
          onMouseDown={(e) => e.target === e.currentTarget && setSelectedOrder(null)}
          onKeyDown={(e) => e.key === "Escape" && setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-label="تفاصيل الطلب"
            tabIndex={-1}
            ref={(el) => el?.focus()}
            className="bg-white w-full sm:max-w-md h-full p-5 shadow-2xl border-r border-gray-100 space-y-5 overflow-y-auto outline-none"
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-400">
                  {new Date(selectedOrder.created_at).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}
                </span>
                <h3 className="text-xl font-black text-gray-900 font-heading font-mono">
                  {selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                aria-label="إغلاق"
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status + quick contact */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                {getStatusBadge(selectedOrder.status)}
                <select
                  aria-label="تغيير الحالة"
                  value={selectedOrder.status}
                  onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)}
                  className="h-10 text-xs font-bold rounded-xl border border-gray-200 px-3 bg-white outline-none cursor-pointer"
                >
                  <option value="pending">قيد المراجعة</option>
                  <option value="confirmed">مؤكد</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedOrder.customer_phone}`}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> اتصال
                </a>
                <a
                  href={`https://wa.me/2${selectedOrder.customer_phone.replace(/^0/, "")}?text=${encodeURIComponent(
                    `أهلاً بحضرتك، بنكلمك لتأكيد طلبك رقم (${selectedOrder.order_number}). العنوان: ${selectedOrder.governorate} - ${selectedOrder.address}. هل الميعاد مناسب للشحن؟`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> واتساب
                </a>
              </div>
            </div>

            {/* Manual payment (transfer) */}
            {selectedOrder.tracking?.payment && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">الدفع</h4>
                <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">الطريقة:</span>
                    <span className="font-bold text-gray-900">{selectedOrder.tracking.payment.method === "instapay" ? "تحويل إنستاباي" : "تحويل فودافون كاش"}</span>
                  </div>
                  {selectedOrder.tracking.payment.reference && (
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">رقم العملية:</span>
                      <span className="font-mono font-bold text-gray-900" dir="ltr">{selectedOrder.tracking.payment.reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 items-center">
                    <span className="text-gray-500">الحالة:</span>
                    {selectedOrder.tracking.payment.status === "paid" ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">التحويل وصل ✓</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">في انتظار التحويل</span>
                    )}
                  </div>
                </div>
                {selectedOrder.tracking.payment.status !== "paid" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/orders?id=${encodeURIComponent(selectedOrder.id)}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "confirm_payment" }),
                      });
                      const j = await res.json().catch(() => null);
                      if (j?.success && j.order) {
                        handleOrderUpdated(j.order);
                        fetchOrders({ withTotal: true });
                      } else alert(j?.error || "تعذر تأكيد التحويل");
                    }}
                    className="w-full min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black cursor-pointer"
                  >
                    تأكيد وصول التحويل
                  </button>
                )}
              </div>
            )}

            {/* Shipping */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">الشحن</h4>
              {selectedOrder.tracking?.shipping ? (
                <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">رقم التتبع:</span>
                    <span className="font-mono font-bold text-gray-900" dir="ltr">{selectedOrder.tracking.shipping.tracking_number}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500">الحالة عند الشركة:</span>
                    <span className="font-bold text-gray-900">{selectedOrder.tracking.shipping.state_label || "—"}</span>
                  </div>
                  {selectedOrder.tracking.shipping.note && <p className="text-xs text-amber-800 bg-amber-50 rounded-lg p-2">{selectedOrder.tracking.shipping.note}</p>}
                </div>
              ) : shipProvider === "bosta" ? (
                <button
                  type="button"
                  onClick={() => sendToShipping([selectedOrder.id])}
                  disabled={shipBusy || ["cancelled", "delivered", "returned"].includes(selectedOrder.status)}
                  className="w-full min-h-[48px] rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Truck className="w-4 h-4" /> {shipBusy ? "جاري الإرسال..." : "إرسال لبوسطة"}
                </button>
              ) : (
                <p className="text-xs text-gray-500 leading-relaxed">مفيش شركة شحن متربطة. اربطها من الإعدادات، أو نزّل «ملف شحن» من الطلبات المحددة.</p>
              )}
            </div>

            {/* Product & Offer Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  المنتج والعرض المطلوب
                </h4>
                <button
                  onClick={() => setEditingOrder(selectedOrder)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>تعديل الطلب</span>
                </button>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-gray-200/80 flex items-start gap-4">
                {selectedOrder.product?.images?.[0] ? (
                  <img
                    src={selectedOrder.product.images[0]}
                    alt={selectedOrder.product.title_ar}
                    className="w-16 h-16 rounded-2xl object-cover border border-gray-200 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                    <Package className="w-8 h-8" />
                  </div>
                )}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h5 className="font-black text-gray-950 text-sm leading-snug">
                    {selectedOrder.product?.title_ar || "منتج غير محدد"}
                  </h5>
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                      {selectedOrder.quantity === 1
                        ? "باقة: قطعة واحدة"
                        : selectedOrder.quantity === 2
                        ? "باقة: قطعتين (عرض خاص)"
                        : selectedOrder.quantity === 3
                        ? "باقة: 3 قطع"
                        : `باقة: ${selectedOrder.quantity} قطع`}
                    </span>
                    <span className="text-gray-500 font-mono text-[11px]">
                      SKU: {selectedOrder.product?.sku || "N/A"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 pt-1">
                    <span>صفحة الهبوط:</span>
                    <a
                      href={`/p/${selectedOrder.landing_page_slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline font-mono inline-flex items-center gap-1"
                    >
                      /p/{selectedOrder.landing_page_slug}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
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

            <div className="pt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteOrder(selectedOrder.id, selectedOrder.order_number)}
                  className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الطلب نهائياً</span>
                </button>

                <button
                  onClick={() => setEditingOrder(selectedOrder)}
                  className="py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>تعديل بيانات الطلب</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2.5 px-6 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer hover:bg-slate-800 transition"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          isOpen={!!editingOrder}
          order={editingOrder}
          products={products}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}
