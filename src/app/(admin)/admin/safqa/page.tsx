"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  Link2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Truck,
  ArrowRight,
  Search,
  Eye,
  EyeOff,
  DollarSign,
  Layers,
  Settings2,
  KeyRound,
  Sparkles,
} from "lucide-react";

export default function AdminSafqaPage() {
  const [settings, setSettings] = useState<any>({
    safqa_api_secret_token: "",
    safqa_auto_forward: true,
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Test Connection State
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Price List Sync State
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [priceSyncResult, setPriceSyncResult] = useState<any>(null);

  // Safka Products Catalog State
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [safkaProducts, setSafkaProducts] = useState<any[]>([]);
  const [productQuery, setProductQuery] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{ [id: string]: { success: boolean; url?: string; message?: string } }>({});

  // Host URL for webhooks
  const [customOrigin, setCustomOrigin] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCustomOrigin(window.location.origin);
    }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.settings) {
        setSettings(json.settings);
      }
    } catch (err) {
      console.error("[Fetch Settings Error]", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      }
    } catch (err) {
      console.error("[Save Settings Error]", err);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/safqa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_connection" }),
      });
      const json = await res.json();
      setTestResult(json);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `تعذر الاتصال بالسيرفر: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncPriceList = async () => {
    setSyncingPrices(true);
    setPriceSyncResult(null);

    try {
      const res = await fetch("/api/safqa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_price_list" }),
      });
      const json = await res.json();
      setPriceSyncResult(json);
    } catch (err: any) {
      setPriceSyncResult({
        success: false,
        message: `تعذر مزامنة الأسعار: ${err.message}`,
      });
    } finally {
      setSyncingPrices(false);
    }
  };

  const handleFetchSafkaProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/safqa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch_products", query: productQuery }),
      });
      const json = await res.json();
      if (json.success && json.products) {
        setSafkaProducts(json.products);
      } else {
        alert(json.error || "تعذر جلب المنتجات من صفقة. تأكد من إدخال مفتاح الـ API أولاً.");
      }
    } catch (err: any) {
      alert(`خطأ: ${err.message}`);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleImportSingleProduct = async (prod: any) => {
    const prodId = prod._id || prod.id;
    setImportingId(prodId);
    try {
      const res = await fetch("/api/safqa/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_product", productData: prod }),
      });
      const json = await res.json();
      if (json.success) {
        setImportResults((prev) => ({
          ...prev,
          [prodId]: {
            success: true,
            url: json.landing_page_url,
            message: "تم الاستيراد وتوليد صفحة الهبوط بنجاح!",
          },
        }));
      } else {
        setImportResults((prev) => ({
          ...prev,
          [prodId]: {
            success: false,
            message: json.error || "فشل الاستيراد",
          },
        }));
      }
    } catch (err: any) {
      setImportResults((prev) => ({
        ...prev,
        [prodId]: {
          success: false,
          message: err.message,
        },
      }));
    } finally {
      setImportingId(null);
    }
  };

  // Safe Origin
  const effectiveOrigin = customOrigin || "https://ecommerce-landing-platform.vercel.app";

  // Webhook URLs
  const productWebhookUrl = `${effectiveOrigin}/api/safqa/products`;
  const orderWebhookUrl = `${effectiveOrigin}/api/safqa/orders`;
  const callbackApiUrl = `${effectiveOrigin}/api/safqa/connect-callback`;
  const redirectAdminUrl = `${effectiveOrigin}/admin/safqa`;

  // Safka Direct Connect Link
  const safkaDirectConnectUrl = `https://aff.safka-eg.com/intergations/apiSafkaKeys/connect?name=RexRack&redirectUrl=${encodeURIComponent(
    redirectAdminUrl
  )}&productHook=${encodeURIComponent(productWebhookUrl)}&orderHook=${encodeURIComponent(
    orderWebhookUrl
  )}&callbackAPI=${encodeURIComponent(callbackApiUrl)}`;

  return (
    <div className="space-y-8 text-right font-sans max-w-5xl mx-auto pb-16" dir="rtl">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold font-mono">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>منظومة دروبشيبينغ صفقة مصر (Safka Egypt)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-heading text-white tracking-tight">
              الربط المباشر مع منصة صفقة (Safka Egypt)
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              عند إضافة أي منتج من حسابك في صفقة، يستقبله متجر <strong className="text-white">RexRack</strong> تلقائياً
              ويولد له صفحة هبوط تسويقية فورية. وعندما يطلب العميل بنظام الدفع عند الاستلام (COD)، يتم ترحيل الطلب
              لحسابك في صفقة تلقائياً لشحنه وحساب عمولتك.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              href={safkaDirectConnectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition transform active:scale-95 text-center cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>ربط حسابك بضغطة زر واحدة</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">طريقة العمل</span>
            <span className="text-xs font-bold text-slate-200">دروبشيبينغ & COD</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">شحن المحافظات</span>
            <span className="text-xs font-bold text-slate-200">27 محافظة مصرية</span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">ترحيل الطلبات</span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> فوري وتلقائي
            </span>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
            <span className="text-[11px] text-slate-400 block">توليد صفحات الهبوط</span>
            <span className="text-xs font-bold text-orange-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> تلقائي من صفقة
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>تم حفظ وتحديث إعدادات منصة صفقة بنجاح!</span>
        </div>
      )}

      {/* Grid: Settings & Webhook URLs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Credentials & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-black text-slate-900 font-heading">مفتاح API الخاص بصفقة</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono">api-safka-key</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                مفتاح الـ API (Secret API Key)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  dir="ltr"
                  value={settings.safqa_api_secret_token || ""}
                  onChange={(e) =>
                    setSettings({ ...settings, safqa_api_secret_token: e.target.value })
                  }
                  placeholder="ألصق مفتاح api-safka-key هنا..."
                  className="w-full pl-24 pr-4 py-3 rounded-xl border border-slate-300 font-mono text-sm text-left outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-slate-50/50"
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                    title={showApiKey ? "إخفاء" : "إظهار"}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {settings.safqa_api_secret_token && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(settings.safqa_api_secret_token, "key")}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                      title="نسخ"
                    >
                      {copiedKey === "key" ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
                يمكنك الحصول عليه مباشرة من لوحة صفقة عبر الضغط على الزر البرتقالي بالأعلى، أو من حسابك في صفقة &gt;
                الإعدادات &gt; المفاتيح البرمجية (API Keys).
              </p>
            </div>

            {/* Toggle: Auto Forward Orders */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  إرسال طلبات الشراء إلى صفقة تلقائياً
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block leading-normal">
                  بمجرد أن يقوم العميل بتأكيد طلبه في أي صفحة هبوط، يتم إرسال بيانات الشحن فوراً لسيرفرات صفقة للبدء في
                  التجهيز والشحن.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.safqa_auto_forward !== false}
                onChange={(e) => setSettings({ ...settings, safqa_auto_forward: e.target.checked })}
                className="w-5 h-5 text-orange-600 rounded cursor-pointer accent-orange-600 shrink-0"
              />
            </div>

            {/* Buttons: Test & Save */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin text-orange-600" : ""}`} />
                  <span>{testing ? "جاري الفحص مع سيرفر صفقة..." : "فحص الاتصال بالـ API"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncPriceList}
                  disabled={syncingPrices}
                  className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                  title="مزامنة معرفات المحافظات من صفقة"
                >
                  <Truck className={`w-4 h-4 ${syncingPrices ? "animate-spin text-orange-600" : ""}`} />
                  <span>{syncingPrices ? "مزامنة..." : "تحديث أسعار الشحن"}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md shadow-orange-600/20 transition cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </button>
            </div>

            {/* Live Test Feedback Banner */}
            {testResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  testResult.success
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.success ? "الاتصال ناجح 100%" : "فشل الاتصال"}</span>
                </div>
                <p>{testResult.message}</p>
                {testResult.data && (
                  <pre
                    dir="ltr"
                    className="p-2 rounded-lg bg-black/5 font-mono text-[10px] overflow-x-auto max-h-24"
                  >
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Price Sync Feedback Banner */}
            {priceSyncResult && (
              <div
                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  priceSyncResult.success
                    ? "bg-sky-50 border-sky-200 text-sky-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-sky-900">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{priceSyncResult.message}</span>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Webhook Endpoints & Setup (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-orange-500" />
                <h2 className="text-base font-black text-slate-900 font-heading">
                  روابط الويب هوك (Webhooks)
                </h2>
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                جاهزة وتعمل
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              إذا قمت بإضافة الربط يدوياً في لوحة تحكم صفقة، انسخ هذه الروابط في الحقول المخصصة لها:
            </p>

            {/* 1. Product Webhook Card */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-orange-600" />
                  <span>رابط إضافة المنتجات (productHook)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(productWebhookUrl, "prodHook")}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "prodHook" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                dir="ltr"
                readOnly
                value={productWebhookUrl}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-left text-slate-700 select-all"
              />
              <span className="text-[10px] text-slate-400 block">
                الوظيفة: عند الضغط على "إرسال للمتجر" في صفقة، يتم استلام المنتج وتوليد صفحة هبوط له فوراً.
              </span>
            </div>

            {/* 2. Order Webhook Card */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-600" />
                  <span>رابط تحديث حالات الطلبات (orderHook)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(orderWebhookUrl, "ordHook")}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "ordHook" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                dir="ltr"
                readOnly
                value={orderWebhookUrl}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-left text-slate-700 select-all"
              />
              <span className="text-[10px] text-slate-400 block">
                الوظيفة: يستقبل حالات الشحن والتسليم والأرباح من صفقة لتحديث متجرك تلقائياً.
              </span>
            </div>

            {/* 3. Connect Callback Card */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                  <span>رابط التفويض (callbackAPI)</span>
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(callbackApiUrl, "callHook")}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "callHook" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                dir="ltr"
                readOnly
                value={callbackApiUrl}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs text-left text-slate-700 select-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog Explorer from Safka */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 font-heading flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-orange-500" />
              <span>مستكشف منتجات صفقة (Safka Catalog)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              استعرض المنتجات المتاحة في حسابك على صفقة واستورد أي منتج بضغطة زر لإنشاء صفحة هبوط له في RexRack
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="ابحث بالاسم أو الباركود..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs outline-hidden focus:ring-2 focus:ring-orange-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <button
              type="button"
              onClick={handleFetchSafkaProducts}
              disabled={loadingProducts}
              className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? "animate-spin" : ""}`} />
              <span>{loadingProducts ? "جاري الجلب..." : "جلب المنتجات"}</span>
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        {safkaProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safkaProducts.map((p) => {
              const prodId = p._id || p.id;
              const title = p.name || p.title || "منتج من صفقة";
              const img = p.image || p.images?.[0] || "/images/hero-organizer.jpg";
              const costPrice = p.properties?.[0]?.min || p.min_price || p.sale_price || 0;
              const salePrice = p.properties?.[0]?.value || p.sale_price || costPrice;
              const estCommission = Math.max(0, salePrice - costPrice);
              const result = importResults[prodId];

              return (
                <div
                  key={prodId}
                  className="bg-slate-50 rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:border-orange-300 transition space-y-3"
                >
                  <div className="flex gap-3 items-start">
                    <img
                      src={img}
                      alt={title}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                      onError={(e: any) => {
                        e.target.src = "/images/hero-organizer.jpg";
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">
                        {title}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        ID: {prodId.substring(0, 10)}...
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-black text-orange-600 font-mono">
                          {salePrice} ج.م
                        </span>
                        {estCommission > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            عمولة: +{estCommission} ج.م
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {result ? (
                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      {result.success ? (
                        <>
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{result.message}</span>
                          </div>
                          {result.url && (
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                            >
                              <span>معاينة صفحة الهبوط</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </>
                      ) : (
                        <div className="text-xs font-bold text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{result.message}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleImportSingleProduct(p)}
                      disabled={importingId === prodId}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60"
                    >
                      <Layers className={`w-3.5 h-3.5 ${importingId === prodId ? "animate-spin" : ""}`} />
                      <span>{importingId === prodId ? "جاري الاستيراد وتوليد الصفحة..." : "استيراد وإنشاء صفحة هبوط"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">
              لم يتم جلب أي منتجات حتى الآن
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              تأكد من إدخال مفتاح الـ API ثم اضغط على زر "جلب المنتجات" بالأعلى لاستعراض كتالوج منتجاتك المتاحة في صفقة.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}