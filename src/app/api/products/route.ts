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
    const body = id ? {} : await req.json().catch(() => ({}));

    // Bulk: { ids: [...] } removes up to 100 products (and their pages) in one request
    if (!id && Array.isArray(body.ids)) {
      const ids: string[] = body.ids.filter((x: unknown) => typeof x === "string" && x.length > 0 && x.length <= 120).slice(0, 100);
      if (ids.length === 0) return NextResponse.json({ success: false, error: "اختار منتج واحد على الأقل" }, { status: 400 });
      let deleted = 0;
      for (const pid of ids) {
        if (await dbStore.deleteProduct(pid).catch(() => false)) deleted++;
      }
      return NextResponse.json({ success: true, deleted, requested: ids.length });
    }
    if (!id) id = body.id;

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

/** Bulk visibility: { ids: [...], status: "active" | "draft" } shows or hides up to 100 products. */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const status = body?.status;
    if (status !== "active" && status !== "draft") {
      return NextResponse.json({ success: false, error: "الحالة غير صحيحة" }, { status: 400 });
    }
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((x: unknown) => typeof x === "string" && x.length <= 120).slice(0, 100) : [];
    if (ids.length === 0) return NextResponse.json({ success: false, error: "اختار منتج واحد على الأقل" }, { status: 400 });
    let updated = 0;
    for (const pid of ids) {
      const p = await dbStore.getProduct(pid);
      if (!p) continue;
      await dbStore.saveProductWithLandingPage({ ...p, status }, false);
      updated++;
    }
    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
