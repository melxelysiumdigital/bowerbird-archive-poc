---
sidebar_position: 1
title: Prerequisites
---

# Prerequisites

You need the following installed before you can run any part of the POC.

## Required

| Tool | Version | Why |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | **≥ 25** | The root `engines.node` pin matches Next.js + Vite requirements |
| [pnpm](https://pnpm.io/) | **9.15.0** exactly | Locked via `packageManager` in root `package.json` — Corepack picks the right version automatically |
| [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) | latest | Needed for any work in `apps/shopify-*` |
| [ngrok](https://ngrok.com/download) | latest | Tunnels for Shopify app dev — required (see below) |
| Git | recent | Repo uses worktrees in some workflows |

### ngrok specifically

The Shopify CLI defaults to a Cloudflare tunnel when running an embedded app or a checkout extension. For this POC we use **ngrok instead** because:

- The Cloudflare tunnel buffers streaming responses (see [Shopify gotchas](https://github.com/Shopify/shopify-app-template-react-router#using-defer--await-for-streaming-responses)), which breaks any React Router route that uses `Await`.
- Stable URLs (with a paid ngrok account) let us register webhooks against a tunnel that survives across CLI sessions, instead of re-registering on every `pnpm dev`.

After installing ngrok ([download](https://ngrok.com/download), then `ngrok config add-authtoken <token>`), point the Shopify CLI at it with the [`--tunnel-url` flag](https://shopify.dev/docs/api/shopify-cli/app/app-dev#flags-propertydetail-tunnelurl):

```bash
ngrok http 3000                              # in one terminal
pnpm dev --tunnel-url https://abc123.ngrok-free.app:3000  # in another
```

If you only ever work on the Next.js app or the theme, you can skip ngrok. It's required as soon as you touch `apps/shopify-donations`, `apps/shopify-thank-you`, or `apps/shopify-digitisation`.

The fastest way to get Node + pnpm right is to enable Corepack:

```bash
corepack enable
```

Corepack will then install pnpm 9.15.0 automatically on first run.

## Recommended

| Tool | Why |
| --- | --- |
| [Shopify Partner account](https://partners.shopify.com) | Required for the Shopify embedded apps and to register Admin API scopes — see [partner docs](https://shopify.dev/docs/apps/getting-started) |
| Dev store on the Partner account | Each Shopify app is wired to a dev store — see [creating a dev store](https://shopify.dev/docs/api/development-stores) |
| [`gh`](https://cli.github.com/) | Useful for working with GitHub Actions deploys |
| VS Code with the [Liquid](https://marketplace.visualstudio.com/items?itemName=Shopify.theme-check-vscode) and [GraphQL](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql) extensions | The theme, especially, is much nicer to edit with these on |
| [Shopify Dev MCP](https://shopify.dev/docs/apps/build/devmcp) | Gives Claude/Cursor live access to Shopify docs and schemas — already configured in `apps/shopify-donations` |

## Accounts you need credentials for

To run the full POC end-to-end you'll need:

- A **Shopify Partner account** with a development store
- An **Auth0 tenant** (or you can stub it — see [env vars](./env-vars))
- An **Azure Search** instance (or rely on the mock — see [POC status](../poc-status))

For just running the web app against mocks, only Auth0 credentials are needed.

## Next

→ [Install](./install)

## External docs you'll bookmark anyway

- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli) — every Shopify app workflow runs through this
- [Shopify Admin GraphQL API](https://shopify.dev/docs/api/admin-graphql) — used by `apps/web` for draft orders + customer tags
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront) — used by `apps/web` for product/collection reads
- [Shopify Functions](https://shopify.dev/docs/api/functions) — used by `apps/shopify-donations`
- [Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions) — used by `apps/shopify-thank-you` and `apps/shopify-donations`
- [Theme app extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions) — what powers the headless-redirect embed

The [Resources](../resources) page has the full list, grouped by topic.
