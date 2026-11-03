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
  offers?: ProductOffer[];
  created_at: string;
  updated_at: string;
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
  landing_page_id?: string;
  product_id?: string;
  event_name: 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'Purchase' | 'AddToCart';
  event_id: string;
  page_url: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
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
  store_name: string;
  support_phone: string;
  support_whatsapp: string;
}

export interface GovernorateInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  deliveryFee: number;
  deliveryDays: string;
  region: 'greater_cairo' | 'alexandria' | 'delta' | 'canal' | 'upper_egypt' | 'frontier';
}
