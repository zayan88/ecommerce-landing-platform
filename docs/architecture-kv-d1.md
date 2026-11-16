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

---

# Implementation status: orders on D1 (branch `feature/d1-orders`, 2026-11-16)

Covers rollout steps 1, 2, 4 and the stats half of 5. Not done here: stock on D1, the real-Cloudflare run,
the per-client setup script. **Default behaviour is unchanged: `ORDERS_BACKEND` defaults to `kv`.**

## What was built

| Piece | File |
|---|---|
| Schema (6 tables, `store_id` on every one) | `migrations/0001_orders.sql`, `migrations/README.md` |
| D1 client: native binding `DB` or the local emulator | `src/lib/db/d1.ts` |
| Orders repository (interface + D1 implementation), backend switch | `src/lib/db/orders-repo.ts` |
| dbStore order functions, guards, stats routed by backend | `src/lib/db/store.ts`, `src/lib/orders/guard.ts`, `src/lib/stats.ts` |
| KV to D1 import (library + admin endpoint) | `src/lib/db/orders-import.ts`, `src/app/api/admin/orders-import/route.ts` |
| Local D1 emulator (node:sqlite) | `scripts/dev-d1-server.mjs` |
| Tests (20) | `scripts/test-orders-repo.mjs` |

Tables: `orders` (every `Order` field; `tracking` and `safqa_response` as JSON; `extra` JSON keeps unknown
fields of imported legacy orders; `created_ms` for sorting and date filters), `order_status_history`,
`deleted_orders` (one row per identifier of a deleted order: id, order number, Safka serial),
`stats_daily` (Cairo day), `order_dedupe`, `rate_limits`.

API behaviour and response shapes are the same on both backends. Additions (optional, both backends):
`GET /api/orders` accepts `gov`, `from`, `to` (YYYY-MM-DD, Egypt time), `limit`, `offset`;
`/api/admin/stats` now loads only the orders of the requested range.

## What one order costs

| | KV backend | D1 backend |
|---|---|---|
| KV writes | 3 (rate-limit key, order record, dedupe entry) | **0** |
| KV list operations | 1 to 2 (order-number collision check) | **0** |
| D1 queries | 0 | 4 (dedupe claim, rate limit, insert batch, dedupe settle) |
| D1 rows written (indexes count) | 0 | about 14 |
| Status change | 1 KV write (+1 read) | 1 D1 batch, about 5 rows written |

The zero-KV-write claim is asserted by the test suite with a KV emulator that counts every operation.
KV is still *read* during an order (product lookup, settings); reads are not the scarce budget.

## How each rule is enforced on D1

- **Order number uniqueness**: `UNIQUE (store_id, order_number)`. The insert is
  `INSERT ... ON CONFLICT DO NOTHING RETURNING id`; no row back means a collision, and the app retries
  with a new number (up to 6 attempts). No listing.
- **Duplicate guard** (same phone + product within 15 minutes returns the existing order):
  `order_dedupe` has primary key `(store_id, dedupe_key)`, `dedupe_key = sha256(phone|product)`.
  A request first claims the key with one atomic upsert; of N concurrent identical requests in any
  isolates exactly one gets the claim, the others wait (up to about 4 s) for the winner's order and
  return it. **Deviation from the plan above, on purpose:** the key has no 15-minute bucket column. A
  fixed bucket would let two orders one minute apart both pass when they straddle a bucket boundary;
  instead the upsert only takes over a row older than 15 minutes, which is the same sliding window the
  KV guard had. A claim whose owner died is released after 20 s. The row stores the order id only;
  the customer snapshot is read from `orders`, so no PII is duplicated.
- **Rate limit** (5 orders / 10 min / IP): one atomic upsert on `rate_limits` returning the count.
  The key is `order_rl:sha256(ip)`. Counted across isolates (the KV version was per isolate and eventually
  consistent). If D1 fails the limiter falls back to the in-memory counter, never to KV.
- **Status changes**: one batch = history row (only if the status really changed) + `UPDATE ... RETURNING *`.
- **Deletes**: one batch per request = tombstone rows + history delete + order delete. A bulk delete of
  any size is one D1 query.
- **Stats**: buffered per isolate as before, flushed every 5 minutes with `visits = visits + ?`
  (atomic; the KV version was read-merge-write once an hour).
