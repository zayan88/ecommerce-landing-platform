import { NextRequest, NextResponse } from "next/server";
import { SafkaClient } from "@/lib/safqa/safka-client";
import { dbStore } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "test_connection") {
      const result = await SafkaClient.testConnection();
      return NextResponse.json(result);
    }

    if (action === "fetch_products") {
      const { page, size, query } = body;
      const result = await SafkaClient.getProducts(page || 1, size || 20, query || "");
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "import_product") {
      const { productData } = body;
      if (!productData) {
        return NextResponse.json({ success: false, error: "بيانات المنتج مطلوبة" }, { status: 400 });
      }
      const imported = await SafkaClient.importSafkaProduct(productData);
      return NextResponse.json({
        success: true,
        message: "تم استيراد المنتج وإنشاء صفحة الهبوط بنجاح",
        product: imported.product,
        landing_page_url: imported.landingPageUrl,
      });
    }

    if (action === "sync_price_list") {
      const list = await SafkaClient.getPriceList(true);
      return NextResponse.json({
        success: true,
        message: `تمت مزامنة قائمة أسعار الشحن لـ ${list.length} محافظة ومدينة من صفقة بنجاح`,
        count: list.length,
        items: list,
      });
    }

    if (action === "retry_order") {
      const { orderId } = body;
      const order = await dbStore.getOrder(orderId);
      if (!order) {
        return NextResponse.json({ success: false, error: "الطلب غير موجود" }, { status: 404 });
      }
      const res = await SafkaClient.createOrder(order);
      return NextResponse.json(res);
    }

    return NextResponse.json({ success: false, error: "إجراء غير معروف" }, { status: 400 });
  } catch (err: any) {
    console.error("[Safka Sync Route Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
