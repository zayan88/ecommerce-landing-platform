import { NextRequest, NextResponse } from "next/server";
import { SafkaClient } from "@/lib/safqa/safka-client";

/**
 * Safka Product Hook (GET)
 * Health check & verification for Safka integration
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    service: "Safka Egypt Product Hook",
    status: "active and ready to receive products",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Safka Product Hook (POST)
 * Receives product data pushed from Safka Egypt dropshipping platform.
 * Automatically saves the product and creates a live high-converting landing page for it!
 */
export async function POST(req: NextRequest) {
  try {
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
        const params = new URLSearchParams(text);
        const obj: Record<string, any> = {};
        params.forEach((val, key) => {
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

    console.log("[Safka Product Hook Received]", JSON.stringify(payload).substring(0, 500));

    // Handle single product or list
    const productData = payload.data || payload.product || payload;

    if (!productData || (!productData.name && !productData.title && !productData._id)) {
      return NextResponse.json({
        success: true,
        message: "Webhook ping received, no product data parsed",
        received: payload,
      });
    }

    // Process single or multiple products
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
  } catch (err: any) {
    console.error("[Safka Product Hook Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "حدث خطأ أثناء معالجة المنتج من صفقة" },
      { status: 500 }
    );
  }
}
