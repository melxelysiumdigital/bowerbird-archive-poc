---
sidebar_position: 7
title: Deployment & CI
---

# Deployment & CI

Two GitHub Actions workflows live in `.github/workflows/`:

| File | What it does |
| --- | --- |
| `ci.yml` | Type-check, lint, format-check, theme-check, build. Runs on every push to `main` and every PR targeting `main` |
| `deploy.yml` | Builds the monorepo, copies the Shopify theme to a deploy branch. Runs on push to `main` (auto → test) or via manual dispatch |

Neither workflow deploys the Next.js app or the Shopify embedded apps. Those have to be deployed separately:

- **Next.js**: not wired up — you'd point Vercel/Cloud Run/Fly at the repo
- **Shopify embedded apps**: `pnpm deploy` from inside each `apps/shopify-*` directory

## CI workflow (`ci.yml`)

```yaml title="trigger"
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

Steps:

1. Checkout
2. Install pnpm + Node (see [Node version note](#node-version-mismatch) below)
3. `pnpm install --frozen-lockfile`
4. `pnpm type-check`
5. `pnpm lint`
6. `pnpm lint:theme` — Shopify's [theme-check](https://shopify.dev/docs/storefronts/themes/tools/theme-check) against the Liquid theme
7. `pnpm format:check`
8. `pnpm build`

A failed step in `ci.yml` blocks merge. It does **not** deploy anything.

`concurrency.cancel-in-progress: true` means a new push to the same branch cancels any in-flight CI run for that branch.

### Node version mismatch

The repo's `engines.node` is `>=25` and the wiki [Prerequisites](../getting-started/prerequisites) tell you to use Node 25 locally. **CI uses Node 22.** This works today because the code doesn't rely on a Node-25-only API, but it's a footgun — if something starts depending on a Node 25 feature, local will pass and CI will fail.

Either bump the CI workflow to `node-version: 25`, or drop the local `engines.node` to `>=22`. Tracked as a follow-up.

## Deploy workflow (`deploy.yml`)

```yaml title="triggers"
on:
  push:
    branches: [main]            # → deploys to deploy/shopify-test
  workflow_dispatch:             # → manual, pick environment
    inputs:
      environment: [test, production, custom]
      custom_branch: <string>    # only when environment=custom
```

### What it actually does

1. Checkout, install, build the full monorepo (`pnpm build`)
2. Determine the deploy branch:
   - `push` to main → `deploy/shopify-test`
   - `workflow_dispatch` with `environment=production` → `deploy/shopify-prod`
   - `workflow_dispatch` with `environment=custom` → whatever `custom_branch` says
   - Default → `deploy/shopify-test`
3. Copy `apps/shopify-theme/theme/` to a tmpdir, respecting [`.shopifyignore`](../apps/shopify-theme/vite-pipeline#shopifyignore)
4. Check out the target branch (or create it as an orphan if it doesn't exist)
5. Two-pass rsync into the branch — see below
6. Commit and push

The push to `deploy/shopify-*` triggers Shopify's GitHub integration on the connected store, which is what actually updates the live theme.

### How to deploy

**Test (automatic)** — merge anything to `main`. The push event fires the workflow, which deploys to `deploy/shopify-test`.

**Production (manual)**:

1. Go to **Actions → Build and Deploy Theme** in the GitHub UI
2. Click **Run workflow**
3. Pick `production` from the environment dropdown
4. Click the green **Run workflow** button

The `gh` CLI alternative:

```bash
gh workflow run "Build and Deploy Theme" -f environment=production
```

**Custom branch** — same dispatch flow but pick `custom` and supply a branch name. Useful for hotfix testing.

### Two-pass rsync (current state)

The workflow does **two** rsync passes. The intent is non-destructive sync that preserves merchant admin edits — full rationale in [Non-destructive deploy](./non-destructive-deploy).

**Current state — Dawn → Horizon migration**: there are two `TODO` comments in `deploy.yml` noting the non-destructive behaviour is temporarily disabled. Specifically:

```yaml
# Pass 1: sync non-template files (with cleanup of removed files)
# TODO: Restore settings_data.json exclusion after first Horizon deploy
rsync -av --delete \
  --exclude='.git' \
  --exclude='templates/' \
  /tmp/deploy/ ./

# Pass 2: sync templates (overwriting to replace Dawn→Horizon)
# TODO: Restore --ignore-existing after first Horizon deploy
rsync -av --delete \
  /tmp/deploy/templates/ ./templates/
```

While the TODOs are in place:

- `config/settings_data.json` is **not** excluded — it will be overwritten. Merchant theme settings can be wiped on each deploy.
- `templates/**` is **not** preserved — it's overwritten. Merchant template customisations can be wiped on each deploy.

After the first Horizon deploy lands, restore the original behaviour:

- Add `--exclude='config/settings_data.json'` to pass 1
- Change pass 2 from `--delete` to `--ignore-existing`

Until then, **don't make important admin-side template or theme-setting changes** on the connected stores between deploys — they'll be overwritten.

### Permissions

The job uses `permissions: contents: write` so the workflow can push to deploy branches. No secrets are used directly by the workflow — Shopify pulls from the deploy branch via its GitHub integration, which is configured on the store side, not the repo side.

### Reading a failed deploy

Common failures and where to look:

| Symptom | First place to look |
| --- | --- |
| `pnpm install --frozen-lockfile` fails | `pnpm-lock.yaml` out of sync with `package.json` — run `pnpm install` locally and commit |
| `pnpm build` fails | Same root cause as a CI failure — run `pnpm build` locally first |
| `rsync` step fails with "No such file or directory" | `apps/shopify-theme/theme/` is empty — the build step didn't produce Vite outputs. Check the build log for Vite errors |
| `git push origin deploy/shopify-*` fails | Branch protection on the deploy branch — check the branch settings, the bot needs push access |
| Deploy succeeds but the store doesn't update | Shopify's GitHub integration isn't connected to the deploy branch, or is paused. Check the store's **Online Store → Themes → GitHub** panel |

### Connecting a store to a deploy branch

Per-store, one-time setup:

1. In the Shopify admin: **Online Store → Themes**
2. Find the theme card → **... → Connect from GitHub**
3. Authorise GitHub if prompted
4. Pick this repo + the branch (`deploy/shopify-test` or `deploy/shopify-prod`)
5. Shopify pulls the current state and watches the branch for updates

After this, every push to the branch updates the theme on the store.

## Related reading

- [Architecture: Non-destructive deploy](./non-destructive-deploy) — the intended behaviour the TODOs will restore
- [shopify-theme: Vite pipeline](../apps/shopify-theme/vite-pipeline) — what the build step produces
- [Shopify GitHub integration docs](https://shopify.dev/docs/storefronts/themes/tools/github)
- [`.shopifyignore` reference](https://shopify.dev/docs/storefronts/themes/tools/cli/managing-themes#ignore-files)
- [GitHub Actions workflow_dispatch](https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow)
