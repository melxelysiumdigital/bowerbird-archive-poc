---
sidebar_position: 2
title: React mount system
---

# React mount system

How a React component ends up on the page. Three files do the heavy lifting; everything else is glue.

## The three files

| File | Role |
| --- | --- |
| `theme/snippets/react-mount.liquid` | Generic "drop a component here" tag used by sections |
| `src/react/registry.ts` | Maps string component names to actual React component imports |
| `src/react/mount.ts` | Scans the DOM for mount points and calls `createRoot` |

Plus `src/entries/react.tsx` which wires `mount.ts` to lifecycle events.

## The Liquid side — `react-mount.liquid`

The full snippet is twelve lines including comments:

```liquid title="theme/snippets/react-mount.liquid"
{%- comment -%}
  Generic mount point for React components.
  Usage:
    {% render 'react-mount', component: 'ComponentName', props: props_json %}
    {% render 'react-mount', component: 'ComponentName', props_script_id: '#props-id' %}
{%- endcomment -%}

<div
  data-react-component="{{ component }}"
  {%- if props %}
    data-react-props="{{ props | escape }}"
  {%- endif -%}
  {%- if props_script_id %}
    data-react-props-from="{{ props_script_id }}"
  {%- endif -%}
></div>
```

It accepts a component name and **one of two** prop sources:

- `props` — an inline JSON string (escaped). Use for small, simple prop sets.
- `props_script_id` — a CSS selector pointing to a `<script type="application/json">` tag elsewhere in the section. Use when props are large, contain quotes, or you want them readable in the rendered HTML.

The output is a single empty `<div>` with data attributes. Nothing else.

## The registry — `src/react/registry.ts`

```ts title="src/react/registry.ts"
import { HeroBanner } from '@bowerbird-poc/ui/components/hero-banner';
import { ProductCard } from '@bowerbird-poc/ui/components/product-card';

import type { ComponentRegistry } from './mount';

export const registry: ComponentRegistry = {
  HeroBanner,
  ProductCard,
};
```

That's the whole file. **Imports are eager and static** — never `React.lazy`, never dynamic `import()`. The reason:

:::warning Why eager imports
Dynamic imports produce extra chunk files (`chunk-abc123.js`) whose URLs Vite generates at build time. Liquid templates can't reliably reference those URLs because Shopify's CDN is content-addressed and the filenames change every build. Keeping everything eager means one stable `react.bundle.js` file, which Liquid can always find.
:::

There **is** one chunk by design: the vendor chunk. See [Vite pipeline](./vite-pipeline).

## The runtime — `src/react/mount.ts`

```ts title="src/react/mount.ts"
import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export type ComponentRegistry = Record<string, ComponentType<any>>;

const roots = new WeakMap<Element, Root>();

function parseProps(el: Element): Record<string, unknown> {
  const inlineJson = el.getAttribute('data-react-props');
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch (e) {
      console.error('[react-mount] Failed to parse inline props:', e);
      return {};
    }
  }

  const scriptSelector = el.getAttribute('data-react-props-from');
  if (scriptSelector) {
    const scriptEl = document.querySelector(scriptSelector);
    if (scriptEl?.textContent) {
      try {
        return JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.error('[react-mount] Failed to parse props from script:', e);
        return {};
      }
    }
  }

  return {};
}

export function mountComponents(registry: ComponentRegistry, scope?: Element): void {
  const container = scope ?? document;
  const elements = container.querySelectorAll<HTMLElement>('[data-react-component]');

  elements.forEach((el) => {
    const name = el.getAttribute('data-react-component');
    if (!name) return;

    const Component = registry[name];
    if (!Component) {
      console.warn(`[react-mount] Unknown component: "${name}"`);
      return;
    }

    if (roots.has(el)) return;  // already mounted

    const props = parseProps(el);
    const root = createRoot(el);
    roots.set(el, root);

    root.render(createElement(Component, props));
  });
}

export function unmountComponents(scope?: Element): void {
  const container = scope ?? document;
  const elements = container.querySelectorAll<HTMLElement>('[data-react-component]');

  elements.forEach((el) => {
    const root = roots.get(el);
    if (root) {
      root.unmount();
      roots.delete(el);
    }
  });
}
```

Three things worth pointing out:

