import { NextRequest, NextResponse } from "next/server";
import { dbStore } from "@/lib/db/store";
import { SafkaClient } from "@/lib/safqa/safka-client";

interface RouteProps {
  params: {
    action?: string[];
  };
}

/**
 * Universal Safka Egypt Integration Gateway
 * Handles all Safka actions (sync, orders, products, connect-callback, webhook)
 * under a single unified Serverless Function to keep total deployment functions <= 10.
 */

// ======================== GET HANDLERS ========================
export async function GET(req: NextRequest, { params }: RouteProps) {
  const subAction = (params.action?.[0] || "webhook").toLowerCase();

  // 1. Connect Callback GET (Safka browser redirect)
  if (subAction === "connect-callback") {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("api-safka-key") || searchParams.get("key") || searchParams.get("token");

    if (key) {
      await dbStore.updateSettings({
        safqa_api_secret_token: key,
      });
    }

    return NextResponse.redirect(new URL("/admin/safqa?connected=true", req.url));
  }

  // 2. Health checks for webhooks & integration
  if (subAction === "orders" || subAction === "order-webhook") {
    return NextResponse.json({
      success: true,
      service: "Safka Egypt Order Hook",
      status: "active and ready to receive order status updates",
      timestamp: new Date().toISOString(),
    });
  }

  if (subAction === "products" || subAction === "product-webhook") {
    return NextResponse.json({
      success: true,
      service: "Safka Egypt Product Hook",
      status: "active and ready to receive products",
      timestamp: new Date().toISOString(),
    });
  }

  // Default / webhook health check
  return NextResponse.json({
    success: true,
    service: "Safka Egypt Unified Gateway",
    action: subAction,
    status: "active and listening",
    timestamp: new Date().toISOString(),
  });
}

// ======================== POST HANDLERS ========================
export async function POST(req: NextRequest, { params }: RouteProps) {
  const subAction = (params.action?.[0] || "webhook").toLowerCase();

  try {
    // ----------------- A. SYNC ACTIONS (Admin Dashboard) -----------------
    if (subAction === "sync") {
      const body = await req.json().catch(() => ({}));
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
    }

    // ----------------- B. CONNECT CALLBACK POST -----------------
    if (subAction === "connect-callback") {
      const payload = await req.json().catch(() => ({}));
      const apiKey =
        payload["api-safka-key"] ||
        payload.api_key ||
        payload.key ||
        payload.token ||
        payload.data?.key;

      if (apiKey) {
        await dbStore.updateSettings({
          safqa_api_secret_token: apiKey,
        });

        return NextResponse.json({
          success: true,
          message: "تم حفظ مفتاح API لمنصة صفقة بنجاح في الإعدادات",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Callback received without API key",
        payload,
      });
    }

    // Parse incoming payload flexibly (supporting JSON, form-data, urlencoded, raw text)
    let payload: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      try {
        const formData = await req.formData();
        const obj: Record<string, any> = {};
        formData.forEach((val, key) => {
          obj[key] = val;
        });
        payload = obj;
      } catch {
        const text = await req.text();
        const searchParams = new URLSearchParams(text);
        const obj: Record<string, any> = {};
        searchParams.forEach((val, key) => {
          obj[key] = val;
        });
        payload = obj;
      }
    } else {
      const text = await req.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = { raw: text };
        }
      }
    }

    // ----------------- C. ORDERS HOOK -----------------
    if (subAction === "orders" || subAction === "order-webhook") {
      const safkaOrderId = payload.order_id || payload._id || payload.data?._id || payload.order_number;
      const rawStatus = (payload.status || payload.data?.status || "").toLowerCase();

      if (safkaOrderId) {
        const orders = await dbStore.getOrders();
        const matched = orders.find(
          (o) =>
            o.safqa_invoice_id === safkaOrderId ||
            o.order_number === safkaOrderId ||
            (payload.client_phone1 && o.customer_phone === payload.client_phone1)
        );

        if (matched) {
          let newStatus = matched.status;
          if (rawStatus.includes("ship") || rawStatus.includes("مكتمل") || rawStatus.includes("جار")) {
            newStatus = "shipped";
          } else if (rawStatus.includes("deliver") || rawStatus.includes("تم التسليم")) {
            newStatus = "delivered";
          } else if (rawStatus.includes("cancel") || rawStatus.includes("ملغي")) {
            newStatus = "cancelled";
          } else if (rawStatus.includes("return") || rawStatus.includes("مرتجع")) {
            newStatus = "returned";
          }

          await dbStore.updateOrderStatus(matched.id, newStatus);
          await dbStore.updateSafqaInfo(matched.id, {
            safqa_status: newStatus === "delivered" ? "paid" : "pending",
            safqa_response: payload,
          });

          return NextResponse.json({
            success: true,
            message: `تم تحديث حالة الطلب ${matched.order_number} إلى ${newStatus}`,
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Order hook received successfully",
      });
    }

    // ----------------- D. PRODUCTS HOOK OR GENERAL WEBHOOK -----------------
    const productData = payload.data || payload.product || payload;

    if (productData && (productData.name || productData.title || productData._id)) {
      const items = Array.isArray(productData) ? productData : [productData];
      const results = [];

      for (const item of items) {
        if (item.name || item.title || item._id) {
          const imported = await SafkaClient.importSafkaProduct(item);
          results.push(imported);
        }
      }

      return NextResponse.json({
        success: true,
        message: `تم استلام وإضافة ${results.length} منتج من صفقة وإنشاء صفحات الهبوط بنجاح`,
        imported_count: results.length,
        products: results.map((r) => ({
          id: r.product.id,
          title: r.product.title_ar,
          slug: r.product.slug,
          landing_page: r.landingPageUrl,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Gateway received payload successfully",
      action: subAction,
    });
  } catch (err: any) {
    console.error("[Safka Gateway Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ غير متوقع" },
      { status: 500 }
    );
  }
}
