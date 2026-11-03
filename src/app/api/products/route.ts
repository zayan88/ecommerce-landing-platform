import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

export async function GET() {
  try {
    const products = await dbStore.getProducts();
    return NextResponse.json({ success: true, products });
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

    const product = await dbStore.saveProduct(body);

    // Auto-create or ensure landing page exists for the product
    await dbStore.saveLandingPage({
      product_id: product.id,
      title: product.title_ar,
      slug: product.slug,
      component_key: "starter-template",
      status: "active",
      deployment_url: `/p/${product.slug}`,
      deployment_status: "published",
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ المنتج وإنشاء صفحة الهبوط بنجاح",
      product,
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

    const product = await dbStore.saveProduct(body);

    // Sync landing page title and slug if updated
    if (body.title_ar || body.slug) {
      await dbStore.saveLandingPage({
        product_id: product.id,
        title: product.title_ar,
        slug: product.slug,
        component_key: "starter-template",
        status: "active",
        deployment_url: `/p/${product.slug}`,
        deployment_status: "published",
      });
    }

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