1. **`WeakMap<Element, Root>`** — when a section is removed from the DOM (e.g. the merchant deletes it in the editor), the element is GC'd and the root entry vanishes automatically. No manual cleanup of the map needed.
2. **`if (roots.has(el)) return;`** — idempotency guard. If `mountComponents` runs twice over the same scope (e.g. the page mounts and then the editor triggers `section:load`), the second call does nothing for already-mounted elements.
3. **`scope?: Element`** — both functions accept an optional scope. Pass an element to mount/unmount only inside that subtree. This is what makes the theme editor events work.

## The lifecycle — `src/entries/react.tsx`

```ts title="src/entries/react.tsx"
import './react.css';

import { mountComponents, unmountComponents } from '@/react/mount';
import { registry } from '@/react/registry';

function mount(scope?: Element) {
  mountComponents(registry, scope);
}

// Mount immediately if DOM is already ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mount());
} else {
  mount();
}

// Shopify theme editor events
document.addEventListener('shopify:section:load', (e) => {
  const section = (e as CustomEvent).target as Element;
  mount(section);
});

document.addEventListener('shopify:section:unload', (e) => {
  const section = (e as CustomEvent).target as Element;
  unmountComponents(section);
});

document.addEventListener('shopify:block:select', (e) => {
  const block = (e as CustomEvent).target as Element;
  mount(block);
});

document.addEventListener('shopify:block:deselect', (e) => {
  const block = (e as CustomEvent).target as Element;
  unmountComponents(block);
});

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept('@/react/registry', () => {
    mount();
  });
}
```

### Why the `readyState` check

The bundle is loaded as a deferred script. Depending on Shopify's HTML structure and where `vite-tag` ends up in the document, the script may execute before or after `DOMContentLoaded` has fired. The check picks the right strategy either way.

### Why the theme editor events matter

When a merchant edits the theme in the Shopify theme editor, sections are dynamically added and removed without a full page reload. Shopify fires custom events on these mutations:

| Event | When it fires | What we do |
| --- | --- | --- |
| `shopify:section:load` | Merchant adds a section, or it's re-rendered after settings change | `mount(section)` — find React components inside it and mount them |
| `shopify:section:unload` | Merchant deletes/replaces a section | `unmountComponents(section)` — clean up roots |
| `shopify:block:select` | Merchant selects a block within a section | `mount(block)` |
| `shopify:block:deselect` | Merchant deselects | `unmountComponents(block)` |

Without these, the merchant would have to refresh the entire preview every time they touched a setting on a React-backed section.

### HMR

`import.meta.hot.accept('@/react/registry', () => mount())` re-mounts everything when the registry module updates. Vite's HMR sends the new module; `mount()` runs again, hitting the existing `data-react-component` elements. The `WeakMap` guard prevents double-mounting, so updated components only render where they didn't already.

This works because React 19's `createRoot` reconciles against existing roots — but **only if** the component instance is the same reference. Hot-replacing the registry replaces the references, and the guard prevents the trivial duplicate-mount case. For full component-level HMR with state preservation, the Vite React plugin handles that separately.

## Two ways to pass props

Both forms produce the same runtime behaviour. Pick by ergonomics.

### Inline JSON — `data-react-props`

```liquid
{% render 'react-mount',
  component: 'ProductCard',
  props: product | json
%}
```

- ✅ One-liner
- ✅ Works for small, structured data
- ❌ Quotes get HTML-escaped which makes view-source ugly
- ❌ Large objects with embedded HTML/quotes can break the escaping

### Script tag — `data-react-props-from`

```liquid
<script id="hero-props-{{ section.id }}" type="application/json">
  {
    "heading": {{ section.settings.heading | json }},
    "subheading": {{ section.settings.subheading | json }}
  }
</script>

{%- assign hero_props_id = '#hero-props-' | append: section.id -%}
{% render 'react-mount',
  component: 'HeroBanner',
  props_script_id: hero_props_id
%}
```

- ✅ Readable rendered HTML
- ✅ No escaping fights with quotes
- ✅ Works for nested objects, arrays, anything `| json` will serialise
- ❌ Two-step (write the script, render the mount)

Use the script-tag pattern for anything non-trivial. `react-hero.liquid` is the canonical example — see the [section walkthrough](./section-walkthrough).
