---
sidebar_position: 2
title: Why a monorepo
---

# Why a monorepo

**Short answer**: five apps share a design system, four of them share Shopify domain types, and we wanted one PR to touch a component and have every consumer pick it up.

## What we picked

- **pnpm workspaces** for package management
- **Turborepo** for task orchestration and caching

## Why pnpm

- Workspace-aware out of the box — `pnpm-workspace.yaml` is enough
- Cheap installs across the graph (content-addressed store, hard links)
- Strict — no phantom deps, so `apps/web` can't accidentally import from `apps/shopify-donations`
- `packageManager` pin in root `package.json` means Corepack auto-installs the right version

## Why Turborepo

- Task graph with `dependsOn` — `build` in `apps/web` waits for `^build` in `packages/ui`
- Local cache makes repeated `pnpm build` near-instant
- The `globalEnv` field is honest about which env vars are part of the cache key, so we don't get stale builds when secrets change

## What we considered and rejected

| Option | Why we passed |
| --- | --- |
| Separate repos per app | Component sharing becomes "publish a private npm package" — too much ceremony for a POC, and breaks atomic refactors |
| Nx | Heavier, more opinionated, more moving parts than the POC needed |
| Lerna | Largely subsumed by pnpm + Turbo for our use case |
| npm workspaces | Workspace support is fine, but we wanted pnpm's stricter import boundaries |

## What the monorepo bought us, concretely

- **One Tailwind v4 source of truth** at `packages/ui/src/styles/globals.css`. Every app `@import`s it and uses the same tokens.
- **One shadcn/ui install**. `pnpm dlx shadcn@latest add dialog` from any app writes to `packages/ui/src/components/dialog.tsx`.
- **One TypeScript base config** — base, next, react-internal. Apps extend one of three configs instead of rolling their own.
- **One ESLint flat config** with shared rule sets. Single source for "what's a lint error here".
- **`@bowerbird-poc/shared` types**. The web app and the Shopify thank-you extension agree on the shape of cart attributes because they import the same type.

## Cost we accepted

- The `pnpm install` graph includes everything, so cold installs aren't tiny.
- Onboarding requires understanding the workspace, Turbo, and at least one of the Shopify CLIs at the same time.
- Turbo cache invalidation occasionally surprises you (see [dev workflow](../getting-started/dev-workflow#turbo-cache)).

For a POC this is the right trade — the friction of separate repos would have outweighed the friction of a monorepo. Whether it's the right trade post-POC depends on the production team structure.
