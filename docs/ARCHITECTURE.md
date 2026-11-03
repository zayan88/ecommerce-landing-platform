# Multi-Product Landing Page Platform - Technical Architecture
**Markets:** Egypt & Arab World E-Commerce (Cash On Delivery, Safqa Gateway, Meta Pixel & Conversions API)

---

## 1. Executive Summary

This platform is engineered as an **agent-scalable, decoupled e-commerce architecture** where independent product landing pages coexist without shared frontend state or layout constraints, but leverage a single, centralized backend, database, payment bridge (Safqa), and marketing attribution engine (Meta CAPI).

### Key Architectural Pillars

1. **Complete Presentation Isolation:**
   - Every product landing page is a standalone React component tree inside `src/landing-pages/<slug>/`.
   - Distinct layouts, color palettes, marketing angles, testimonials, and DOM trees.
   - Creating a new landing page never touches or risks regressions in existing pages.

2. **Unified Core Backend:**
   - Single source of truth for orders, products, offers, inventory, and tracking.
   - Strict server-side price validation using Zod prevents client-side price tampering.
   - Centralized Egyptian governorate directory with automated delivery fee rules.

3. **Safqa API Integration Layer:**
   - Order-first persistence: Orders are written to PostgreSQL / local store immediately.
   - Background invoice generation via Safqa API (`/invoice/create`).
   - Sandbox resilience: Offline/sandbox fallback prevents customer checkout blockage during network outages.

4. **Meta Pixel + Server CAPI with Deduplication:**
   - Client and server share a unique cryptographic `event_id`.
   - Browser Pixel fires `Purchase` with `{ eventID: event_id }`.
   - Server CAPI dispatches `Purchase` with the matching `event_id` and SHA-256 hashed customer phone/name.
   - Meta deduplicates the events within 48 hours for 100% attribution accuracy.

---

## 2. Directory Layout & Routing Topology

```
platform/
├── docs/                               # Engineering documentation
│   ├── ARCHITECTURE.md
│   ├── AI_AGENT_CREATION_GUIDE.md
│   └── DEPLOYMENT.md
├── public/                             # Public static assets
│   └── landing-pages/                  # Product-specific static assets
│       └── portable-urinal/images/
├── src/
│   ├── app/
│   │   ├── (admin)/admin/              # Central Admin Dashboard (Arabic RTL)
│   │   │   ├── layout.tsx              # Admin shell with RTL sidebar & status bar
│   │   │   ├── page.tsx                # Overview KPI dashboard & LP performance
│   │   │   ├── orders/                 # Order management, Safqa retry, WhatsApp
│   │   │   ├── landing-pages/          # Landing pages directory & status toggles
│   │   │   ├── products/               # Products catalog & quantity offers
│   │   │   ├── safqa/                  # Safqa API credentials & sandbox switch
│   │   │   ├── tracking/               # Meta Pixel & CAPI access tokens
│   │   │   └── ai-guide/               # AI Agent creation protocol & prompt templates
│   │   ├── (landing)/p/[slug]/         # Dynamic Landing Page Resolver
│   │   │   ├── page.tsx                # Loads dedicated LP from registry
│   │   │   └── thank-you/              # Conversion page with confetti & WhatsApp
│   │   ├── api/                        # Central REST API Endpoints
│   │   │   ├── orders/                 # Order placement & validation
│   │   │   ├── orders/[id]/            # Status update & Safqa retry
│   │   │   ├── products/               # Products & offers CRUD
│   │   │   ├── landing-pages/          # Landing pages CRUD & status switch
│   │   │   ├── analytics/              # Aggregated dashboard metrics
│   │   │   ├── settings/               # System configuration & secrets
│   │   │   └── safqa/webhook/          # Safqa IPN payment callback
│   │   ├── globals.css                 # Cairo/Tajawal fonts & utilities
│   │   ├── layout.tsx                  # Root HTML wrapper (lang="ar" dir="rtl")
│   │   └── page.tsx                    # Platform portal & live links
│   ├── components/
│   │   └── shared/                     # Reusable Egyptian checkout components
│   │       ├── EgyptianCheckoutForm.tsx # COD Form with Egyptian governorates
│   │       └── StickyBuyBar.tsx        # Mobile floating sticky CTA
│   ├── landing-pages/                  # Independent Landing Page Units
│   │   ├── registry.ts                 # Central dynamic component registry
│   │   └── portable-urinal/            # Reference landing page implementation
│   │       ├── config.ts               # Product copy, benefits, FAQs, reviews
│   │       └── page.tsx                # Dedicated UI presentation
│   ├── lib/
│   │   ├── constants/governorates.ts   # 27 Egyptian governorates & fees
│   │   ├── db/                         # Supabase client & resilient storage adapter
│   │   ├── safqa/safqa-client.ts       # Safqa API invoice generator
│   │   ├── tracking/                   # Meta Pixel & Server CAPI deduplication
│   │   └── validation/order.ts         # Zod schemas (Egyptian phone validation)
│   └── types/                          # TypeScript interfaces
```

---

## 3. Database Schema Diagram

```
+--------------------+        +---------------------+
|      products      |<-------|   product_offers    |
+--------------------+        +---------------------+
| id (PK)            |        | id (PK)             |
| title_ar           |        | product_id (FK)     |
| slug (Unique)      |        | title_ar            |
| sku (Unique)       |        | quantity            |
| base_price         |        | price               |
| images (JSONB)     |        | is_popular          |
| stock_quantity     |        | free_shipping       |
+--------------------+        +---------------------+
          ^
          |
+--------------------+        +---------------------+
|   landing_pages    |        | system_settings     |
+--------------------+        +---------------------+
| id (PK)            |        | key (PK)            |
| product_id (FK)    |        | value               |
| slug (Unique)      |        | is_secret           |
| component_key      |        +---------------------+
| status (active/...) |
| meta_pixel_id      |
| deployment_url     |
+--------------------+
          ^
          |
+--------------------+        +---------------------+
|       orders       |------->| order_tracking_meta |
+--------------------+        +---------------------+
| id (PK)            |        | id (PK)             |
| order_number (UQ)  |        | order_id (FK)       |
| landing_page_slug  |        | utm_source          |
| product_id (FK)    |        | utm_medium          |
| customer_name      |        | utm_campaign        |
| customer_phone     |        | ip_address          |
| governorate        |        | fbp, fbc, event_id  |
| final_amount       |        +---------------------+
| safqa_invoice_id   |
| safqa_status       |
+--------------------+
```
