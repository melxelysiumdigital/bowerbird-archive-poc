---
sidebar_position: 6
title: Installed Shopify apps
---

# Installed Shopify apps

In addition to the custom apps in `apps/shopify-*/`, the dev store has these third-party apps installed from the Shopify App Store. New stores need them re-installed manually — they're not part of `pnpm deploy`.

## Install procedure (applies to all)

For every app below:

1. Visit the App Store link
2. Click **Install**
3. Pick the destination store from the dropdown
4. Review the scopes Shopify shows you and approve
5. Open the app from the Shopify admin sidebar and follow its first-run wizard (if any)

That's it. The apps below are Shopify-published or App Store apps — none of them need ngrok, OAuth scripts, or `.env` configuration on our side.

## What's installed

### Shopify Flow

- **App Store**: [apps.shopify.com/flow](https://apps.shopify.com/flow)
- **Publisher**: Shopify (first-party, free)
- **What it does**: workflow automation — trigger actions in response to store events (order placed, customer tag added, draft order completed, etc.)
- **Why we use it**: the POC uses Flow workflows as the **mocked integration layer** for RefTracker and TechOne. When the real integrations get built, Flow's HTTP-request action is a fast way to push payloads to a logging endpoint without writing a webhook handler.
- **Caveats**:
  - Workflows can be exported as `.flow` files (zipped). The current snapshot lives at `apps/export/workflows_export_*.zip` — see [Seeding Flow workflows](./seeding-workflows) for what's in it and how to re-import.
  - See [POC status](../poc-status#-mocked--stubbed-integrations) — these workflows are mocks; do not rely on them in production.

### Flow Trigger Extensions

- **App Store**: [apps.shopify.com/flow-trigger-extensions](https://apps.shopify.com/flow-trigger-extensions)
- **Publisher**: Shopify (first-party, free)
- **What it does**: lets other Shopify apps expose **custom triggers** that Flow can listen to
- **Why we use it**: required by Shopify Subscriptions (below) so subscription events (e.g. subscription paused, subscription billed) can fire Flow workflows
- **Caveats**: this is plumbing — install it before installing apps that depend on it, or you'll re-install both

### Shopify Subscriptions

- **App Store**: [apps.shopify.com/shopify-subscriptions](https://apps.shopify.com/shopify-subscriptions)
- **Publisher**: Shopify (first-party, free)
- **What it does**: turns products into subscription products with selling plans (weekly / monthly / annual billing)
- **Why we use it**: scaffolded for the **archive membership** flow — a yearly membership product that auto-renews. Currently membership in the POC is derived from a customer tag, not a real subscription (see [POC status](../poc-status#-mocked--stubbed-integrations)), but the app is installed so we can wire up real subscriptions later without re-architecting.
- **Caveats**:
  - Subscriptions require [Shopify Payments](https://help.shopify.com/en/manual/payments/shopify-payments) (or a compatible payment provider) on the destination store
  - Selling plans attach to specific products — re-importing products from `apps/export/products_export.csv` does **not** automatically re-attach selling plans
  - Test with the Shopify [Bogus Gateway](https://help.shopify.com/en/manual/checkout-settings/test-orders) on dev stores

### DonateMate

- **App Store**: [apps.shopify.com/donatemate](https://apps.shopify.com/donatemate)
- **Publisher**: third-party (paid tiers + free)
- **What it does**: donation widgets and round-up-at-checkout for cause-based stores
- **Why we use it**: comparison point against our **custom** `apps/shopify-donations` app, which uses Shopify Functions for checkout-side upsell. DonateMate handles the product-page and post-purchase donation surfaces that our Function doesn't.
- **Caveats**:
  - Has its own admin UI and pricing tiers — check the active plan in the DonateMate dashboard before relying on a paid feature
  - The two donation systems (DonateMate + our custom one) **can interfere with each other** if both are active at checkout — pick one per environment and disable the other to avoid double-prompting
  - Settings live entirely inside the DonateMate app — there is no repo file representing its config

## Reinstalling on a new store

If you're standing up a fresh dev/staging store, install in this order to avoid dependency issues:

1. **Shopify Flow** (foundation)
2. **Flow Trigger Extensions** (enables custom triggers)
3. **Shopify Subscriptions** (uses Flow triggers)
4. **DonateMate** (independent of the above)
5. Then deploy our custom apps: `apps/shopify-donations`, `apps/shopify-thank-you`, `apps/shopify-digitisation` — see each app's page under [Apps](../apps/web)

After all apps are installed:

- Re-enable the **Headless Redirect** app embed in the theme customizer (see [Gotchas](../gotchas#shopify-app-embed-resets-after-deploy))
- Re-approve **protected customer data** for `bowerbird-archive-digitisation` (see [shopify-digitisation setup](../apps/shopify-digitisation#protected-customer-data--manual-step))
- Re-import products from `apps/export/products_export.csv` (see [Seeding products](./seeding-products))
- Re-import Flow workflows from `apps/export/workflows_export_*.zip` (see [Seeding Flow workflows](./seeding-workflows))

## Related reading

- [Shopify Flow docs](https://help.shopify.com/en/manual/shopify-flow)
- [Shopify Subscriptions docs](https://help.shopify.com/en/manual/products/purchase-options/subscriptions)
- [Selling Plans API](https://shopify.dev/docs/api/admin-graphql/latest/objects/SellingPlanGroup)
- [Shopify App Store](https://apps.shopify.com)
