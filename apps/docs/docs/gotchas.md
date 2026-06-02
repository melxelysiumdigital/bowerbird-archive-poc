---
sidebar_position: 99
title: Gotchas
---

# Gotchas

The things that have wasted hours. Read this whole page before you change anything load-bearing.

## Shopify app embed resets after deploy

**Symptom**: After running `pnpm deploy` in `apps/shopify-thank-you` (or any Shopify app with theme app extensions), the headless redirect stops working. Customer clicks checkout, lands on the Shopify storefront homepage with `?headless_origin=...&checkout_url=...` in the URL, and just sits there.

**Cause**: Deploying a Shopify app can reset the app-embed toggle in the theme customizer.

**Fix**: After every deploy, manually re-enable the embed:

1. **Online Store → Themes → Customize**
2. **App embeds** (puzzle piece icon)
3. Toggle **Headless Redirect** to **on**
4. **Save**

This needs to be done **on every theme**, including dev copies of the theme.

## App embeds are per-theme, not per-store

If a merchant duplicates the theme to make customisations safely, the new copy starts with the embed **off**. They must enable it on the new theme too. Easy to miss because everything looks fine on the original theme.

## The password page bypasses everything

Dev stores typically have a password page enabled. That page is rendered **before** any theme code, any app embeds, or any extensions. So:

- The `headless-redirect` script doesn't run
- Cookies for the redirect never get set
- Customers who arrive with `?headless_origin=...` get stuck on the password page

**Workarounds**:

- Enter the password manually in the browser once per session (it's cookied for that session)
- Disable the password page for testing (Online Store → Preferences)
- For automated tests, use Storefront API auth or a long-lived storefront token

## `config/settings_data.json` is owned by the admin

It's listed in the deploy workflow as **excluded entirely**. Touching it in the repo and pushing will:

- **Not** affect production (the workflow skips it)
- Mislead you into thinking the file controls anything

Theme settings (colours, fonts, layout choices) are managed exclusively through the Shopify admin theme editor. The repo's job is to ship the schema, not the data.

## Templates aren't re-deployed once they exist

Per the [non-destructive deploy](./architecture/non-destructive-deploy) strategy, templates are copied on **first** deploy and never overwritten. If you change `templates/index.json` and deploy, **your change won't roll out**. You have two options:

1. Coordinate with the merchant to re-apply the template
2. Ship a new template under a different name and have the merchant switch

## Liquid filters don't work inside `{% render %}` parameters

This will silently produce wrong output:

```liquid
{% render 'react-mount', props_script_id: '#props-' | append: section.id %}
```

The `| append:` is treated as part of the literal string. Always pre-assign:

```liquid
{%- assign props_id = '#props-' | append: section.id -%}
{% render 'react-mount', props_script_id: props_id %}
```

## Vite dev mode left on in production

`Theme Settings → Developer → Vite Dev Mode` is great in dev. If it gets toggled on in production, the theme tries to load JS from `localhost:5173` and the page breaks for all customers.

**Always verify the toggle is off on the live theme** before publishing. There is no automated check for this.

## Tailwind utilities silently lose to Dawn

If a Tailwind class on a React component is being ignored, the cause is almost always the **layered-vs-unlayered cascade rule**. See [Tailwind cascade](./architecture/tailwind-cascade). Dawn's `base.css` must be wrapped in `@layer base`, which it is in `src/entries/react.css` — if you fork or replace that file, this is the bug that bites you.

## Protected customer data has to be enabled in the Partner Dashboard

The `apps/shopify-digitisation` Admin API calls fail with a confusing permission error if you skip the Partner Dashboard step for protected customer data (customer name + email). It cannot be done via the TOML. See [shopify-digitisation: setup](./apps/shopify-digitisation#setup).

## The Shopify CLI rewrites `SHOPIFY_APP_URL` on every dev run

Expected behaviour — the Cloudflare tunnel URL changes per session. If you've copied the value somewhere outside the `.env`, you'll be looking at stale data.

## Turbo cache can hand you stale builds

If you change an env var that affects build output and it's **not** in `turbo.json`'s `globalEnv` list, Turbo's cache key won't change and you'll get the old build. Symptoms: the app behaves as if you never set the env var.

**Fixes**:

- Add the env var to `globalEnv` in `turbo.json`
- Or force-bust the cache: `pnpm turbo run build --force`

## Shopify CLI defer/await streaming

The Shopify CLI uses a [Cloudflare tunnel](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options) by default. Cloudflare tunnels **wait for the full response stream** before sending it, which breaks React Router's `<Await>` streaming pattern. Only an issue in local dev — production traffic is unaffected.

**This POC's workaround**: we use ngrok instead. See [Prerequisites → ngrok](./getting-started/prerequisites#ngrok-specifically) and [Dev workflow → ngrok](./getting-started/dev-workflow#ngrok-instead-of-cloudflare-tunnel). [Localhost-based development](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options#localhost-based-development) is another option if you don't want a tunnel at all.

## "nbf claim timestamp check failed"

JWT validation error from a Shopify embedded app. Usually means your machine clock is out of sync with the Shopify server clock. Enable "Set time and date automatically" in macOS Date & Time settings.

## React component chunks 404 on the storefront

If the Vite bundle for the theme is producing `chunk-*.js` files and Liquid is referencing them, they'll 404 because Shopify's CDN can't resolve dynamic chunk paths.

**Fix**: keep all `registry.ts` imports as **eager** (static `import`), never `React.lazy`. The bundle should be a single file.

## Things that look broken but aren't

- **Donations app's `admin` is undefined on a CLI-triggered webhook.** Expected — the CLI uses a non-existent shop. Real webhooks from a real shop have `admin` populated.
- **First `pnpm dev` is slow.** Turbo has no cache; subsequent runs are fast.
- **`pnpm build` succeeds but the Shopify theme is missing JS.** Vite outputs are gitignored — they need to be present in `theme/assets/` for the push. The CI workflow handles this; locally you must `pnpm build` before `pnpm theme:push`.
