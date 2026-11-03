# Deployment Guide: GitHub & Vercel
## Multi-Product Landing Page Platform

This guide outlines how to deploy this platform to **GitHub** and **Vercel** with full Supabase PostgreSQL and Safqa integration.

---

### 1. Initialize Git Repository

In the `d:\AI Project\platform` directory:
```bash
git init
git add .
git commit -m "feat: complete multi-product landing page platform with Safqa and Meta CAPI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

---

### 2. Database Setup (Supabase / PostgreSQL)

1. Create a project at [https://supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `src/lib/db/schema.sql` from this repository, copy the entire SQL script, paste it into the editor, and click **Run**.
4. Retrieve the following credentials from **Project Settings > API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Keep secret)

---

### 3. Deploy on Vercel

1. Log in to [https://vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository.
3. In the **Environment Variables** section, configure the following:

| Variable Name | Description | Example / Default |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public client anon key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key | `eyJhbGci...` |
| `SAFQA_API_BASE_URL` | Safqa API Endpoint | `https://api.safqapay.com/v1` |
| `SAFQA_MERCHANT_ID` | Safqa Merchant ID | Provided by Safqa |
| `SAFQA_API_SECRET_TOKEN` | Safqa Bearer Token | Provided by Safqa |
| `SAFQA_WEBHOOK_SECRET` | Secret to verify webhooks | Custom secret |
| `SAFQA_SANDBOX_MODE` | Sandbox mode switch | `true` (or `false` for live) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Global Meta Pixel ID | `123456789012345` |
| `META_CAPI_ACCESS_TOKEN` | Meta CAPI Access Token | `EAABw...` |
| `NEXT_PUBLIC_APP_URL` | Deployed production URL | `https://your-domain.vercel.app` |

4. Click **Deploy**. Vercel will build and deploy the Next.js application automatically.

---

### 4. Configure Safqa Webhook in Safqa Dashboard

1. Log in to your **Safqa Merchant Portal**.
2. Navigate to **Integration / Webhooks**.
3. Set the Webhook Notification URL to:
   `https://your-domain.vercel.app/api/safqa/webhook`
4. Enable events: `invoice.paid`, `invoice.failed`.

---

### 5. Domain Configuration for Landing Pages

- **Subpath routing (Default):** Every landing page is accessible at `https://your-domain.com/p/<slug>`.
- **Custom domains per landing page:** Vercel allows multiple custom domains connected to one project. Next.js middleware or Vercel rewrites can map `productA.com` to `/p/productA`.
