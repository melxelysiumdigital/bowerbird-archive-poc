---
sidebar_position: 5
title: shopify-digitisation
---

# `apps/shopify-digitisation` — Admin API for draft orders

Tiny Shopify app whose only purpose is to register the [Admin API](https://shopify.dev/docs/api/admin-graphql) scopes the web app needs for **digitisation request draft orders**.

- **Workspace**: `@bowerbird-poc/shopify-digitisation`

## What this app *is* (and isn't)

It is **only** a vehicle for OAuth + scope registration. There is no UI, no embedded admin surface, no extensions. The actual API calls are made by `apps/web` using the offline access token this app's OAuth flow produces.

## Scopes

```
read_customers
write_customers
read_draft_orders
write_draft_orders
read_orders
```

## Setup

```bash
cd apps/shopify-digitisation

# 1. Link the app to a Partner account
pnpm shopify app config link

# 2. Deploy to register the scopes
pnpm deploy

# 3. Enable protected customer data (manual — see below)

# 4. Run the OAuth dance to get an Admin API token
SHOPIFY_CLIENT_SECRET=<from Partner Dashboard> pnpm get-admin-token

# 5. Copy the token to apps/web/.env.local as SHOPIFY_ADMIN_ACCESS_TOKEN
```

The `get-admin-token` script runs a local OAuth server on port 3457. ngrok isn't required for this script specifically (the OAuth callback is local), but it **is** required if you ever run `pnpm dev` on this app.

## Protected customer data — manual step

This step **cannot** be configured via the TOML. You must do it in the Partner Dashboard — see Shopify's [protected customer data docs](https://shopify.dev/docs/apps/launch/protected-customer-data):

1. Go to [Partner Dashboard](https://partners.shopify.com) → Apps → `bowerbird-archive-digitisation`
2. Click **Settings** in the left sidebar
3. Find **Protected customer data** under "Data protection"
4. **Step 1 — Reason**: select **Store management**
5. **Step 2 — Data fields**: check **Customer name** *and* **Customer email** (both required for `firstName`, `lastName`, and `email` fields in the Admin API)
6. Save

For dev stores this is granted immediately. For production stores it goes through review.

## About the token

- It is an **offline access token** — does not expire, no refresh flow
- It is invalidated only if: the app is uninstalled, scopes change, or the OAuth flow is re-run
- Treat it like a password — `apps/web/.env.local` is the only place it should live in the POC, and a managed secret store is the only place it should live in production

## Where it's used in the web app

`apps/web/lib/shopify/admin.ts` (and friends) use this token to:

- Create [draft orders](https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate) when a customer requests digitisation
- Read order/customer state for the account pages
- Read [customer tags](https://shopify.dev/docs/api/admin-graphql/latest/objects/Customer#field-Customer.fields.tags) for membership status

## External docs to read

- [Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql)
- [Authentication & access tokens](https://shopify.dev/docs/apps/build/authentication-authorization)
- [Access scopes reference](https://shopify.dev/docs/api/usage/access-scopes)
- [Protected customer data](https://shopify.dev/docs/apps/launch/protected-customer-data)
- [Draft Order API](https://shopify.dev/docs/api/admin-graphql/latest/objects/DraftOrder)
