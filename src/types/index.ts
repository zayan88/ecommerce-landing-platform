export type ProductStatus = 'active' | 'draft' | 'archived';
export type LandingPageStatus = 'active' | 'paused' | 'draft';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'cod' | 'safqa' | 'card';
export type SafqaSyncStatus = 'not_synced' | 'pending' | 'paid' | 'failed' | 'refunded';

export interface ProductOffer {
  id: string;
  product_id: string;
  title_ar: string;
  quantity: number;
  price: number;
  original_price?: number;
  discount_label?: string;
  is_popular?: boolean;
  free_shipping?: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  title_ar: string;
  title_en?: string;
  slug: string;
  sku: string;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  images: string[];
  description_ar: string;
  stock_quantity: number;
  status: ProductStatus;
  safka_product_id?: string;
  safka_property_id?: string;
  safka_commission?: number;
  safka_raw?: any;
  offers?: ProductOffer[];
  created_at: string;
  updated_at: string;
}

export interface LandingPageSectionConfig {
  id: string; // 'hero' | 'comparison' | 'box_contents' | 'how_to_use' | 'reviews' | 'offers' | 'order_form' | 'guarantees'
  name_ar: string;
  enabled: boolean;
}

export const DEFAULT_LANDING_PAGE_SECTIONS: LandingPageSectionConfig[] = [
  { id: "hero", name_ar: "المعرض الرئيسي والسعر وباقات العروض والزر السريع", enabled: true },
  { id: "comparison", name_ar: "المشكلة والحل (القديم vs الجديد)", enabled: true },
  { id: "box_contents", name_ar: "المواصفات ومحتويات العلبة", enabled: true },
  { id: "reviews", name_ar: "آراء وتجارب العملاء الواقعية", enabled: true },
  { id: "order_form", name_ar: "فورم الطلب السريع وباقات العروض والدفع عند الاستلام", enabled: true },
  { id: "guarantees", name_ar: "الضمانات الثلاثة الذهبية", enabled: true },
  { id: "faq", name_ar: "الأسئلة الشائعة (كسر الاعتراضات)", enabled: true },
  { id: "final_cta", name_ar: "دعوة أخيرة للشراء (زر في آخر الصفحة)", enabled: true },
  { id: "how_to_use", name_ar: "طريقة الاستخدام السهلة (3 خطوات)", enabled: false },
  { id: "social_proof", name_ar: "شريط الثقة والتقييم وتغطية الشحن", enabled: false },
];

/** Earlier default order (FAQ before the order form). Pages still on it are moved to the current default: order form, then FAQ. */
const LEGACY_SECTION_ORDER = "hero,social_proof,comparison,box_contents,how_to_use,reviews,guarantees,faq,order_form";

/**
 * Pages saved in KV keep their own sections_config, so newly introduced default
 * sections would never appear. Keeps the saved order and enabled flags, and inserts
 * any default section that is missing at its default position.
 */
export function mergeSections(
  saved: LandingPageSectionConfig[] | undefined | null,
  defaults: LandingPageSectionConfig[] = DEFAULT_LANDING_PAGE_SECTIONS
): LandingPageSectionConfig[] {
  if (!Array.isArray(saved) || saved.length === 0) return defaults;
  // Drop invalid entries and duplicate ids (a duplicate would render a section twice)
  const result = saved.filter((s, i, arr) => s?.id && arr.findIndex((x) => x?.id === s.id) === i);
  // Untouched pages (still on the previous default order): the order form comes first, then the questions.
  if (defaults === DEFAULT_LANDING_PAGE_SECTIONS && result.map((s) => s.id).join(",") === LEGACY_SECTION_ORDER) {
    const o = result.findIndex((s) => s.id === "order_form");
    const f = result.findIndex((s) => s.id === "faq");
    [result[o], result[f]] = [result[f], result[o]];
  }
  defaults.forEach((def, index) => {
    if (result.some((s) => s.id === def.id)) return;
    // Insert right after the default section that precedes it, so it still lands sensibly
    // when the admin has reordered the saved sections.
    const prevId = index > 0 ? defaults[index - 1].id : null;
    const prevPos = prevId ? result.findIndex((s) => s.id === prevId) : -1;
    result.splice(prevPos >= 0 ? prevPos + 1 : Math.min(index, result.length), 0, def);
  });
  return result;
}

export interface LandingPageContentConfig {
  // 1. Hero & Header
  announcement_bar?: string;
  /** Optional page extras the merchant can switch off (shown by default so existing pages do not change). */
  hide_announcement?: boolean;
  hide_hero_trust?: boolean;
  hide_checkout_trust?: boolean;
  /** One flat price instead of the 1/2/3-piece offer tiers. */
  hide_offers?: boolean;
  final_cta_title?: string;
  final_cta_desc?: string;
  /** Mobile sticky buy bar off, and a custom text for the order button. */
  hide_sticky_bar?: boolean;
  cta_text?: string;
  hero_headline?: string;
  hero_subheadline?: string;
  hero_badge?: string;
  hero_image?: string;
  hero_bullets?: string[];

  // Per-page theme override (PaletteKey). Empty = use the store brand colors.
  theme_primary?: string;
  theme_accent?: string;

  // Trust strip (honest: real rating/count only — leave empty to hide the numbers)
  proof_rating?: number;
  proof_reviews_count?: number;
  proof_statements?: string[];
  proof_governorates?: string[];

