import { Product, ProductOffer, LandingPage, LandingPageSectionConfig, LandingPageContentConfig, DEFAULT_LANDING_PAGE_SECTIONS, Order, OrderTrackingMeta, AnalyticsEvent, SystemSettings, OrderStatus, SafqaSyncStatus } from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { kvStore } from "./kv";
import { generateOrderId, generateOrderNumber, generateUniqueOrderNumber } from "@/lib/orders/guard";
import { getOrdersRepo, ordersBackend, ordersKvMirrorEnabled } from "./orders-repo";
import {
  findOrderRecord,
  listDeletedOrderTokens,
  listOrderEntries,
  listRecentOrderNumbers,
  mapLimit,
  orderFromMeta,
  orderKey,
  readOrderRecord,
  reconcileLegacyOrders,
  sanitizeOrderForStorage,
  writeOrderRecord,
  writeOrderTombstone,
} from "./order-kv";

/** Thrown by dbStore.createOrder when the order could not be written to any durable store. */
export class OrderPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderPersistenceError";
  }
}

// Initial seed data
const initialProducts: (Product & { offers: ProductOffer[] })[] = [
  {
    id: "prod-mesh-nebulizer-8ftidwr",
    title_ar: "جهاز استنشاق البخار المحمول ميني (Mesh Nebulizer) الصامت للأطفال والكبار",
    title_en: "Portable Mini Mesh Nebulizer",
    slug: "mesh-nebulizer",
    sku: "8fTldWR",
    base_price: 599,
    compare_at_price: 850,
    cost_price: 255,
    images: [
      "/landing-pages/mesh-nebulizer/images/hero.webp",
      "/landing-pages/mesh-nebulizer/images/features_1.webp",
      "/landing-pages/mesh-nebulizer/images/features_2.webp",
      "/landing-pages/mesh-nebulizer/images/features_3.webp",
      "https://safka.fra1.cdn.digitaloceanspaces.com/media/products/1771233682858-IMG_6569.webp",
    ],
    description_ar: "ودّع رعب جلسات البخار الفجرية في الشتاء! جهاز النيبولايزر المحمول الذكي فائق الهدوء للأطفال والكبار مع ماسك للكبار وماسك للأطفال وقطعة استنشاق للفم، يعمل بالبطاريات وUSB.",
    stock_quantity: 100,
    status: "active",
    safka_product_id: "69615044356433dea16f0bd8",
    safka_property_id: "69615044356433dea16f0bd9",
    safka_commission: 344,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [
      {
        id: "off-nebulizer-1",
        product_id: "prod-mesh-nebulizer-8ftidwr",
        title_ar: "قطعة واحدة (تجربة)",
        quantity: 1,
        price: 599,
        original_price: 850,
        discount_label: "خصم 30%",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      },
      {
        id: "off-nebulizer-2",
        product_id: "prod-mesh-nebulizer-8ftidwr",
        title_ar: "قطعتان (الأكثر طلباً - جهاز للبيت وجهاز للشنطة/الحضانة)",
        quantity: 2,
        price: 990,
        original_price: 1700,
        discount_label: "وفر 710 ج.م + شحن مجاني",
        is_popular: true,
        free_shipping: true,
        sort_order: 2,
      },
      {
        id: "off-nebulizer-3",
        product_id: "prod-mesh-nebulizer-8ftidwr",
        title_ar: "3 قطع (عرض التوفير العائلي الشامل)",
        quantity: 3,
        price: 1390,
        original_price: 2550,
        discount_label: "وفر 1160 ج.م + شحن مجاني",
        is_popular: false,
        free_shipping: true,
        sort_order: 3,
      },
    ],
  },
  {
    id: "prod-body-massager-7mebpwu",
    title_ar: "جهاز التدليك والمساج الشامل 5×1 اللاسلكي بالحرارة والاهتزاز (للكتف، الظهر، البطن، والرجل)",
    title_en: "Multipurpose 5-in-1 Heated Vibration Body Massager for Shoulder, Back, Abdomen and Knee",
    slug: "body-massager",
    sku: "7Mebpwu",
    base_price: 799,
    compare_at_price: 1200,
    cost_price: 440,
    images: [
      "/landing-pages/body-massager/images/hero.webp",
      "/landing-pages/body-massager/images/features_1.webp",
      "/landing-pages/body-massager/images/features_2.webp",
      "/landing-pages/body-massager/images/features_3.webp",
      "/landing-pages/body-massager/images/use_case_shoulder.webp",
      "/landing-pages/body-massager/images/use_case_back.webp",
      "/landing-pages/body-massager/images/use_case_abdomen.webp",
      "/landing-pages/body-massager/images/use_case_knee.webp",
    ],
    description_ar: "ودّع آلام المفاصل وتشنج الرقبة والأكتاف وآلام أسفل الظهر والركبة! جهاز تدليك ذكي شامل يجمع بين المساج الاهتزازي العميق والتدفئة الحرارية بالأشعة تحت الحمراء مع شاشة ديجيتال وبطارية قوية قابلة لإعادة الشحن.",
    stock_quantity: 100,
    status: "active",
    safka_product_id: "68c0caddc79e01ee5439126b",
    safka_property_id: "68c0caddc79e01ee5439126c",
    safka_commission: 359,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [
      {
        id: "off-massager-1",
        product_id: "prod-body-massager-7mebpwu",
        title_ar: "قطعة واحدة (تجربة)",
        quantity: 1,
        price: 799,
        original_price: 1200,
        discount_label: "خصم 33%",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      },
      {
        id: "off-massager-2",
        product_id: "prod-body-massager-7mebpwu",
        title_ar: "قطعتان (الأكثر طلباً - لك ولأحد أحبائك)",
        quantity: 2,
        price: 1390,
        original_price: 2400,
        discount_label: "وفر 1010 ج.م + شحن مجاني",
        is_popular: true,
        free_shipping: true,
        sort_order: 2,
      },
      {
        id: "off-massager-3",
        product_id: "prod-body-massager-7mebpwu",
        title_ar: "3 قطع (عرض التوفير العائلي الشامل)",
        quantity: 3,
        price: 1890,
        original_price: 3600,
        discount_label: "وفر 1710 ج.م + شحن مجاني",
        is_popular: false,
        free_shipping: true,
        sort_order: 3,
      },
    ],
  },
  {
    id: "prod-car-organizer-9pkjp8q",
    title_ar: "منظم ظهر مقعد السيارة الذكي متعدد الجيوب مع حامل تابلت مدمج",
    title_en: "Multi-Pocket Car Seat Back Organizer with Tablet Holder",
    slug: "car-organizer",
    sku: "9pkjp8Q",
    base_price: 499,
    compare_at_price: 750,
    cost_price: 180,
    images: [
      "/landing-pages/car-organizer/images/hero.webp",
      "/landing-pages/car-organizer/images/features_1.webp",
      "/landing-pages/car-organizer/images/features_2.webp",
      "https://safka.fra1.cdn.digitaloceanspaces.com/media/products/1781133512942-1000373663.webp",
    ],
    description_ar: "حافظ على سيارتك منظمة وفندقية وتخلص من فوضى الأغراض وزجاجات المياه وكركبة ألعاب الأطفال في الرحلات! مع حامل شفاف للتابلت لمشاهدة الأفلام والكرتون وحماية كاملة لفرش المقاعد.",
    stock_quantity: 100,
    status: "active",
    safka_product_id: "6a29f09bf6c8815f8d0500df",
    safka_property_id: "6a29f09bf6c8815f8d0500e0",
    safka_commission: 319,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [
      {
        id: "off-organizer-1",
        product_id: "prod-car-organizer-9pkjp8q",
        title_ar: "قطعة واحدة (تجربة)",
        quantity: 1,
        price: 499,
        original_price: 750,
        discount_label: "خصم 33%",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      },
      {
        id: "off-organizer-2",
        product_id: "prod-car-organizer-9pkjp8q",
        title_ar: "قطعتان (الأكثر طلباً - طقم للكرسيين الأماميين)",
        quantity: 2,
        price: 850,
        original_price: 1500,
        discount_label: "وفر 650 ج.م + شحن مجاني",
        is_popular: true,
        free_shipping: true,
        sort_order: 2,
      },
      {
        id: "off-organizer-3",
        product_id: "prod-car-organizer-9pkjp8q",
        title_ar: "3 قطع (عرض التوفير للسيارات العائلية)",
        quantity: 3,
        price: 1190,
        original_price: 2250,
        discount_label: "وفر 1060 ج.م + شحن مجاني",
        is_popular: false,
        free_shipping: true,
        sort_order: 3,
      },
    ],
  },
  {
    id: "prod-astrobeam-6ab19443",
    title_ar: "بروجكتور الفضاء المصغر AstroBeam مع 6 غيارات لعرض القمر والمجرات",
    title_en: "AstroBeam Mini Space Projector 6-in-1",
    slug: "astrobeam",
    sku: "57HolKg",
    base_price: 450,
    compare_at_price: 650,
    cost_price: 250,
    images: [
      "/landing-pages/astrobeam/images/hero.webp",
      "/landing-pages/astrobeam/images/features_1.webp",
      "/landing-pages/astrobeam/images/features_2.webp",
      "https://safka.fra1.cdn.digitaloceanspaces.com/media/products/1790022747701-03AEB4FE-2DE6-4FE0-BB19-C6776568EC5C.webp",
    ],
    description_ar: "حوّل أوضتك لعالم تاني مع AstroBeam، بروجكتور فضاء مصغر بيعرض أشكال مستوحاة من القمر والكواكب والمجرات على الحائط أو السقف مع 6 غيارات مختلفة وذراع مرن 360 درجة وتشغيل USB.",
    stock_quantity: 100,
    status: "active",
    safka_product_id: "6ab19443ca38d5013c7cb9fb",
    safka_property_id: "6ab19443ca38d5013c7cb9fc",
    safka_commission: 200,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [
      {
        id: "off-astrobeam-1",
        product_id: "prod-astrobeam-6ab19443",
        title_ar: "قطعة واحدة (تجربة)",
        quantity: 1,
        price: 450,
        original_price: 650,
        discount_label: "خصم 31%",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      },
      {
        id: "off-astrobeam-2",
        product_id: "prod-astrobeam-6ab19443",
        title_ar: "قطعتان (الأكثر طلباً - لغرفتين أو هدية مميزة)",
        quantity: 2,
        price: 790,
        original_price: 1300,
        discount_label: "وفر 510 ج.م + شحن مجاني",
        is_popular: true,
        free_shipping: true,
        sort_order: 2,
      },
      {
        id: "off-astrobeam-3",
        product_id: "prod-astrobeam-6ab19443",
        title_ar: "3 قطع (عرض التوفير العائلي الشامل)",
        quantity: 3,
        price: 1090,
        original_price: 1950,
        discount_label: "وفر 860 ج.م + شحن مجاني",
        is_popular: false,
        free_shipping: true,
        sort_order: 3,
      },
    ],
  },
  {
    id: "prod-smart-book-e91b",
    title_ar: "الكتاب التعليمي الذكي الناطق بالصوت التفاعلي للأطفال (عربي وإنجليزي)",
    title_en: "Smart Interactive Audio Learning E-Book for Kids",
    slug: "book",
    sku: "BOOK-EDU-01",
    base_price: 399,
    compare_at_price: 650,
    cost_price: 170,
    images: [
      "https://safka.fra1.cdn.digitaloceanspaces.com/media/products/1771233682858-IMG_6569.webp",
    ],
    description_ar: "الكتاب الذكي الناطق بالصوت لتعليم الأطفال الحروف والأرقام والكلمات والأذكار والقرآن بأسلوب ترفيهي تفاعلي جذاب باللغتين العربية والإنجليزية، بديل آمن ومسلي لشاشات الموبايل.",
    stock_quantity: 100,
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    offers: [
      {
        id: "off-book-1",
        product_id: "prod-smart-book-e91b",
        title_ar: "نسخة واحدة (تجربة)",
        quantity: 1,
        price: 399,
        original_price: 650,
        discount_label: "خصم 38%",
        is_popular: false,
        free_shipping: true,
        sort_order: 1,
      },
      {
        id: "off-book-2",
        product_id: "prod-smart-book-e91b",
        title_ar: "نسختان (الأكثر طلباً - لطفلين أو هدية مميزة)",
        quantity: 2,
        price: 690,
        original_price: 1300,
        discount_label: "وفر 610 ج.م + شحن مجاني",
        is_popular: true,
        free_shipping: true,
        sort_order: 2,
      },
      {
        id: "off-book-3",
        product_id: "prod-smart-book-e91b",
        title_ar: "3 نسخ (عرض التوفير العائلي الشامل)",
        quantity: 3,
        price: 990,
        original_price: 1950,
        discount_label: "وفر 960 ج.م + شحن مجاني",
        is_popular: false,
        free_shipping: true,
        sort_order: 3,
      },
    ],
  },
];

