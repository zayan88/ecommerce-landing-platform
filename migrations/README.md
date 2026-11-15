# D1 migrations

Numbered `.sql` files, applied in file-name order, each exactly once. Never edit a file that has been
applied anywhere: add the next number (`0002_...sql`) instead.

| Where | How | Tracking |
|---|---|---|
| Local dev (`next dev`) | `node scripts/dev-d1-server.mjs 3198` applies pending files on start (data in `.dev-d1.sqlite`) | table `d1_migrations` |
| Tests | `node scripts/test-orders-repo.mjs` applies them to an in-memory database | — |
| Local wrangler preview | `npx.cmd wrangler d1 migrations apply DB --local` | table `d1_migrations` |
| Real Cloudflare | `npx.cmd wrangler d1 migrations apply DB --remote` | table `d1_migrations` |

`DB` is the binding name in `wrangler.toml` (`[[d1_databases]]`, `migrations_dir = "migrations"`).
Check what is pending without applying: `npx.cmd wrangler d1 migrations list DB --remote`.

Rules for a migration file: plain statements separated by `;` (no triggers or anything with an inner
`;`), `IF NOT EXISTS` where possible, and `store_id TEXT NOT NULL DEFAULT 'default'` on every new table.

Full procedure (create the database, switch the backend, import, roll back): `docs/architecture-kv-d1.md`.
