---
sidebar_position: 4
title: Dawn + Vite
---

# Dawn + Vite

The Shopify theme is **Dawn with a Vite bundle bolted on**. This page covers why we didn't write a custom theme from scratch and how Vite slots in.

## Why keep Dawn

Dawn is Shopify's reference theme. It comes with:

- Battle-tested cart, account, product, collection templates
- Localisation files for ~30 languages
- Accessibility patterns merchants and reviewers already expect
- Performance that meets Shopify's "Built for Shopify" standards
- Section schemas the theme editor already knows how to render

For a POC we explicitly **don't** want to rebuild any of that. Dawn handles the boring 80%; our React components handle the parts of the storefront that need to feel like the Bowerbird Archive design system.

## Why we needed Vite at all

Liquid is fine for content rendering. It's not fine for the interactive components we need on certain pages (faceted search UI, hero galleries, product cards that match the Next.js app exactly). Those are React components in `packages/ui`. We need:

- A way to **build** those components into a bundle Shopify can serve
- **HMR in dev** so iterating doesn't require a theme push for each tweak

Vite does both, and outputs predictable filenames into `theme/assets/`.

## The mount system

In `theme/snippets/react-mount.liquid`, sections render markup like:

```liquid
<div
  data-react-component="HeroBanner"
  data-react-props-from="#hero-props-{{ section.id }}"
></div>

<script id="hero-props-{{ section.id }}" type="application/json">
  {{ section.settings | json }}
</script>
```

On page load, `src/react/mount.ts` scans the DOM for `[data-react-component]`, looks up the component in `src/react/registry.ts`, parses the props out of the `<script type="application/json">` tag (or `data-react-props` inline), and calls `createRoot().render()`.

Two non-obvious choices:

1. **Eager imports, not `React.lazy`.** Code-splitting produces dynamic chunk URLs Shopify's CDN can't resolve at runtime. So `registry.ts` imports everything statically and we ship one bundle.
2. **Classic `<script defer>`, not `type="module"`.** Shopify's CDN handles classic scripts more reliably for theme assets, and our bundle doesn't need ESM features at runtime.

## Build outputs

Vite writes stable filenames so Liquid can reference them:

| File | What |
| --- | --- |
| `react.bundle.js` | React entry, mount logic, all components |
| `react.min.css` | Tailwind utilities + scoped styles |
| `theme.bundle.js` | Non-React theme JS entry |
| `theme.min.css` | Theme-specific CSS |

These are **gitignored**. The CI deploy workflow builds them fresh on every push. Dawn's own static assets (`base.css`, `component-*.css`, SVGs) are tracked because they're part of Dawn's base.

## Dev vs prod mode

`snippets/vite-tag.liquid` checks a theme setting (`vite_dev_mode`):

- **On**: loads from `http://localhost:5173` (Vite HMR server)
- **Off**: loads from theme assets

The dev mode toggle lives in **Theme settings → Developer → Vite Dev Mode**. It's defaulted off — production should never read it as on.

## Why not just Hydrogen or a fully custom theme?

- Hydrogen replaces the storefront entirely; it doesn't sit alongside an existing Liquid theme.
- A fully custom Liquid theme would mean rebuilding Dawn's product/collection/cart logic. Not POC scope.
- Static-site approaches (Eleventy, Astro) don't have Shopify's section editor or live preview — merchants couldn't manage the store.

The Dawn + Vite hybrid is the boring, low-risk middle ground.
