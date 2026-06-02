---
sidebar_position: 3
title: Headless checkout
---

# Headless checkout

The most load-bearing decision in the POC. The Next.js app owns the customer's storefront experience, but **Shopify owns checkout**. This page walks through the round-trip and the reasons it's built this way.

## The flow

```
1. Customer adds items to cart in Next.js (apps/web)
   - Items can be digitised products OR digitisation requests
   - Cart lives in localStorage + is mirrored to Shopify cart attributes

2. Customer clicks "Checkout"
   - Next.js redirects to:
       https://store.myshopify.com/?headless_origin=<web-origin>&checkout_url=<checkout>

3. Shopify storefront loads
   - The `headless-redirect` app embed (from apps/shopify-thank-you) runs in <head>
   - Reads `headless_origin` from the URL, saves it as a cookie
   - Redirects to the checkout URL

4. Customer completes checkout on Shopify
   - All PCI, tax, payment-method logic stays with Shopify

5. Shopify thank-you page renders
   - The `thank-you-redirect` checkout UI extension renders
   - Reads `headless_origin` from cart attributes
   - Shows a "Continue to Your Order" button with order_id + order_number

6. Customer clicks → back to apps/web/account/orders
```

## Why this approach

### Why not embed Shopify checkout in an iframe?

You can't. Shopify deprecated checkout iframing and the supported APIs (Storefront API + Hydrogen) explicitly redirect to `checkout.shopify.com`. Trying to wrap that is a fight you'll lose every release.

### Why not Hydrogen?

Hydrogen is excellent if you start there. We had an existing Bowerbird Archive design system (in React), an existing Shopify Plus store, and a need to integrate with Auth0 + RefTracker + TechOne + Azure Search. Hydrogen's opinionated structure doesn't pay off when you're stapling that many third-party systems on. A plain Next.js + the Storefront API + the Admin API is more flexible at the cost of "you have to write more glue".

### Why the app-embed pattern for the redirect?

Originally the redirect was a `<script>` tag injected directly into `theme.liquid`. Two problems:

1. Every theme deploy could clobber it
2. Different themes (e.g. a customised one) wouldn't have it without manual re-edits

A **theme app extension** (app embed) solves both:

- It's installed by enabling a toggle in the theme editor — once, per theme
- It survives theme updates because Shopify treats app embeds as separate from theme files
- It's configurable through the theme editor (e.g. on/off, custom path mappings)

The trade-off: app embeds **can be reset on app deploy**. See [Gotchas](../gotchas#shopify-app-embed-resets-after-deploy).

### Why a cookie + URL param, not just a query string?

The checkout flow on Shopify often involves multiple page navigations (shipping → payment → success), and Shopify doesn't reliably propagate arbitrary query params through all of them. Storing `headless_origin` in a cookie means even if the customer takes a detour, we can still find their way home.

Cart attributes get the same data so the thank-you UI extension can read it without depending on cookies (which checkout UI extensions can't read).

### Why a separate "thank-you-redirect" checkout UI extension?

The thank-you page is a Shopify-rendered page — we can't inject our own script into it. Checkout UI extensions are the only supported way to add UI there. The extension reads `headless_origin` from cart/line-item attributes and renders the continue button.

There are two targets used:

- `purchase.thank-you.block.render` — appears as a block the merchant can place
- `purchase.thank-you.footer.render-after` — replaces the default "Continue shopping" link

## Security note (POC limitation)

The `headless-redirect` script accepts any `headless_origin` value and redirects to it. A production deployment **must** validate the origin against an allowlist. Right now this is an open-redirect by design — fine for a dev store, not OK on a real store. See [POC status](../poc-status#-security).

## Password-protected dev stores

Dev stores typically have a Shopify password page enabled. The password page is rendered **before** any theme or app code, so the `headless-redirect` script doesn't run. The customer has to enter the store password once per browser session, and then subsequent loads work.

For end-to-end testing in CI, either disable the password or use a Shopify storefront token to bypass.

## Where the code lives

- Redirect logic: `apps/shopify-thank-you/extensions/headless-redirect/`
- Thank-you button: `apps/shopify-thank-you/extensions/thank-you-redirect/`
- The web-app side: `apps/web/lib/checkout/` and the cart components in `apps/web/app/`
