import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { isAdminRequest } from "@/lib/auth/session";

export const runtime = "edge";

// Internal business fields never shown to visitors (cost, supplier ids, commissions)
const PRIVATE_PRODUCT_FIELDS = [
  "cost_price",
  "safka_product_id",
  "safka_property_id",
  "safka_commission",
  "safka_raw",
] as const;

export async function GET(req: NextRequest) {
  try {
    const isAdmin = isAdminRequest(req);
    if (isAdmin) dbStore.refreshCatalogCache(); // the admin list always shows the latest save
    const products = await dbStore.getProducts();
    if (isAdmin) {
      return NextResponse.json({ success: true, products });
    }
    const publicProducts = products.map((p) => {
      const copy: any = { ...p };
      for (const f of PRIVATE_PRODUCT_FIELDS) delete copy[f];
      return copy;
    });
    return NextResponse.json({ success: true, products: publicProducts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title_ar) {
      return NextResponse.json({ success: false, error: "اسم المنتج مطلوب" }, { status: 400 });
    }

    // Saves the product and auto-creates (or ensures) its landing page.
    // On the D1 catalog backend both happen in ONE transaction.
    const { product, landingPage: lp } = await dbStore.saveProductWithLandingPage(body, true);

    return NextResponse.json({
      success: true,
      message: "تم حفظ المنتج وإنشاء صفحة الهبوط بنجاح",
      product,
      landing_page_id: lp?.id,
      landing_page_url: `/p/${product.slug}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "معرف المنتج مطلوب للتعديل" }, { status: 400 });
    }

    // Sync landing page title and slug if updated (one transaction with the product on the D1 backend)
    const { product } = await dbStore.saveProductWithLandingPage(
      body,
      Boolean((body.title_ar || body.slug) && !body.skip_lp_sync)
    );

    return NextResponse.json({
      success: true,
      message: "تم تعديل بيانات المنتج وصفحة الهبوط بنجاح",
      product,
      landing_page_url: `/p/${product.slug}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "معرف المنتج (id) مطلوب للحذف" }, { status: 400 });
    }

    const deleted = await dbStore.deleteProduct(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "المنتج غير موجود أو تعذر حذفه" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج وصفحة الهبوط المرتبطة به بنجاح",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
