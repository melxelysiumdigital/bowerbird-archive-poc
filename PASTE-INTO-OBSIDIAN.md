## Unified Cart — Mixed Order Types — 2026-04-07

> Source: Architecture analysis for handling digitised items + digitisation requests in a single cart

### Problem

Currently there are two completely separate flows:

1. **Ready digitised items** (`forSale: true`) → Shopify cart → standard checkout → order
2. **Digitisation requests** (`forSale: false`) → separate form → draft order API → manual review/quote flow

Users who want both a ready item and a digitisation request must go through two different flows. We want a **single cart** that handles both and splits at checkout.

### Approach: Split Before Checkout, Not After

Shopify doesn't natively support splitting one checkout into two orders. But we don't need it to — the web app already controls the cart UI. The cart holds both item types and dispatches to two backends when the user checks out.

**No Shopify order splitting required.**

### Unified Cart UX

```
┌─ Cart Drawer ─────────────────────────────────┐
│                                               │
│ ┌─ Ready to Purchase ───────────────────────┐ │
│ │ Photograph A3456        $25.00       [✕]  │ │
│ │ Document B7890          $15.00       [✕]  │ │
│ │                         ─────             │ │
│ │                  Subtotal: $40.00         │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│ ┌─ Digitisation Requests ───────────────────┐ │
│ │ Film C1234 (not yet digitised)       [✕]  │ │
│ │ Audio D5678 (not yet digitised)      [✕]  │ │
│ │                                           │ │
│ │ These items need to be digitised first.   │ │
│ │ You'll receive a quote by email.          │ │
│ └───────────────────────────────────────────┘ │
│                                               │
│           [Checkout All]                      │
│  Purchases will be charged now.               │
│  Digitisation requests will be quoted          │
│  separately by email.                         │
└───────────────────────────────────────────────┘
```

### What "Checkout All" Does

Two simultaneous dispatches:

1. **Ready items** → proceeds to Shopify checkout (existing flow via `use-shopify-cart.ts`)
2. **Request items** → submits to draft order API (existing `/api/shopify/draft-orders` endpoint)

The user sees one action. The backend handles them as two separate workflows.

### What Changes

| Layer | Current State | Change Needed |
|-------|--------------|---------------|
| **Cart state** | `use-shopify-cart.ts` — only tracks Shopify cart items | Add parallel "request items" state (local state or new hook `use-request-cart.ts`) |
| **Product page** | `forSale: false` → goes straight to digitisation request form | "Add to Cart" button for both types. Request items get `type: 'request'` flag in cart state |
| **Cart drawer** | Shows only Shopify cart line items | Split into two sections: "Ready to Purchase" and "Digitisation Requests" |
| **Checkout action** | Single Shopify checkout redirect | Dispatch to both backends, then redirect to Shopify checkout |
| **Cart badge** | Counts Shopify cart items only | Count both Shopify cart + request items |

### Contact Details for Requests

The current digitisation request form collects: name, email, phone, researcher type, contact preference, additional info. If requests now go through the cart, where do these details come from?

**Three options:**

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A. Checkout UI extension (recommended)** | Shopify Plus checkout extensibility — add custom fields (researcher type, additional info) when order contains request items. Name/email/phone already captured by Shopify checkout. | Clean UX. Single checkout flow. Uses Plus features. | Needs a checkout extension app. Only shows fields for mixed carts (request + purchase). |
| **B. Collect in cart drawer** | Show a condensed form section in the cart drawer when request items are present | No checkout extension needed | Cart drawer gets heavy. Bad UX for a drawer. |
| **C. Collect post-purchase** | Submit request with just email (from auth session). Follow up for extra details if needed. | Simplest. Fewest blockers. | May delay request processing if details are needed. |

**Recommendation: Option A for production, Option C for the POC.** The POC already has the user's email from the auth session — submit the draft order with that. For production, add a checkout UI extension that collects the extra fields.

### Cart State Architecture

```typescript
// New hook: use-unified-cart.ts
// Composes existing Shopify cart + local request items

interface UnifiedCart {
  // Shopify cart (existing)
  shopifyCart: ShopifyCart;
  addToShopifyCart: (variantId: string, attributes: CartAttribute[]) => void;

  // Request items (new — local state, persisted to localStorage)
  requestItems: RequestCartItem[];
  addRequestItem: (item: SearchResultItem) => void;
  removeRequestItem: (itemId: string) => void;

  // Unified
  totalItemCount: number;
  hasShopifyItems: boolean;
  hasRequestItems: boolean;
  checkoutAll: () => Promise<void>;  // dispatches to both backends
}

interface RequestCartItem {
  itemId: string;
  itemTitle: string;
  itemType: ItemType;
  seriesNumber?: string;
  controlSymbol?: string;
  barcode?: string;
  itemImage?: string;
  addedAt: string;
}
```

### Checkout Flow

```
User clicks "Checkout All"
  │
  ├─ Has request items?
  │   └─ YES → POST /api/shopify/draft-orders
  │            (uses existing bundling logic — appends to open draft order)
  │            Show toast: "Digitisation request submitted — you'll receive a quote by email"
  │
  ├─ Has Shopify cart items?
  │   └─ YES → Redirect to Shopify checkout
  │            (existing headless checkout flow)
  │
  └─ Both?
      └─ Submit draft order FIRST, then redirect to Shopify checkout
         (draft order is fire-and-forget, no redirect needed)
```

### Edge Cases

| Scenario | Handling |
|----------|---------|
| **Only request items in cart** | "Submit Request" button instead of "Checkout All". No Shopify checkout redirect. |
| **Only ready items in cart** | Standard "Checkout" button. Existing flow unchanged. |
| **User not authenticated** | Prompt login before checkout (existing behaviour). Email from session used for draft order. |
| **Draft order bundling** | Existing logic already bundles into open draft orders by email. Works as-is. |
| **Request item already in an open draft order** | Check before adding — show "Already requested" state on product page. |

### Implementation Order

1. **`use-request-cart.ts`** — local state hook for request items (localStorage-persisted)
2. **`use-unified-cart.ts`** — composes Shopify cart + request cart
3. **Update product page** — "Add to Cart" for both `forSale` and `!forSale` items
4. **Update cart drawer** — split into two sections
5. **Update cart badge** — count both types
6. **"Checkout All" action** — dispatch to draft order API + Shopify checkout
7. **Toast/confirmation** — feedback for submitted digitisation requests
8. **(Future) Checkout UI extension** — extra fields for request items at Shopify checkout
