---
sidebar_position: 3
title: shopify-donations
---

# `apps/shopify-donations` — embedded app + Functions

A Shopify embedded app (built on the [Shopify React Router template](https://github.com/Shopify/shopify-app-template-react-router)) that adds **donation upsell** at checkout via a [Shopify Function](https://shopify.dev/docs/api/functions) and a [checkout UI extension](https://shopify.dev/docs/api/checkout-ui-extensions).

- **Workspace**: `@bowerbird-poc/shopify-app`
- **Port**: 3001 (when running through Shopify CLI tunnel)
- **Storage**: [Prisma](https://www.prisma.io/) + SQLite for session storage (POC only — see below)

## What it does

Two extensions plus the admin app shell:

| Extension | Type | Purpose |
| --- | --- | --- |
| `cart-transform-donation` | Shopify Function (cart transform) | Adds the donation product line to the cart when the checkout-side upsell is confirmed |
| `checkout-donation-upsell` | Checkout UI extension | Renders the "Add a donation" UI on the checkout page |

The admin app shell is the standard Shopify React Router template — it provides the OAuth flow, session storage, and the Polaris admin UI we use for configuring donation amounts.

## Run it

```bash
cd apps/shopify-donations

# In one terminal — ngrok tunnel
ngrok http 3001

# In another terminal — Shopify CLI pointed at the ngrok URL
pnpm dev --tunnel-url https://<your-ngrok-id>.ngrok-free.app:3001
```

The Shopify CLI prompts you to pick a Partner org, an app, and a dev store on first run. Subsequent runs are zero-config.

ngrok is required — Cloudflare tunnel breaks React Router streaming. See [Prerequisites → ngrok](../getting-started/prerequisites#ngrok-specifically) and the [Shopify CLI networking docs](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options).

## File structure

```
apps/shopify-donations/
├── app/                              # React Router routes (admin UI)
├── extensions/
│   ├── cart-transform-donation/
│   │   └── src/                      # Rust → Wasm Shopify Function
│   └── checkout-donation-upsell/
│       └── src/                      # Preact checkout UI extension
├── prisma/
│   └── schema.prisma                 # SQLite session storage
├── shopify.app.toml                  # App config
├── shopify.web.toml                  # Server config
└── Dockerfile
```

## Why React Router and not the Remix template?

This app started life as a Remix app and was migrated to React Router after Shopify split the package. The base template is now [`shopify-app-template-react-router`](https://github.com/Shopify/shopify-app-template-react-router). Functionally near-identical for our purposes — see the [upgrade guide](https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix) if you ever need to revisit it.

## SQLite is POC-only

The session storage uses Prisma + SQLite. That's fine for a single-instance dev deployment. For production, swap to PostgreSQL or another managed DB — see the [upstream README](https://github.com/Shopify/shopify-app-template-react-router#database) and the list of [session-storage adapters](https://github.com/Shopify/shopify-api-js/blob/main/packages/shopify-api/docs/guides/session-storage.md).

## Common gotchas (from the upstream template)

The [Shopify React Router template README](https://github.com/Shopify/shopify-app-template-react-router#gotchas--troubleshooting) has an extensive Gotchas section. Highlights worth flagging here:

- **Embedded apps must use `Link` from React Router, not `<a>`.** Otherwise the iframe loses its session.
- **Use the `redirect` returned from `authenticate.admin`**, not React Router's `redirect`. Embedded redirects need to escape the iframe — see the [App Bridge docs](https://shopify.dev/docs/api/app-bridge-library).
- **[App-specific webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-subscriptions) declared in `shopify.app.toml`** auto-sync on every `deploy`. Shop-specific webhooks via `shopify.registerWebhooks` are flakier and need manual reinstall to reflect changes.
- **`pnpm dev` rewrites `SHOPIFY_APP_URL`** to a new tunnel URL each time — that's expected (and another reason we use a paid ngrok with a stable URL).

## Deploy

```bash
pnpm deploy
```

This registers the extensions with Shopify. The actual hosting of the admin shell is **not** wired up in the POC — you'd need to host it on [Cloud Run](https://shopify.dev/docs/apps/launch/deployment/deploy-to-google-cloud-run), [Fly](https://fly.io/docs/js/shopify/), [Render](https://render.com/docs/deploy-shopify-app), or [your own](https://shopify.dev/docs/apps/launch/deployment/deploy-to-hosting-service) before going live.
