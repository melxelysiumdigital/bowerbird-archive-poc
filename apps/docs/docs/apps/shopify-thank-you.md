---
sidebar_position: 4
title: shopify-thank-you
---

# `apps/shopify-thank-you` — headless redirect glue

The **primary mechanism** by which the headless storefront round-trips through Shopify checkout. Two extensions, no theme file edits required.

- **Workspace**: `@bowerbird-poc/shopify-thank-you`

See [Architecture: Headless checkout](../architecture/headless-checkout) for the full flow and rationale.

## What's in here

| Extension | Type | What it does |
| --- | --- | --- |
| `headless-redirect` | [Theme app extension](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions) (app embed) | Sits in `<head>` on every storefront page. Reads `headless_origin` from URL/cookie, redirects to checkout or back to the headless app |
| `thank-you-redirect` | [Checkout UI extension](https://shopify.dev/docs/api/checkout-ui-extensions) | Renders "Continue to Your Order" on the thank-you page with `order_id` + `order_number` |
| `thank-you-messages` | Checkout UI extension | Optional messaging shown on the thank-you page |

## Run it

```bash
cd apps/shopify-thank-you

# ngrok in one terminal (see Prerequisites)
ngrok http 3002

# Shopify CLI in another, pointed at ngrok
pnpm dev --tunnel-url https://<your-ngrok-id>.ngrok-free.app:3002

# When you're ready to register extensions with Shopify
pnpm deploy
```

ngrok is required — see [Prerequisites → ngrok](../getting-started/prerequisites#ngrok-specifically) for why we don't use the default Cloudflare tunnel.

## Setup checklist

After deploying, **you must enable the app embed**:

1. In the Shopify admin, go to **Online Store → Themes → Customize**
2. Click the **App embeds** icon (puzzle piece) in the left sidebar
3. Toggle **Headless Redirect** to **on**
4. Click **Save**

:::danger Embeds reset on every deploy
`pnpm deploy` can flip this toggle back to off. **After every deploy, re-verify the embed is on.** Symptom of the embed being off: the customer lands on the Shopify storefront homepage with `headless_origin` and `checkout_url` params in the URL but is never redirected. See [Gotchas](../gotchas#shopify-app-embed-resets-after-deploy).
:::

## Configurable from the theme editor

The `headless-redirect` app embed exposes settings (defined in the extension's [`shopify.extension.toml`](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)):

- **Enable headless redirect** — master on/off
- **Custom path redirects** — map Shopify paths to headless paths (e.g. `/collections` → `/shop`)

These live in the theme editor, not the codebase, so they survive theme switches.

## Per-theme

App embeds are stored **per theme**, not per store. If you switch themes (e.g. from a published theme to a dev copy), you'll need to enable the embed again on the new theme. The preview bar at the bottom of the store page shows which theme you're looking at.

## The Admin API token

`scripts/get-admin-token.js` runs an OAuth dance to produce an Admin API access token. Used here only for the [checkout branding API](https://shopify.dev/docs/api/admin-graphql/latest/objects/CheckoutBranding) — hiding the default Shopify checkout footer so the headless context feels seamless.

```bash
SHOPIFY_CLIENT_SECRET=<from Partner Dashboard> pnpm get-admin-token
```

The token gets saved to `.shopify-admin-token` and should be copied into `apps/web/.env.local` as `SHOPIFY_ADMIN_ACCESS_TOKEN` (same token is reused by the web app for draft orders).

## Scopes

```
read_checkout_branding_settings
write_checkout_branding_settings
read_orders
read_draft_orders
write_draft_orders
read_themes
write_themes
```

See the [Shopify access scopes reference](https://shopify.dev/docs/api/usage/access-scopes) for what each one grants.

## External docs to read

- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions) — how the app embed works
- [Checkout UI extensions overview](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Checkout UI extension targets](https://shopify.dev/docs/api/checkout-ui-extensions/targets) — the `purchase.thank-you.*` targets we use
- [Cart attributes API](https://shopify.dev/docs/api/storefront/latest/objects/Cart) — how `headless_origin` is passed through
