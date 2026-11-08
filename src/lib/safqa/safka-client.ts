import { Order, Product } from "@/types";
import { dbStore } from "../db/store";

export interface SafkaProductProperty {
  _id: string;
  key: string;
  value: number; // selling price
  min: number; // minimum / cost price
  is_available: boolean;
}

export interface SafkaProduct {
  _id: string;
  name: string;
  barcode?: string;
  sale_price?: number;
  images?: string[];
  image?: string;
  description?: string;
  note?: string;
  media_url?: string;
  properties?: SafkaProductProperty[];
  is_active?: boolean;
}

export interface SafkaPriceListItem {
  _id: string;
  name_ar?: string;
  name_en?: string;
  governorate?: string;
  price?: number;
  delivery_cost?: number;
}

export interface SafkaOrderResponse {
  success: boolean;
  safka_order_id?: string;
  order_number?: string;
  error?: string;
  raw?: any;
}

// In-memory cache for Safka price-list (governorates mapping)
let cachedPriceList: SafkaPriceListItem[] = [];
let priceListFetchedAt = 0;

function normalizeArabicText(t?: string): string {
  return (t || "")
    .replace(/^(محافظة|مدينة)\s+/, "")
    .replace(/\s*\(.*?\)\s*/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, "")
    .trim()
    .toLowerCase();
}

export class SafkaClient {
  private static async getApiKey(): Promise<string> {
    const settings = await dbStore.getSettings();
    return settings.safqa_api_secret_token || process.env.SAFKA_API_KEY || "sk_542077e40b44f0837da89f7f542f752270ac78644240cfa46a98b9afe8e312fc";
  }

  private static getBaseUrl(): string {
    return "https://api.safka-eg.com";
  }