const initialLandingPages: LandingPage[] = [
  // 1. Mesh Nebulizer
  {
    id: "c1000000-0000-0000-0000-000000000020",
    product_id: "prod-mesh-nebulizer-8ftidwr",
    title: "جهاز استنشاق البخار المحمول ميني (Mesh Nebulizer) الصامت للأطفال والكبار",
    slug: "mesh-nebulizer",
    component_key: "mesh-nebulizer",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/mesh-nebulizer",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[0],
  },
  {
    id: "c1000000-0000-0000-0000-000000000021",
    product_id: "prod-mesh-nebulizer-8ftidwr",
    title: "جهاز استنشاق البخار ميني Mesh Nebulizer الصامت | صفقة",
    slug: "safka-8ftidwr",
    component_key: "mesh-nebulizer",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-8ftidwr",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[0],
  },

  // 2. Body Massager 5x1 (Replacing Massage Cushion as requested)
  {
    id: "c1000000-0000-0000-0000-000000000010",
    product_id: "prod-body-massager-7mebpwu",
    title: "جهاز التدليك والمساج الشامل 5×1 الحراري والاهتزازي لفقرات الرقبة والظهر والجسم",
    slug: "body-massager",
    component_key: "body-massager",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/body-massager",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[1],
  },
  {
    id: "c1000000-0000-0000-0000-000000000011",
    product_id: "prod-body-massager-7mebpwu",
    title: "جهاز التدليك والمساج الشامل 5×1 | صفقة",
    slug: "safka-7mebpwu",
    component_key: "body-massager",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-7mebpwu",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[1],
  },
  {
    id: "c1000000-0000-0000-0000-000000000012",
    product_id: "prod-body-massager-7mebpwu",
    title: "جهاز التدليك والمساج الشامل 5×1 | صفقة",
    slug: "safka-b5fb3b6b",
    component_key: "body-massager",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-b5fb3b6b",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[1],
  },
  {
    id: "c1000000-0000-0000-0000-000000000013",
    product_id: "prod-body-massager-7mebpwu",
    title: "جهاز التدليك والمساج الشامل 5×1 | RexRack",
    slug: "starter-template",
    component_key: "body-massager",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/starter-template",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[1],
  },

  // 3. Car Seat Organizer
  {
    id: "c1000000-0000-0000-0000-000000000030",
    product_id: "prod-car-organizer-9pkjp8q",
    title: "منظم ظهر مقعد السيارة الذكي متعدد الجيوب مع حامل تابلت مدمج",
    slug: "car-organizer",
    component_key: "car-organizer",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/car-organizer",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[2],
  },
  {
    id: "c1000000-0000-0000-0000-000000000031",
    product_id: "prod-car-organizer-9pkjp8q",
    title: "منظم ظهر مقعد السيارة الذكي | صفقة",
    slug: "safka-9pkjp8q",
    component_key: "car-organizer",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-9pkjp8q",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[2],
  },
  {
    id: "c1000000-0000-0000-0000-000000000032",
    product_id: "prod-body-massager-7mebpwu",
    title: "جهاز التدليك والمساج الشامل 5×1 اللاسلكي بالحرارة والاهتزاز",
    slug: "massage-cushion",
    component_key: "body-massager",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/body-massager",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[1],
  },
  {
    id: "c1000000-0000-0000-0000-000000000033",
    product_id: "prod-car-organizer-9pkjp8q",
    title: "منظم ظهر مقعد السيارة الذكي | صفقة",
    slug: "safka-rxuirx2",
    component_key: "car-organizer",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-rxuirx2",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[2],
  },

  // 4. AstroBeam Space Projector
  {
    id: "c1000000-0000-0000-0000-000000000040",
    product_id: "prod-astrobeam-6ab19443",
    title: "بروجكتور الفضاء المصغر AstroBeam مع 6 غيارات لعرض القمر والمجرات",
    slug: "astrobeam",
    component_key: "astrobeam",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/astrobeam",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[3],
  },
  {
    id: "c1000000-0000-0000-0000-000000000041",
    product_id: "prod-astrobeam-6ab19443",
    title: "بروجكتور الفضاء المصغر AstroBeam | صفقة",
    slug: "safka-6ab19443",
    component_key: "astrobeam",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/safka-6ab19443",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[3],
  },
  {
    id: "c1000000-0000-0000-0000-000000000050",
    product_id: "prod-smart-book-e91b",
    title: "الكتاب التعليمي الذكي الناطق بالصوت التفاعلي للأطفال",
    slug: "book",
    component_key: "starter-template",
    status: "active",
    meta_pixel_id: "",
    meta_capi_token: "",
    deployment_url: "/p/book",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[4],
  },
];

const initialOrders: Order[] = [];

