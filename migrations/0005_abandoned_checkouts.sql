-- 0005_abandoned_checkouts.sql — checkouts a visitor started (name + phone typed) but never completed.
-- One row per (phone, product): a re-visit updates the row instead of adding one. Rows turn into
-- status 'converted' when the same phone places an order, and are purged after 30 days.
CREATE TABLE IF NOT EXISTS abandoned_checkouts (
  store_id      TEXT    NOT NULL DEFAULT 'default',
  id            TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  name          TEXT    NOT NULL DEFAULT '',
  governorate   TEXT,
  product_id    TEXT    NOT NULL DEFAULT '',
  product_title TEXT,
  landing_slug  TEXT,
  offer_title   TEXT,
  amount        INTEGER NOT NULL DEFAULT 0,
  utm_source    TEXT,
  status        TEXT    NOT NULL DEFAULT 'open',
  created_ms    INTEGER NOT NULL,
  updated_ms    INTEGER NOT NULL,
  PRIMARY KEY (store_id, id)
);
CREATE INDEX IF NOT EXISTS abandoned_updated_idx ON abandoned_checkouts (store_id, updated_ms DESC);
CREATE INDEX IF NOT EXISTS abandoned_phone_idx ON abandoned_checkouts (store_id, phone);
