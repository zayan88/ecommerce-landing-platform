-- 0006_chat_live.sql — live store chat: a customer's messages go to the merchant's Telegram support bot and the
-- merchant's replies (a Telegram "Reply" on the message) come back into the customer's chat window.
-- chat_conv: one row per conversation (random id kept in the customer's browser).
-- chat_messages: both directions (who = 'me' customer, 'shop' merchant). Purged after 1 day.
-- chat_tg: which Telegram message belongs to which conversation (so a Reply finds its customer).
CREATE TABLE IF NOT EXISTS chat_conv (
  store_id   TEXT    NOT NULL DEFAULT 'default',
  cid        TEXT    NOT NULL,
  name       TEXT    NOT NULL DEFAULT '',
  phone      TEXT    NOT NULL DEFAULT '',
  page       TEXT    NOT NULL DEFAULT '',
  created_ms INTEGER NOT NULL,
  PRIMARY KEY (store_id, cid)
);
CREATE TABLE IF NOT EXISTS chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id   TEXT    NOT NULL DEFAULT 'default',
  cid        TEXT    NOT NULL,
  who        TEXT    NOT NULL,
  text       TEXT    NOT NULL,
  created_ms INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chat_messages_cid_idx ON chat_messages (store_id, cid, id);
CREATE TABLE IF NOT EXISTS chat_tg (
  store_id      TEXT    NOT NULL DEFAULT 'default',
  tg_message_id INTEGER NOT NULL,
  cid           TEXT    NOT NULL,
  created_ms    INTEGER NOT NULL,
  PRIMARY KEY (store_id, tg_message_id)
);
