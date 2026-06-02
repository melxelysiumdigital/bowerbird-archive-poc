---
sidebar_position: 1
title: Overview
---

# `apps/shopify-theme` — Dawn + Vite theme

A Shopify Liquid theme based on [Dawn](https://github.com/Shopify/dawn) with React component support via Vite. See [Architecture: Dawn + Vite](../../architecture/dawn-plus-vite) for the high-level *why*. The pages in this section cover the *how*.

## What's interesting in here

| Page | What it covers |
| --- | --- |
| [React mount system](./react-mount-system) | `mount.ts`, `registry.ts`, `react-mount.liquid`, theme editor events |
| [Section walkthrough](./section-walkthrough) | Reading `react-hero.liquid` line by line, then writing your own |
| [Vite pipeline](./vite-pipeline) | `vite.config.ts`, `vite-tag.liquid`, dev/prod modes, asset naming |

## Run it

Two terminals from `apps/shopify-theme/`:

```bash
# Terminal 1 — Vite watches and rebuilds JS/CSS into theme/assets/
pnpm dev

# Terminal 2 — Shopify CLI serves the theme to a connected store
pnpm theme:dev
```

To target a specific store the first time:

```bash
pnpm theme:dev --store=your-store.myshopify.com
```

In the Shopify theme editor: **Theme Settings → Developer → Vite Dev Mode** — turn it on so the theme loads React assets from `localhost:5173`.

## File structure

```
apps/shopify-theme/
├── src/                          # NOT deployed — build sources
│   ├── entries/
│   │   ├── react.tsx             # React entry point (Vite bundles this)
│   │   ├── react.css             # Tailwind + UI globals
│   │   ├── theme.ts              # Non-React theme JS entry
│   │   └── theme.css             # Theme-specific CSS
│   └── react/
│       ├── mount.ts              # DOM scanner + createRoot logic
│       └── registry.ts           # Component name → eager import
│
├── theme/                        # Deployed to Shopify
│   ├── assets/                   # Dawn static assets + Vite build outputs (gitignored)
│   ├── config/
│   │   ├── settings_schema.json  # Theme settings shape (tracked)
│   │   └── settings_data.json    # Theme settings values (admin-owned, not deployed)
│   ├── layout/
│   │   ├── theme.liquid          # Main wrapper — includes {% render 'vite-tag' %}
│   │   └── password.liquid
│   ├── locales/                  # Dawn's localisation files
│   ├── sections/
│   │   ├── react-hero.liquid     # Example React-backed section
│   │   ├── react-product-card.liquid
│   │   └── ...dawn-sections...
│   ├── snippets/
│   │   ├── react-mount.liquid    # Generic React mount point
│   │   ├── vite-tag.liquid       # Dev/prod asset loader
│   │   └── ...dawn-snippets...
│   └── templates/
│
├── vite.config.ts
├── .shopifyignore                # Excludes src/, tooling, etc. from deploy
├── package.json
└── tsconfig.json
```

The split between `src/` and `theme/` matters: only `theme/` is shipped to Shopify (the `.shopifyignore` file is configured to keep `src/` and build tooling out). `src/` is purely build-time — it produces files inside `theme/assets/`.

## What goes where mental model

- **`packages/ui/src/components/`** — the actual React components (shared with `apps/web`)
- **`src/react/registry.ts`** — flat map of `Name → Component` so Liquid can reference them by string
- **`src/entries/react.tsx`** — Vite entry, glues `mount.ts` to `registry.ts`, listens to theme editor events
- **`theme/snippets/react-mount.liquid`** — the universal "drop a React component here" tag
- **`theme/sections/<name>.liquid`** — a Shopify section that uses `react-mount` and exposes settings to merchants via `{% schema %}`

The flow each page render:

```
Liquid section
  ↓ writes <div data-react-component="Name"> + <script type="application/json"> props
Browser loads react.bundle.js
  ↓ DOMContentLoaded
mount.ts scans for [data-react-component]
  ↓ looks up in registry.ts, parses props JSON
createRoot(el).render(<Name {...props} />)
```