- **SQL safety**: every statement is prepared with bound parameters. The only dynamic SQL text is
  column names and sort directions from constant whitelists in `orders-repo.ts`, and generated `?` lists.
  Search uses `instr()` rather than `LIKE`, so `%` and `_` are literal and D1's 50-byte LIKE pattern
  limit does not apply. No SQL parameters are logged.

## Environment variables

| Variable | Values | Meaning |
|---|---|---|
| `ORDERS_BACKEND` | `kv` (default) / `d1` | Where orders, guards and visit counters live. Anything but `d1` means KV. |
| `ORDERS_KV_MIRROR` | empty / `1` | With `d1`: also copy every order write to its KV key (1 KV write each). Verification period only. |
| `D1_REST_BASE_URL` | e.g. `http://127.0.0.1:3198` | Local dev only: the emulator. Never set in production. |
| `STORE_ID` | default `default` | Value of `store_id` for this deployment. |

Production D1 access is the native binding `DB` only (there is no Cloudflare REST fallback for D1).

## Run it locally

1. `node scripts/dev-kv-server.mjs 3199` and `node scripts/dev-d1-server.mjs 3198`
   (launch configs `dev-kv`, `dev-d1`). The D1 emulator applies `migrations/*.sql` on start.
2. Start Next with `KV_REST_BASE_URL=http://127.0.0.1:3199`, `D1_REST_BASE_URL=http://127.0.0.1:3198`,
   `ORDERS_BACKEND=d1`: launch config `store-local-d1` (same port as `store-local`; run only one of
   them, two `next dev` in one checkout share `.next`).
3. Tests: `node scripts/test-orders-repo.mjs` (Node >= 22.15; in-memory databases, no network).

## Enable it on Cloudflare (nothing below has been run yet)

1. `npx.cmd wrangler d1 create growix-orders`, then put the printed id in `wrangler.toml`
   (`database_id`, currently the placeholder `REPLACE_WITH_REAL_D1_DATABASE_ID`).
   **Do not deploy a branch that still has the placeholder.**
2. `npx.cmd wrangler d1 migrations apply DB --remote`.
3. Deploy with `ORDERS_BACKEND` still unset (KV). Logged in as admin, check
   `GET /api/admin/orders-import`: it must show `d1.available: true`.
4. Import, from the browser console of the admin panel:
   ```js
   let offset = 0, r;
   do {
     r = (await (await fetch("/api/admin/orders-import", { method: "POST", body: JSON.stringify({ offset, limit: 100 }) })).json()).report;
     console.log(r); offset = r.next_offset;
   } while (!r.done);
   ```
   `{ dry_run: true }` reports the source counts without writing. Compare `source.total` with
   `d1_orders_total + skipped_deleted + conflicts.length`; investigate any `conflicts` or `failed_reads`.
   The import only reads KV. It can be repeated at any time (unchanged orders are skipped, a newer KV
   copy updates the D1 row, deleted orders never come back).
5. Set `ORDERS_BACKEND=d1` and `ORDERS_KV_MIRROR=1` in the Pages project variables, redeploy, run the
   import once more (orders placed between step 4 and the switch), then verify: place an order, double
   click, change status, delete, export, stats page.
6. When satisfied, remove `ORDERS_KV_MIRROR`.

**Rollback**: set `ORDERS_BACKEND=kv` (or remove it) and redeploy. With the mirror on, KV has every
order. Without the mirror, orders created while on D1 exist only in D1; there is no D1 to KV export yet.

## Free-plan numbers (checked against the Cloudflare docs on 2026-11-16)

| Limit (Workers Free) | Value |
|---|---|
| D1 rows written | 100,000 / day (each index on the table adds one row written) |
| D1 rows read | 5,000,000 / day |
| D1 storage | 500 MB per database, 5 GB per account, 10 databases |
| D1 queries per Worker invocation | 50 (a `batch()` counts as one) |
| D1 bound parameters per query | 100 |
| D1 statement length / row size / query time | 100 KB / 2 MB / 30 s |
| D1 LIKE pattern | 50 bytes |
| KV writes | 1,000 / day (1 / second to the same key) |
| KV reads | 100,000 / day |
| KV operations per Worker invocation | 1,000 |

Daily limits reset at 00:00 UTC; past the D1 limit, queries fail until the reset.
Sources: developers.cloudflare.com/d1/platform/pricing, /d1/platform/limits, /kv/platform/limits.

