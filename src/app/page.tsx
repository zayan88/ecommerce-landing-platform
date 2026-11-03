import React from "react";
import Link from "next/link";
import { dbStore } from "@/lib/db/store";
import { MetaPixel } from "@/lib/tracking/meta-pixel";
import { UrgencyBar } from "@/components/shared/UrgencyBar";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
  Star,
  ShoppingBag,
  ArrowLeft,
  Lock,
  Sparkles,
  PhoneCall,
  Clock,
  BadgePercent,
  Check,
  X,
  ChevronLeft,
  HelpCircle,
  Flame,
  HeartHandshake,
} from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RexRack - متجرك الأول للمنتجات الذكية والعصرية في مصر",
  description:
    "تسوق أحدث المنتجات الذكية والمنظمات العصرية مع RexRack في مصر. دفع عند الاستلام، معاينة الشحنة قبل الدفع، وشحن سريع لجميع محافظات مصر خلال 24-48 ساعة.",
  openGraph: {
    title: "RexRack - عروض حصرية في مصر",
    description: "معاينة مجانية قبل الدفع + دفع عند الاستلام + ضمان 14 يوم",
    type: "website",
  },
};

export default async function HomePage() {
  const products = await dbStore.getProducts();
  const landingPages = await dbStore.getLandingPages();
  const settings = await dbStore.getSettings();
  const pixelId = settings.default_meta_pixel_id || "1636283807582751";

  // Map each product to its landing page slug
  const productCards = products
    .filter((p) => p.status === "active")
    .map((product) => {
      const lp = landingPages.find((l) => l.product_id === product.id) || {
        slug: product.slug,
        title: product.title_ar,
      };
      const discount = product.compare_at_price
        ? Math.round(((product.compare_at_price - product.base_price) / product.compare_at_price) * 100)
        : 0;

      return {
        ...product,
        landingSlug: lp.slug,
        discountPercentage: discount,
      };
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white font-sans" dir="rtl">
      {/* Meta Facebook Pixel */}
      <MetaPixel pixelId={pixelId} />

      {/* Top Flash Urgency Announcement Bar */}
      <UrgencyBar />

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-600/25 group-hover:scale-105 transition">
              R
            </div>
            <div>
              <span className="text-2xl font-black font-heading text-slate-900 tracking-tight block">
                RexRack
              </span>
              <span className="text-[11px] font-bold text-gray-500 block -mt-0.5">
                الجودة والابتكار في مكان واحد 🇪🇬
              </span>
            </div>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <a href="#products" className="hover:text-emerald-600 transition">
              المنتجات والعروض
            </a>
            <a href="#features" className="hover:text-emerald-600 transition">
              مميزات التسوق
            </a>
            <a href="#reviews" className="hover:text-emerald-600 transition">
              آراء العملاء
            </a>
            <a href="#faq" className="hover:text-emerald-600 transition">
              الأسئلة الشائعة
            </a>
          </nav>

          {/* Direct CTA */}
          <div className="flex items-center gap-3">
            <a
              href="#products"
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/30 transition flex items-center gap-2 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>تصفح المنتجات</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/30 py-16 md:py-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tag badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs md:text-sm font-extrabold border border-emerald-200 shadow-xs">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>المتجر المصري المعتمد للمنتجات العصرية الذكية</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black font-heading text-slate-900 leading-tight tracking-tight">
              تسوق أرقى المنتجات الذكية{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                بأعلى جودة وأفضل سعر
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              في RexRack، راحتك وأمانك هما أولويتنا: نوفر لك إمكانية{" "}
              <span className="font-bold text-slate-900 underline decoration-emerald-500 decoration-2">
                معاينة وفحص المنتج بنفسك أمام مندوب الشحن قبل دفع أي مليم
              </span>
              ، مع الدفع عند الاستلام وضمان استبدال مجاني 14 يوماً.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#products"
                className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base shadow-xl shadow-emerald-600/30 hover:shadow-emerald-600/40 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>شاهد المنتجات الحصرية (خصومات حتى 50%)</span>
              </a>

              <a
                href="https://wa.me/201000000000?text=مرحباً%20RexRack،%20أود%20الاستفسار%20عن%20العروض"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-white hover:bg-gray-100 text-slate-800 font-bold text-base border border-gray-300 shadow-sm transition flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-5 h-5 text-emerald-600" />
                <span>تواصل معنا على واتساب</span>
              </a>
            </div>

            {/* 4 Pillars Trust Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-right">
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">معاينة قبل الدفع</h4>
                  <p className="text-[11px] text-gray-500">افحص طلبك براحتك</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">شحن سريع 24-48 ساعة</h4>
                  <p className="text-[11px] text-gray-500">لكافة المحافظات المصرية</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">استبدال 14 يوماً</h4>
                  <p className="text-[11px] text-gray-500">ضمان ذهبي بدون تعقيد</p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">خدمة عملاء 24/7</h4>
                  <p className="text-[11px] text-gray-500">متابعة هاتفية وتأكيد فوري</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Showcase Section */}
      <section id="products" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <BadgePercent className="w-4 h-4" /> العروض والمنتجات المتاحة الآن
          </div>
          <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900">
            اختر منتجك واستمتع بأقوى العروض
          </h2>
          <p className="text-sm text-gray-600">
            جميع المنتجات متوفرة وجاهزة للشحن الفوري لباب بيتك مع خيار الدفع عند الاستلام.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {productCards.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-gray-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group"
            >
              {/* Product Image Container */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                <img
                  src={product.images[0]}
                  alt={product.title_ar}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  {product.discountPercentage > 0 && (
                    <span className="px-3 py-1 rounded-full bg-red-600 text-white font-black text-xs shadow-md">
                      خصم {product.discountPercentage}%
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-bold text-[10px]">
                    معاينة قبل الدفع
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.9 (تقييمات ممتازة)</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-emerald-600 transition">
                    {product.title_ar}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                    {product.description_ar}
                  </p>
                </div>

                {/* Offers Highlight */}
                <div className="bg-slate-50 rounded-2xl p-3 border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>متوفر في المخزن - شحن فوري اليوم</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Truck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>شحن مجاني متوفر عند طلب قطعتين</span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block line-through">
                      {product.compare_at_price} ج.م
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-heading text-emerald-600">
                        {product.base_price}
                      </span>
                      <span className="text-xs font-bold text-gray-600">جنيه مصري</span>
                    </div>
                  </div>

                  <Link
                    href={`/p/${product.landingSlug}`}
                    className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-md transition flex items-center gap-1.5 active:scale-95 group/btn"
                  >
                    <span>طلب المنتج الآن</span>
                    <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why RexRack Section */}
      <section id="features" className="py-20 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              ضمانات RexRack الذهبية
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900">
              لماذا يثق بنا آلاف العملاء في مصر؟
            </h2>
            <p className="text-sm text-gray-600">
              تسوق وأنت مطمئن البال بنسبة 100%. نظامنا مبني بالكامل لحماية حق المشتري.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-slate-900">
                1. فحص الشحنة قبل الاستلام
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                لك كامل الحق في فتح الطرد ومعاينة المنتج والتأكد من مطابقته للمواصفات المعروضة قبل تسليم أي مبلغ للمندوب.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Truck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-slate-900">
                2. شحن مباشر لجميع المحافظات
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                نتعامل مع كبرى شركات الشحن المصرية لضمان وصول طلبك لباب بيتك خلال 24 إلى 48 ساعة أينما كنت في محافظات مصر.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-gray-200/80 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                <RotateCcw className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-heading text-slate-900">
                3. استبدال واسترجاع 14 يوم
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                في حال وجود أي عيب صناعة أو عدم مطابقة، نوفر لك استبدالاً فورياً مجانياً أو استرداد كامل أموالك دون أي تعقيد.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs RexRack Solution Section (Lovable / High-Converting Pattern) */}
      <section className="py-16 bg-slate-50 border-b border-gray-200 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-emerald-700 bg-emerald-100/60 px-3.5 py-1 rounded-full border border-emerald-200">
              المقارنة الحقيقية
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 font-heading">
              لماذا RexRack أفضل بمراحل من المنتجات التقليدية؟
            </h2>
            <p className="text-sm text-gray-600">
              شاهد الفرق العملي بين الشراء من السوق التقليدي والشراء من RexRack المعتمد
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old / Conventional Way */}
            <div className="p-6 md:p-8 rounded-3xl bg-red-50/60 border border-red-200 space-y-4">
              <div className="flex items-center gap-2.5 text-red-600 font-black text-lg font-heading">
                <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                  <X className="w-5 h-5 stroke-[3]" />
                </div>
                <span>المنتجات العادية في السوق</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>خامات بلاستيكية ومقلدة تتلف وتنكسر سريعاً بعد أيام قليلة.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>لا يوجد أي ضمان حقيقي ولا خدمة ما بعد البيع إذا ظهر عيب بالمنتج.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>مندوب الشحن يجبرك على دفع الحساب قبل أن تفتح وتفحص محتويات الطرد.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>تأخير طويل في التوصيل لعدة أسابيع دون أي تواصل أو متابعة.</span>
                </li>
              </ul>
            </div>

            {/* The RexRack Way */}
            <div className="p-6 md:p-8 rounded-3xl bg-emerald-50/80 border-2 border-emerald-500 space-y-4 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2.5 text-emerald-700 font-black text-lg font-heading">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <span>حلول RexRack الأصلية المعتمدة</span>
              </div>

              <ul className="space-y-3 text-sm text-gray-800">
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>خامات فاخرة متينة ومختبرة بأعلى معايير الجودة لتتحمل الاستخدام الشاق.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>ضمان استبدال واسترجاع حقيقي لمدة 14 يوماً مع دعم فني متواصل 24/7.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>حقك الكامل في فتح الطرد ومعاينة المنتج أمام المندوب قبل دفع مليم واحد.</span>
                </li>
                <li className="flex items-start gap-2.5 font-bold">
                  <span className="text-emerald-600">✓</span>
                  <span>شحن سريع لجميع محافظات مصر الـ 27 خلال 24 - 48 ساعة لباب بيتك.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Simple Order Section */}
      <section className="py-16 bg-white border-b border-gray-200 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              تجربة تسوق مريحة
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 font-heading">
              كيف تتسوق من RexRack في 3 خطوات بسيطة؟
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-xl flex items-center justify-center mx-auto">
                1
              </div>
              <h3 className="font-heading font-black text-base text-slate-900">اختر منتجك</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                تصفح العروض واضغط على زر "طلب المنتج" ثم اكتب بياناتك في أقل من 30 ثانية.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 font-black text-xl flex items-center justify-center mx-auto">
                2
              </div>
              <h3 className="font-heading font-black text-base text-slate-900">تأكيد وشحن فوري</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                يتصل بك فريق المبيعات هاتفياً لتأكيد الأوردر ومراجعة العنوان ويتم الشحن في نفس اليوم.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-gray-200 shadow-xs text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 font-black text-xl flex items-center justify-center mx-auto">
                3
              </div>
              <h3 className="font-heading font-black text-base text-slate-900">معاينة واستلام</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                عاين طلبك وافحصه وتأكد من جودته أمام مندوب شركة الشحن، ثم ادفع نقداً أو بمحفظة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Golden Guarantee Certificate */}
      <section className="py-14 px-4 max-w-4xl mx-auto">
        <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-amber-300 shadow-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
            <HeartHandshake className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-black font-heading text-amber-950">
            شهادة ضمان RexRack الذهبية 100%
          </h3>

          <p className="text-sm text-gray-700 max-w-2xl mx-auto leading-relaxed">
            نحن واثقون تماماً من جودة وفائدة منتجاتنا. لذلك نمنحك ضماناً حقيقياً لمدة 14 يوماً كاملاً: إذا وجدت أي عيب صناعة أو لم يكن المنتج مطابقاً تماماً لما رأيته، سنقوم باستبداله فوراً مجاناً أو استرداد كامل المبلغ دون أي تعقيد.
          </p>

          <div className="pt-2 flex items-center justify-center gap-6 text-xs font-bold text-amber-900">
            <span>✓ ضمان استبدال 14 يوم</span>
            <span>•</span>
            <span>✓ معاينة كاملة قبل الدفع</span>
            <span>•</span>
            <span>✓ دعم فني متواصل 24/7</span>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            تجارب حقيقية موثقة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900">
            ماذا يقول عملاؤنا بعد التجربة؟
          </h2>
          <p className="text-sm text-gray-600">
            آراء عملاء حقيقيين استلموا وعاينوا طلباتهم من RexRack في مختلف المحافظات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              "المنتج ممتاز والخامات قوية جداً وتستاهل كل مليم. الأهم إن المندوب استنى لما فتحت الكرتونة واتأكدت بنفسي قبل ما أدفع. شكراً RexRack على الاحترام والأمانة."
            </p>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 block">م. أحمد الشناوي</span>
                <span className="text-xs text-gray-500">القاهرة - التجمع الخامس</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                مشتري موثق ✓
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              "سرعة التوصيل خرافية، طلبت العرض الساعة 2 الظهر وصلني تاني يوم الصبح في الإسكندرية. التغليف محكم والمنتج شغال بكفاءة عالية جداً."
            </p>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 block">د. هبة محمود</span>
                <span className="text-xs text-gray-500">الإسكندرية - سموحة</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                مشتري موثق ✓
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              "خدمة العملاء محترمة جداً، كلموني أكدوا معايا الأوردر وتابعوا معايا لحد ما استلمت. منتجات نضيفة وأسعار أوفر كتير من المحلات."
            </p>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 block">ك. طارق فهمي</span>
                <span className="text-xs text-gray-500">الجيزة - الدقي</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                مشتري موثق ✓
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              إجابات سريعة
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-heading text-slate-900">
              الأسئلة الأكثر شيوعاً
            </h2>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>هل مسموح لي بفتح الشحنة وفحصها قبل الدفع؟</span>
              </h4>
              <p className="text-sm text-gray-600 pr-7 leading-relaxed">
                نعم بكل تأكيد! يحق لك فحص ومعاينة المنتج والتأكد من جودته ومطابقته التامة أمام مندوب شركة الشحن قبل دفع أي مبالغ نقدية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>متى سيصلني الطلب بعد تأكيده؟</span>
              </h4>
              <p className="text-sm text-gray-600 pr-7 leading-relaxed">
                يصل الطلب خلال 24 إلى 48 ساعة فقط في محافظات القاهرة الكبرى والإسكندرية ومدن القناة، وخلال 2 إلى 3 أيام لباقي محافظات الدلتا والصعيد.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>ما هي طرق الدفع المتاحة في المتجر؟</span>
              </h4>
              <p className="text-sm text-gray-600 pr-7 leading-relaxed">
                نوفر خيار الدفع نقداً عند الاستلام (COD) وهو الأكثر شيوعاً، بالإضافة إلى الدفع الإلكتروني بالبطاقات البنكية والمحافظ الإلكترونية عبر بوابة دفع صفقة (Safqa) المشفرة والآمنة.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-gray-200 space-y-2">
              <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>ماذا لو أردت استبدال أو إرجاع المنتج؟</span>
              </h4>
              <p className="text-sm text-gray-600 pr-7 leading-relaxed">
                نقدم ضمان استبدال واسترجاع لمدة 14 يوماً. ما عليك سوى مراسلتنا عبر الواتساب أو الهاتف وسيتولى مندوبنا استبدال الشحنة حتى باب منزلك.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white py-14 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-xl flex items-center justify-center">
                R
              </div>
              <div>
                <span className="font-black font-heading text-xl text-white">RexRack</span>
                <p className="text-xs text-slate-400">منصة التجارة الإلكترونية الموثوقة في مصر</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 font-bold">
              <span>🇪🇬 شحن لـ 27 محافظة</span>
              <span>•</span>
              <span>💵 الدفع عند الاستلام</span>
              <span>•</span>
              <span>🔄 ضمان 14 يوم</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} RexRack (RexRack.com) - جميع الحقوق محفوظة.</p>

            {/* Discreet Admin Login Link for the Owner */}
            <Link
              href="/admin"
              className="text-slate-600 hover:text-slate-400 flex items-center gap-1 transition text-[11px]"
              title="دخول المسؤول"
            >
              <Lock className="w-3 h-3" />
              <span>لوحة التحكم المركزية</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href="https://wa.me/201000000000?text=مرحباً%20RexRack،%20أود%20الاستفسار%20عن%20العروض%20المتاحة"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group"
      >
        <span className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-lg">
          تواصل معنا على واتساب
        </span>
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      </a>
    </div>
  );
}
