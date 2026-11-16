# Domain tab (admin > Settings > Domain)

The merchant connects his own domain from the store admin. The store registers the domain on the Cloudflare Pages
project (SSL included) and shows the one DNS record (CNAME) the merchant adds at whoever sold him the domain
(Spaceship, Hostinger, GoDaddy, Namecheap, ...). The store never talks to the registrar.

## What must exist (one-time, at install)

| Name | Kind | Value |
|---|---|---|
| `CF_PAGES_API_TOKEN` | **secret** | A SCOPED API token: **Account > Cloudflare Pages > Edit**, limited to the merchant's account |
| `CF_ACCOUNT_ID` | variable | The merchant's Cloudflare account id (32 hex characters) |
| `CF_PAGES_PROJECT` | variable | The Pages project name (e.g. `my-store`) |

Without the token the tab shows "not enabled on this store" and the domain has to be attached from the Cloudflare
dashboard (Workers & Pages > project > Custom domains).

### Create the token (Cloudflare dashboard, 2 minutes)
1. My Profile > API Tokens > Create Token > Create Custom Token.
2. Name: `store-domain-tab`.
3. Permission: **Account > Cloudflare Pages > Edit**.
4. Account Resources: the merchant's account only. Continue > Create Token. Copy it once.
5. Set it as a secret on the Pages project: Settings > Variables and Secrets > add `CF_PAGES_API_TOKEN` (encrypt), or
   `npx wrangler pages secret put CF_PAGES_API_TOKEN --project-name <project> --env production`. Redeploy.

The token can only manage Pages of that account. Verified on the RexRack production token: it cannot list zones, read
DNS records, list D1 databases, list KV namespaces or read the user profile.

## What the merchant does
1. Admin > Settings > Domain: type the domain (`shop.mystore.com`, or `mystore.com`) and press "Link the domain".
2. At his domain provider (DNS settings) add the record shown: type `CNAME`, name `www` / the subdomain / `@`, value
   `<project>.pages.dev`. Delete an older A/CNAME record for the same name first if one exists.
3. Wait (minutes to 48 hours). The page re-checks every 30 seconds while open; "Check now" forces it.
4. When the status is active, press "Make it the main store link" (used by the product feed and social previews).

## Limits and notes
- Up to 3 custom domains per store.
- A bare domain (`mystore.com`, no `www`) works only if the provider accepts a CNAME on the root (or the whole domain is
  moved to Cloudflare). Otherwise use `www`.
- Hostnames are validated strictly (no IPs, `localhost`, `*.pages.dev`, wildcards); internationalised names are stored as punycode.
- Cloudflare API calls take 2 to 4 seconds; the UI shows progress.
- The token never reaches the browser and is never put in error messages (tested).

## Local testing without Cloudflare
`node scripts/dev-fake-cf-pages.mjs 3197` starts a fake Cloudflare Pages API (a new domain becomes active after 25 s).
Launch config `store-local-domain` points the store at it (`CF_API_BASE` is honoured ONLY for `127.0.0.1` / `localhost`).
Tests: `node scripts/test-domains.mjs` (11).
