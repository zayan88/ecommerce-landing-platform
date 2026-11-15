-- 0001_orders.sql — transactional order data on Cloudflare D1 (see docs/architecture-kv-d1.md).
-- Every table carries store_id from day one (multi-store ready; single store = 'default').
-- Applied by: `wrangler d1 migrations apply DB` (remote/local) and scripts/dev-d1-server.mjs (local dev).
-- Keep statements simple (no triggers): wrangler splits this file on ';'.

CREATE TABLE IF NOT EXISTS orders (
  store_id          TEXT    NOT NULL DEFAULT 'default',
  id                TEXT    NOT NULL,
  order_number      TEXT    NOT NULL,
  landing_page_id   TEXT,
  landing_page_slug TEXT    NOT NULL DEFAULT 'direct',
  product_id        TEXT    NOT NULL DEFAULT '',
  offer_id          TEXT,
  customer_name     TEXT    NOT NULL DEFAULT '',
  customer_phone    TEXT    NOT NULL DEFAULT '',
  customer_phone2   TEXT,
  governorate       TEXT    NOT NULL DEFAULT '',
  city              TEXT,
  address           TEXT    NOT NULL DEFAULT '',
  notes             TEXT,
  quantity          INTEGER NOT NULL DEFAULT 1,
  unit_price        REAL    NOT NULL DEFAULT 0,
  total_amount      REAL    NOT NULL DEFAULT 0,
  shipping_fee      REAL    NOT NULL DEFAULT 0,
  discount_amount   REAL    NOT NULL DEFAULT 0,
  final_amount      REAL    NOT NULL DEFAULT 0,
  currency          TEXT    NOT NULL DEFAULT 'EGP',
  status            TEXT    NOT NULL DEFAULT 'pending',
  payment_method    TEXT    NOT NULL DEFAULT 'cod',
  safqa_invoice_id  TEXT,
  safqa_invoice_url TEXT,
  safqa_status      TEXT    NOT NULL DEFAULT 'not_synced',
  safqa_response    TEXT,              -- JSON
  safqa_synced_at   TEXT,
  created_at        TEXT    NOT NULL,  -- ISO-8601, as returned by the API
  updated_at        TEXT    NOT NULL,
  tracking          TEXT,              -- JSON (OrderTrackingMeta)
  extra             TEXT,              -- JSON: unknown fields of imported legacy orders (lossless import)
  created_ms        INTEGER NOT NULL,  -- epoch ms of created_at: sorting and date filters
  PRIMARY KEY (store_id, id)
);

-- Order number uniqueness is enforced here (no listing, no KV): a collision fails the INSERT and the app retries.
CREATE UNIQUE INDEX IF NOT EXISTS orders_number_uq  ON orders (store_id, order_number);
CREATE INDEX IF NOT EXISTS orders_created_idx       ON orders (store_id, created_ms);
CREATE INDEX IF NOT EXISTS orders_status_idx        ON orders (store_id, status, created_ms);
CREATE INDEX IF NOT EXISTS orders_phone_idx         ON orders (store_id, customer_phone);
CREATE INDEX IF NOT EXISTS orders_product_idx       ON orders (store_id, product_id, created_ms);

CREATE TABLE IF NOT EXISTS order_status_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id    TEXT NOT NULL DEFAULT 'default',
  order_id    TEXT NOT NULL,
  from_status TEXT,                    -- NULL for the creation row
  to_status   TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'admin',  -- create | admin | status | safka | import
  changed_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS order_status_history_order_idx ON order_status_history (store_id, order_id, id);

-- Tombstones: one row per identifier of a deleted order (id, order number, Safka serial).
-- An identifier listed here is never re-imported and never re-created by the Safka sync.
CREATE TABLE IF NOT EXISTS deleted_orders (
  store_id   TEXT NOT NULL DEFAULT 'default',
  token      TEXT NOT NULL,
  order_id   TEXT,
  deleted_at TEXT NOT NULL,
  PRIMARY KEY (store_id, token)
);

-- Visit / checkout-start counters, one row per Cairo calendar day.
CREATE TABLE IF NOT EXISTS stats_daily (
  store_id        TEXT    NOT NULL DEFAULT 'default',
  day             TEXT    NOT NULL,    -- YYYY-MM-DD (Africa/Cairo)
  visits          INTEGER NOT NULL DEFAULT 0,
  checkout_starts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (store_id, day)
);

-- Duplicate-order guard. dedupe_key = sha256(phone|product) (never the raw phone).
-- The primary key makes the claim atomic: of N concurrent identical orders exactly one INSERT wins.
-- order_id is NULL while the winner is still creating its order.
CREATE TABLE IF NOT EXISTS order_dedupe (
  store_id   TEXT    NOT NULL DEFAULT 'default',
  dedupe_key TEXT    NOT NULL,
  claim_id   TEXT    NOT NULL,
  order_id   TEXT,
  created_ms INTEGER NOT NULL,
  PRIMARY KEY (store_id, dedupe_key)
);

-- Per-IP order rate limit. ip_key = 'order_rl:' + sha256(ip) (never the raw IP).
CREATE TABLE IF NOT EXISTS rate_limits (
  store_id     TEXT    NOT NULL DEFAULT 'default',
  ip_key       TEXT    NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start INTEGER NOT NULL,       -- epoch ms
  PRIMARY KEY (store_id, ip_key)
);
