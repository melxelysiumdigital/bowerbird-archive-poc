---
sidebar_position: 6
title: Non-destructive deploy
---

# Non-destructive deploy

The Shopify theme deploy workflow uses a **two-pass rsync** rather than wiping and replacing the deploy branch. This page explains why, and what each category of file does on deploy.

## The problem

A typical "sync from main to deploy branch" workflow uses `rsync --delete` (or `git checkout -- theme/`) to make the deploy branch exactly mirror the repo. That's fine for source code. It's actively harmful for a Shopify theme, because **merchants edit templates and settings through the Shopify admin**.

If a merchant customises the homepage template through the theme editor, and the next deploy `--delete`s the templates directory, their work is lost.

## The fix

The deploy workflow at `.github/workflows/deploy.yml` does **two passes** with different rsync flags:

```
Pass 1 (everything except templates and settings_data.json)
  rsync -a --delete <exclude templates,settings_data> repo/ deploy-branch/

Pass 2 (only new templates)
  rsync -a --ignore-existing repo/templates/ deploy-branch/templates/
```

This translates to three categories of file:

| Category | rsync behaviour | Examples |
| --- | --- | --- |
| **Fully synced** (old files cleaned up) | Overwritten every deploy | `assets/`, `sections/`, `snippets/`, `layout/`, `locales/`, `config/settings_schema.json` |
| **New only** (never overwritten) | Copied on first deploy, preserved on subsequent deploys | `templates/**` |
| **Excluded entirely** | Never touched by the deploy | `config/settings_data.json` |

## Why each category is what it is

**Fully synced** files are code we own — the assets, sections, snippets, theme layout. If we ship a fix, it must roll out. Templates referencing those files don't break because the file paths are stable.

**Templates** are the part of the theme merchants are most likely to customise via the editor. Once a template ships, it gets dropped into the deploy branch on first deploy and is then left alone. New templates we add later still get added on their first deploy; nothing already in production gets clobbered.

**`config/settings_data.json`** contains every theme setting value the merchant has chosen — colour palettes, fonts, layout choices. It is **entirely** owned by the Shopify admin, not the repo. Touching it would overwrite the merchant's branding.

`config/settings_schema.json` (the **shape** of the settings) is still synced because that's a developer concern. You can add a new setting without losing the merchant's existing values.

## Branches

- `deploy/shopify-test` — auto-deployed on merge to `main`
- `deploy/shopify-prod` — manually deployed via workflow dispatch

Both are connected to Shopify's GitHub integration, so a push to the branch triggers a theme update on the connected store.

## Trade-offs

The cost of this approach is **complexity** — the workflow is harder to read than a simple `git checkout`. The win is that merchants can safely use the theme editor without a deploy nuking their work.

## What this means for you when editing a template

If you change `templates/index.json` in the repo, **your change will not roll out to existing stores**. The template was copied on first deploy and is now treated as merchant-owned. Two ways to roll your change out anyway:

1. Coordinate with the merchant — they pull your change via the theme editor's section/page settings, or you remote-edit through `theme:push` after coordinating.
2. Add a new template (`templates/index.alt.json`) and have the merchant switch to it.

For sections and snippets, no special handling — they roll out every deploy.
