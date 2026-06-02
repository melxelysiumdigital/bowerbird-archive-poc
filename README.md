# Bowerbird Archive POC

A proof of concept for the Bowerbird Archive — Next.js storefront, Dawn-based Shopify theme, and a handful of Shopify apps tying it all together. Not production-ready, and the wiki has the long list of reasons why.

To get going, spin up the wiki first:

```bash
pnpm install
pnpm dev:docs
```

Then open http://localhost:3030 and start with "POC Status — Read Me First". Setup, architecture, gotchas, per-app docs — all in there.

Heads up: you'll need Node 25 and pnpm 9.15 (run `corepack enable` once and it handles both). Shopify-app workflows also want the Shopify CLI and ngrok — wiki covers the full prereqs.

Repo layout:

- `apps/web` — Next.js storefront
- `apps/shopify-theme` — Dawn + Vite
- `apps/shopify-donations` — checkout donation upsell
- `apps/shopify-thank-you` — headless redirect glue
- `apps/shopify-digitisation` — Admin API scopes for draft orders
- `apps/docs` — this wiki
- `apps/export` — product CSV + Flow workflow zip
- `packages/*` — shared UI, types, configs
