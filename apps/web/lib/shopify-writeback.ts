/* eslint-disable no-console */
import { shopifyAdminFetch } from './shopify-admin';

// ─── Low-level helpers ──────────────────────────────────────

async function getOrderTags(orderId: number): Promise<string> {
  const data = await shopifyAdminFetch(`/orders/${orderId}.json?fields=tags`);
  return ((data.order as Record<string, unknown>)?.tags as string) || '';
}

async function getDraftOrderTags(draftOrderId: number): Promise<string> {
  const data = await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json?fields=tags`);
  return ((data.draft_order as Record<string, unknown>)?.tags as string) || '';
}

async function addOrderTag(orderId: number, tag: string): Promise<void> {
  const existing = await getOrderTags(orderId);
  const tags = existing ? existing.split(',').map((t) => t.trim()) : [];
  if (tags.includes(tag)) return;
  tags.push(tag);
  await shopifyAdminFetch(`/orders/${orderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ order: { tags: tags.join(', ') } }),
  });
}

async function addDraftOrderTag(draftOrderId: number, tag: string): Promise<void> {
  const existing = await getDraftOrderTags(draftOrderId);
  const tags = existing ? existing.split(',').map((t) => t.trim()) : [];
  if (tags.includes(tag)) return;
  tags.push(tag);
  await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json`, {
    method: 'PUT',
    body: JSON.stringify({ draft_order: { tags: tags.join(', ') } }),
  });
}

async function getDraftOrderOrderId(draftOrderId: number): Promise<number | null> {
  const data = await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json?fields=order_id`);
  const orderId = (data.draft_order as Record<string, unknown>)?.order_id;
  return typeof orderId === 'number' && orderId > 0 ? orderId : null;
}

// ─── Public API (fire-and-forget) ───────────────────────────

/** Tag whichever Shopify resource exists — order (if paid) or draft order */
export async function tagForDraftOrder(draftOrderId: number, tag: string): Promise<void> {
  try {
    const orderId = await getDraftOrderOrderId(draftOrderId);
    if (orderId) {
      await addOrderTag(orderId, tag);
    } else {
      await addDraftOrderTag(draftOrderId, tag);
    }
    console.log(
      `[shopify-writeback] Tagged ${orderId ? `order ${orderId}` : `draft ${draftOrderId}`} with "${tag}"`,
    );
  } catch (err) {
    console.error(
      `[shopify-writeback] Failed to tag draft order ${draftOrderId} with "${tag}":`,
      err,
    );
  }
}

/** Update the draft order line item price (for TechOne cost finalization before invoice) */
export async function updateDraftOrderPrice(draftOrderId: number, price: string): Promise<void> {
  try {
    // Only works on unpaid draft orders — if already converted to an order, skip
    const orderId = await getDraftOrderOrderId(draftOrderId);
    if (orderId) {
      console.log(
        `[shopify-writeback] Draft ${draftOrderId} already paid (order ${orderId}), skipping price update`,
      );
      return;
    }

    const data = await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json?fields=line_items`);
    const draft = data.draft_order as Record<string, unknown>;
    const lineItems = draft?.line_items as Array<Record<string, unknown>> | undefined;

    if (!lineItems?.length) return;

    // Update the first (digitisation service) line item price
    const updatedItems = lineItems.map((item, idx) => (idx === 0 ? { ...item, price } : item));

    await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ draft_order: { line_items: updatedItems } }),
    });
    console.log(`[shopify-writeback] Updated draft order ${draftOrderId} price to $${price}`);
  } catch (err) {
    console.error(
      `[shopify-writeback] Failed to update price on draft order ${draftOrderId}:`,
      err,
    );
  }
}

/** Update the note on a draft order (or its associated order) */
export async function updateNoteForDraftOrder(draftOrderId: number, note: string): Promise<void> {
  try {
    const orderId = await getDraftOrderOrderId(draftOrderId);
    if (orderId) {
      await shopifyAdminFetch(`/orders/${orderId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ order: { note } }),
      });
      console.log(`[shopify-writeback] Updated note on order ${orderId}`);
    } else {
      await shopifyAdminFetch(`/draft_orders/${draftOrderId}.json`, {
        method: 'PUT',
        body: JSON.stringify({ draft_order: { note } }),
      });
      console.log(`[shopify-writeback] Updated note on draft order ${draftOrderId}`);
    }
  } catch (err) {
    console.error(`[shopify-writeback] Failed to update note on draft order ${draftOrderId}:`, err);
  }
}
