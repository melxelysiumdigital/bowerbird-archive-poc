---
sidebar_position: 4
title: Vite pipeline
---

# Vite pipeline

How `src/entries/*.{ts,tsx,css}` becomes `theme/assets/*.bundle.js` and how the theme loads those files.

## `vite.config.ts`

```ts title="apps/shopify-theme/vite.config.ts"
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    outDir: resolve(__dirname, 'theme/assets'),
    emptyOutDir: false,
    watch: process.argv.includes('--watch')
      ? { exclude: resolve(__dirname, 'theme/assets/**') }
      : null,
    rollupOptions: {
      input: {
        theme: resolve(__dirname, 'src/entries/theme.ts'),
        react: resolve(__dirname, 'src/entries/react.tsx'),
      },
      output: {
        entryFileNames: '[name].bundle.js',
        chunkFileNames: '[name].chunk.js',
        assetFileNames: '[name].min[extname]',
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    cors: true,
    origin: 'http://localhost:5173',
  },
});
```

### Why these specific options

#### `outDir: 'theme/assets'` + `emptyOutDir: false`

Vite writes its output directly into `theme/assets/` so the Shopify CLI sees the bundle as a regular theme asset. `emptyOutDir: false` is **critical** — Dawn ships dozens of static assets (its CSS files, Dawn JS, SVGs) that live in the same directory. Letting Vite empty this folder would nuke Dawn.

#### `watch: { exclude: 'theme/assets/**' }`

Without the exclude, Vite's watcher sees the files it just wrote and triggers another build, which writes again, which triggers another build. Infinite loop. Excluding the output directory from the watcher prevents that.

#### Two entry points

| Entry | Purpose |
| --- | --- |
| `src/entries/react.tsx` | React mount runtime + components |
| `src/entries/theme.ts` | Non-React theme JS (small utilities, scroll behaviour, etc.) |

They're separate so Dawn-only pages don't pay the React bundle cost — `theme.bundle.js` is included from `theme.liquid`, `react.bundle.js` is included via the `vite-tag` snippet only where needed.

In practice the current theme always loads both because `vite-tag` is rendered in the layout. But the split keeps the door open for selective loading later.

#### Stable file names

```ts
entryFileNames: '[name].bundle.js',
chunkFileNames: '[name].chunk.js',
assetFileNames: '[name].min[extname]',
```

No content hashes. Filenames are stable across builds:

| Vite source | Output |
| --- | --- |
| `src/entries/react.tsx` | `theme/assets/react.bundle.js` |
| `src/entries/react.css` (CSS extracted) | `theme/assets/react.min.css` |
| `src/entries/theme.ts` | `theme/assets/theme.bundle.js` |
| `src/entries/theme.css` | `theme/assets/theme.min.css` |
| vendor chunk (React + React DOM) | `theme/assets/vendor.chunk.js` |

Stable names mean Liquid can reference them directly: `{{ 'react.bundle.js' | asset_url }}`.

Shopify's CDN handles cache busting via its own query string params on `asset_url`, so we don't need fingerprinted filenames.

#### The vendor chunk

```ts
manualChunks(id) {
  if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
    return 'vendor';
  }
},
```

React + React DOM are the largest chunk of the bundle. Splitting them into `vendor.chunk.js` means:

- The vendor chunk only changes when React itself updates (rarely)
- The product code in `react.bundle.js` can change frequently without invalidating the vendor cache

That's the **only** chunk split. Everything else — components, helpers, Tailwind — stays in `react.bundle.js`. See [react mount system](./react-mount-system#the-registry--srcreactregistryts) for why we don't split further.

### Server config

```ts
server: {
  port: 5173,
  strictPort: true,
  cors: true,
  origin: 'http://localhost:5173',
},
```

- **`port: 5173, strictPort: true`** — fail if 5173 is in use rather than silently picking another port. `vite-tag.liquid` hard-codes the URL, so the port has to match.
- **`cors: true`** — the Shopify CLI serves the storefront on a different origin (the dev store or a Cloudflare tunnel). Without CORS headers, browsers would block the dev-mode script load.
- **`origin: 'http://localhost:5173'`** — ensures Vite-generated URLs (HMR boundaries, asset URLs) use the right base.

