# Shopify Theme — Bowerbird Archive

Shopify Liquid theme based on [Dawn](https://github.com/Shopify/dawn) with React component support via Vite.

## Prerequisites

- Node.js 25+
- pnpm 9+
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

## Install

From the monorepo root:

```sh
pnpm install
```

## Development

### Connect to a store

The Shopify CLI uses the last authenticated store by default. To target a specific store:

```sh
pnpm theme:dev --store=your-store.myshopify.com
```

This will authenticate and save the store for subsequent runs.

### Run dev servers

Two terminals:

```sh
# Terminal 1 — Vite build watch + HMR server (localhost:5173)
pnpm dev

# Terminal 2 — Shopify theme preview
pnpm theme:dev
```

### Enable Dev Mode

In the Shopify theme editor: **Theme Settings > Developer > Vite Dev Mode** — check the box. This loads React assets from the local Vite dev server instead of bundled files.

## Build

```sh
pnpm build
```

Outputs to `theme/assets/`:

| File              | Description                                   |
| ----------------- | --------------------------------------------- |
| `react.bundle.js` | React entry point (components + mount system) |
| `react.min.css`   | Tailwind CSS utilities for React components   |
| `theme.bundle.js` | Theme-specific JS entry                       |
| `theme.min.css`   | Theme-specific CSS                            |
| `chunk-*.js`      | Code-split chunks (if any)                    |

### Build assets are gitignored

All Vite-generated files (`*.bundle.js`, `*.min.css`, `chunk-*.js`) are in `.gitignore`. They are **not committed** — CI builds them fresh on every deploy. See [Deployment](#deployment) below.

Dawn's static assets (`base.css`, `component-*.css`, Dawn JS files, SVGs) **are** tracked in git since they're part of the base theme.

## Deployment

The GitHub Actions workflow at `.github/workflows/deploy.yml` handles deployment:

1. Installs dependencies and builds the full monorepo (`pnpm build`)
2. Copies only `theme/` files to a clean deployment branch, respecting `.shopifyignore`
3. Pushes to `deploy/test` (on merge to main) or `deploy/prod` (manual workflow dispatch)

The `.shopifyignore` file excludes source code, build tooling, and config files from the deployment branch — only Shopify-ready theme files are included.

To deploy manually:

```sh
pnpm build
pnpm theme:push
```

## Adding a New React Component

1. Create the component in `packages/ui/src/components/my-component.tsx` with a named export
2. Register it in `src/react/registry.ts` with an eager import:

   ```ts
   import { MyComponent } from '@bowerbird-poc/ui/components/my-component';

   export const registry: Record<string, React.ComponentType<any>> = {
     // ...existing components
     MyComponent,
   };
   ```

3. Create a Liquid section in `theme/sections/` that uses the `react-mount` snippet:

   ```liquid
   <script id="my-props-{{ section.id }}" type="application/json">
     { "title": {{ section.settings.title | json }} }
   </script>

   {%- assign my_props_id = '#my-props-' | append: section.id -%}
   {% render 'react-mount', component: 'MyComponent', props_script_id: my_props_id %}
   ```

> **Note:** Liquid filters don't work inline in `{% render %}` tag parameters. Always pre-compute with `{% assign %}`.

## Architecture

### React mount system

- `data-react-component` attributes in the DOM are scanned and mounted with `createRoot`
- Props passed via `data-react-props` (inline JSON) or `data-react-props-from` (CSS selector to a `<script type="application/json">` tag)
- Components use eager imports (not `React.lazy`) to produce a single bundle without code-split chunks — Shopify's CDN can't resolve dynamic chunk paths
- Bundle is loaded as a classic `<script defer>` tag (not `type="module"`)
- `document.readyState` check ensures mounting works whether the script runs before or after DOMContentLoaded

### Vite dev vs production

- **Dev mode**: `snippets/vite-tag.liquid` loads from Vite HMR server (`localhost:5173`) — full hot reload
- **Prod mode**: Pre-built bundle loaded as a deferred script from theme assets

### Editor support

Listens for Shopify theme editor events:

- `shopify:section:load/unload` — mount/unmount components when sections are added/removed
- `shopify:block:select/deselect` — mount/unmount components when blocks are selected

### CSS: Tailwind v4 + Dawn

Dawn's `base.css` is wrapped in `@layer base { ... }` so that Tailwind v4 utility classes (which live in `@layer utilities`) correctly override Dawn's default styles. Without this, Dawn's unlayered CSS would always beat Tailwind's layered utilities per the CSS cascade spec.

The Tailwind CSS entry point (`src/entries/react.css`) imports the shared design tokens from `@bowerbird-poc/ui/globals.css` and uses a `@source` directive to scan the UI package's components for class usage:

```css
@import '@bowerbird-poc/ui/globals.css';
@source '../../node_modules/@bowerbird-poc/ui/src';
```

## File Structure

```
apps/shopify-theme/
├── src/
│   ├── entries/
│   │   ├── react.tsx         # React entry (mounts components)
│   │   ├── react.css         # Tailwind CSS entry
│   │   └── theme.ts          # Theme JS entry
│   └── react/
│       ├── mount.ts          # DOM scanning + createRoot logic
│       └── registry.ts       # Component name → import mapping
├── theme/                    # Shopify theme directory (deployed)
│   ├── assets/               # Dawn assets + Vite build output
│   ├── config/               # Settings schema + data
│   ├── layout/               # theme.liquid (Dawn + vite-tag)
│   ├── locales/              # Dawn locale files
│   ├── sections/             # Dawn sections + react-hero, react-product-card
│   ├── snippets/             # Dawn snippets + react-mount, vite-tag
│   └── templates/            # Dawn templates + custom index.json
├── vite.config.ts
├── .shopifyignore            # Excludes src/tooling from deploy
└── package.json
```