const initialSettings: SystemSettings = {
  safqa_api_base_url: process.env.SAFQA_API_BASE_URL || "https://api.safqapay.com/v1",
  safqa_merchant_id: process.env.SAFQA_MERCHANT_ID || "",
  // Secrets come from env only (filled lazily per request in getSettings) — never hardcode them here.
  safqa_api_secret_token: "",
  safqa_webhook_secret: "",
  safqa_sandbox_mode: false,
  safqa_auto_forward: true,
  // No default pixel: a merchant copy must never send events to someone else's Meta Pixel.
  default_meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
  default_meta_capi_token: "",
  meta_test_event_code: process.env.META_TEST_EVENT_CODE || "",
  // Brand/contact come from the admin (/admin/brand) or BRAND_* / SUPPORT_* env seeds — see lib/brand.ts
  store_name: "",
  support_phone: "",
  support_whatsapp: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  telegram_notifications_enabled: true,
};

/** Admin-saved settings overrides persist in KV (memory alone is lost between Edge isolates). */
const SETTINGS_KV_KEY = "system_settings_overrides";

/** Env values read per request (next-on-pages fills process.env per request). */
function envSettingDefaults(): Partial<SystemSettings> {
  return {
    safqa_api_secret_token: process.env.SAFQA_API_SECRET_TOKEN || process.env.SAFKA_API_KEY || "",
    safqa_webhook_secret: process.env.SAFQA_WEBHOOK_SECRET || "",
    default_meta_capi_token: process.env.META_CAPI_ACCESS_TOKEN || "",
    telegram_bot_token: process.env.TELEGRAM_BOT_TOKEN || "",
    telegram_chat_id: process.env.TELEGRAM_CHAT_ID || "",
  };
}

async function readSettingsOverrides(): Promise<Partial<SystemSettings>> {
  try {
    const stored = await kvStore.get<Partial<SystemSettings>>(SETTINGS_KV_KEY);
    return stored && typeof stored === "object" ? stored : {};
  } catch {
    return {};
  }
}

// In-Memory cache singleton for development & fast fallback
// Demo catalog (hand-written sample pages) only on the owner's demo instance; a merchant copy starts empty.
const DEMO_SEED = (process.env.DEMO_MODE || "").trim() === "1";
let memoryProducts = DEMO_SEED ? [...initialProducts] : [];
let memoryLandingPages = DEMO_SEED ? [...initialLandingPages] : [];
let memoryOrders = [...initialOrders];
let memorySettings = { ...initialSettings };
let memoryAnalytics: AnalyticsEvent[] = [];
let memoryDeletedOrderIds = new Set<string>();

// ── Orders: per-isolate helpers ─────────────────────────────────────────────
// KV (one key per order, see ./order-kv) is the durable store. `memoryOrders` is only this
// isolate's cache of orders it wrote: it bridges KV's eventual consistency (a list/read right
// after a write) and is the whole store in local dev without KV.

/** How long a memory-only order (not in the KV listing yet) is still shown. */
const MEMORY_ORDER_FRESH_MS = 2 * 60 * 1000;
const MEMORY_ORDERS_MAX = 500;
const ORDER_STORE_UNAVAILABLE = "تعذر الوصول إلى مخزن الطلبات مؤقتاً، برجاء المحاولة مرة أخرى";

const orderTime = (value?: string) => (value ? Date.parse(value) || 0 : 0);

function rememberOrder(order: Order): void {
  memoryOrders = [order, ...memoryOrders.filter((o) => o.id !== order.id)];
  if (memoryOrders.length > MEMORY_ORDERS_MAX && kvStore.isAvailable()) {
    memoryOrders = memoryOrders.slice(0, MEMORY_ORDERS_MAX);
  }
}

function findMemoryOrder(idOrNumber: string): Order | null {
  return memoryOrders.find((o) => o.id === idOrNumber || o.order_number === idOrNumber) || null;
}

/** Landing page relation for an order — never carries the CAPI token (or a nested product copy). */
function publicLandingPageFor(slug?: string): LandingPage | undefined {
  const lp = slug ? memoryLandingPages.find((l) => l.slug === slug) : undefined;
  if (!lp) return undefined;
  const { meta_capi_token: _token, product: _product, ...safe } = lp;
  return safe as LandingPage;
}

/** Relations are not persisted with the order; re-attach them for display. */
function attachOrderRelations(orders: Order[], products: Product[]): void {
  for (const ord of orders) {
    if (ord.product_id) {
      ord.product = products.find((p) => p.id === ord.product_id) || ord.product;
    }
    if (!ord.product && ord.landing_page_slug) {
      const lp = memoryLandingPages.find((l) => l.slug === ord.landing_page_slug);
      if (lp?.product) ord.product = lp.product;
    }
    const lp = publicLandingPageFor(ord.landing_page_slug);
    if (lp) ord.landing_page = lp;
    else delete ord.landing_page;
  }
}

/**
 * Loads the current version of an order for a read-modify-write.
 * `kvError: true` = KV could not be read: the caller must NOT write to KV (it could clobber data).
 */
async function loadOrderForWrite(idOrNumber: string): Promise<{ order: Order | null; kvError: boolean }> {
  const mem = findMemoryOrder(idOrNumber);
  const direct = await readOrderRecord(idOrNumber);
  if (direct.status === "found") {
    // Same isolate may hold a newer copy than a lagging KV read.
    const newer = mem && orderTime(mem.updated_at) > orderTime(direct.value.updated_at) ? mem : direct.value;
    return { order: newer, kvError: false };
  }
  if (direct.status === "error") return { order: mem, kvError: true };
  if (mem) return { order: mem, kvError: false }; // created here moments ago / dev without KV
  if (direct.status === "unconfigured") return { order: null, kvError: false };

  const found = await findOrderRecord(idOrNumber); // by order number, or still in the legacy array
  if (found.status === "found") return { order: found.value, kvError: false };
  return { order: null, kvError: found.status === "error" };
}

/**
 * Merges `patch` into the stored order and writes it back to its own KV key (value + metadata).
 * Returns null when the order does not exist. Throws when KV could not be read or written and
 * no other durable store took the change — the update must not be reported as saved.
 */
async function applyOrderPatch(id: string, patch: Partial<Order>, savedElsewhere: boolean): Promise<Order | null> {
  const { order: base, kvError } = await loadOrderForWrite(id);
  if (kvError && !savedElsewhere) throw new Error(ORDER_STORE_UNAVAILABLE);
  if (!base) return null;

  const next: Order = { ...base, ...patch, id: base.id };
  if (!kvError && kvStore.isAvailable()) {
    const ok = await writeOrderRecord(next);
    if (!ok && !savedElsewhere) throw new Error(ORDER_STORE_UNAVAILABLE);
  }
  rememberOrder(next);
  return next;
}

/** Verification period only (ORDERS_KV_MIRROR=1): best-effort copy of a D1 order to its KV key. */
async function mirrorOrderToKv(order: Order): Promise<void> {
  if (!ordersKvMirrorEnabled()) return;
  try {
    const ok = await writeOrderRecord(order);
    if (!ok) console.warn("[orders/d1] KV mirror write failed");
  } catch {
    console.warn("[orders/d1] KV mirror write failed");
  }
}

/**
 * Backend-neutral order patch: D1 (ORDERS_BACKEND=d1) or the KV read-modify-write above.
 * `source` labels the order_status_history row when the status changes.
 */
async function patchOrder(id: string, patch: Partial<Order>, savedElsewhere: boolean, source: string): Promise<Order | null> {
  if (ordersBackend() !== "d1") return applyOrderPatch(id, patch, savedElsewhere);
  try {
    const next = await getOrdersRepo().updateOrder(id, patch, source);
    if (next) await mirrorOrderToKv(next);
    return next;
  } catch (e) {
    console.error("[orders/d1] update failed", (e as Error)?.message);
    if (savedElsewhere) return null;
    throw new Error(ORDER_STORE_UNAVAILABLE);
  }
}

const getStoreFilePath = () => "";

const DUMMY_IDS = new Set([
  "a1000000-0000-0000-0000-000000000001",
  "a1000000-0000-0000-0000-000000000002",
  "a1000000-0000-0000-0000-000000000003",
  "rexrack-smart-organizer",
  "rexrack-power-station",
  "rexrack-mag-mount",
  "c1000000-0000-0000-0000-000000000001",
  "c1000000-0000-0000-0000-000000000002",
  "c1000000-0000-0000-0000-000000000003",
  "b1000000-0000-0000-0000-000000000001",
  "b1000000-0000-0000-0000-000000000002",
  "b1000000-0000-0000-0000-000000000003",
  "b1000000-0000-0000-0000-000000000004",
  "b1000000-0000-0000-0000-000000000005",
  "b1000000-0000-0000-0000-000000000006",
  "b1000000-0000-0000-0000-000000000007",
]);

function loadFromFile() {
  // Edge runtime safe - in-memory and Supabase store
}

function saveToFile() {
  // Edge runtime safe - in-memory and Supabase store
}

loadFromFile();

