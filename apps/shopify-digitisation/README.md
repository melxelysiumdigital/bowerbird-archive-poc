# Shopify Digitisation Requests App

Dedicated Shopify app providing Admin API access for managing digitisation requests (draft orders) linked to customer accounts. Used by the web app (`apps/web`).

## Scopes

`read_customers`, `write_customers`, `read_draft_orders`, `write_draft_orders`, `read_orders`

## Setup

### 1. Link the app

```bash
cd apps/shopify-digitisation
pnpm shopify app config link
```

This creates a `.toml` with the real `client_id`. Copy that ID into `scripts/get-admin-token.js`.

### 2. Deploy to register scopes

```bash
pnpm deploy
```

### 3. Enable protected customer data

This **cannot** be done via the TOML — it must be configured manually in the Partner Dashboard:

1. Go to [Partner Dashboard](https://partners.shopify.com) > Apps > bowerbird-archive-digitisation
2. Click **Settings** in the left sidebar
3. Scroll down and find the **Protected customer data** section (under "Data protection")
4. **Step 1 — Reason:** Select **Store management**
5. **Step 2 — Data fields:** Check both **Customer name** and **Customer email** (required for `firstName`, `lastName`, and `email` fields in the Admin API)
6. Save

For dev stores, access is granted immediately without review.

### 4. Get an Admin API token

```bash
SHOPIFY_CLIENT_SECRET=<from Partner Dashboard> pnpm get-admin-token
```

The script runs a local OAuth server on port 3457. Open the printed URL in your browser and approve the app. The token is saved to `.shopify-admin-token`.

### 5. Configure the web app

Copy the token to `apps/web/.env.local`:

```
SHOPIFY_ADMIN_ACCESS_TOKEN=<token from step 4>
```

## Notes

- The Admin API token is **permanent** (offline access) — it doesn't expire or need refreshing
- The token is only invalidated if the app is uninstalled, scopes change, or the OAuth flow is re-run