  // Guarantees (always shown as 3 cards)
  guarantees_title?: string;
  guarantees?: { icon: "inspect" | "swap" | "shipping"; title: string; desc: string }[];

  // FAQ
  faq_title?: string;
  faq_items?: { q: string; a: string }[];

  // 2. Comparison Section
  comparison_badge?: string;
  comparison_title?: string;
  comparison_old_title?: string;
  comparison_old_points?: string[];
  comparison_new_title?: string;
  comparison_new_points?: string[];
  comparison_image?: string;
  comparison_image_badge?: string;

  // 3. Box Contents Section
  box_title?: string;
  box_items?: string[];
  box_image?: string;

  // 4. How to Use & Specs Section
  how_to_use_title?: string;
  how_to_use_steps?: { step_num: number; title: string; desc: string }[];
  how_to_use_image?: string;

  // 5. Customer Reviews
  reviews_title?: string;
  reviews?: { name: string; location: string; comment: string; rating: number }[];
}

export interface LandingPage {
  id: string;
  product_id: string;
  title: string;
  slug: string;
  component_key: string; // references landing page component in registry
  custom_domain?: string;
  status: LandingPageStatus;
  meta_pixel_id?: string;
  meta_capi_token?: string;
  head_scripts?: string;
  custom_css?: string;
  deployment_url?: string;
  deployment_status?: 'published' | 'building' | 'failed';
  last_published_at?: string;
  created_at: string;
  updated_at: string;
  product?: Product;
  sections_config?: LandingPageSectionConfig[];
  content_config?: LandingPageContentConfig;
}

export interface Order {
  id: string;
  order_number: string;
  landing_page_id?: string;
  landing_page_slug: string;
  product_id: string;
  offer_id?: string;
  
  // Customer info
  customer_name: string;
  customer_phone: string;
  customer_phone2?: string;
  governorate: string;
  city?: string;
  address: string;
  notes?: string;
  
  // Financials
  quantity: number;
  unit_price: number;
  total_amount: number;
  shipping_fee: number;
  discount_amount: number;
  final_amount: number;
  currency: string;
  
  // Statuses
  status: OrderStatus;
  payment_method: PaymentMethod;
  
  // Safqa details
  safqa_invoice_id?: string;
  safqa_invoice_url?: string;
  safqa_status: SafqaSyncStatus;
  safqa_response?: any;
  safqa_synced_at?: string;
  
  // Metadata & Timestamps
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: Product;
  landing_page?: LandingPage;
  tracking?: OrderTrackingMeta;
}

export interface OrderTrackingMeta {
  id?: string;
  order_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  ip_address?: string;
  user_agent?: string;
  fbp?: string;
  fbc?: string;
  event_id?: string;
  created_at?: string;
}

export interface AnalyticsEvent {
  id?: string;
  visitor_id?: string;
  session_id?: string;
  landing_page_id?: string;
  landing_page_slug?: string;
  product_id?: string;
  event_name: 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'Purchase' | 'AddToCart' | 'ScrollDepth' | 'ClickCTA' | 'SelectOffer' | 'FormInteraction' | string;
  event_id: string;
  page_url: string;
  page_title?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface SystemSettings {
  safqa_api_base_url: string;
  safqa_merchant_id: string;
  safqa_api_secret_token: string;
  safqa_webhook_secret: string;
  safqa_sandbox_mode: boolean;
  safqa_auto_forward: boolean;
  default_meta_pixel_id: string;
  default_meta_capi_token: string;
  meta_test_event_code?: string;
  // Other marketing tags (validated server-side; empty = off)
  tiktok_pixel_id?: string; // legacy single id
  meta_pixel_ids?: string[]; // up to 5 pixels per platform
  tiktok_pixel_ids?: string[];
  snap_pixel_ids?: string[];
  meta_capi_entries?: { pixel_id: string; token: string; test_code?: string }[]; // token is a secret (masked in the admin API)
  ga4_measurement_id?: string; // G-XXXXXXXXXX
  gtm_container_id?: string; // GTM-XXXXXXX
  store_name: string;
  support_phone: string;
  support_whatsapp: string;
  support_email?: string;
  // White-label brand (all optional: empty = neutral defaults, see lib/brand.ts)
  store_tagline?: string;
  logo_url?: string;
  favicon_url?: string;
  brand_primary?: string; // PaletteKey: trust color (emerald-*)
  brand_accent?: string; // PaletteKey: buy-button color (orange-*)
  site_domain?: string; // https://shop.example.com
  currency_symbol?: string;
  store_mode?: "landing" | "catalog"; // landing = one landing page per product; catalog = regular store home with all products
  onboarding_done?: boolean;
  // Catalog-mode home page content (all optional; defaults in lib/home-config.ts)
  home_config?: {
    announcements?: string[];
    hero_image?: string;
    hero_title?: string;
    hero_subtitle?: string;
    hero_cta?: string;
  };
  // Optional Safka (Egyptian dropshipping) module
  safka_enabled?: boolean;
  safka_page_id?: string;
  safka_page_name?: string;
  // Mobile / Telegram Sales Notifications
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_notifications_enabled?: boolean;
}

export interface GovernorateInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  deliveryFee: number;
  deliveryDays: string;
  region: 'greater_cairo' | 'alexandria' | 'delta' | 'canal' | 'upper_egypt' | 'frontier';
}
