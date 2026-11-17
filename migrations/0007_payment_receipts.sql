-- 0007_payment_receipts.sql — transfer receipts (Vodafone Cash / InstaPay screenshots) uploaded by customers.
-- The image is kept ONLY until the merchant decides the order (confirm / reject / any status change) or the order is
-- deleted, then the row is removed. Rows older than 45 days are purged on every new upload as a safety net.
CREATE TABLE IF NOT EXISTS payment_receipts (
  store_id   TEXT    NOT NULL DEFAULT 'default',
  id         TEXT    NOT NULL,
  ct         TEXT    NOT NULL,
  b64        TEXT    NOT NULL,
  size       INTEGER NOT NULL,
  created_ms INTEGER NOT NULL,
  PRIMARY KEY (store_id, id)
);
CREATE INDEX IF NOT EXISTS payment_receipts_created_idx ON payment_receipts (store_id, created_ms);
