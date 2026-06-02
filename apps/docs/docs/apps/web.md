---
sidebar_position: 1
title: web (Next.js storefront)
---

# `apps/web` — Next.js headless storefront

The customer's primary surface. Browse, search, account, and the cart that feeds into Shopify checkout.

- **Port**: 3000
- **Workspace**: `@bowerbird-poc/web`
- **Stack**: [Next.js (App Router)](https://nextjs.org/docs/app), [React 19](https://react.dev/), [Tailwind v4](https://tailwindcss.com/docs), [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react), [shadcn/ui](https://ui.shadcn.com/) from `packages/ui`

## Run it

```bash
pnpm dev:web        # or, from apps/web: pnpm dev
```

## What's in there

```
apps/web/
├── app/
│   ├── account/
│   │   └── orders/       # Order history, copy-quote flow, request forms
│   ├── search/           # Mocked search results
│   ├── product/[id]/     # Product page (request-copy style)
│   └── ...
├── components/           # App-specific composed components
├── data/                 # Mocked Azure Search fixtures
├── hooks/
├── lib/
│   ├── auth/             # Auth0 wrappers
│   ├── shopify/          # Storefront + Admin API clients
│   └── cart/             # Unified cart store
└── ...
```

App-specific components live here. Reusable primitives (Button, Dialog, Card, …) live in `packages/ui`.

## Notable features

### Unified cart

The cart handles **both** digitised products (which checkout normally) and digitisation requests (which create draft orders via the Admin API). One UI, two fulfilment paths. State is stored in `localStorage` and mirrored to Shopify cart attributes when checkout is initiated.

### Membership status

A `/account/membership` page checks a customer tag (set via the digitisation app's Admin API access) to render member-only state. The tag → tier mapping is a stand-in for a real membership system.

### Mocked search

`apps/web/data/` contains a JSON fixture used as the "Azure Search" backend. The real Azure index isn't wired up — see [POC status](../poc-status).

### Donation flow

A donation upsell path that drops the customer into a Shopify-rendered checkout with a donation product added. The actual checkout-side upsell is implemented by `apps/shopify-donations` (Shopify Function + UI extension).

## Auth0

Wraps the app with `@auth0/auth0-react` (root dep). Login/logout state hydrates customer info, which the cart and account pages use to look up draft orders.

## Storefront vs Admin API

- **[Storefront API](https://shopify.dev/docs/api/storefront)** (public, customer-scope) → product/collection reads, public cart operations
- **[Admin API](https://shopify.dev/docs/api/admin-graphql)** (server-only, offline access token) → draft orders for digitisation requests, customer tag reads

The Admin API token comes from `apps/shopify-digitisation/scripts/get-admin-token.js`. See [Env vars](../getting-started/env-vars).

## External docs to read

- [Next.js App Router](https://nextjs.org/docs/app)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront) — products, collections, cart
- [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql) — draft orders, customers
- [Auth0 React SDK quickstart](https://auth0.com/docs/quickstart/spa/react)
- [`@shopify/hydrogen-react`](https://shopify.dev/docs/api/hydrogen-react) — utility hooks we use for cart shape
- [shadcn/ui](https://ui.shadcn.com/docs) — the component conventions
