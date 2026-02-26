# Shopify Thank You App

Shopify CLI app that handles the headless checkout redirect flow via two extensions. This is the **primary** redirect mechanism — no theme file modifications needed.

## What this app provides

### `headless-redirect` extension (theme app extension)

A theme app extension (app embed) injected into the store `<head>`. Handles the full cookie-based redirect cycle:

1. **Checkout redirect**: Web app sends customer to `https://store.myshopify.com/?headless_origin=<origin>&checkout_url=<checkout_url>`. The script saves `headless_origin` as a cookie and redirects to checkout.
2. **Post-checkout redirect**: After purchase, any link back to the store (header, "Continue shopping") triggers the script, which reads the cookie and redirects back to the headless app.

Configurable via the Shopify theme editor (App embeds):

- **Enable headless redirect** — on/off toggle
- **Custom path redirects** — map Shopify paths to headless paths (e.g., `/collections > /shop`)

### `thank-you-redirect` extension (checkout UI extension)

A Preact-based checkout UI extension that renders on the Shopify thank-you page. It reads `headless_origin` from cart/line item attributes and shows a "Continue to Your Order" button that redirects back to the headless app with order details (`order_id`, `order_number`).

Only renders when `headless_origin` exists (i.e., customer came from the headless storefront). Direct Shopify customers see the standard thank-you page.

**Targets:**

- `purchase.thank-you.block.render` — configurable block placement
- `purchase.thank-you.footer.render-after` — replaces "Continue shopping" link

## Setup

```bash
# Install dependencies
pnpm install

# Deploy the app (registers extensions with Shopify)
pnpm deploy

# Run in dev mode (for testing extensions locally)
pnpm dev
```

After deploying, enable the **Headless Redirect** app embed in the Shopify admin:
Online Store > Themes > Customize > App embeds

### Important: Development vs Main theme

App embeds must be enabled **per theme**. If you're testing with a development theme, enable the embed on that specific theme. The preview bar at the bottom of the store page shows which theme you're viewing.

### Admin API token

The `scripts/get-admin-token.js` script runs an OAuth flow to get an Admin API access token. This is used for checkout branding API calls (e.g., hiding the default checkout footer).

```bash
SHOPIFY_CLIENT_SECRET=your_secret pnpm get-admin-token
```

The token is saved to `.shopify-admin-token` and should be added to `apps/web/.env.local` as `SHOPIFY_ADMIN_ACCESS_TOKEN`.

## App scopes

```
read_checkout_branding_settings
write_checkout_branding_settings
read_orders
read_draft_orders
write_draft_orders
read_themes
write_themes
```
