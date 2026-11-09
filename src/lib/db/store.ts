import fs from "fs";
import path from "path";
import { Product, ProductOffer, LandingPage, Order, OrderTrackingMeta, AnalyticsEvent, SystemSettings, OrderStatus, SafqaSyncStatus } from "@/types";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
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
    meta_pixel_id: "1636283807582751",
    meta_capi_token: "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
    deployment_url: "/p/safka-rxuirx2",
    deployment_status: "published",
    last_published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: initialProducts[2],
  },
];

const initialOrders: Order[] = [
  {
    id: "ord-1001",
    order_number: "EG-261101-4412",
    landing_page_id: "c1000000-0000-0000-0000-000000000010",
    landing_page_slug: "safka-b5fb3b6b",
    product_id: "prod-1793739856444",
    offer_id: "off-6ad092978e0e888bb5fb3b6b-2",
    customer_name: "محمد عبد الرحمن",
    customer_phone: "01012345678",
    customer_phone2: "01187654321",
    governorate: "القاهرة",
    city: "مدينة نصر",
    address: "شارع مصطفى النحاس، عمارة 14",
    notes: "يرجى الاتصال قبل الوصول",
    quantity: 2,
    unit_price: 486,
    total_amount: 972,
    shipping_fee: 0,
    discount_amount: 594,
    final_amount: 972,
    currency: "EGP",
    status: "confirmed",
    payment_method: "cod",
    safqa_invoice_id: "INV-SFQ-99120",
    safqa_invoice_url: "https://pay.safqapay.com/inv/INV-SFQ-99120",
    safqa_status: "pending",
    safqa_synced_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    product: initialProducts[0],
    landing_page: initialLandingPages[0],
    tracking: {
      order_id: "ord-1001",
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: "campaign_v1",
      event_id: "evt_1001",
    },
  },
  {
    id: "ord-1002",
    order_number: "EG-261102-8874",
    landing_page_id: "c1000000-0000-0000-0000-000000000010",
    landing_page_slug: "safka-b5fb3b6b",
    product_id: "prod-1793739856444",
    offer_id: "off-6ad092978e0e888bb5fb3b6b-1",
    customer_name: "أحمد حسني فاروق",
    customer_phone: "01234567890",
    governorate: "الإسكندرية",
    city: "سموحة",
    address: "شارع فوزي معاذ بجوار المسجد",
    quantity: 1,
    unit_price: 540,
    total_amount: 540,
    shipping_fee: 50,
    discount_amount: 243,
    final_amount: 590,
    currency: "EGP",
    status: "shipped",
    payment_method: "cod",
    safqa_invoice_id: "INV-SFQ-99145",
    safqa_status: "pending",
    safqa_synced_at: new Date(Date.now() - 20 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 20 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    product: initialProducts[0],
    landing_page: initialLandingPages[0],
    tracking: {
      order_id: "ord-1002",
      utm_source: "instagram",
      utm_medium: "reel_ad",
      utm_campaign: "campaign_v2",
      event_id: "evt_1002",
    },
  },
];

const initialSettings: SystemSettings = {
  safqa_api_base_url: process.env.SAFQA_API_BASE_URL || "https://api.safqapay.com/v1",
  safqa_merchant_id: process.env.SAFQA_MERCHANT_ID || "MERCHANT_EG_984",
  safqa_api_secret_token: process.env.SAFQA_API_SECRET_TOKEN || process.env.SAFKA_API_KEY || "sk_542077e40b44f0837da89f7f542f752270ac78644240cfa46a98b9afe8e312fc",
  safqa_webhook_secret: process.env.SAFQA_WEBHOOK_SECRET || "WH_SECRET_984",
  safqa_sandbox_mode: false,
  safqa_auto_forward: true,
  default_meta_pixel_id: process.env.NEXT_PUBLIC_META_PIXEL_ID || "1636283807582751",
  default_meta_capi_token: process.env.META_CAPI_ACCESS_TOKEN || "EAAXuaKCAEB4BS3vKJpFxUZC4jnLSiUgurp2itSFZCheAaCFOG4eiLm5hF7lu0YZC4fUm3UQas9TFe8sLUTZBpBjZC0nYABU7BUfAjSloTPtjR5hC0c9xAoWVL96BHAj4S72BQcB4xrSEN7NxLxghfk7zRY4edCWNehpBZAPk9fejGVR5lVfS3A5fZBd54WjMk5yNgZDZD",
  meta_test_event_code: process.env.META_TEST_EVENT_CODE || "",
  store_name: "RexRack",
  support_phone: "01000000000",
  support_whatsapp: "201000000000",
};

// In-Memory cache singleton for development & fast fallback
let memoryProducts = [...initialProducts];
let memoryLandingPages = [...initialLandingPages];
let memoryOrders = [...initialOrders];
let memorySettings = { ...initialSettings };
let memoryAnalytics: AnalyticsEvent[] = [];

const getStoreFilePath = () => {
  if (process.env.VERCEL) {
    return "/tmp/rexrack-store.json";
  }
  const dir = path.join(process.cwd(), ".next");
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return path.join(dir, "rexrack-store.json");
};

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
  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.products) && data.products.length > 0) {
        const existingIds = new Set(memoryProducts.map((p) => p.id));
        for (const p of data.products) {
          if (!existingIds.has(p.id) && !DUMMY_IDS.has(p.id) && !DUMMY_IDS.has(p.slug)) {
            memoryProducts.push(p);
            existingIds.add(p.id);
          }
        }
      }
      if (Array.isArray(data.landingPages) && data.landingPages.length > 0) {
        const existingIds = new Set(memoryLandingPages.map((lp) => lp.id));
        for (const lp of data.landingPages) {
          if (!existingIds.has(lp.id) && !DUMMY_IDS.has(lp.id) && !DUMMY_IDS.has(lp.product_id) && !DUMMY_IDS.has(lp.slug)) {
            memoryLandingPages.push(lp);
            existingIds.add(lp.id);
          }
        }
      }
      if (Array.isArray(data.orders) && data.orders.length > 0) {
        const existingIds = new Set(memoryOrders.map((o) => o.id));
        for (const o of data.orders) {
          if (!existingIds.has(o.id) && !DUMMY_IDS.has(o.product_id)) {
            memoryOrders.push(o);
            existingIds.add(o.id);
          }
        }
      }
      if (data.settings) {
        memorySettings = { ...initialSettings, ...data.settings };
      }
    }
  } catch (e) {
    // ignore
  }

  // Ensure memory state is never polluted with dummy products
  memoryProducts = memoryProducts.filter((p) => !DUMMY_IDS.has(p.id) && !DUMMY_IDS.has(p.slug));
  memoryLandingPages = memoryLandingPages.filter((lp) => !DUMMY_IDS.has(lp.id) && !DUMMY_IDS.has(lp.product_id) && !DUMMY_IDS.has(lp.slug));
  memoryOrders = memoryOrders.filter((o) => !DUMMY_IDS.has(o.product_id));
}

