-- ==============================================================================
-- DATABASE SCHEMA: MULTI-PRODUCT E-COMMERCE LANDING PLATFORM (EG)
-- PostgreSQL / Supabase Compatible
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    slug VARCHAR(120) UNIQUE NOT NULL,
    sku VARCHAR(64) UNIQUE NOT NULL,
    base_price NUMERIC(10, 2) NOT NULL,
    compare_at_price NUMERIC(10, 2),
    cost_price NUMERIC(10, 2),
    images JSONB DEFAULT '[]'::jsonb,
    description_ar TEXT,
    stock_quantity INTEGER DEFAULT 100,
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT OFFERS & QUANTITY TIERS
CREATE TABLE IF NOT EXISTS product_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title_ar VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL,
    original_price NUMERIC(10, 2),
    discount_label VARCHAR(64),
    is_popular BOOLEAN DEFAULT false,
    free_shipping BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LANDING PAGES REGISTRY
CREATE TABLE IF NOT EXISTS landing_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    component_key VARCHAR(120) NOT NULL,
    custom_domain VARCHAR(255),
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft')),
    meta_pixel_id VARCHAR(64),
    meta_capi_token TEXT,
    head_scripts TEXT,
    custom_css TEXT,
    deployment_url VARCHAR(255),
    deployment_status VARCHAR(32) DEFAULT 'published',
    last_published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(64) UNIQUE NOT NULL,
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE SET NULL,
    landing_page_slug VARCHAR(120) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    offer_id UUID REFERENCES product_offers(id) ON DELETE SET NULL,
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    customer_phone2 VARCHAR(32),
    governorate VARCHAR(64) NOT NULL,
    city VARCHAR(120),
    address TEXT NOT NULL,
    notes TEXT,
    
    -- Financials & Pricing
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_amount NUMERIC(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EGP',
    
    -- Status
    status VARCHAR(32) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
    payment_method VARCHAR(32) DEFAULT 'cod' CHECK (payment_method IN ('cod', 'safqa', 'card')),
    
    -- Safqa Integration Tracking
    safqa_invoice_id VARCHAR(120),
    safqa_invoice_url TEXT,
    safqa_status VARCHAR(64) DEFAULT 'not_synced' CHECK (safqa_status IN ('not_synced', 'pending', 'paid', 'failed', 'refunded')),
    safqa_response JSONB,
    safqa_synced_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER TRACKING & UTM ATTRIBUTION
CREATE TABLE IF NOT EXISTS order_tracking_meta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    utm_source VARCHAR(120),
    utm_medium VARCHAR(120),
    utm_campaign VARCHAR(255),
    utm_content VARCHAR(255),
    utm_term VARCHAR(255),
    referrer TEXT,
    ip_address VARCHAR(64),
    user_agent TEXT,
    fbp VARCHAR(120),
    fbc VARCHAR(120),
    event_id VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ANALYTICS & PIXEL EVENTS LOG
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    landing_page_id UUID REFERENCES landing_pages(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    event_name VARCHAR(64) NOT NULL,
    event_id VARCHAR(120),
    page_url TEXT,
    utm_source VARCHAR(120),
    utm_medium VARCHAR(120),
    utm_campaign VARCHAR(255),
    ip_address VARCHAR(64),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR SCALE & SPEED
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_landing_page_slug ON orders(landing_page_slug);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);

-- ==============================================================================
-- SEED DATA: FIRST PRODUCT & OFFERS & LANDING PAGE
-- ==============================================================================
INSERT INTO products (id, title_ar, title_en, slug, sku, base_price, compare_at_price, cost_price, images, description_ar, stock_quantity, status)
VALUES (
    'a1000000-0000-0000-0000-000000000001',
    'وعاء التبول المحمول المطور لكبار السن والسفر',
    'Portable Urinal Device with Extension Tube',
    'portable-urinal',
    'URINAL-PRO-01',
    299.00,
    450.00,
    110.00,
    '["/landing-pages/portable-urinal/images/hero_product.jpg", "/landing-pages/portable-urinal/images/product_cutout.png", "/landing-pages/portable-urinal/images/product_bedside_elderly.jpg", "/landing-pages/portable-urinal/images/travel_scenario.jpg"]'::jsonb,
    'وسيلة مساعدة مريحة وعملية لجمع البول بسعة 2000 مل مع خرطوم مرن مضاد للتسريب وغطاء محكم الرائحة، مثالية لكبار السن، مرضى الفراش، والسفر لمسافات طويلة في السيارة.',
    150,
    'active'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_offers (id, product_id, title_ar, quantity, price, original_price, discount_label, is_popular, free_shipping, sort_order)
VALUES 
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'قطعة واحدة', 1, 299.00, 450.00, 'خصم 33%', false, false, 1),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'قطعتان (الأكثر طلباً)', 2, 499.00, 900.00, 'خصم 45% + شحن مجاني', true, true, 2),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', '3 قطع (عرض العائلة)', 3, 649.00, 1350.00, 'خصم 52% + شحن مجاني', false, true, 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO landing_pages (id, product_id, title, slug, component_key, status, meta_pixel_id, deployment_status)
VALUES (
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'صفحة وعاء التبول المحمول - حملة الرعاية والسفر',
    'portable-urinal',
    'portable-urinal',
    'active',
    'PIXEL_URINAL_01',
    'published'
) ON CONFLICT (slug) DO NOTHING;