Budget for 250 orders/day with 3 status changes each: 250 x 14 + 750 x 5 = about 7,300 rows written
(7% of the free allowance), zero KV writes.

**The reads budget is the one to watch.** On D1 every row returned or scanned is a row read. With
20,000 stored orders a single full listing is 20,000 rows read, so about 250 full listings a day would
reach 5M. The admin UI no longer loads full lists: see "Admin orders UI: pulse and pagination" below.

## Admin orders UI: pulse and pagination

Before: the orders page re-downloaded the FULL order list every 15 s while the tab was open. On KV that
is one list operation per poll (1,000/day allowed: an open tab used the day's allowance in about 4 hours);
on D1 it read every order row on every poll.

Now:

| Piece | What it does | Cost |
|---|---|---|
| `GET /api/admin/orders-pulse[?since=<ms>]` (admin-only) | `{ latest_created_at, latest_created_ms, new_count, pending_count, pending_capped, count, count_capped, poll_interval_sec }` | D1: ONE batch of 3 index-only statements. Rows read per poll: 1 (latest) + pending rows (at most 201) + orders created after `since` (at most 500). Only the first call (no `since`) counts the total, capped at 10,001 index rows. KV: `supported: false`, nothing is read |
| Orders page polling | Calls the pulse every 60 s (the server names the interval), only while `document.visibilityState === "visible"`; a hidden tab makes no requests; errors double the delay up to 15 min. New orders: cha-ching + refresh of the first page only (if the user is on it) | 1 request / minute / visible tab |
| KV backend | No pulse. The first page is refreshed every 5 minutes while visible (new orders are detected by the total) | at most 12 list ops / hour / visible tab, was 240 |
| `GET /api/orders?limit=&offset=` | One page (25 or 50 in the UI; server clamps to 100). Response adds `total`, `total_capped`, `has_more`, `limit`, `offset`. Filters: `status`, `q`, `gov`, `from`, `to`, `lp` | D1: `limit + 1` rows, plus a COUNT capped at 5,000 rows only when the filter changes (`total=0` skips it; page flips, background refreshes and text searches never count; the last page knows the total for free) |
| CSV export | Selected rows, or every order of the current filter: pages of 500 with `export=1` (no product relation in the payload, server clamps to 1,000), fetched sequentially, at most 5,000 rows, with a message when capped | D1: the exported rows. KV: one list op per 500 rows |
| `GET /api/orders` without `limit` | Unchanged full list (compatibility); the admin UI does not use it any more | full scan |

Other full-list loads removed on the D1 backend (KV behaviour unchanged):

- `POST /api/support/chat` (PUBLIC) loaded every order on every chat message. It now looks up only the phone /
  order number found in the message (`dbStore.findOrdersForLookup`, indexed), and only for tracking questions.
- Safka status webhook (`/api/safqa/orders`) loaded every order per call; now the same targeted lookup.
- "Sync with Safka" de-duplicates through `dbStore.findKnownOrderTokens` (indexed) instead of the listed orders.
- Migration `0003_orders_safqa_idx.sql`: partial index on `(store_id, safqa_invoice_id)` for those lookups
  (only orders that have a Safka serial pay the extra index row).
- Dashboard (`/admin`) only calls `/api/admin/stats`, which already loads just its date range.

Still a full scan (on demand, not polled): `GET /api/analytics` (tracking page summary, all-time totals),
a text search (`q`: `instr()` cannot use an index), `GET /api/orders` without `limit`.

Worst case for one visible admin tab for 24 h on D1 with a 200+ pending backlog: 1,440 polls x about 205 rows
= about 295,000 rows read (6% of the free allowance); typical (20 pending) is about 30,000.

Tests: `node scripts/test-orders-admin.mjs` (16 tests; shared harness in `scripts/lib/test-kit.mjs`).

## Not verified (needs the real Cloudflare run)

- The native binding path (`db.prepare().bind().all()`, `db.batch()`) has only been type-checked; all
  tests run through the emulator. In particular, `INSERT ... ON CONFLICT ... RETURNING` and an upsert
  with a sub-select in its `WHERE` are assumed to behave on D1 as on node:sqlite (both are SQLite).
- Write latency from Egypt to the D1 primary region, cold starts, behaviour under real concurrency.
- That next-on-pages exposes `DB` on the request context the same way it exposes `STORE_KV`.
- The import against production-size KV data (paging keeps each call inside the limits on paper).