  /**
   * Test connection to Safka Public API with the configured API key
   */
  static async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        message: "لم يتم إدخال مفتاح API لصفقة (api-safka-key) في الإعدادات.",
      };
    }

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/public/products?size=1`, {
        method: "GET",
        headers: {
          "api-safka-key": apiKey,
          Accept: "application/json",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = json.errors?.[0]?.msg || json.message || `خطأ ${res.status}`;
        return {
          success: false,
          message: `فشل الاتصال بصفقة: ${errorMsg}`,
          data: json,
        };
      }

      return {
        success: true,
        message: "تم الاتصال بنجاح مع منصة دروبشيبينغ صفقة (Safka Egypt) ومفتاح الـ API صالح 100%.",
        data: json,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `خطأ أثناء الاتصال بسيرفر صفقة: ${err.message}`,
      };
    }
  }

  /**
   * Fetch price list (governorates and shipping costs) from Safka
   */
  static async getPriceList(forceRefresh = false): Promise<SafkaPriceListItem[]> {
    const now = Date.now();
    if (!forceRefresh && cachedPriceList.length > 0 && now - priceListFetchedAt < 3600000) {
      return cachedPriceList;
    }

    const apiKey = await this.getApiKey();
    if (!apiKey) return [];

    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/public/price-list?size=100`, {
        method: "GET",
        headers: {
          "api-safka-key": apiKey,
          Accept: "application/json",
        },
      });

      if (!res.ok) return cachedPriceList;

      const json = await res.json();
      const list = json.data || json || [];
      if (Array.isArray(list) && list.length > 0) {
        cachedPriceList = list;
        priceListFetchedAt = now;
      }
      return cachedPriceList;
    } catch (err) {
      console.error("[SafkaClient getPriceList error]", err);
      return cachedPriceList;
    }
  }

  /**
   * Resolve Egyptian governorate name to Safka shipping_governorate pricing _id
   */
  static async resolveGovernoratePricingId(governorateName: string): Promise<string> {
    const priceList = await this.getPriceList();
    if (priceList.length === 0) {
      // Fallback Safka governorate ID
      return "64878fdedc16090c1858e696";
    }

    const cleanGov = normalizeArabicText(governorateName);

    const found = priceList.find((item: any) => {
      const ar = normalizeArabicText(item.governorateNameAr || item.name_ar || (typeof item.governorate === "string" ? item.governorate : ""));
      const en = (item.governorateName || item.name_en || "").toLowerCase();
      return (
        ar.includes(cleanGov) ||
        cleanGov.includes(ar) ||
        (en && (en.includes(cleanGov) || cleanGov.includes(en)))
      );
    });

    return found?._id || priceList[0]?._id || "64878fdedc16090c1858e696";
  }

  /**
   * Fetch products list from Safka
   */
  static async getProducts(page = 1, size = 20, query = ""): Promise<{ products: SafkaProduct[]; total?: number }> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      throw new Error("يرجى إدخال api-safka-key في إعدادات صفقة أولاً");
    }

    let url = `${this.getBaseUrl()}/api/v1/public/products?page=${page}&size=${size}`;
    if (query) url += `&query=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "api-safka-key": apiKey,
        Accept: "application/json",
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.errors?.[0]?.msg || json.message || "تعذر جلب منتجات صفقة");
    }

    return {
      products: json.data || [],
      total: json.total || (json.data ? json.data.length : 0),
    };
  }

  /**
   * Forward an order to Safka Egypt Dropshipping platform (POST /api/v1/public/orders)
   */
  static async createOrder(order: Order): Promise<SafkaOrderResponse> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      console.warn("[SafkaClient] Order skipped: No api-safka-key configured in settings.");
      await dbStore.updateSafqaInfo(order.id, {
        safqa_status: "failed",
        safqa_response: { error: "لم يتم حفظ مفتاح API لصفقة (api-safka-key) في الإعدادات" },
      });
      return { success: false, error: "مفتاح API لصفقة غير مسجل" };
    }

    try {
      const product = await dbStore.getProduct(order.product_id);
      if (!product) {
        throw new Error("المنتج المرتبط بالطلب غير موجود في المتجر");
      }

      // Safka item identifiers
      const safkaProductId = (product as any).safka_product_id || product.id;
      const safkaPropertyId = (product as any).safka_property_id || (product as any).safka_raw?.properties?.[0]?._id || "69615044356433dea16f0bd9";

      // Resolve Safka shipping_governorate ID
      const shippingGovernorateId = await this.resolveGovernoratePricingId(order.governorate);

      // Calculate commission: Total paid minus cost price
      const costPerItem = product.cost_price || 0;
      const totalCost = costPerItem * order.quantity;
      const calculatedCommission = Math.max(0, order.total_amount - totalCost);

      const payload = {
        items: [
          {
            product: safkaProductId,
            property: safkaPropertyId,
            qty: String(order.quantity || 1),
          },
        ],
        client_name: order.customer_name,
        client_phone1: order.customer_phone,
        client_phone2: order.customer_phone2 || undefined,
        shipping_governorate: shippingGovernorateId,
        city: order.city || order.governorate,
        client_address: order.address,
        total: Number(order.final_amount),
        commission: Number(calculatedCommission),
        page_name: `RexRack - ${order.landing_page_slug}`,
        page_id: "rexrack-main",
        note: order.notes || `طلب من صفحة هبوط RexRack (رقم الطلب: ${order.order_number})`,
      };

      console.log("[SafkaClient] Forwarding order to Safka Egypt:", JSON.stringify(payload));

      const res = await fetch(`${this.getBaseUrl()}/api/v1/public/orders`, {
        method: "POST",
        headers: {
          "api-safka-key": apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorDetail = json.errors?.[0]?.msg || json.message || `خطأ ${res.status}`;
        console.error("[SafkaClient Order Error]", errorDetail, json);

        await dbStore.updateSafqaInfo(order.id, {
          safqa_status: "failed",
          safqa_response: {
            error: errorDetail,
            payload,
            response: json,
          },
        });

        return {
          success: false,
          error: errorDetail,
          raw: json,
        };
      }

      // Order created successfully on Safka
      const safkaOrderId = json.data?._id || json._id || json.data?.order_number || `SFK-${Date.now()}`;
      const safkaOrderNumber = json.data?.order_number || json.order_number;

      console.log(`[SafkaClient] Order ${order.order_number} created in Safka with ID: ${safkaOrderId}`);

      await dbStore.updateSafqaInfo(order.id, {
        safqa_invoice_id: safkaOrderId, // stored as safka_order_id
        safqa_status: "paid", // forwarded and queued in Safka
        safqa_response: {
          safka_order_id: safkaOrderId,
          order_number: safkaOrderNumber,
          commission: calculatedCommission,
          forwarded_at: new Date().toISOString(),
          raw: json,
        },
      });

      return {
        success: true,
        safka_order_id: safkaOrderId,
        order_number: safkaOrderNumber,
        raw: json,
      };
    } catch (err: any) {
      console.error("[SafkaClient Exception]", err);
      await dbStore.updateSafqaInfo(order.id, {
        safqa_status: "failed",
        safqa_response: { error: err.message },
      });
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Helper to convert an incoming Safka product into a RexRack Product and Landing Page
   */
  static async importSafkaProduct(safkaData: any): Promise<{ product: Product; landingPageUrl: string }> {
    const safkaId = safkaData._id || safkaData.id || `sfk-${Date.now()}`;
    const nameAr = safkaData.name || safkaData.title || "منتج من صفقة";
    const basePrice = Number(safkaData.sale_price) || Number(safkaData.properties?.[0]?.value) || 299;
    const costPrice = Number(safkaData.properties?.[0]?.min) || 150;
    const comparePrice = Math.round(basePrice * 1.45);

    // Images array
    let images: string[] = [];
    if (Array.isArray(safkaData.images) && safkaData.images.length > 0) {
      images = safkaData.images;
    } else if (safkaData.image) {
      images = [safkaData.image];
    } else {
      images = ["/images/hero-organizer.jpg"];
    }

    // Slug generation
    const cleanSlug = `safka-${safkaId.slice(-8)}`;

    // Safka properties (first active property)
    const activeProperty = safkaData.properties?.find((p: any) => p.is_available) || safkaData.properties?.[0];
    const propertyId = activeProperty?._id || `${safkaId}-prop`;

    // Save product in store
    const product = await dbStore.saveProduct({
      title_ar: nameAr,
      title_en: safkaData.barcode || "",
      slug: cleanSlug,
      sku: safkaData.barcode || `SFK-${safkaId.slice(-6)}`,
      base_price: basePrice,
      compare_at_price: comparePrice,
      cost_price: costPrice,
      images,
      description_ar: safkaData.description || safkaData.note || "منتج أصلي معتمد مع إمكانية المعاينة قبل الدفع وشحن سريع لجميع محافظات مصر.",
      status: "active",
      stock_quantity: 100,
      // Store Safka metadata
      ...( {
        safka_product_id: safkaId,
        safka_property_id: propertyId,
        safka_commission: Math.max(0, basePrice - costPrice),
        safka_raw: safkaData,
      } as any),
      offers: [
        {
          id: `off-${safkaId}-1`,
          product_id: "",
          title_ar: "قطعة واحدة (تجربة)",
          quantity: 1,
          price: basePrice,
          original_price: comparePrice,
          discount_label: "خصم حصري",
          is_popular: false,
          free_shipping: false,
          sort_order: 1,
        },
        {
          id: `off-${safkaId}-2`,
          product_id: "",
          title_ar: "قطعتان (الأكثر طلباً)",
          quantity: 2,
          price: Math.round(basePrice * 2 * 0.9),
          original_price: comparePrice * 2,
          discount_label: "وفر أكثر + شحن مجاني",
          is_popular: true,
          free_shipping: true,
          sort_order: 2,
        },
        {
          id: `off-${safkaId}-3`,
          product_id: "",
          title_ar: "3 قطع (عرض التوفير العائلي)",
          quantity: 3,
          price: Math.round(basePrice * 3 * 0.8),
          original_price: comparePrice * 3,
          discount_label: "أقصى توفير + شحن مجاني",
          is_popular: false,
          free_shipping: true,
          sort_order: 3,
        },
      ],
    });

    // Create and publish matching Landing Page automatically
    await dbStore.saveLandingPage({
      product_id: product.id,
      title: `${nameAr} | عرض حصري ومعاينة قبل الدفع`,
      slug: cleanSlug,
      component_key: "starter-template",
      status: "active",
      deployment_url: `/p/${cleanSlug}`,
      deployment_status: "published",
      last_published_at: new Date().toISOString(),
    });

    return {
      product,
      landingPageUrl: `/p/${cleanSlug}`,
    };
  }
}