## `vite-tag.liquid` — the runtime switch

```liquid title="theme/snippets/vite-tag.liquid"
{%- comment -%}
  Dual-mode asset loader for Vite.
  In dev mode (settings.vite_dev_mode): loads from Vite HMR server on localhost:5173
  In production: loads bundled JS and CSS from theme assets
{%- endcomment -%}

{%- if settings.vite_dev_mode -%}
  <script type="module" src="http://localhost:5173/@vite/client"></script>
  <script type="module" src="http://localhost:5173/src/entries/react.tsx"></script>
{%- else -%}
  {{ 'react.min.css' | asset_url | stylesheet_tag }}
  <link rel="modulepreload" href="{{ 'vendor.chunk.js' | asset_url }}">
  <script type="module" src="{{ 'react.bundle.js' | asset_url }}"></script>
{%- endif -%}
```

Two modes, one toggle.

### Dev mode (toggle in theme editor → on)

- `@vite/client` connects the page to Vite's HMR WebSocket
- `src/entries/react.tsx` is loaded as a raw module — Vite serves and transforms it on demand
- Edit a component → HMR reloads only what changed, preserving state where possible

The toggle lives in **Theme Settings → Developer → Vite Dev Mode**. It's a checkbox in `settings_schema.json` that defaults to off.

### Production mode (toggle off)

- `react.min.css` is included as a regular stylesheet
- `vendor.chunk.js` is preloaded (so it's cached before `react.bundle.js` tries to import it)
- `react.bundle.js` loads as an ES module

`<link rel="modulepreload">` is important — without it, the browser would parse `react.bundle.js`, discover the `vendor.chunk.js` import, and only then start downloading it. Preloading parallelises that.

### Why `type="module"`

Vite always outputs ES modules for the entry points. The vendor chunk is also ESM. Browsers that support ES modules (everything modern) handle this fine. The theme inherits Shopify's browser support matrix, which long since dropped pre-ESM browsers.

## What's in `theme/assets/` after a build

```
theme/assets/
├── base.css                # Dawn — tracked in git
├── component-*.css         # Dawn — tracked in git
├── *.svg                   # Dawn — tracked in git
├── *.js                    # Dawn — tracked in git
│
├── react.bundle.js         # Vite — gitignored
├── react.min.css           # Vite — gitignored
├── theme.bundle.js         # Vite — gitignored
├── theme.min.css           # Vite — gitignored
└── vendor.chunk.js         # Vite — gitignored
```

The `.gitignore` for the theme assets folder excludes Vite outputs but keeps Dawn's assets:

```
theme/assets/*.bundle.js
theme/assets/*.chunk.js
theme/assets/*.min.css
```

This means a clean checkout has Dawn's assets but no Vite output until you `pnpm build`. The CI deploy workflow builds before pushing, so production always has the bundle.

## Build commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | `vite build --watch` — rebuilds on file change |
| `pnpm build` | `vite build` — single production build |
| `pnpm theme:dev` | `shopify theme dev` — serves the theme to the connected dev store |
| `pnpm theme:push` | `shopify theme push` — uploads the theme |
| `pnpm theme:pull` | `shopify theme pull` — downloads the live theme |

For local dev you want **two terminals**: `pnpm dev` (Vite watch) and `pnpm theme:dev` (Shopify CLI). Vite produces the bundle; the CLI serves the theme that references it.

## `.shopifyignore`

Controls what the Shopify CLI uploads when pushing the theme. The `theme/` directory contains everything that should be deployed, but `apps/shopify-theme/` also contains source code and build tooling. `.shopifyignore` keeps the latter out:

```
# Build tooling
node_modules/
src/
package.json
pnpm-lock.yaml
vite.config.ts
tsconfig.json
tsconfig.*.json

# Linting/formatting
eslint.config.*
.prettierrc
.prettierignore
stylelint.config.*

# Environment
.env
.env.*

# IDE/Editor
.vscode/

# Docs
README.md
```

The deploy workflow at `.github/workflows/deploy.yml` does an additional step: it rsyncs only the `theme/` subdirectory to a deploy branch, so what gets pushed to Shopify is **just** Shopify-ready files. See [Non-destructive deploy](../../architecture/non-destructive-deploy).
