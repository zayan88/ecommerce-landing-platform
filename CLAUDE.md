# CLAUDE.md — RexRack E-Commerce Landing Platform Directives

## 1. Project Mission & Prime Focus
- **Strict Project Focus:** You are dedicated 100% to this project (`D:\AI Project\platform`). Discard generic conversational fluff; focus purely on code quality, conversion rate optimization (CRO), UI craft, and edge-native performance.
- **Live URL:** `https://ecommerce-landing-platform.pages.dev`
- **Admin Panel:** `https://ecommerce-landing-platform.pages.dev/admin/landing-pages`
- **Target Audience:** Egyptian consumers purchasing via Cash on Delivery (الدفع عند الاستلام). 95% of traffic is mobile.
- **Reference Vault:** `D:\AI Project\Doc-LLM\LLM-Wiki\WIKI\work\rexrack\ecommerce-platform-architecture.md`

---

## 2. Technical Invariants (NEVER Violate)

1. **Cloudflare Edge Runtime Strictness:**
   - Every route and API runs on Edge (`export const runtime = "edge";`).
   - **Absolute Ban:** NEVER import Node.js `fs`, `path`, or native `crypto`.
   - Use `src/lib/crypto/sha256.ts` for SHA-256 and HMAC operations.

2. **Unified Single-Card Checkout Form:**
   - The tiered offer selector (`HeroOfferSelector`) MUST stay integrated directly inside `EgyptianCheckoutForm`.
   - **Absolute Ban:** NEVER split the offers and checkout inputs into separate floating cards.

3. **Zero-Collapse Image Containers:**
   - **Absolute Ban:** NEVER use Tailwind `aspect-4/3` alone (causes Next.js `<Image fill />` to collapse to 0px height).
   - Always use explicit responsive height containers: `w-full h-64 sm:h-80 relative` with proper `sizes` and `object-cover` or `object-contain`.

4. **Dynamic Content Engine (`LandingPageContentConfig`):**
   - Content customization must flow strictly through `landingPage.content_config`.
   - Always provide a solid fallback: `c?.field || default_fallback`.
   - The HTML structure, CSS classes, and grid columns must remain invariant to prevent merchant broken layouts.

5. **Windows PowerShell Rules:**
   - Always quote paths: `"D:\AI Project\platform"`.
   - Always use `npm.cmd` instead of `npm`.

---

## 3. UI Design & Craft Standards (The Impeccable Standard)

You act as an elite Product Designer and Frontend Craftsman. Every UI component must meet these standards:

1. **Mobile-First Visual Hierarchy:**
   - Primary focal point per viewport: The product visual and the action CTA must lead.
   - Cards: Clean white backgrounds (`bg-white rounded-3xl border border-slate-200/90 shadow-xs sm:shadow-md`).
   - Touch Targets: Buttons and clickable offer cards must be at least 48px high with generous padding (`p-3 sm:p-4`).

2. **Arabic Typography & Readability (Cairo Font):**
   - Text direction: Always explicit `dir="rtl"` with `font-sans` or `font-heading`.
   - Line height: `leading-relaxed` for Arabic paragraphs; never clamp text so tightly that diacritics or Arabic descenders clip.
   - Headings: `font-black text-slate-900` or `text-slate-950`.

3. **Psychological Color Palette for E-Commerce:**
   - **Trust & Free Shipping:** Emerald (`bg-emerald-50 text-emerald-800 border-emerald-200`, `text-emerald-600`).
   - **Primary Action (Buy):** High-contrast vibrant Orange/Cyan CTA with subtle glow or shadow (`bg-orange-600 hover:bg-orange-700 text-white`).
   - **Urgency & Savings:** Amber (`bg-amber-100 text-amber-900`).
   - **Pain Points / Old Flaws:** Rose (`bg-rose-50 border-rose-200 text-rose-900`).
   - **Subtle Badges:** Pill badges (`px-3 py-1 rounded-full text-xs font-bold`).

4. **Micro-Interactions & Polish:**
   - Smooth active state rings when selecting offers: `ring-2 ring-orange-500/30 border-orange-500`.
   - Instant visual feedback on clicks.
   - Sticky Buy Bar on mobile when scrolling past the Hero (`StickyBuyBar.tsx`).

---

## 4. Conversion & Direct-Response Research Skills

When writing copy, analyzing products, or designing sections, apply these research frameworks:

1. **The 4 Core Egyptian Consumer Objections to Crush:**
   - *Objection 1: "هل المنتج أصلي ولا هيجيلي حاجة تانية؟"* -> **Counter:** "حق فتح الشحنة والفحص والتجربة أمام المندوب قبل دفع مليم واحد".
   - *Objection 2: "مصاريف الشحن كام وهتدبس فيها؟"* -> **Counter:** "شحن مجاني 100% لجميع محافظات مصر حتى باب بيتك".
   - *Objection 3: "لو طلع فيه عيب صناعة هعمل إيه؟"* -> **Counter:** "ضمان ذهبي 14 يوماً مع استبدال فوري مجاني حتى باب منزلك".
   - *Objection 4: "صوت الجهاز عالي أو استخدامه معقد؟"* -> **Counter:** سكشن مقارنة صريح (عيوب القديم vs مميزات جهازنا) + شرح الاستخدام بـ 3 خطوات.

2. **Copywriting Tone:**
   - Egyptian dialect: Friendly, respectable, confident, and punchy.
   - Avoid generic corporate speak; speak to daily Egyptian family pains (بهدلة المستشفيات الفجر، الزحمة، تشنج الرقبة، راحة الأطفال).

3. **Offer Architecture (AOV Maximizer):**
   - **Tier 1 (1 piece):** Single piece test order (Base price, e.g. 599 ج.م).
   - **Tier 2 (2 pieces):** "الأكثر طلباً ⭐" (Discounts + e.g. "جهاز للبيت وجهاز للعربية").
   - **Tier 3 (3 pieces):** "أعلى توفير 🔥" (Family bundle, maximum savings).

---

## 5. Build, Test, and Deploy Commands

- **Build Check:** `npm.cmd run build`
- **Lint Check:** `npm.cmd run lint`
- **Deploy to Cloudflare:**
  ```bash
  git add -A
  git commit -m "feat: description"
  git push origin main
  ```

---

## 6. Key Files Map

| Path | Purpose |
|---|---|
| `src/landing-pages/mesh-nebulizer/page.tsx` | Flagship Mesh Nebulizer Landing Page |
| `src/landing-pages/starter-template/page.tsx` | Universal Dynamic 7-stage Landing Page |
| `src/components/shared/EgyptianCheckoutForm.tsx` | Unified Single-Card COD Checkout Form |
| `src/components/shared/HeroOfferSelector.tsx` | 3-tier Quantity & Pricing Selector |
| `src/app/(admin)/admin/landing-pages/page.tsx` | Admin: Sections, Content & Media Editor, AI Creator |
| `src/lib/db/store.ts` | Central DB Interface (Cloudflare KV + Memory) |
| `src/lib/db/kv.ts` | Cloudflare KV REST API & Native Binding Client |
| `src/lib/notifications/telegram.ts` | Telegram Bot Real-time Order Dispatcher |
