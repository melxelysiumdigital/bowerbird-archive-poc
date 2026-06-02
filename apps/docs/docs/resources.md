---
sidebar_position: 100
title: External resources
slug: /resources
---

# External resources

Every link the POC depends on, grouped by topic. Bookmark this page.

## Shopify

### Platform docs

- [Shopify dev docs root](https://shopify.dev/docs)
- [Getting started with Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [Shopify Partner Dashboard](https://partners.shopify.com)
- [Create a development store](https://shopify.dev/docs/api/development-stores)

### CLI + tooling

- [Shopify CLI overview](https://shopify.dev/docs/api/shopify-cli)
- [Shopify CLI for apps](https://shopify.dev/docs/api/shopify-cli/app)
- [Shopify CLI for themes](https://shopify.dev/docs/themes/tools/cli)
- [Networking / tunnels (Cloudflare vs ngrok vs localhost)](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options)
- [`shopify app dev` flags](https://shopify.dev/docs/api/shopify-cli/app/app-dev) (including `--tunnel-url` for ngrok)
- [`shopify theme dev` flags](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev)
- [Shopify Dev MCP](https://shopify.dev/docs/apps/build/devmcp) — lets Claude/Cursor read live Shopify docs

### APIs

- [Admin GraphQL API reference](https://shopify.dev/docs/api/admin-graphql) — used by `apps/web` for draft orders, customer tags
- [Admin REST API reference](https://shopify.dev/docs/api/admin-rest) — legacy, prefer GraphQL
- [Storefront GraphQL API reference](https://shopify.dev/docs/api/storefront) — used by `apps/web` for product/collection reads
- [Authentication & access tokens](https://shopify.dev/docs/apps/build/authentication-authorization)
- [Access scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data) — must be enabled in the Partner Dashboard, see [shopify-digitisation setup](./apps/shopify-digitisation#setup)

### Apps & extensions

- [App configuration TOML reference](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration)
- [App extensions overview](https://shopify.dev/docs/apps/app-extensions/list)
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions) — what powers `headless-redirect`
- [Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions) — used by `thank-you-redirect`, `checkout-donation-upsell`
- [Checkout UI extension targets](https://shopify.dev/docs/api/checkout-ui-extensions/targets) — the `purchase.thank-you.*` targets we use
- [App Bridge](https://shopify.dev/docs/api/app-bridge-library)
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)

### Shopify Functions

- [Functions overview](https://shopify.dev/docs/api/functions)
- [Cart transform Function](https://shopify.dev/docs/api/functions/reference/cart-transform) — used by `apps/shopify-donations`
- [Functions in JS](https://shopify.dev/docs/api/functions/javascript-input-query) (we don't use Rust)

### React Router app template

- [Shopify React Router app template](https://github.com/Shopify/shopify-app-template-react-router) — the basis of `apps/shopify-donations`
- [`@shopify/shopify-app-react-router` docs](https://shopify.dev/docs/api/shopify-app-react-router)
- [Upgrading from Remix](https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix)

### Themes

- [Dawn theme repo](https://github.com/Shopify/dawn)
- [Theme architecture](https://shopify.dev/docs/storefronts/themes/architecture)
- [Liquid reference](https://shopify.dev/docs/api/liquid)
- [Liquid filters](https://shopify.dev/docs/api/liquid/filters) — including the `image_url` and `json` filters used in our React-backed sections
- [Section schema](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-schema)
- [Theme editor JavaScript events](https://shopify.dev/docs/storefronts/themes/architecture/sections/section-assets#theme-editor-javascript-events) — `shopify:section:load`, `shopify:block:select`, etc.

### Headless

- [Hydrogen](https://shopify.dev/docs/api/hydrogen) — the framework we didn't pick
- [Headless commerce overview](https://shopify.dev/docs/storefronts/headless)
- [Customer Account API](https://shopify.dev/docs/api/customer)
- [Checkout branding API](https://shopify.dev/docs/api/admin-graphql/latest/objects/CheckoutBranding) — used by `shopify-thank-you` to hide the default footer

### Product import/export

- [Import products with a CSV file](https://help.shopify.com/en/manual/products/import-export/using-csv) — how to use `apps/export/products_export.csv`
- [Exporting products](https://help.shopify.com/en/manual/products/import-export/export-products) — how the snapshot is produced
- [Product CSV column reference](https://help.shopify.com/en/manual/products/import-export/using-csv#product-csv-file-format)
- [Bulk operations API (imports)](https://shopify.dev/docs/api/usage/bulk-operations/imports) — scripted alternative

### Webhooks

- [Webhooks overview](https://shopify.dev/docs/apps/build/webhooks)
- [App-specific webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-subscriptions) — preferred over shop-specific
- [Webhook topics](https://shopify.dev/docs/api/admin-rest/latest/resources/webhook)

## Tunnels

- [ngrok download](https://ngrok.com/download)
- [ngrok docs](https://ngrok.com/docs)
- [ngrok with Shopify CLI](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options#tunneling-with-ngrok)
- [Localhost-based dev (no tunnel)](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options#localhost-based-development)

## Web app stack

### Next.js + React

- [Next.js docs](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React 19 docs](https://react.dev/)
- [React Server Components](https://react.dev/reference/rsc/server-components)

### Auth

- [Auth0 React SDK](https://auth0.com/docs/quickstart/spa/react)
- [Auth0 management API](https://auth0.com/docs/api/management/v2)

### Search (mocked in POC)

- [Azure AI Search docs](https://learn.microsoft.com/en-us/azure/search/)
- [Azure Search JS SDK](https://www.npmjs.com/package/@azure/search-documents)

## UI stack

- [shadcn/ui](https://ui.shadcn.com/) — components live in `packages/ui`
- [shadcn CLI docs](https://ui.shadcn.com/docs/cli)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Tailwind v4 cascade layers](https://tailwindcss.com/blog/tailwindcss-v4-alpha#use-css-cascade-layers) — relevant to [our cascade fix](./architecture/tailwind-cascade)
- [Radix UI primitives](https://www.radix-ui.com/primitives) — under shadcn/ui

## Build / tooling

- [Vite docs](https://vite.dev/)
- [Turborepo docs](https://turborepo.com/docs)
- [pnpm docs](https://pnpm.io/)
- [pnpm workspaces](https://pnpm.io/workspaces)

## Docs site

- [Docusaurus docs](https://docusaurus.io/docs)
- [Docusaurus Markdown features](https://docusaurus.io/docs/markdown-features)
- [Docusaurus sidebar config](https://docusaurus.io/docs/sidebar)
