---
sidebar_position: 3
title: Section walkthrough — react-hero.liquid
---

# Section walkthrough — `react-hero.liquid`

A line-by-line read of the canonical React-backed section. If you understand this file, you can write your own.

## The file in full

```liquid title="theme/sections/react-hero.liquid"
<section id="react-hero-{{ section.id }}" class="shopify-section">
  <script id="react-hero-props-{{ section.id }}" type="application/json">
    {
      "heading": {{ section.settings.heading | json }},
      "subheading": {{ section.settings.subheading | json }},
      {%- if section.settings.image -%}
        "imageUrl": {{ section.settings.image | image_url: width: 1920 | json }},
      {%- endif -%}
      "ctaText": {{ section.settings.cta_text | json }},
      "ctaUrl": {{ section.settings.cta_url | json }},
      "overlayOpacity": {{ section.settings.overlay_opacity | json }},
      "textAlignment": {{ section.settings.text_alignment | json }}
    }
  </script>

  {%- assign hero_props_id = '#react-hero-props-' | append: section.id -%}
  {% render 'react-mount',
    component: 'HeroBanner',
    props_script_id: hero_props_id
  %}
</section>

{% schema %}
{
  "name": "React Hero Banner",
  "tag": "div",
  "class": "react-hero-section",
  "settings": [
    { "type": "text",        "id": "heading",         "label": "Heading", "default": "Welcome to Our Store" },
    { "type": "textarea",    "id": "subheading",      "label": "Subheading", "default": "Discover our curated collection" },
    { "type": "image_picker","id": "image",           "label": "Background Image" },
    { "type": "text",        "id": "cta_text",        "label": "Button Text", "default": "Shop Now" },
    { "type": "url",         "id": "cta_url",         "label": "Button Link" },
    { "type": "range",       "id": "overlay_opacity", "label": "Overlay Opacity", "min": 0, "max": 100, "step": 5, "default": 40, "unit": "%" },
    { "type": "select",      "id": "text_alignment",  "label": "Text Alignment", "options": [
        { "value": "left",   "label": "Left" },
        { "value": "center", "label": "Center" },
        { "value": "right",  "label": "Right" }
      ], "default": "center"
    }
  ],
  "presets": [
    { "name": "React Hero Banner" }
  ]
}
{% endschema %}
```

## Annotated walkthrough

### The outer `<section>`

```liquid
<section id="react-hero-{{ section.id }}" class="shopify-section">
```

- `{{ section.id }}` is unique per instance of the section on the page. Two heroes on one page get different IDs.
- The `id="react-hero-{{ section.id }}"` is mainly there for CSS targeting and for the theme editor to scroll to the right element.
- `class="shopify-section"` is Dawn convention — keeps Dawn's section-scoped styles working.

### The props script

```liquid
<script id="react-hero-props-{{ section.id }}" type="application/json">
  {
    "heading": {{ section.settings.heading | json }},
    "subheading": {{ section.settings.subheading | json }},
    {%- if section.settings.image -%}
      "imageUrl": {{ section.settings.image | image_url: width: 1920 | json }},
    {%- endif -%}
    ...
  }
</script>
```

Three things worth noticing:

1. **`type="application/json"`** — browsers don't execute this script; it's just an inert data container. The mount runtime reads its `textContent` and `JSON.parse`s it.
2. **`| json`** on every value — Liquid's `json` filter escapes the value correctly for JSON: strings get quoted, booleans/numbers don't, `null` is rendered as `null`. Without this you'd be hand-writing escape rules.
3. **`{%- if section.settings.image -%}`** — the conditional key. When the merchant hasn't picked an image, omit the key entirely (rather than emitting `"imageUrl": null`). The React component sees `props.imageUrl === undefined` and falls back to whatever default it has.

The `image_url: width: 1920` filter asks Shopify's CDN for a 1920-wide version. Shopify supports `width`, `height`, `crop`, `format`, etc. — see Shopify's image filter docs. Don't ship raw original images; you'll regret it.

### The render call

```liquid
{%- assign hero_props_id = '#react-hero-props-' | append: section.id -%}
{% render 'react-mount',
  component: 'HeroBanner',
  props_script_id: hero_props_id
%}
```

The `{% assign %}` is **load-bearing**. This will NOT work:

```liquid
{# WRONG — filter is treated as part of the literal #}
{% render 'react-mount',
  component: 'HeroBanner',
  props_script_id: '#react-hero-props-' | append: section.id
%}
```

