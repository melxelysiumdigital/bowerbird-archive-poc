---
sidebar_position: 1
title: Overview
slug: /
---

# Bowerbird Archive POC

Internal wiki for the **Bowerbird Archive proof of concept** — a monorepo containing a Next.js headless storefront, three Shopify embedded apps, and a Shopify Liquid theme based on Dawn with React component support.

The code in this repo is **not production-ready**. It is a vertical-slice prototype intended to validate the headless storefront + Shopify checkout approach and a few specific integrations. See [POC status](./poc-status) for the explicit list of things you cannot rely on yet.

## What's in the box

| Workspace                             | Path                        | Purpose                                                               |
| ------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `@bowerbird-poc/web`                  | `apps/web`                  | Next.js headless storefront (port 3000)                               |
| `@bowerbird-poc/shopify-app`          | `apps/shopify-donations`    | Embedded app — donations (port 3001)                                  |
| `@bowerbird-poc/shopify-digitisation` | `apps/shopify-digitisation` | Embedded app — Admin API for digitisation requests                    |
| `@bowerbird-poc/shopify-thank-you`    | `apps/shopify-thank-you`    | Theme app extension + checkout UI extension for the headless redirect |
| `@bowerbird-poc/shopify-theme`        | `apps/shopify-theme`        | Dawn-based Liquid theme with Vite-built React components              |
| `@bowerbird-poc/ui`                   | `packages/ui`               | Shared shadcn/ui component library                                    |
| `@bowerbird-poc/shared`               | `packages/shared`           | Shared types, constants, utilities                                    |

## Reading order

1. **[POC status](./poc-status)** — what this is, what it isn't, what's missing
2. **[Getting Started](./getting-started/prerequisites)** — prereqs, install, dev workflow
3. **[Architecture](./architecture/overview)** — the _why_ behind the structure
4. **[Apps](./apps/web)** — per-app deep dives
5. **[Gotchas](./gotchas)** — read this before deploying anything anywhere

## The headless flow at a glance

```
┌─────────────────┐   browse + add to cart   ┌──────────────────┐
│  Next.js (web)  │ ───────────────────────► │ unified cart UI  │
│  apps/web       │                          │ (digitised +     │
└─────────────────┘                          │  request items)  │
        │                                    └──────────────────┘
        │ redirect with ?headless_origin=...&checkout_url=...
        ▼
┌──────────────────────────────────────────────────────────┐
│  Shopify storefront (Dawn theme + headless-redirect)     │
│  - App embed reads headless_origin, forwards to checkout │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────┐
│  Shopify checkout                                        │
│  - thank-you-redirect extension renders                  │
│    "Continue to Your Order" button on success            │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│  Next.js (web)  │ ◄── customer returns to /account/orders
└─────────────────┘
```

The headless storefront never owns checkout — Shopify does. The `shopify-thank-you` app is what makes the round-trip feel seamless.
