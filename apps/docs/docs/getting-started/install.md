---
sidebar_position: 2
title: Install
---

# Install

From the repo root:

```bash
pnpm install
```

That's it. pnpm reads `pnpm-workspace.yaml` and installs every workspace including the Shopify app extensions:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'apps/shopify-donations/extensions/*'
  - 'apps/shopify-thank-you/extensions/*'
  - 'packages/*'
```

## What gets installed where

- **Root** — Prettier, Turborepo, and a small handful of cross-cutting deps (`@auth0/auth0-react`, `@shopify/hydrogen-react`)
- **`apps/web`** — Next.js, React 19, Tailwind v4, Auth0 React SDK
- **`apps/shopify-donations`** — Shopify React Router app template (Polaris, Prisma, App Bridge)
- **`apps/shopify-theme`** — Vite, Shopify CLI for themes, the shared UI package
- **`apps/shopify-thank-you`** — Shopify CLI for apps, theme app + checkout UI extensions
- **`apps/shopify-digitisation`** — Shopify CLI for apps, a small Admin API helper
- **`apps/docs`** — this Docusaurus site
- **`packages/ui`** — shadcn/ui components, Tailwind v4 globals
- **`packages/shared`** — types and helpers

## Build everything once

After install, do a one-time build so Turbo's cache is warm and downstream packages have their built outputs:

```bash
pnpm build
```

This runs `turbo run build` across the graph. Expect it to take 1–2 minutes on a cold cache.

## Verify

```bash
pnpm type-check   # TypeScript across all workspaces
pnpm lint         # ESLint across all workspaces
pnpm format:check # Prettier check
```

If any of these fail in a clean checkout, that's a bug worth filing — open the issue with `td add "..." --p1`.

## Next

→ [Dev workflow](./dev-workflow)
