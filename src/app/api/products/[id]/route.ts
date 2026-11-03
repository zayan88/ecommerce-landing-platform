import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";

interface RouteProps {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteProps) {
  try {
    const product = await dbStore.getProduct(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: "المنتج غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteProps) {
  try {
    const body = await req.json();
    const product = await dbStore.saveProduct({ ...body, id: params.id });

    // Sync landing page
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
      message: "تم تعديل المنتج بنجاح",
      product,
      landing_page_url: `/p/${product.slug}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteProps) {
  try {
    const deleted = await dbStore.deleteProduct(params.id);
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