Liquid does not parse filters inside `{% render %}` parameter values. Always assign first. This is a real footgun — see [Gotchas](../../gotchas#liquid-filters-dont-work-inside--render--parameters).

### The schema

```liquid
{% schema %}
{
  "name": "React Hero Banner",
  "tag": "div",
  "class": "react-hero-section",
  "settings": [...],
  "presets": [...]
}
{% endschema %}
```

Shopify reads this JSON at theme-edit time. Each entry in `settings` becomes a control in the theme editor sidebar — text input, image picker, range slider, etc.

- **`name`** — what the merchant sees in the theme editor section picker
- **`tag`** + **`class`** — Shopify wraps the section output in `<div class="react-hero-section shopify-section">`. The `class` is a CSS hook for theme-wide styling
- **`settings`** — the controls (their `id` maps to `section.settings.<id>` in Liquid above)
- **`presets`** — if a section is in `presets`, the merchant can add it from the "Add section" menu in the editor. Without a preset, the section can only be referenced from a static template

### What gets rendered

After Liquid runs, the browser sees something like:

```html
<section id="react-hero-template--12345__main" class="shopify-section">
  <script id="react-hero-props-template--12345__main" type="application/json">
    {
      "heading": "Welcome to Our Store",
      "subheading": "Discover our curated collection",
      "imageUrl": "https://cdn.shopify.com/.../hero.jpg?width=1920",
      "ctaText": "Shop Now",
      "ctaUrl": "/collections/all",
      "overlayOpacity": 40,
      "textAlignment": "center"
    }
  </script>

  <div
    data-react-component="HeroBanner"
    data-react-props-from="#react-hero-props-template--12345__main"
  ></div>
</section>
```

Then `react.bundle.js` runs, `mount.ts` finds the `data-react-component="HeroBanner"`, looks it up in `registry.ts`, reads the `<script>` JSON, and calls `createRoot(div).render(<HeroBanner {...props} />)`.

## Writing your own section

End-to-end, in three steps.

### 1. Create or pick a React component

Components live in `packages/ui/src/components/`. They are plain React — no Shopify-specific awareness needed.

```tsx title="packages/ui/src/components/announcement-bar.tsx"
import type { ReactNode } from 'react';

export interface AnnouncementBarProps {
  message: string;
  background?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function AnnouncementBar({
  message,
  background = '#000',
  ctaText,
  ctaUrl,
}: AnnouncementBarProps): ReactNode {
  return (
    <div className="px-4 py-2 text-center text-sm text-white" style={{ background }}>
      {message}
      {ctaText && ctaUrl && (
        <a href={ctaUrl} className="ml-2 underline">
          {ctaText}
        </a>
      )}
    </div>
  );
}
```

### 2. Register it

```ts title="src/react/registry.ts"
import { AnnouncementBar } from '@bowerbird-poc/ui/components/announcement-bar';
import { HeroBanner } from '@bowerbird-poc/ui/components/hero-banner';
import { ProductCard } from '@bowerbird-poc/ui/components/product-card';

import type { ComponentRegistry } from './mount';

export const registry: ComponentRegistry = {
  AnnouncementBar,
  HeroBanner,
  ProductCard,
};
```

The key in the registry (`AnnouncementBar`) is what Liquid will reference. Convention: PascalCase matching the component name.

### 3. Create the Liquid section

```liquid title="theme/sections/react-announcement-bar.liquid"
<section id="react-announcement-{{ section.id }}" class="shopify-section">
  <script id="react-announcement-props-{{ section.id }}" type="application/json">
    {
      "message": {{ section.settings.message | json }},
      "background": {{ section.settings.background | json }},
      "ctaText": {{ section.settings.cta_text | json }},
      "ctaUrl": {{ section.settings.cta_url | json }}
    }
  </script>

  {%- assign announcement_props_id = '#react-announcement-props-' | append: section.id -%}
  {% render 'react-mount',
    component: 'AnnouncementBar',
    props_script_id: announcement_props_id
  %}
</section>

{% schema %}
{
  "name": "Announcement Bar",
  "tag": "div",
  "class": "react-announcement-section",
  "settings": [
    { "type": "text",  "id": "message",    "label": "Message", "default": "Free shipping on orders over $50" },
    { "type": "color", "id": "background", "label": "Background", "default": "#000000" },
    { "type": "text",  "id": "cta_text",   "label": "Link text" },
    { "type": "url",   "id": "cta_url",    "label": "Link URL" }
  ],
  "presets": [
    { "name": "Announcement Bar" }
  ]
}
{% endschema %}
```

### 4. Make sure it builds

```bash
cd apps/shopify-theme
pnpm build
```

The new section is now selectable in the theme editor under "Add section → Announcement Bar". The React component renders inline as soon as the page loads.

## Common variations

### Section with blocks

If you want the merchant to add multiple of something inside one section (e.g. multiple product cards), use Shopify blocks. See `react-product-card.liquid` for a working example — it loops `section.blocks` and renders one `react-mount` per block.

### Section that uses inline props

For tiny prop sets you don't need a `<script>` tag:

```liquid
{% render 'react-mount',
  component: 'Spacer',
  props: '{"height": 32}'
%}
```

Equivalent to passing `height={32}` to a `Spacer` component. Keep this for the truly small cases.

### Section that renders a Shopify product

```liquid
{%- assign product = section.settings.featured_product -%}
{%- if product != blank -%}
  {% render 'react-mount',
    component: 'ProductCard',
    props: product | json
  %}
{%- endif -%}
```

The `product | json` filter serialises Shopify's product object directly into JSON. The React component then receives a Shopify-shaped product. Your component should be typed against that shape (use the types from `packages/shared`).
