---
sidebar_position: 3
title: Dev workflow
---

# Dev workflow

Each app can be run on its own. Turbo orchestrates the dependency graph so a workspace's own `dev` script doesn't have to know about shared packages.

## Run everything

```bash
pnpm dev
```

Boots every app's dev server in parallel. You'll see overlapping output — use filtered scripts (below) if that's noisy.

## Run a single app

```bash
pnpm dev:web                   # Next.js storefront on http://localhost:3000
pnpm dev:shopify-app           # Donations embedded app on http://localhost:3001
pnpm dev:shopify-theme         # Theme dev (see two-process workflow below)
pnpm dev:shopify-donations     # Same as :shopify-app
pnpm dev:shopify-digitisation  # Digitisation embedded app
pnpm dev:docs                  # This wiki on http://localhost:3030
```

Each of those resolves to a `turbo run dev --filter=@bowerbird-poc/<app>`.

## The Shopify theme is a two-process workflow

The theme is special — Vite needs to watch + rebuild assets into `theme/assets/` while the Shopify CLI separately serves the theme:

```bash
cd apps/shopify-theme

# Terminal 1 — Vite watches and rebuilds JS/CSS into theme/assets/
pnpm dev

# Terminal 2 — Shopify CLI serves the theme to a dev store
pnpm theme:dev
```

In the Shopify theme editor, enable **Theme Settings → Developer → Vite Dev Mode**. This tells the theme to load React assets from `localhost:5173` (Vite's HMR server) instead of the pre-built bundle. You get HMR for React components inside a Liquid page.

When you ship, leave Vite Dev Mode **off** — production should always use the bundled assets.

## The Shopify apps

Shopify embedded apps run through the [Shopify CLI](https://shopify.dev/docs/api/shopify-cli/app), which handles the tunnel, OAuth, and dev store install:

```bash
cd apps/shopify-donations    # or shopify-thank-you, shopify-digitisation
pnpm dev
```

The first run prompts you to pick a Partner org, an app, and a dev store. The CLI saves this so subsequent runs are zero-config.

### ngrok instead of Cloudflare tunnel

The CLI defaults to a Cloudflare tunnel, but **we use ngrok for this POC** — Cloudflare buffers streaming responses, which breaks any React Router route using `Await`. See [Prerequisites → ngrok](./prerequisites#ngrok-specifically).

```bash
ngrok http 3000                                            # terminal 1
pnpm dev --tunnel-url https://abc123.ngrok-free.app:3000   # terminal 2
```

The full list of tunneling options (Cloudflare, ngrok, localhost) is in the [Shopify CLI networking docs](https://shopify.dev/docs/apps/build/cli-for-apps/networking-options).

For the `shopify-thank-you` app specifically, see [Headless checkout](../architecture/headless-checkout) — the dev loop involves enabling app embeds on the dev theme.

## Turbo cache

Turbo caches `build`, `lint`, `check-types`, and friends. If you see weird stale behaviour:

```bash
pnpm turbo run build --force   # Skip the cache for one run
# or
pnpm clean && pnpm install     # Nuke node_modules and .turbo
```

## Formatting and linting on save

Use the repo's Prettier config. The `.prettierrc` and `eslint-config` packages are set up so VS Code's "format on save" Just Works once you install the Prettier and ESLint extensions.

## Next

→ [Environment variables](./env-vars)
