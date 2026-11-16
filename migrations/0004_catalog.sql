-- 0004_catalog.sql — products, offers, landing pages and system settings on Cloudflare D1
-- (see docs/architecture-kv-d1.md, "Catalog on D1"). Used only when CATALOG_BACKEND=d1; additive.
-- Every table carries store_id (multi-store ready; single store = 'default').
-- Images stay in KV (/api/media); the `images` column holds their URLs only.
-- Keep statements simple (no triggers): wrangler splits this file on ';'.

CREATE TABLE IF NOT EXISTS products (
  store_id         TEXT    NOT NULL DEFAULT 'default',
  id               TEXT    NOT NULL,
  slug             TEXT    NOT NULL,
  sku              TEXT    NOT NULL DEFAULT '',
  title_ar         TEXT    NOT NULL DEFAULT '',
  title_en         TEXT,
  base_price       REAL    NOT NULL DEFAULT 0,
  compare_at_price REAL,
  cost_price       REAL,              -- private: never sent to visitors (stripped by /api/products and /p/[slug])
  stock_quantity   INTEGER NOT NULL DEFAULT 0,
  track_stock      INTEGER NOT NULL DEFAULT 0,  -- reserved for stock tracking (not used yet)
  stock_set_at     TEXT,                        -- reserved: when stock_quantity was last set (baseline for SUM)
  images           TEXT    NOT NULL DEFAULT '[]',  -- JSON array of URLs
  description_ar   TEXT    NOT NULL DEFAULT '',
  status           TEXT    NOT NULL DEFAULT 'active',  -- active | draft | archived
  extra            TEXT,              -- JSON: fields this schema does not know (lossless import, e.g. safka_*)
  created_at       TEXT    NOT NULL,  -- ISO-8601, as returned by the API
  updated_at       TEXT    NOT NULL,
  created_ms       INTEGER NOT NULL,  -- epoch ms of created_at: ordering
  PRIMARY KEY (store_id, id)
);
-- A product URL (/p/<slug>) must be unique inside a store.
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uq  ON products (store_id, slug);
CREATE INDEX IF NOT EXISTS products_status_idx      ON products (store_id, status, created_ms);

-- Offers of a product. Replaced as a set, in the same transaction as the product row.
-- Offer ids are only unique inside their product (duplicated products may reuse them).
CREATE TABLE IF NOT EXISTS product_offers (
  store_id       TEXT    NOT NULL DEFAULT 'default',
  product_id     TEXT    NOT NULL,
  id             TEXT    NOT NULL,
  title_ar       TEXT    NOT NULL DEFAULT '',
  quantity       INTEGER NOT NULL DEFAULT 1,
  price          REAL    NOT NULL DEFAULT 0,
  original_price REAL,
  discount_label TEXT,
  is_popular     INTEGER,           -- NULL = not set, 0 / 1
  free_shipping  INTEGER,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  position       INTEGER NOT NULL DEFAULT 0,  -- order inside the saved array (ties of sort_order keep it)
  extra          TEXT,              -- JSON: unknown fields
  PRIMARY KEY (store_id, product_id, id)
);

CREATE TABLE IF NOT EXISTS landing_pages (
  store_id          TEXT    NOT NULL DEFAULT 'default',
  id                TEXT    NOT NULL,
  slug              TEXT    NOT NULL,
  product_id        TEXT    NOT NULL DEFAULT '',
  title             TEXT    NOT NULL DEFAULT '',
  component_key     TEXT    NOT NULL DEFAULT 'starter-template',
  status            TEXT    NOT NULL DEFAULT 'active',  -- active | paused | draft
  custom_domain     TEXT,
  meta_pixel_id     TEXT,
  meta_capi_token   TEXT,            -- SECRET: never sent to visitors (stripped by /p/[slug])
  head_scripts      TEXT,
  custom_css        TEXT,
  content_config    TEXT,            -- JSON (LandingPageContentConfig)
  sections_config   TEXT,            -- JSON (LandingPageSectionConfig[]); NULL = default sections
  deployment_url    TEXT,
  deployment_status TEXT,
  last_published_at TEXT,
  extra             TEXT,            -- JSON: unknown fields
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  created_ms        INTEGER NOT NULL,
  PRIMARY KEY (store_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_slug_uq   ON landing_pages (store_id, slug);
CREATE INDEX IF NOT EXISTS landing_pages_product_idx      ON landing_pages (store_id, product_id);
CREATE INDEX IF NOT EXISTS landing_pages_status_idx       ON landing_pages (store_id, status, created_ms);

-- Admin-saved settings overrides (what the KV key `system_settings_overrides` holds): one row per field,
-- so a save touches only the fields it changes. Values are JSON. Some values are secrets saved from the
-- admin panel (Telegram token, Conversions API tokens): the settings API masks them, nothing else reads this table.
CREATE TABLE IF NOT EXISTS settings (
  store_id   TEXT NOT NULL DEFAULT 'default',
  key        TEXT NOT NULL,
  value      TEXT NOT NULL,          -- JSON
  updated_at TEXT NOT NULL,
  PRIMARY KEY (store_id, key)
);
