---
sidebar_position: 1
title: Overview
---

# Architecture overview

The POC is a **pnpm + Turborepo monorepo** with five apps and six shared packages. The apps are deliberately separate so each can be deployed independently, but they share design tokens, types, and components through the `packages/*` workspaces.

## High-level diagram

```
                     ┌──────────────────────────┐
                     │   Next.js (apps/web)     │
                     │   Headless storefront    │
                     │   - Browse / search      │
                     │   - Account + orders     │
                     │   - Unified cart UI      │
                     └─────────┬────────────────┘
                               │
                  redirect with cart attrs
                               │
                               ▼
┌────────────────────────────────────────────────────────────┐
│                  Shopify storefront                        │
│                                                            │
│  apps/shopify-theme (Dawn + Vite)                          │
│  - Liquid templates, Dawn sections                         │
│  - React components mounted via Vite-built bundle          │
│                                                            │
│  apps/shopify-thank-you (theme app extension)              │
│  - headless-redirect app embed forwards to checkout        │
│  - thank-you-redirect renders "Continue to Your Order"     │
│                                                            │
│  apps/shopify-donations (Functions + UI extensions)        │
│  - cart-transform-donation Function                        │
│  - checkout-donation-upsell UI extension                   │
└────────────────────────────────────────────────────────────┘
                               │
                Admin API (offline access token)
                               │
                               ▼
                ┌──────────────────────────┐
                │  apps/shopify-           │
                │  digitisation            │
                │  - Draft orders for      │
                │    digitisation requests │
                └──────────────────────────┘
```

## Decision log (the *why*)

The pages in this section each cover one architectural choice:

- **[Why a monorepo](./why-monorepo)** — why pnpm + Turborepo, not separate repos
- **[Headless checkout](./headless-checkout)** — why we redirect to Shopify rather than embedding checkout
- **[Dawn + Vite](./dawn-plus-vite)** — why we kept Dawn and bolted Vite on top
- **[Tailwind cascade](./tailwind-cascade)** — the one CSS gotcha that drove an architectural change
- **[Non-destructive deploy](./non-destructive-deploy)** — why the deploy workflow uses two-pass rsync

## Shared packages

| Package | Purpose |
| --- | --- |
| `@bowerbird-poc/ui` | shadcn/ui components + Tailwind v4 global styles. Single source of truth for design tokens. |
| `@bowerbird-poc/shared` | Types, constants, small utility functions shared across apps. |
| `@bowerbird-poc/eslint-config` | Flat-config ESLint presets (`base`, `next`, `react-internal`). |
| `@bowerbird-poc/stylelint-config` | Stylelint config for Liquid + CSS. |
| `@bowerbird-poc/typescript-config` | Base `tsconfig.json` extended by each app. |

The shadcn/ui CLI is configured so `pnpm dlx shadcn@latest add <component>` from inside any app writes to `packages/ui` — components are shared by default.

## Why these particular boundaries

Three observations drove the structure:

1. **The Next.js app is the customer's primary surface.** It owns search, browse, and account UX. We didn't want to be limited by Liquid for any of it.
2. **Checkout has to be Shopify.** PCI scope, payment methods, tax — none of that is worth rebuilding. So the redirect dance was the lightest way to keep checkout on Shopify while owning the rest.
3. **Some workflows are Shopify-admin-native.** Donations, draft orders, checkout customisation — these live closer to the platform than to the headless app. Hence the dedicated Shopify apps rather than building everything into Next.js.
