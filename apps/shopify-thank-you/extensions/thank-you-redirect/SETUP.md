# Thank You Redirect — App Setup

Single Shopify app with two extensions that handle the full headless checkout redirect flow. No theme code changes needed.

## Extensions

| Extension            | Type              | Purpose                                                          |
| -------------------- | ----------------- | ---------------------------------------------------------------- |
| `thank-you-redirect` | Checkout UI       | Button on thank-you page to redirect back to headless storefront |
| `headless-redirect`  | Theme App (embed) | Script on every storefront page to handle cookie-based redirect  |

## How It Works

```
Headless App (user clicks Checkout)
  → Redirects to Shopify store with ?headless_origin=...&checkout_url=...

Shopify Store (headless-redirect embed)
  → Saves headless_origin cookie → redirects to checkout URL

Shopify Checkout (user completes purchase)

Thank You Page (thank-you-redirect extension)
  → Reads headless_origin from cart attributes
  → Shows "View Your Order Details" button with order info in URL

Headless App /thank-you
  → Parses order_id, order_number, status from URL
```

## Setup

### 1. Deploy

```bash
cd apps/shopify-thank-you
pnpm shopify app deploy
```

### 2. Enable the Headless Redirect Embed

1. Go to **Online Store > Themes > Customize**
2. Click **App embeds** (left sidebar)
3. Toggle on **Headless Redirect**
4. Optionally configure custom path redirects

### 3. Add the Thank You Block

1. Go to **Settings > Checkout > Customize**
2. Navigate to the **Thank you page**
3. Add the **Thank You Redirect** app block
4. Configure: Return URL, Button text, Message

### 4. Hide Default Footer (Shopify Plus Only)

Run `./scripts/hide-default-footer.sh` or manually execute the GraphQL mutation:

```graphql
# First get your checkout profile ID
query {
  checkoutProfiles(first: 1, query: "is_published:true") {
    nodes {
      id
      name
    }
  }
}

# Then hide the footer
mutation ($id: ID!) {
  checkoutBrandingUpsert(
    checkoutProfileId: $id
    checkoutBrandingInput: { customizations: { footer: { visibility: HIDDEN } } }
  ) {
    userErrors {
      field
      message
    }
  }
}
```

### 5. Verify

1. From your headless app, click Checkout
2. Complete a test purchase
3. On the thank-you page you should see your custom redirect button
4. Clicking it returns to your headless app with order params
