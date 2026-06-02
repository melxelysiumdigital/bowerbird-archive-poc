---
sidebar_position: 2
title: POC Status — Read Me First
---

# POC Status — Read Me First

:::danger DO NOT DEPLOY TO PRODUCTION

This repository is a **proof of concept**. It exists to demonstrate that a Next.js headless storefront can co-exist with Shopify checkout for the Bowerbird Archive use case, and to prototype the integrations with RefTracker, TechOne, and Azure Search. **It is not the finished product.**

:::

## What "POC" means here

A POC is code written to answer questions, not code written to be operated. Concretely, the following things are deliberately incomplete, mocked, or absent:

### 🟥 Mocked / stubbed integrations

- **Azure Search** is mocked (`apps/web` reads from a local JSON fixture). The real Search index is not connected.
- **RefTracker and TechOne** integrations are mocked via Shopify Flow scripts that log payloads — no actual write-back happens.
- **Search results, archive metadata, digitisation pricing** all come from fixtures, not live data sources.

### 🟥 Auth & access control

- The web app uses Auth0 for customer login but **does not enforce role-based access** anywhere serious.
- The Shopify Admin API token used by `apps/web` is a long-lived **offline access token** stored in `.env.local`. There is no rotation, no secrets manager, and no audit trail.
- B2B membership tiers are derived from a customer tag rather than from a real membership system.

### 🟥 Data & persistence

- The donations app uses **SQLite via Prisma** for session storage. That works for single-instance hosting but is not how a production deployment would run.
- Cart state lives in `localStorage` and Shopify cart attributes — there is no server-side session store or recovery flow.
- No migrations strategy for moving real customer data into the new model.

### 🟥 Operations

- **No staging environment.** The repo has a `deploy/shopify-test` branch but it points at a dev store, not a true staging environment.
- **No monitoring, logging, or alerting.** A request failing in production would be invisible.
- **No CI for the web app.** GitHub Actions only builds and deploys the Shopify theme.
- **Test coverage is sparse.** Some Storybook visual regression scaffolding exists; there is no integration test suite for the checkout flow end-to-end.

### 🟥 Security

- **Not pen-tested.** Not security-reviewed beyond Shopify's own checkout protections.
- The `headless_origin` redirect chain accepts any URL passed in a query param. A production version would need a strict allowlist to prevent open-redirect abuse.
- App credentials live in plain `.env.local` files.

### 🟧 Performance

- The Next.js app is unoptimised — no image CDN config, no bundle-size budgets, no caching strategy.
- The Shopify theme ships Dawn's full asset set plus our Vite bundle. No dead-code elimination beyond what Vite does by default.

## What the POC *has* successfully shown

These pieces work and have been demoed:

- ✅ Headless redirect to Shopify checkout and back, with cart attributes preserved
- ✅ Unified cart for both digitised products and digitisation requests (one Shopify checkout, two fulfilment paths)
- ✅ Theme app extension as the redirect mechanism (no theme-file edits needed on each deploy)
- ✅ Dawn theme with React components mounted via Vite, with HMR in dev
- ✅ Shopify Functions for donation upsell at checkout
- ✅ Non-destructive deploy that preserves admin-customized templates

## Before any production rollout, you must

1. Replace every mocked integration with the real service.
2. Stand up a real staging environment that mirrors production Shopify config.
3. Add server-side validation for every redirect URL.
4. Move secrets out of `.env.local` into a managed secret store.
5. Add monitoring + alerting on the headless ↔ checkout boundary.
6. Run a security review focused on the redirect chain and the Admin API token usage.
7. Replace the SQLite session store with a managed database.
8. Write integration tests covering the full checkout round-trip.
9. Audit the Shopify app embeds and reinstall flow — see [Gotchas](./gotchas).

If you can't tick off all nine, **do not promote this to production**.
