---
sidebar_position: 6
title: Seeding Flow workflows
---

# Seeding Flow workflows

The `apps/export/` folder contains a Shopify Flow workflow export (`workflows_export_<timestamp>.zip`). This page covers what's in it and how to import.

## What's in the zip

Six `.flow` files — one per workflow. Each is a JSON blob describing the trigger, conditions, and actions. They map onto the digitisation lifecycle and the membership flow.

| File | What it does |
| --- | --- |
| `Digitisation_request_created_*.flow` | Fires when a draft order is created with the `digitisation-request` tag. Mocks RefTracker by logging the payload (see [POC status](../poc-status#-mocked--stubbed-integrations)) |
| `Digitisation_payment_received_*.flow` | Fires when payment is captured on a digitisation order. Mocks the kick-off to TechOne |
| `Digitisation_started_*.flow` | Fires when an order moves into the "in progress" state — mocks status writeback |
| `Digitisation_complete_*.flow` | Fires when an order is marked fulfilled — would notify the customer / close the ticket in a real integration |
| `Membership_Activation_-_Subscription_Contract_*.flow` | Fires when a Shopify Subscriptions contract activates. Adds the `member` customer tag |
| `Remove_member_tag_on_subscription_cancellation_*.flow` | The opposite — removes the `member` tag when the subscription is cancelled |

The membership pair is what lets the web app derive membership status from a customer tag (see [`apps/web`](../apps/web#membership-status)).

## How to import

Workflows are imported **one file at a time** — Shopify Flow doesn't accept the zip directly, you have to extract first.

1. Unzip `apps/export/workflows_export_*.zip` somewhere local:

   ```bash
   cd apps/export
   unzip workflows_export_*.zip -d workflows/
   ```

2. In the Shopify admin: **Apps → Flow** (requires the [Flow app](./installed-apps#shopify-flow) installed)
3. Click **Import** (top right of the Flow workflows list)
4. Pick one of the extracted `.flow` files
5. Flow shows the trigger, conditions, and actions for review. Confirm the trigger app is still connected (e.g. Shopify Subscriptions for the membership flows)
6. Click **Import**
7. The workflow is created as **draft / off**. Toggle it on once you've reviewed it
8. Repeat for each `.flow` file

See [Shopify's official import docs](https://help.shopify.com/en/manual/shopify-flow/reference/workflows#export-and-import-workflows) for the canonical steps.

## How the zip was produced

From the Shopify admin:

1. **Apps → Flow** → workflows list
2. Select the workflows you want (checkbox each row, or "select all")
3. **Export** (top right)
4. Shopify zips them and triggers a download

The filename includes a timestamp — keep filenames stable in the repo by renaming on commit if you want easier diffs, or just leave the timestamps and replace the file each refresh.

## Things to know before importing

### Trigger apps must be installed first

Workflows that depend on other apps (Shopify Subscriptions, the digitisation app, DonateMate, etc.) will import but fail to activate if the source app isn't installed yet. Install order, on a fresh store, is roughly:

1. Install [the apps the workflows depend on](./installed-apps#reinstalling-on-a-new-store)
2. Deploy the custom apps (`apps/shopify-*/`)
3. Import the Flow workflows

If you import out of order, Flow will let you save the workflow but the trigger picker will be empty. Re-edit after the dependency is installed.

### Workflows are off after import

Every imported workflow lands as **off** (draft). This is intentional — review the conditions before activation. The digitisation-related workflows post to HTTP endpoints that, in the POC, are just logging endpoints. Verify the URL is what you expect before turning them on.

### IDs in the filename

The `019c9bfe-c647-...` and `01KJE014QF...` segments in the filenames are Shopify-internal IDs (UUID + ULID). They're unique per workflow per store — re-exporting from a different store gives different IDs even for an identical workflow. Don't try to match by ID across stores.

### Refresh cadence

Re-export and replace the zip when:

- A workflow's logic changes (conditions tweaked, actions added)
- A new workflow is added that production-shaped deployments will need
- An app version bump changes the available triggers/actions

Diffing `.flow` files in git is **noisy** — they're large minified JSON blobs with embedded UUIDs that change on every export. Treat the zip as an opaque snapshot; for change history, rely on git's "the file changed" signal plus a one-line commit message explaining what changed in human terms.

## Related reading

- [Shopify Flow docs](https://help.shopify.com/en/manual/shopify-flow)
- [Exporting and importing workflows](https://help.shopify.com/en/manual/shopify-flow/reference/workflows#export-and-import-workflows)
- [Flow triggers reference](https://help.shopify.com/en/manual/shopify-flow/reference/triggers)
- [Flow actions reference](https://help.shopify.com/en/manual/shopify-flow/reference/actions)
- [Installed Shopify apps → Flow](./installed-apps#shopify-flow)
