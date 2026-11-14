import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db/store";
import { getLandingPageComponent } from "@/landing-pages/registry";
import { MetaPixel } from "@/lib/tracking/meta-pixel";
import { Metadata } from "next";
import { PauseCircle, PackageX } from "lucide-react";
import { FloatingSalesAgent } from "@/components/chat/FloatingSalesAgent";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const landingPages = await dbStore.getLandingPages();
  return landingPages.map((lp) => ({ slug: lp.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lp = await dbStore.getLandingPage(params.slug);
  if (!lp) return { title: "الصفحة غير موجودة" };

  return {
    title: `${lp.title} | عرض خاص والدفع عند الاستلام`,
    description: lp.product?.description_ar || "عرض حصري في مصر والدفع عند الاستلام",
    openGraph: {
      title: lp.title,
      description: lp.product?.description_ar,
      images: lp.product?.images?.[0] ? [{ url: lp.product.images[0] }] : [],
    },
  };
}

export default async function DynamicLandingPage({ params }: PageProps) {
  const landingPage = await dbStore.getLandingPage(params.slug);

  if (!landingPage || !landingPage.product) {
    notFound();
  }

  // Handle Paused Landing Pages
  if (landingPage.status === "paused") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4">
            <PauseCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2 font-heading">
            هذا العرض متوقف مؤقتاً
          </h1>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            تم إيقاف استقبال الطلبات على هذه الصفحة مؤقتاً بسبب نفاد الكمية المتاحة حالياً في المخزن أو انتهاء فترة العرض الترويجي.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 text-xs text-gray-500">
            تابعنا للحصول على إشعار عند توفر دفعات جديدة من المنتج.
          </div>
        </div>
      </div>
    );
  }

  // Resolve dedicated component from registry
  const Component = getLandingPageComponent(landingPage.component_key || landingPage.slug);

  if (!Component) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-right" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 mx-auto flex items-center justify-center mb-4">
            <PackageX className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            قالب الصفحة غير مسجل
          </h1>
          <p className="text-xs text-gray-600">
            مفتاح المكون <code className="bg-gray-100 px-1 py-0.5 rounded">{landingPage.component_key}</code> غير مسجل في `src/landing-pages/registry.ts`.
          </p>
        </div>
      </div>
    );
  }

  const settings = await dbStore.getSettings();
  const pixelId = landingPage.meta_pixel_id || settings.default_meta_pixel_id;

  return (
    <>
      <MetaPixel pixelId={pixelId} />
      <Component product={landingPage.product} landingPage={landingPage} />

      {/* Floating AI Sales Closer Chat Widget */}
      <FloatingSalesAgent currentProduct={landingPage.product} />
    </>
  );
}
