# Storage architecture: KV for presentation, D1 for transactional data

Decision (owner, 2026-11-15). Goal: scale from day one on the free Cloudflare plan, no paid plan or USD card needed
for a ~250 orders/day merchant, and no per-order KV write budget.

## Split

| Store | Holds | Why |
|---|---|---|
| **KV** | Brand/settings (name, colors, logo), landing page content + sections, products and offers (storefront reads), uploaded images, login rate-limit, any cached read | Read-heavy, rarely written, must be fast on every page view |
| **D1 (SQL)** | Orders and their status history, stock (computed with SUM, tracked per product), visit/checkout stats, customers/blacklist, discount codes, shipping rules, courier shipments | Written and queried constantly; needs search, totals, uniqueness |
| **Env vars (secrets)** | ADMIN_PIN, AUTH_SECRET, courier/Telegram/Meta/Safka keys | Never stored in KV or D1 |

Admin sessions are signed stateless tokens: nothing to store.

## Rules
- Every D1 query is a prepared statement with bound parameters. No string concatenation with user input.
- Duplicate-order guard = unique constraint (phone + product + 15-minute bucket), not extra KV keys.
- Order number uniqueness = unique index (no listing needed).
- Stock = `stock_set` baseline minus SUM(quantity) of non-cancelled/returned orders since the baseline. No counter writes.
- Status changes are UPDATEs of one row plus one history row.
- Budget check: D1 free ≈ 100k rows written/day, 5M rows read/day; Workers requests 100k/day is the next ceiling.

## Rollout (separate branch, live store untouched until verified)
1. D1 binding + schema + migration runner; local dev path for D1.
2. Storage adapter for orders (create, list/search/filter, update status, delete/tombstone, export) behind a flag.
3. Dual-write period (D1 + KV) with comparison; one-setting rollback to KV.
4. One-time import of existing KV orders; compare totals/stats.
5. Move stats and stock to D1; tests: normal order, double click, parallel orders, cancel, export, real-Cloudflare run.
6. Then build on D1 from the start: discount codes, shipping by governorate, courier adapters (Bosta first), stock alerts.
7. Per-client setup script creates the D1 database and applies the schema.

## Risks to verify
D1 write latency from Egypt (single primary region), cold-start first request, migration correctness (order numbers, tombstones), SQL injection review of every query.