function saveToFile() {
  try {
    const filePath = getStoreFilePath();
    const data = {
      products: memoryProducts,
      landingPages: memoryLandingPages,
      orders: memoryOrders,
      settings: memorySettings,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    // ignore
  }
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
    return memoryProducts;
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
      // offers insert
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
      // Also remove any associated landing page
      const lpIdx = memoryLandingPages.findIndex(
        (lp) => lp.product_id === removed.id || lp.slug === removed.slug
      );
      if (lpIdx >= 0) {
        memoryLandingPages.splice(lpIdx, 1);
      }
      saveToFile();
      return true;
    }
    return false;
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
    // link products
    return memoryLandingPages.map((lp) => ({
      ...lp,
      product: memoryProducts.find((p) => p.id === lp.product_id),
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
    const lp = memoryLandingPages.find((p) => p.slug === slug || p.id === slug);
    if (lp) {
      return {
        ...lp,
        product: memoryProducts.find((p) => p.id === lp.product_id),
      };
    }

    // Auto-synthesize landing page if a product exists with this slug or id
    const prod = memoryProducts.find((p) => p.slug === slug || p.id === slug);
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
      component_key: data.component_key || data.slug || "portable-urinal",
      custom_domain: data.custom_domain,
      status: data.status || "active",
      meta_pixel_id: data.meta_pixel_id || memorySettings.default_meta_pixel_id,
      meta_capi_token: data.meta_capi_token || memorySettings.default_meta_capi_token,
      head_scripts: data.head_scripts,
      custom_css: data.custom_css,
      deployment_url: data.deployment_url || `/p/${data.slug}`,
      deployment_status: data.deployment_status || "published",
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
    return newLp;
  },

  async toggleLandingPageStatus(id: string, status: "active" | "paused"): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("landing_pages").update({ status }).eq("id", id);
    }
    const found = memoryLandingPages.find((p) => p.id === id);
    if (found) {
      found.status = status;
      found.updated_at = new Date().toISOString();
      return true;
    }
    return false;
  },

  async deleteLandingPage(id: string): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("landing_pages").delete().eq("id", id);
    }
    const idx = memoryLandingPages.findIndex((p) => p.id === id || p.slug === id);
    if (idx >= 0) {
      memoryLandingPages.splice(idx, 1);
      saveToFile();
      return true;
    }
    return false;
  },

  // ORDERS
  async getOrders(filters?: {
    landing_page_slug?: string;
    product_id?: string;
    status?: OrderStatus;
    search?: string;
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

    let results = [...memoryOrders];
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
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.includes(q) ||
          o.order_number.toLowerCase().includes(q) ||
          o.governorate.toLowerCase().includes(q)
      );
    }
    return results;
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
    const found = memoryOrders.find((o) => o.id === id || o.order_number === id);
    return found || null;
  },

  async createOrder(order: Partial<Order> & { tracking?: Partial<OrderTrackingMeta> }): Promise<Order> {
    const admin = getSupabaseAdmin();
    const id = `ord-${Date.now()}`;
    const orderNumber = `EG-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

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

    // Attach relations for memory store
    const product = memoryProducts.find((p) => p.id === newOrder.product_id);
    const lp = memoryLandingPages.find((p) => p.slug === newOrder.landing_page_slug);
    newOrder.product = product;
    newOrder.landing_page = lp;

    if (admin) {
      await admin.from("orders").insert({
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

      if (order.tracking) {
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
    }

    memoryOrders.unshift(newOrder);
    saveToFile();
    return newOrder;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<boolean> {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    }
    const order = memoryOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.updated_at = new Date().toISOString();
      saveToFile();
      return true;
    }
    return false;
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
    const order = memoryOrders.find((o) => o.id === id);
    if (order) {
      Object.assign(order, updatePayload);
      saveToFile();
      return true;
    }
    return false;
  },

  // ANALYTICS & STATS
  async getAnalyticsSummary() {
    const orders = await this.getOrders();
    const landingPages = await this.getLandingPages();
    const products = await this.getProducts();

    const totalRevenue = orders.reduce((acc, o) => (o.status !== "cancelled" ? acc + Number(o.final_amount) : acc), 0);
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const confirmedOrders = orders.filter((o) => o.status === "confirmed").length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // By landing page
    const lpPerformance = landingPages.map((lp) => {
      const lpOrders = orders.filter((o) => o.landing_page_slug === lp.slug);
      const lpRevenue = lpOrders.reduce((acc, o) => (o.status !== "cancelled" ? acc + Number(o.final_amount) : acc), 0);
      const estimatedVisits = Math.max(lpOrders.length * 14 + 120, 150); // realistic mock visits if not tracked yet
      const conversionRate = estimatedVisits > 0 ? ((lpOrders.length / estimatedVisits) * 100).toFixed(1) : "0.0";

      return {
        id: lp.id,
        title: lp.title,
        slug: lp.slug,
        status: lp.status,
        productTitle: lp.product?.title_ar || "منتج",
        ordersCount: lpOrders.length,
        revenue: lpRevenue,
        estimatedVisits,
        conversionRate: `${conversionRate}%`,
      };
    });

    // Top Governorates
    const govCounts: Record<string, number> = {};
    orders.forEach((o) => {
      govCounts[o.governorate] = (govCounts[o.governorate] || 0) + 1;
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
    };
  },

  async logAnalyticsEvent(event: AnalyticsEvent) {
    const admin = getSupabaseAdmin();
    if (admin) {
      await admin.from("analytics_events").insert({
        ...event,
        created_at: new Date().toISOString(),
      });
    }
    memoryAnalytics.push(event);
  },

  // SETTINGS
  async getSettings(): Promise<SystemSettings> {
    loadFromFile();
    return memorySettings;
  },

  async updateSettings(newSettings: Partial<SystemSettings>): Promise<SystemSettings> {
    memorySettings = { ...memorySettings, ...newSettings };
    saveToFile();
    return memorySettings;
  },
};
