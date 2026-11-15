import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dbStore } from "@/lib/db/store";
import { getLandingPageComponent } from "@/landing-pages/registry";
import { MetaPixel } from "@/lib/tracking/meta-pixel";
import { Metadata } from "next";
import { PauseCircle, PackageX } from "lucide-react";
import { FloatingSalesAgent } from "@/components/chat/FloatingSalesAgent";
import { getBrand } from "@/lib/brand";
import { SimpleProductPage } from "@/components/store/SimpleProductPage";
import { SITE_NAME, absoluteUrl, getSiteUrl, shortText } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const lp = await dbStore.getLandingPage(params.slug);
  if (!lp) return { title: "الصفحة غير موجودة", robots: { index: false, follow: false } };

  const title = `${lp.title} | عرض خاص والدفع عند الاستلام`;
  const description =
    shortText(lp.product?.description_ar, 160) ||
    "عرض حصري في مصر، شحن مجاني لكل المحافظات، ادفع عند الاستلام بعد المعاينة، وضمان استبدال 14 يوم.";
  const image = absoluteUrl(lp.product?.images?.[0]);
  const url = `${getSiteUrl()}/p/${lp.slug || params.slug}`;
  // Paused/draft pages must not be indexed
  const indexable = lp.status === "active";

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "ar_EG",
      siteName: SITE_NAME,
      url,
      title: lp.title,
      description,
      images: image ? [{ url: image, alt: lp.title }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: lp.title,
      description,
      images: image ? [image] : [],
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

  // Regular-store mode: render the simple product page instead of the sales-funnel landing page
  if ((await getBrand()).store_mode === "catalog") {
    const settingsC = await dbStore.getSettings();
    const pixelC = landingPage.meta_pixel_id || settingsC.default_meta_pixel_id;
    const prodC: any = { ...landingPage.product };
    for (const f of ["cost_price", "safka_product_id", "safka_property_id", "safka_commission", "safka_raw"]) {
      delete prodC[f];
    }
    const lpC: any = { ...landingPage, product: prodC };
    delete lpC.meta_capi_token;
    return (
      <>
        <MetaPixel pixelId={pixelC} />
        <SimpleProductPage product={prodC} landingPage={lpC} />
        <FloatingSalesAgent currentProduct={prodC} />
      </>
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

  // Never serialize secrets or internal business data into the public page HTML
  const publicProduct: any = { ...landingPage.product };
  for (const f of ["cost_price", "safka_product_id", "safka_property_id", "safka_commission", "safka_raw"]) {
    delete publicProduct[f];
  }
  const publicLandingPage: any = { ...landingPage, product: publicProduct };
  delete publicLandingPage.meta_capi_token;

  return (
    <>
      <MetaPixel pixelId={pixelId} />
      <Component product={publicProduct} landingPage={publicLandingPage} />

      {/* Floating AI Sales Closer Chat Widget */}
      <FloatingSalesAgent currentProduct={publicProduct} />
    </>
  );
}
