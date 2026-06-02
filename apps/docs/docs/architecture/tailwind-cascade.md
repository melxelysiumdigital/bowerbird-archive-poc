---
sidebar_position: 5
title: Tailwind cascade fix
---

# Tailwind cascade fix

A small but load-bearing detail of how Tailwind v4 coexists with Dawn's stylesheet.

## The problem

Tailwind v4 puts its utilities in `@layer utilities`. CSS cascade rules say a declaration **inside** any layer loses to a declaration **outside** any layer, regardless of specificity. Dawn's `base.css` is unlayered. So:

```css
/* Dawn base.css (unlayered) */
button { background: red; }

/* Tailwind */
@layer utilities {
  .bg-blue-500 { background: blue; }   /* loses */
}
```

Even though `.bg-blue-500` has higher specificity than `button`, Dawn wins because layered declarations always lose to unlayered ones.

This was caught when React components inside the theme were not getting the styles we expected — Dawn's defaults were stomping them.

## The fix

Wrap Dawn's base CSS in `@layer base { ... }`. Now both stylesheets are layered, and standard cascade rules apply:

```css
@layer base {
  /* Dawn base.css goes here */
  button { background: red; }
}

@layer utilities {
  .bg-blue-500 { background: blue; }   /* wins now */
}
```

The wrapping happens in `apps/shopify-theme/src/entries/react.css`:

```css
@import '@bowerbird-poc/ui/globals.css';

@layer base {
  @import url('dawn/base.css');
}

@source '../../node_modules/@bowerbird-poc/ui/src';
```

`@source` tells Tailwind to scan the shared UI package for class usage so utilities aren't tree-shaken away in production builds.

## Why this is worth knowing

If you ever:

- Add another framework's stylesheet alongside Tailwind
- Swap Dawn for another theme
- Add a CSS-in-JS solution

…remember that **layered vs unlayered** matters more than specificity. Default to layering everything you don't own.

## Why we didn't just override with `!important`

It works, but it metastasizes — every utility you ever write has to be `!`-prefixed, and any future migration becomes a search-and-destroy job. Wrapping Dawn once is a one-line fix that doesn't change how you write components.
