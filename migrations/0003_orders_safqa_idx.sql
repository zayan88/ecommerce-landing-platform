-- 0003_orders_safqa_idx.sql — lookup of an order by its Safka serial without scanning the table
-- (Safka status webhook, "sync with Safka" de-duplication). Partial: only orders that have a serial
-- pay the extra index row on write.
CREATE INDEX IF NOT EXISTS orders_safqa_idx ON orders (store_id, safqa_invoice_id) WHERE safqa_invoice_id IS NOT NULL;
