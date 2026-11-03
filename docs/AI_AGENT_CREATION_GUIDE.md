# AI Agent Creation Guide
## How to Build a Brand New Product Landing Page with an AI Agent

This document defines the exact workflow and conventions an AI Coding Agent must follow to create a new product landing page inside this platform.

---

### Step 1: Create the Product Asset Directory
Create a folder inside `public/landing-pages/<slug>/images/` and place product images there.

---

### Step 2: Create the Dedicated Landing Page Folder
Create `src/landing-pages/<slug>/` with two files:

#### 1. `config.ts`
Contains marketing copy, tiered offers, specifications, pain points, and FAQs:
```typescript
export const myProductConfig = {
  slug: "my-product",
  productTitle: "اسم المنتج بالعربية",
  subtitle: "الوصف التسويقي الجذاب",
  basePrice: 349,
  comparePrice: 550,
  // images, painPoints, features, specs, reviews, faqs...
};
```

#### 2. `page.tsx`
Contains the React UI tree. It **must** import and render the shared COD checkout form:
```tsx
"use client";

import React, { useState } from "react";
import { Product, LandingPage, ProductOffer } from "@/types";
import { EgyptianCheckoutForm } from "@/components/shared/EgyptianCheckoutForm";
import { StickyBuyBar } from "@/components/shared/StickyBuyBar";

export default function MyProductPage({ product, landingPage }: { product: Product; landingPage: LandingPage }) {
  const [selectedOffer, setSelectedOffer] = useState<ProductOffer>(
    product.offers?.[0] || ({} as ProductOffer)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900" dir="rtl">
      {/* 1. Custom Hero Section */}
      {/* 2. Custom Problem / Solution Breakdown */}
      {/* 3. Custom Feature Showcase */}
      {/* 4. Customer Reviews */}
      
      {/* 5. Shared Egyptian COD Form */}
      <section className="py-12 bg-slate-100 px-4">
        <div className="max-w-4xl mx-auto">
          <EgyptianCheckoutForm
            product={product}
            landingPageSlug={landingPage.slug}
            selectedOffer={selectedOffer}
            onOfferSelect={(offer) => setSelectedOffer(offer)}
          />
        </div>
      </section>

      {/* 6. Mobile Sticky CTA */}
      <StickyBuyBar
        productTitle={product.title_ar}
        price={selectedOffer.price || product.base_price}
        compareAtPrice={selectedOffer.original_price || product.compare_at_price}
      />
    </div>
  );
}
```

---

### Step 3: Register in `src/landing-pages/registry.ts`
Import the new page component and add it to `landingPageRegistry`:
```typescript
import MyProductPage from "./my-product/page";

export const landingPageRegistry: Record<string, React.ComponentType<LandingPageComponentProps>> = {
  "portable-urinal": PortableUrinalPage,
  "my-product": MyProductPage, // <-- Added here
};
```

---

### Step 4: Register in the Admin Dashboard
Open the Admin Dashboard at `/admin/landing-pages` and click **"تسجيل صفحة هبوط جديدة"**. Enter:
- Title
- Slug (`my-product`)
- Component Key (`my-product`)
- Select the associated product

The page is immediately live at `/p/my-product`!

---

### Invariant Rules for AI Agents
1. **Zero Impact on Existing Pages:** Never modify another landing page component file unless explicitly instructed.
2. **Never Duplicate the Backend:** All orders, validation, Safqa forwarders, Meta CAPI calls, and Egyptian governorate fees are handled automatically by the central backend.
3. **Always Include Egyptian Phone & Address Validation:** The shared form guarantees valid Egyptian numbers (`010`, `011`, `012`, `015`).