export const dbStore = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("products")
        .select("*, offers:product_offers(*)")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    const custom = (await kvStore.get<Product[]>("custom_products_all")) || [];
    const merged = [...custom];
    for (const p of memoryProducts) {
      if (!merged.some((m) => m.id === p.id || m.slug === p.slug)) {
        merged.push(p);
      }
    }
    return merged;
  },

  async getProduct(idOrSlug: string): Promise<Product | null> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("products")
        .select("*, offers:product_offers(*)")
        .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
        .single();
      if (!error && data) return data;
    }
    const fromKv = await kvStore.get<Product>(`prod:${idOrSlug}`);
    if (fromKv) return fromKv;

    const found = memoryProducts.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found || null;
  },

  async saveProduct(productData: Partial<Product> & { offers?: Partial<ProductOffer>[] }): Promise<Product> {
    const admin = getSupabaseAdmin();
    const id = productData.id || `prod-${Date.now()}`;
    const newProduct: Product & { offers: ProductOffer[] } = {
      id,
      title_ar: productData.title_ar || "منتج جديد",
      title_en: productData.title_en || "",
      slug: productData.slug || `prod-${Date.now()}`,
      sku: productData.sku || `SKU-${Date.now()}`,
      base_price: Number(productData.base_price) || 0,
      compare_at_price: Number(productData.compare_at_price) || 0,
      cost_price: Number(productData.cost_price) || 0,
      images: productData.images || [],
      description_ar: productData.description_ar || "",
      stock_quantity: Number(productData.stock_quantity) || 50,
      status: productData.status || "active",
      created_at: productData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      offers: (productData.offers as ProductOffer[]) || [],
    };

    if (admin) {
      await admin.from("products").upsert({
        id: newProduct.id,
        title_ar: newProduct.title_ar,
        title_en: newProduct.title_en,
        slug: newProduct.slug,
        sku: newProduct.sku,
        base_price: newProduct.base_price,
        compare_at_price: newProduct.compare_at_price,
        cost_price: newProduct.cost_price,
        images: newProduct.images,
        description_ar: newProduct.description_ar,
        stock_quantity: newProduct.stock_quantity,
        status: newProduct.status,
      });
      if (newProduct.offers && newProduct.offers.length > 0) {
        await admin.from("product_offers").delete().eq("product_id", newProduct.id);
        await admin.from("product_offers").insert(
          newProduct.offers.map((o) => ({
            ...o,
            product_id: newProduct.id,
          }))
        );
      }
    }

    const idx = memoryProducts.findIndex((p) => p.id === id);
    if (idx >= 0) {
      memoryProducts[idx] = newProduct;
    } else {
      memoryProducts.unshift(newProduct);
    }
    saveToFile();

    try {
      await kvStore.put(`prod:${newProduct.id}`, newProduct);
      await kvStore.put(`prod:${newProduct.slug}`, newProduct);
      const currentCustom = (await kvStore.get<Product[]>("custom_products_all")) || [];
      const existIdx = currentCustom.findIndex((p) => p.id === newProduct.id || p.slug === newProduct.slug);
      if (existIdx >= 0) {
        currentCustom[existIdx] = newProduct;
      } else {
        currentCustom.unshift(newProduct);
      }
      await kvStore.put("custom_products_all", currentCustom);
    } catch (e) {
      console.warn("[KV saveProduct Error]", e);
    }

    return newProduct;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("product_offers").delete().eq("product_id", id);
      await admin.from("landing_pages").delete().eq("product_id", id);
      await admin.from("products").delete().eq("id", id);
    }
    const idx = memoryProducts.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0) {
      const removed = memoryProducts.splice(idx, 1)[0];
      const lpIdx = memoryLandingPages.findIndex(
        (lp) => lp.product_id === removed.id || lp.slug === removed.slug
      );
      if (lpIdx >= 0) {
        memoryLandingPages.splice(lpIdx, 1);
      }
      saveToFile();
    }

    try {
      await kvStore.delete(`prod:${id}`);
      const currentCustom = (await kvStore.get<Product[]>("custom_products_all")) || [];
      const filtered = currentCustom.filter((p) => p.id !== id && p.slug !== id);
      await kvStore.put("custom_products_all", filtered);
    } catch {}

    return true;
  },

  // LANDING PAGES
  async getLandingPages(): Promise<LandingPage[]> {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("landing_pages")
        .select("*, product:products(*)")
        .order("created_at", { ascending: false });
      if (!error && data) return data;
    }
    const customLps = (await kvStore.get<LandingPage[]>("custom_lps_all")) || [];
    const allLps = [...customLps];
    for (const mlp of memoryLandingPages) {
      if (!allLps.some((l) => l.id === mlp.id || l.slug === mlp.slug)) {
        allLps.push(mlp);
      }
    }
    const allProducts = await this.getProducts();
    return allLps.map((lp) => ({
      ...lp,
      sections_config: lp.sections_config || DEFAULT_LANDING_PAGE_SECTIONS,
      product: lp.product || allProducts.find((p) => p.id === lp.product_id),
    }));
  },

  async getLandingPage(slug: string): Promise<LandingPage | null> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("landing_pages")
        .select("*, product:products(*, offers:product_offers(*))")
        .eq("slug", slug)
        .single();
      if (!error && data) return data;
    }

    let lp = await kvStore.get<LandingPage>(`lp:${slug}`);
    if (!lp) {
      lp = memoryLandingPages.find((p) => p.slug === slug || p.id === slug) || null;
    }

    if (lp) {
      let prod = await this.getProduct(lp.product_id);
      if (!prod && lp.slug) prod = await this.getProduct(lp.slug);
      return {
        ...lp,
        sections_config: lp.sections_config || DEFAULT_LANDING_PAGE_SECTIONS,
        product: prod || undefined,
      };
    }

    // Auto-synthesize landing page if a product exists with this slug or id
    const prod = await this.getProduct(slug);
    if (prod) {
      return {
        id: `lp-auto-${prod.id}`,
        product_id: prod.id,
        title: prod.title_ar,
        slug: prod.slug,
        component_key: "starter-template",
        status: "active",
        deployment_status: "published",
        meta_pixel_id: memorySettings.default_meta_pixel_id,
        meta_capi_token: memorySettings.default_meta_capi_token,
        deployment_url: `/p/${prod.slug}`,
        created_at: prod.created_at,
        updated_at: prod.updated_at,
        sections_config: DEFAULT_LANDING_PAGE_SECTIONS,
        product: prod,
      };
    }

    return null;
  },

  async saveLandingPage(data: Partial<LandingPage>): Promise<LandingPage> {
    const admin = getSupabaseAdmin();
    const id = data.id || `lp-${Date.now()}`;
    const newLp: LandingPage = {
      id,
      product_id: data.product_id || memoryProducts[0]?.id || "",
      title: data.title || "صفحة هبوط جديدة",
      slug: data.slug || `page-${Date.now()}`,
      component_key: data.component_key || data.slug || "starter-template",
      custom_domain: data.custom_domain,
      status: data.status || "active",
      meta_pixel_id: data.meta_pixel_id || memorySettings.default_meta_pixel_id,
      meta_capi_token: data.meta_capi_token || memorySettings.default_meta_capi_token,
      head_scripts: data.head_scripts,
      custom_css: data.custom_css,
      deployment_url: data.deployment_url || `/p/${data.slug}`,
      deployment_status: data.deployment_status || "published",
      sections_config: data.sections_config || DEFAULT_LANDING_PAGE_SECTIONS,
      content_config: data.content_config,
      last_published_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (admin) {
      await admin.from("landing_pages").upsert({
        id: newLp.id,
        product_id: newLp.product_id,
        title: newLp.title,
        slug: newLp.slug,
        component_key: newLp.component_key,
        custom_domain: newLp.custom_domain,
        status: newLp.status,
        meta_pixel_id: newLp.meta_pixel_id,
        meta_capi_token: newLp.meta_capi_token,
        head_scripts: newLp.head_scripts,
        custom_css: newLp.custom_css,
        deployment_url: newLp.deployment_url,
        deployment_status: newLp.deployment_status,
      });
    }

    const idx = memoryLandingPages.findIndex((p) => p.id === id);
    if (idx >= 0) {
      memoryLandingPages[idx] = newLp;
    } else {
      memoryLandingPages.unshift(newLp);
    }
    saveToFile();

    try {
      await kvStore.put(`lp:${newLp.slug}`, newLp);
      await kvStore.put(`lp:${newLp.id}`, newLp);
      const currentCustomLps = (await kvStore.get<LandingPage[]>("custom_lps_all")) || [];
      const existIdx = currentCustomLps.findIndex((l) => l.id === newLp.id || l.slug === newLp.slug);
      if (existIdx >= 0) {
        currentCustomLps[existIdx] = newLp;
      } else {
        currentCustomLps.unshift(newLp);
      }
      await kvStore.put("custom_lps_all", currentCustomLps);
    } catch (e) {
      console.warn("[KV saveLandingPage Error]", e);
    }

    return newLp;
  },

  async updateLandingPageSections(id: string, sections_config: LandingPageSectionConfig[]): Promise<LandingPage | null> {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("landing_pages").update({ updated_at: new Date().toISOString() }).eq("id", id);
      } catch {}
    }

    let lp = memoryLandingPages.find((p) => p.id === id || p.slug === id);
    if (lp) {
      lp.sections_config = sections_config;
      lp.updated_at = new Date().toISOString();
    }

    try {
      const fromKv = await kvStore.get<LandingPage>(`lp:${id}`) || (lp ? await kvStore.get<LandingPage>(`lp:${lp.slug}`) : null);
      if (fromKv) {
        fromKv.sections_config = sections_config;
        fromKv.updated_at = new Date().toISOString();
        await kvStore.put(`lp:${fromKv.slug}`, fromKv);
        await kvStore.put(`lp:${fromKv.id}`, fromKv);
        lp = fromKv;
      } else if (lp) {
        await kvStore.put(`lp:${lp.slug}`, lp);
        await kvStore.put(`lp:${lp.id}`, lp);
      }

      const currentCustomLps = (await kvStore.get<LandingPage[]>("custom_lps_all")) || [];
      const idx = currentCustomLps.findIndex((l) => l.id === id || l.slug === id);
      if (idx >= 0) {
        currentCustomLps[idx].sections_config = sections_config;
        currentCustomLps[idx].updated_at = new Date().toISOString();
        await kvStore.put("custom_lps_all", currentCustomLps);
      }
    } catch (e) {
      console.warn("[KV updateLandingPageSections Error]", e);
    }

    saveToFile();
    return lp || null;
  },

  async updateLandingPageContent(id: string, content_config: LandingPageContentConfig): Promise<LandingPage | null> {
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("landing_pages").update({ updated_at: new Date().toISOString() }).eq("id", id);
      } catch {}
    }

    let lp = memoryLandingPages.find((p) => p.id === id || p.slug === id);
    if (lp) {
      lp.content_config = content_config;
      lp.updated_at = new Date().toISOString();
    }

    try {
      const fromKv = (await kvStore.get<LandingPage>(`lp:${id}`)) || (lp ? await kvStore.get<LandingPage>(`lp:${lp.slug}`) : null);
      if (fromKv) {
        fromKv.content_config = content_config;
        fromKv.updated_at = new Date().toISOString();
        await kvStore.put(`lp:${fromKv.slug}`, fromKv);
        await kvStore.put(`lp:${fromKv.id}`, fromKv);
        lp = fromKv;
      } else if (lp) {
        await kvStore.put(`lp:${lp.slug}`, lp);
        await kvStore.put(`lp:${lp.id}`, lp);
      }

      const currentCustomLps = (await kvStore.get<LandingPage[]>("custom_lps_all")) || [];
      const idx = currentCustomLps.findIndex((l) => l.id === id || l.slug === id);
      if (idx >= 0) {
        currentCustomLps[idx].content_config = content_config;
        currentCustomLps[idx].updated_at = new Date().toISOString();
        await kvStore.put("custom_lps_all", currentCustomLps);
      }
    } catch (e) {
      console.warn("[KV updateLandingPageContent Error]", e);
    }

    saveToFile();
    return lp || null;
  },

  async toggleLandingPageStatus(id: string, status: "active" | "paused"): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("landing_pages").update({ status }).eq("id", id);
    }
    const found = memoryLandingPages.find((p) => p.id === id || p.slug === id);
    if (found) {
      found.status = status;
      found.updated_at = new Date().toISOString();
      saveToFile();
    }
    try {
      if (found) {
        await kvStore.put(`lp:${found.slug}`, found);
        await kvStore.put(`lp:${found.id}`, found);
      }
    } catch {}
    return true;
  },

  /** Reserved first path segments that a landing page slug must never take. */
  _RESERVED_SLUGS: new Set(["admin", "api", "p", "policy", "thank-you", "support", "_next"]),

  /** Lowercase, trim, spaces -> hyphens, keep Latin letters/digits/Arabic/hyphen/underscore. */
  normalizeSlug(raw: string): string {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF\-_]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);
  },

  /**
   * Renames a landing page (title and/or link) safely: validates, checks uniqueness against other
   * landing pages and products, writes the new keys and removes the stale old-slug key so the old
   * URL does not keep serving an outdated copy.
   */
  async updateLandingPageMeta(
    id: string,
    patch: { title?: string; slug?: string }
  ): Promise<{ ok: true; landingPage: LandingPage } | { ok: false; error: string }> {
    const current = await this.getLandingPage(id);
    if (!current) return { ok: false, error: "صفحة الهبوط غير موجودة" };

    const title = patch.title !== undefined ? String(patch.title).trim().slice(0, 120) : current.title;
    if (!title) return { ok: false, error: "اسم الصفحة مطلوب" };

    let slug = current.slug;
    if (patch.slug !== undefined) {
      slug = this.normalizeSlug(patch.slug);
      if (!slug) return { ok: false, error: "الرابط غير صالح. استخدم حروف أو أرقام أو شرطة فقط" };
      if (this._RESERVED_SLUGS.has(slug)) return { ok: false, error: "الرابط ده محجوز، اختار رابط تاني" };
      if (slug !== current.slug) {
        const [pages, prods] = await Promise.all([this.getLandingPages(), this.getProducts()]);
        if (pages.some((l) => l.id !== current.id && l.slug === slug)) {
          return { ok: false, error: "الرابط ده مستخدم في صفحة هبوط تانية" };
        }
        if (prods.some((p) => p.slug === slug && p.id !== current.product_id)) {
          return { ok: false, error: "الرابط ده مستخدم كرابط منتج تاني" };
        }
      }
    }

    const { product: _product, ...rest } = current as any;
    const updated = await this.saveLandingPage({
      ...rest,
      title,
      slug,
      deployment_url: `/p/${slug}`,
    });

    if (slug !== current.slug) {
      try {
        await kvStore.delete(`lp:${current.slug}`);
      } catch {}
      const mi = memoryLandingPages.findIndex((p) => p.id === current.id);
      if (mi >= 0) memoryLandingPages[mi] = { ...memoryLandingPages[mi], title, slug };
    }
    return { ok: true, landingPage: updated };
  },

  async deleteLandingPage(id: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("landing_pages").delete().eq("id", id);
    }
    const idx = memoryLandingPages.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0) {
      const removed = memoryLandingPages.splice(idx, 1)[0];
      saveToFile();
      try {
        await kvStore.delete(`lp:${removed.slug}`);
        await kvStore.delete(`lp:${removed.id}`);
      } catch {}
    }

    try {
      const currentCustomLps = (await kvStore.get<LandingPage[]>("custom_lps_all")) || [];
      const filtered = currentCustomLps.filter((l) => l.id !== id && l.slug !== id);
      await kvStore.put("custom_lps_all", filtered);
    } catch {}

    return true;
  },

  // ORDERS
  async getOrders(filters?: {
    landing_page_slug?: string;
    product_id?: string;
    status?: OrderStatus;
    search?: string;
    governorate?: string;
    /** created_at range (epoch ms, inclusive) and pagination — all optional. */
    created_from?: number;
    created_to?: number;
    limit?: number;
    offset?: number;
  }): Promise<Order[]> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    if (admin) {
      let query = admin
        .from("orders")
        .select("*, product:products(*), landing_page:landing_pages(*), tracking:order_tracking_meta(*)")
        .order("created_at", { ascending: false });

      if (filters?.landing_page_slug) query = query.eq("landing_page_slug", filters.landing_page_slug);
      if (filters?.product_id) query = query.eq("product_id", filters.product_id);
      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,customer_phone.ilike.%${filters.search}%,order_number.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (!error && data) return data;
    }

    // D1 (ORDERS_BACKEND=d1): filtering, ordering and pagination happen in SQL. No KV traffic.
    if (ordersBackend() === "d1") {
      const rows = await getOrdersRepo().listOrders(filters || {});
      let d1Products: Product[] = memoryProducts;
      try {
        d1Products = await this.getProducts();
      } catch (e) {
        console.warn("[getOrders] products lookup failed, using built-in catalog", e);
      }
      attachOrderRelations(rows, d1Products);
      return rows;
    }

    // KV: one list call per 1000 orders. Each key's metadata is the order's list view; only orders
    // whose list view did not fit in the metadata are read individually.
    const byId = new Map<string, Order>();
    const listedAt = new Map<string, number>(); // id → updated_at of the KV version
    const listing = await listOrderEntries();

    if (!listing.ok) {
      if (kvStore.isAvailable()) {
        console.error("[getOrders] KV order listing failed — serving this isolate's memory only");
      }
      for (const mo of memoryOrders) byId.set(mo.id, mo);
    } else {
      const needsRecord: string[] = [];
      for (const entry of listing.entries) {
        const meta = entry.meta;
        if (meta) listedAt.set(entry.id, orderTime(meta.u));
        // Cheap pre-filter on exact-match fields (skipped when the metadata was truncated).
        if (meta && !meta.t) {
          if (filters?.status && meta.st !== filters.status) continue;
          if (filters?.landing_page_slug && meta.lp !== filters.landing_page_slug) continue;
          if (filters?.product_id && meta.p !== filters.product_id) continue;
        }
        const fromMeta = orderFromMeta(entry.id, meta);
        if (fromMeta) byId.set(entry.id, fromMeta);
        else needsRecord.push(entry.id);
      }

      const records = await mapLimit(needsRecord, 8, async (id) => {
        let res = await readOrderRecord(id);
        if (res.status === "error") res = await readOrderRecord(id); // one retry
        if (res.status === "found") return res.value;
        if (res.status === "error") console.error(`[getOrders] could not read order ${id}`);
        return memoryOrders.find((o) => o.id === id) || null;
      });
      for (const rec of records) if (rec) byId.set(rec.id, rec);

      // Legacy single-key store: include what is not migrated yet, and migrate a batch.
      try {
        const legacy = await reconcileLegacyOrders(new Set(listing.entries.map((e) => e.id)));
        for (const lo of legacy) {
          if (!listedAt.has(lo.id) && !byId.has(lo.id) && !memoryDeletedOrderIds.has(lo.id)) byId.set(lo.id, lo);
        }
      } catch (e) {
        console.error("[getOrders] legacy order reconciliation failed", e);
      }

      // This isolate's own recent writes win over a listing that has not caught up yet.
      const now = Date.now();
      for (const mo of memoryOrders) {
        if (memoryDeletedOrderIds.has(mo.id)) continue;
        const moTime = orderTime(mo.updated_at);
        const kvTime = listedAt.get(mo.id);
        if (kvTime !== undefined) {
          if (moTime > kvTime) byId.set(mo.id, mo);
        } else if (!byId.has(mo.id) && now - moTime < MEMORY_ORDER_FRESH_MS) {
          byId.set(mo.id, mo);
        }
      }
    }

    let results = Array.from(byId.values());

    if (filters?.landing_page_slug) {
      results = results.filter((o) => o.landing_page_slug === filters.landing_page_slug);
    }
    if (filters?.product_id) {
      results = results.filter((o) => o.product_id === filters.product_id);
    }
    if (filters?.status) {
      results = results.filter((o) => o.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (o) =>
          String(o.customer_name || "").toLowerCase().includes(q) ||
          String(o.customer_phone || "").includes(q) ||
          String(o.order_number || "").toLowerCase().includes(q) ||
          String(o.governorate || "").toLowerCase().includes(q)
      );
    }

    // Always ensure product is attached for display (relations are not persisted with the order)
    let products: Product[] = memoryProducts;
    try {
      products = await this.getProducts();
    } catch (e) {
      console.warn("[getOrders] products lookup failed, using built-in catalog", e);
    }
    attachOrderRelations(results, products);

    results.sort((a, b) => orderTime(b.created_at) - orderTime(a.created_at));

    // Same optional filters as the D1 backend, applied in memory.
    if (filters?.governorate) results = results.filter((o) => o.governorate === filters.governorate);
    if (Number.isFinite(filters?.created_from)) {
      results = results.filter((o) => orderTime(o.created_at) >= (filters!.created_from as number));
    }
    if (Number.isFinite(filters?.created_to)) {
      results = results.filter((o) => orderTime(o.created_at) <= (filters!.created_to as number));
    }
    if (filters?.limit !== undefined || filters?.offset !== undefined) {
      const offset = Math.max(Math.floor(Number(filters.offset) || 0), 0);
      const limit = filters.limit === undefined ? results.length : Math.max(Math.floor(Number(filters.limit) || 0), 1);
      results = results.slice(offset, offset + limit);
    }
    return results;
  },

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | null> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    const updatePayload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (admin) {
      try {
        await admin.from("orders").update(updatePayload).eq("id", id);
      } catch (e) {
        console.error("[Supabase updateOrder error]", e);
      }
    }

    const order = await patchOrder(id, updatePayload, Boolean(admin), "admin");
    if (!order) return null;

    let products: Product[] = memoryProducts;
    try {
      products = await this.getProducts();
    } catch {}
    attachOrderRelations([order], products);
    saveToFile();
    return order;
  },

  async getOrder(id: string): Promise<Order | null> {
    const admin = getSupabaseAdmin();
    if (admin) {
      const { data, error } = await admin
        .from("orders")
        .select("*, product:products(*), landing_page:landing_pages(*), tracking:order_tracking_meta(*)")
        .eq("id", id)
        .single();
      if (!error && data) return data;
    }

    let order: Order | null;
    if (ordersBackend() === "d1") {
      order = await getOrdersRepo().getOrder(id);
    } else {
      const loaded = await loadOrderForWrite(id);
      if (loaded.kvError) console.error(`[getOrder] KV read failed for ${id}`);
      order = loaded.order;
    }
    if (!order || memoryDeletedOrderIds.has(order.id)) return null;

    const found: Order = { ...order };
    let products: Product[] = memoryProducts;
    try {
      products = await this.getProducts();
    } catch {}
    attachOrderRelations([found], products);
    return found;
  },

  async createOrder(order: Partial<Order> & { tracking?: Partial<OrderTrackingMeta> }): Promise<Order> {
    const admin = getSupabaseAdmin();
    const id = generateOrderId();
    const useD1 = ordersBackend() === "d1";

    // Collision check against today's order numbers (KV listing metadata + this isolate's memory).
    // Read-only and best-effort: if the listing fails we skip the check — the order is written to
    // its own brand-new key either way, so a failed read can never overwrite or drop other orders.
    // D1: skipped entirely — uniqueness is a UNIQUE index and a collision is retried at insert time.
    let takenNumbers = new Set<string>();
    try {
      if (!useD1 && kvStore.isAvailable()) takenNumbers = await listRecentOrderNumbers();
    } catch (e) {
      console.warn("[KV createOrder read error]", e);
    }
    const orderNumber = useD1
      ? generateOrderNumber()
      : generateUniqueOrderNumber(
          (candidate) =>
            takenNumbers.has(candidate) ||
            memoryOrders.some((o) => o.order_number === candidate)
        );

    const newOrder: Order = {
      id,
      order_number: orderNumber,
      landing_page_id: order.landing_page_id,
      landing_page_slug: order.landing_page_slug || "direct",
      product_id: order.product_id!,
      offer_id: order.offer_id,
      customer_name: order.customer_name!,
      customer_phone: order.customer_phone!,
      customer_phone2: order.customer_phone2,
      governorate: order.governorate!,
      city: order.city || "",
      address: order.address!,
      notes: order.notes,
      quantity: order.quantity || 1,
      unit_price: order.unit_price || 0,
      total_amount: order.total_amount || 0,
      shipping_fee: order.shipping_fee || 0,
      discount_amount: order.discount_amount || 0,
      final_amount: order.final_amount || 0,
      currency: "EGP",
      status: "pending",
      payment_method: order.payment_method || "cod",
      safqa_status: "not_synced",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracking: order.tracking as OrderTrackingMeta,
    };

    // Attach relations for the returned/in-memory order only — they are never persisted,
    // and the landing page copy never carries the CAPI token.
    const product = memoryProducts.find((p) => p.id === newOrder.product_id);
    newOrder.product = product;
    newOrder.landing_page = publicLandingPageFor(newOrder.landing_page_slug);

    // D1 first, so the order number is final (unique-index retry) before anything else sees it.
    // One batch: the order row + its first status-history row. Zero KV writes, zero KV list calls.
    let savedToD1 = false;
    if (useD1) {
      try {
        const stored = await getOrdersRepo().insertOrderWithUniqueNumber(
          sanitizeOrderForStorage(newOrder),
          () => generateOrderNumber()
        );
        if (stored) {
          newOrder.order_number = stored.order_number;
          savedToD1 = true;
        }
      } catch (e) {
        console.error("[D1 createOrder write error]", (e as Error)?.message);
      }
    }

    let savedToSupabase = false;
    if (admin) {
      try {
        const { error: insertError } = await admin.from("orders").insert({
          id: newOrder.id,
          order_number: newOrder.order_number,
          landing_page_id: newOrder.landing_page_id,
          landing_page_slug: newOrder.landing_page_slug,
          product_id: newOrder.product_id,
          offer_id: newOrder.offer_id,
          customer_name: newOrder.customer_name,
          customer_phone: newOrder.customer_phone,
          customer_phone2: newOrder.customer_phone2,
          governorate: newOrder.governorate,
          city: newOrder.city,
          address: newOrder.address,
          notes: newOrder.notes,
          quantity: newOrder.quantity,
          unit_price: newOrder.unit_price,
          total_amount: newOrder.total_amount,
          shipping_fee: newOrder.shipping_fee,
          discount_amount: newOrder.discount_amount,
          final_amount: newOrder.final_amount,
          currency: newOrder.currency,
          status: newOrder.status,
          payment_method: newOrder.payment_method,
        });
        if (insertError) {
          console.error("[Supabase createOrder insert error]", insertError);
        } else {
          savedToSupabase = true;
        }

        if (savedToSupabase && order.tracking) {
          await admin.from("order_tracking_meta").insert({
            order_id: newOrder.id,
            utm_source: order.tracking.utm_source,
            utm_medium: order.tracking.utm_medium,
            utm_campaign: order.tracking.utm_campaign,
            utm_content: order.tracking.utm_content,
            utm_term: order.tracking.utm_term,
            referrer: order.tracking.referrer,
            ip_address: order.tracking.ip_address,
            user_agent: order.tracking.user_agent,
            fbp: order.tracking.fbp,
            fbc: order.tracking.fbc,
            event_id: order.tracking.event_id,
          });
        }
      } catch (e) {
        console.error("[Supabase createOrder error]", e);
      }
    }

    // One KV key per order: no shared list to read-modify-write, no cap on how many are kept.
    if (useD1) {
      // With D1 selected an order is never left only in memory (lists read D1): fail loudly instead.
      if (!savedToD1 && !savedToSupabase) {
        throw new OrderPersistenceError(`Order ${newOrder.order_number} could not be persisted to D1`);
      }
      if (savedToD1) await mirrorOrderToKv(newOrder);
      return newOrder;
    }

    let savedToKv = false;
    try {
      savedToKv = await writeOrderRecord(newOrder);
    } catch (e) {
      console.error("[KV createOrder write error]", e);
    }

    // The order must land somewhere durable. Memory only survives this isolate,
    // so memory-only is accepted solely outside production (local dev without KV/Supabase).
    if (!savedToSupabase && !savedToKv) {
      if (process.env.NODE_ENV === "production") {
        throw new OrderPersistenceError(
          `Order ${newOrder.order_number} could not be persisted to Supabase or KV`
        );
      }
      console.warn("[createOrder] order kept in memory only (no durable store reachable)");
    }

    rememberOrder(newOrder);
    saveToFile();
    return newOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const updated_at = new Date().toISOString();
    if (admin) {
      await admin.from("orders").update({ status, updated_at }).eq("id", id);
    }
    try {
      const order = await patchOrder(id, { status, updated_at }, Boolean(admin), "status");
      saveToFile();
      return Boolean(order);
    } catch (e) {
      console.error(`[updateOrderStatus] order ${id} was not persisted`, e);
      return false;
    }
  },

  async updateSafqaInfo(id: string, safqaData: {
    safqa_invoice_id?: string;
    safqa_invoice_url?: string;
    safqa_status: SafqaSyncStatus;
    safqa_response?: any;
  }): Promise<boolean> {
    const admin = getSupabaseAdmin();
    const updatePayload = {
      ...safqaData,
      safqa_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (admin) {
      await admin.from("orders").update(updatePayload).eq("id", id);
    }
    try {
      const order = await patchOrder(id, updatePayload, Boolean(admin), "safka");
      saveToFile();
      return Boolean(order);
    } catch (e) {
      console.error(`[updateSafqaInfo] order ${id} was not persisted`, e);
      return false;
    }
  },

  async deleteOrder(id: string): Promise<boolean> {
    loadFromFile();
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("order_tracking_meta").delete().eq("order_id", id);
        await admin.from("orders").delete().eq("id", id);
      } catch (e) {
        console.error("[Supabase deleteOrder error]", e);
      }
    }

    if (ordersBackend() === "d1") {
      const result = await this.deleteOrders([id]); // (Supabase delete above is idempotent)
      return result.count > 0 || Boolean(admin);
    }

    // Everything that identifies this order, so the Safka sync can never resurrect it.
    const tokens = new Set<string>([id]);
    if (id.startsWith("sfk-")) tokens.add(id.slice(4)); // virtual Safka order → its serial number
    let targetId = id;
    try {
      const { order } = await loadOrderForWrite(id);
      if (order) {
        targetId = order.id;
        tokens.add(order.id);
        if (order.order_number) tokens.add(order.order_number);
        if (order.safqa_invoice_id) tokens.add(order.safqa_invoice_id);
      }
    } catch (e) {
      console.warn("[deleteOrder] lookup failed, deleting by id only", e);
    }

    tokens.forEach((t) => memoryDeletedOrderIds.add(t));
    memoryOrders = memoryOrders.filter((o) => !tokens.has(o.id) && !tokens.has(o.order_number));
    saveToFile();

    if (!kvStore.isAvailable()) return true;
    let ok = false;
    try {
      // Tombstone first: if the key delete then fails, the order is at least never re-imported.
      const tombOk = await writeOrderTombstone(targetId, Array.from(tokens));
      const delOk = await kvStore.delete(orderKey(targetId));
      ok = tombOk && delOk;
    } catch (e) {
      console.error("[KV deleteOrder error]", e);
    }
    return ok || Boolean(admin);
  },

  async deleteOrders(ids: string[]): Promise<{ count: number }> {
    loadFromFile();
    const idSet = new Set(ids);
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("order_tracking_meta").delete().in("order_id", ids);
        await admin.from("orders").delete().in("id", ids);
      } catch (e) {
        console.error("[Supabase deleteOrders error]", e);
      }
    }

    // D1: tombstones + deletes for every id in ONE transaction (one D1 query, no KV traffic).
    if (ordersBackend() === "d1") {
      try {
        const res = await getOrdersRepo().deleteOrders(
          Array.from(idSet).map((id) => ({ key: id, tokens: id.startsWith("sfk-") ? [id.slice(4)] : [] }))
        );
        res.tokens.forEach((t) => memoryDeletedOrderIds.add(t));
        if (ordersKvMirrorEnabled()) {
          await mapLimit(Array.from(idSet), 6, async (id) => {
            try {
              await writeOrderTombstone(id, res.tokens);
              await kvStore.delete(orderKey(id));
            } catch {}
          });
        }
        // Like the KV path: a recorded deletion counts even when no stored row existed (virtual Safka orders).
        return { count: idSet.size };
      } catch (e) {
        console.error("[D1 deleteOrders error]", (e as Error)?.message);
        return { count: admin ? ids.length : 0 };
      }
    }

    // One listing resolves every order number / Safka serial (no per-order read).
    const listing = kvStore.isAvailable() ? await listOrderEntries() : { ok: false, entries: [] };
    const targets = Array.from(idSet).map((id) => {
      const tokens = new Set<string>([id]);
      if (id.startsWith("sfk-")) tokens.add(id.slice(4));
      let targetId = id;
      const entry = listing.entries.find((e) => e.id === id) || listing.entries.find((e) => e.meta?.n === id);
      if (entry) {
        targetId = entry.id;
        tokens.add(entry.id);
        if (entry.meta?.n) tokens.add(entry.meta.n);
        if (entry.meta?.si) tokens.add(entry.meta.si);
      }
      const mem = findMemoryOrder(id);
      if (mem) {
        targetId = mem.id;
        tokens.add(mem.id);
        if (mem.order_number) tokens.add(mem.order_number);
        if (mem.safqa_invoice_id) tokens.add(mem.safqa_invoice_id);
      }
      return { targetId, tokens: Array.from(tokens) };
    });

    const allTokens = new Set<string>();
    targets.forEach((t) => t.tokens.forEach((tok) => allTokens.add(tok)));
    allTokens.forEach((t) => memoryDeletedOrderIds.add(t));
    const beforeCount = memoryOrders.length;
    memoryOrders = memoryOrders.filter((o) => !allTokens.has(o.id) && !allTokens.has(o.order_number));
    const memoryCount = beforeCount - memoryOrders.length;
    saveToFile();

    if (!kvStore.isAvailable()) return { count: memoryCount || ids.length };

    const outcomes = await mapLimit(targets, 6, async (t) => {
      try {
        const tombOk = await writeOrderTombstone(t.targetId, t.tokens);
        const delOk = await kvStore.delete(orderKey(t.targetId));
        return tombOk && delOk;
      } catch (e) {
        console.error("[KV deleteOrders error]", e);
        return false;
      }
    });
    const kvCount = outcomes.filter(Boolean).length;
    return { count: admin ? ids.length : kvCount };
  },

  /** Sync check against this isolate's set — call refreshDeletedOrderIds() first for the durable list. */
  isOrderDeleted(idOrSerial: string): boolean {
    return memoryDeletedOrderIds.has(idOrSerial);
  },

  /** Loads the durable deletion tombstones from KV into this isolate (deletions made by other isolates). */
  async refreshDeletedOrderIds(): Promise<void> {
    try {
      if (ordersBackend() === "d1") {
        (await getOrdersRepo().listDeletedTokens()).forEach((t) => memoryDeletedOrderIds.add(t));
        return;
      }
      const res = await listDeletedOrderTokens();
      if (res.ok) res.tokens.forEach((t) => memoryDeletedOrderIds.add(t));
    } catch (e) {
      console.warn("[refreshDeletedOrderIds] failed", e);
    }
  },

  // ANALYTICS & STATS
  async getAnalyticsSummary() {
    loadFromFile();
    const orders = await this.getOrders();
    const landingPages = await this.getLandingPages();
    const products = await this.getProducts();

    const totalRevenue = orders.reduce((acc, o) => (o.status !== "cancelled" ? acc + Number(o.final_amount) : acc), 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const now = Date.now();
    const fifteenMinsAgo = now - 15 * 60 * 1000;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayMs = startOfToday.getTime();

    // Visitor tracking calculations
    const allVisitorIds = new Set<string>();
    const todayVisitorIds = new Set<string>();
    const onlineVisitorIds = new Set<string>();

    let totalPageViews = 0;
    let totalScrollEvents = 0;
    let totalOfferSelects = 0;
    let totalCtaClicks = 0;
    let totalFormStarts = 0;
    let totalPurchases = orders.length;

    const deviceCounts: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 };
    const sourceCounts: Record<string, number> = {};
    const pageVisitsCount: Record<string, { views: number; visitors: Set<string> }> = {};

    memoryAnalytics.forEach((ev) => {
      const vId = ev.visitor_id || ev.ip_address || "visitor_guest";
      allVisitorIds.add(vId);
      const evTime = ev.created_at ? new Date(ev.created_at).getTime() : now;

      if (evTime >= startOfTodayMs) {
        todayVisitorIds.add(vId);
      }
      if (evTime >= fifteenMinsAgo) {
        onlineVisitorIds.add(vId);
      }

      const evName = (ev.event_name || "").toLowerCase();
      if (evName === "pageview" || evName === "viewcontent") totalPageViews++;
      else if (evName.includes("scroll")) totalScrollEvents++;
      else if (evName.includes("offer") || evName === "addtocart") totalOfferSelects++;
      else if (evName.includes("cta") || evName.includes("click")) totalCtaClicks++;
      else if (evName.includes("form") || evName.includes("checkout")) totalFormStarts++;
      else if (evName === "purchase") totalPurchases++;

      if (ev.device_type) {
        deviceCounts[ev.device_type] = (deviceCounts[ev.device_type] || 0) + 1;
      }

      const src = ev.utm_source || (ev.referrer && ev.referrer.includes("facebook") ? "Facebook" : ev.referrer && ev.referrer.includes("tiktok") ? "TikTok" : "مباشر (Direct)");
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      const slug = ev.landing_page_slug || (ev.page_url ? ev.page_url.replace(/^\/p\//, "").split("?")[0] : "home");
      if (!pageVisitsCount[slug]) {
        pageVisitsCount[slug] = { views: 0, visitors: new Set() };
      }
      pageVisitsCount[slug].views++;
      pageVisitsCount[slug].visitors.add(vId);
    });

    const uniqueVisitorsCount = allVisitorIds.size || (orders.length > 0 ? orders.length * 3 + 12 : 0);
    const todayVisitorsCount = todayVisitorIds.size || (orders.length > 0 ? 3 : 0);
    const onlineVisitorsCount = onlineVisitorIds.size;

    // By landing page
    const lpPerformance = landingPages.map((lp) => {
      const lpOrders = orders.filter((o) => o.landing_page_slug === lp.slug);
      const lpRevenue = lpOrders.reduce((acc, o) => (o.status !== "cancelled" ? acc + Number(o.final_amount) : acc), 0);
      const trackedData = pageVisitsCount[lp.slug];
      const realVisits = trackedData ? trackedData.views : (lpOrders.length > 0 ? lpOrders.length * 5 : 0);
      const uniqueVisits = trackedData ? trackedData.visitors.size : (lpOrders.length > 0 ? lpOrders.length * 3 : 0);
      const conversionRate = uniqueVisits > 0 ? ((lpOrders.length / uniqueVisits) * 100).toFixed(1) : (lpOrders.length > 0 ? "10.0" : "0.0");

      return {
        id: lp.id,
        title: lp.title,
        slug: lp.slug,
        status: lp.status,
        productTitle: lp.product?.title_ar || "منتج",
        ordersCount: lpOrders.length,
        revenue: lpRevenue,
        estimatedVisits: realVisits,
        uniqueVisitors: uniqueVisits,
        conversionRate: `${conversionRate}%`,
      };
    });

    // Top Governorates
    const govCounts: Record<string, number> = {};
    orders.forEach((o) => {
      govCounts[o.governorate] = (govCounts[o.governorate] || 0) + 1;
    });

    // Funnel
    const totalFunnelStarts = totalPageViews || (uniqueVisitorsCount > 0 ? uniqueVisitorsCount * 2 : 0);
    const funnel = [
      { step: "زيارة الصفحة (Page Views)", count: totalFunnelStarts, icon: "Eye" },
      { step: "قراءة وتصفح التفاصيل (Scroll 50%+)", count: totalScrollEvents || Math.round(totalFunnelStarts * 0.7), icon: "FileText" },
      { step: "تفاعل مع العروض (Select Offer)", count: totalOfferSelects || Math.round(totalFunnelStarts * 0.45), icon: "Layers" },
      { step: "نقر اطلب الآن (Click CTA)", count: totalCtaClicks || Math.round(totalFunnelStarts * 0.35), icon: "MousePointerClick" },
      { step: "كتابة بيانات الشحن (Form Start)", count: totalFormStarts || Math.round(totalFunnelStarts * 0.25), icon: "Edit3" },
      { step: "إتمام الشراء وتأكيد الطلب (Orders)", count: totalOrders, icon: "CheckCircle2" },
    ];

    // Live Activity Stream
    const recentActivity = memoryAnalytics.slice(-50).reverse().map((ev) => {
      let arabicDescription = "تصفح صفحة";
      const name = ev.event_name;
      if (name === "PageView") arabicDescription = `فتح وتصفح صفحة ${ev.page_title || ev.landing_page_slug || ev.page_url}`;
      else if (name === "ScrollDepth") arabicDescription = `نزل لـ ${ev.metadata?.depth || "50%"} من الصفحة وقرأ المواصفات`;
      else if (name === "SelectOffer") arabicDescription = `اختار باقة (${ev.metadata?.title || ev.metadata?.quantity + " قطع"}) بسعر ${ev.metadata?.price || ""} ج.م`;
      else if (name === "ClickCTA") arabicDescription = `نقر على زر "${ev.metadata?.label || "اطلب الآن"}"`;
      else if (name === "FormInteraction") arabicDescription = `بدأ بكتابة بيانات الطلب في خانة (${ev.metadata?.field || "الفورم"})`;
      else if (name === "Purchase") arabicDescription = `أتم الطلب بنجاح بمبلغ ${ev.metadata?.total || ""} ج.م (رقم الطلب: ${ev.metadata?.order_number || ""})`;
      else arabicDescription = `${name} على ${ev.page_url}`;

      return {
        id: ev.id || `act-${Math.random()}`,
        eventName: ev.event_name,
        arabicDescription,
        pageUrl: ev.page_url,
        landingPageSlug: ev.landing_page_slug || "direct",
        deviceType: ev.device_type || "mobile",
        utmSource: ev.utm_source || "direct",
        createdAt: ev.created_at || new Date().toISOString(),
        metadata: ev.metadata,
      };
    });

    return {
      totalRevenue,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      confirmedOrders,
      avgOrderValue,
      landingPagesCount: landingPages.length,
      activeLandingPagesCount: landingPages.filter((lp) => lp.status === "active").length,
      productsCount: products.length,
      lpPerformance,
      topGovernorates: Object.entries(govCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      tracking: {
        totalPageViews,
        uniqueVisitors: uniqueVisitorsCount,
        todayVisitors: todayVisitorsCount,
        onlineVisitors: onlineVisitorsCount,
        deviceCounts,
        sourceCounts,
        funnel,
        recentActivity,
      },
    };
  },

  async logAnalyticsEvent(event: AnalyticsEvent) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: event.id || `ev-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: event.created_at || new Date().toISOString(),
    };
    const admin = getSupabaseAdmin();
    if (admin) {
      try {
        await admin.from("analytics_events").insert(fullEvent);
      } catch (e) {
        // ignore
      }
    }
    memoryAnalytics.push(fullEvent);
    if (memoryAnalytics.length > 1000) {
      memoryAnalytics = memoryAnalytics.slice(-1000);
    }
    saveToFile();
    return fullEvent;
  },

  // SETTINGS
  async getSettings(): Promise<SystemSettings> {
    const overrides = await readSettingsOverrides();
    const merged: any = { ...memorySettings, ...overrides };
    // Empty secret fields fall back to env (so rotating an env var takes effect without a DB edit)
    const env: any = envSettingDefaults();
    for (const k of Object.keys(env)) {
      if (!merged[k]) merged[k] = env[k];
    }
    return merged as SystemSettings;
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    // Persist only the admin overrides (never the env-filled secrets)
    const overrides = { ...(await readSettingsOverrides()), ...newSettings };
    memorySettings = { ...memorySettings, ...newSettings };
    await kvStore.put(SETTINGS_KV_KEY, overrides);
    return this.getSettings();
  },
};
