import Link from "react";
import { LayoutDashboard, ExternalLink, ShieldCheck, Zap, BarChart3, Layers, ShoppingBag, ArrowLeft } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-white" dir="rtl">
      {/* Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <header className="border-b border-slate-800 py-5 px-6 relative z-10 backdrop-blur-md bg-slate-900/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shadow-emerald-500/20">
              م
            </div>
            <div>
              <span className="font-heading font-black text-xl tracking-tight block">منصة صفحات الهبوط المركزية</span>
              <span className="text-xs text-slate-400">نظام إدارة مبيعات الدفع عند الاستلام وبوابة صفقة</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/30 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>لوحة التحكم المركزية</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10 space-y-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" /> هندسة مستقلة لصفحات هبوط متعددة مع باك-إند موحد
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-heading leading-tight tracking-tight">
            نظام متكامل لإدارة ونشر وتتبع{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              صفحات الهبوط المستقلة
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed">
            تم بناء المنصة خصيصاً للتجارة الإلكترونية في مصر والدول العربية: تكامل حقيقي مع بوابة صفقة (Safqa)، تتبع مزدوج متطابق عبر Meta Pixel وConversions API (CAPI) مع منع التكرار (Deduplication)، ونظام إضافة صفحات هبوط جديدة عبر الذكاء الاصطناعي دون لمس الباك-إند.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/admin"
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>دخول لوحة التحكم (Admin)</span>
            </a>

            <a
              href="/p/portable-urinal"
              target="_blank"
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>معاينة صفحة المنتج الأولى (Live)</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-white">صفحات هبوط مستقلة التصميم</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              كل منتج يمتلك تصميمه وهويته الخاصة تماماً على مسار فريد، مع ربطها بنفس الباك إند وقاعدة البيانات المركزية دون تكرار للأكواد.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-white">تكامل آمن مع بوابة صفقة (Safqa)</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              تخزين محلي فوري لكل طلب مع إعادة توجيه الفواتير لـ Safqa في الخلفية، ومحاكاة وضع الساند بوكس لتجربة مستمرة دون انقطاع.
            </p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-heading text-white">تتبع ميتا وبيكسل مع Deduplication</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              إرسال أحداث الشراء للـ Browser Pixel وسيرفر CAPI بنفس الـ event_id لمنع الاحتساب المزدوج وتحقيق دقة 100% في إعلانات فيسبوك وإنستغرام.
            </p>
          </div>
        </div>

        {/* Quick Launchpad to First Landing Page */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800/80 to-slate-800/60 border border-emerald-500/30 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-right">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              الصفحة النموذجية الجاهزة للاختبار
            </span>
            <h2 className="text-2xl font-black text-white font-heading">
              وعاء التبول المحمول المطور لكبار السن والسفر
            </h2>
            <p className="text-sm text-slate-300 max-w-xl">
              صفحة مكتملة العناصر: صور عالية الدقة، حزم عروض متعددة، نموذج دفع عند الاستلام مع قائمة المحافظات المصرية، وتأكيد طلب فوري عبر الواتساب.
            </p>
          </div>

          <a
            href="/p/portable-urinal"
            className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm whitespace-nowrap shadow-md transition flex items-center gap-2"
          >
            <span>اختبار الشراء الفعلي</span>
            <ArrowLeft className="w-4 h-4" />
          </a>
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        منصة صفحات الهبوط متعددة المنتجات | متوافقة مع Vercel و GitHub و Supabase
      </footer>
    </div>
  );
}
