---
sidebar_position: 4
title: Environment variables
---

# Environment variables

Each app has its own `.env.local`. None of these are checked in. The list below is the **complete** set the POC reads — anything not on this list is unused or dead.

:::warning POC handling
All secrets live in plain `.env.local` files. There is no secret manager integration. For production, move every value below into a managed store (1Password, AWS Secrets Manager, Doppler, …).
:::

## `apps/web/.env.local`

```bash
# Auth0
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...                       # only used server-side
AUTH0_AUDIENCE=...

# Shopify storefront (public — read product/collection data)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=...

# Shopify Admin API — for digitisation request draft orders
# Token comes from `apps/shopify-digitisation/scripts/get-admin-token.js`
SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_...

# Azure Search (currently mocked — these can be empty)
AZURE_SEARCH_ENDPOINT=
AZURE_SEARCH_INDEX=
AZURE_SEARCH_API_KEY=
```

## `apps/shopify-donations/.env`

Provisioned automatically by the Shopify CLI on `pnpm dev`:

```bash
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_APP_URL=https://...trycloudflare.com    # rotates per dev session
SCOPES=write_products,read_orders,...
```

The CLI rewrites `SHOPIFY_APP_URL` on every `dev` run because the tunnel URL is ephemeral.

## `apps/shopify-thank-you/.env`

Also CLI-provisioned. Additionally for the admin OAuth helper:

```bash
SHOPIFY_CLIENT_SECRET=...    # only needed when running scripts/get-admin-token.js
```

## `apps/shopify-digitisation/.env`

```bash
SHOPIFY_CLIENT_SECRET=...    # for scripts/get-admin-token.js
```

The token this script produces is what goes into `apps/web/.env.local` as `SHOPIFY_ADMIN_ACCESS_TOKEN`.

## Turbo globalEnv

`turbo.json` declares the env vars Turbo considers part of the cache key:

```json
"globalEnv": [
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_SCOPES",
  "SHOPIFY_HOST_NAME",
  "AZURE_SEARCH_ENDPOINT",
  "AZURE_SEARCH_INDEX",
  "AZURE_SEARCH_API_KEY",
  "SHOPIFY_ADMIN_ACCESS_TOKEN"
]
```

If you add a new env var that affects build output, add it here too or Turbo will hand you stale cached builds.
