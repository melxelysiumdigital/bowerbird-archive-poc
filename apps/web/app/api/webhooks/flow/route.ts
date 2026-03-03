import { REFTRACKER_STATUS_ORDER } from '@bowerbird-poc/shared/constants';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  createRefTrackerJob,
  createTechOneWorkOrder,
  getAllIntegrations,
  getIntegrationState,
  setRefTrackerStatus,
  setTechOneStatus,
} from '@/lib/mock-store';
import { shopifyAdminFetch } from '@/lib/shopify-admin';

interface FlowPayload {
  trigger: string;
  draft_order_id?: string | number;
  order_id?: string | number;
  barcode?: string;
  item_title?: string;
  estimate?: number;
}

/** Extract numeric ID from Shopify GID (e.g. "gid://shopify/DraftOrder/123" → 123) or pass through numbers */
function parseShopifyId(id: string | number): number {
  if (typeof id === 'number') return id;
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

/**
 * Resolve a Shopify order ID to our mock store's draft order ID.
 * Checks each known draft order via the Shopify API to find which one
 * was converted into this order.
 */
async function resolveDraftOrderIdFromOrder(orderId: number): Promise<number | null> {
  const integrations = getAllIntegrations();
  for (const integration of integrations) {
    try {
      const data = await shopifyAdminFetch(
        `/draft_orders/${integration.draftOrderId}.json?fields=order_id`,
      );
      const linkedOrderId = (data.draft_order as Record<string, unknown>)?.order_id;
      if (linkedOrderId === orderId) {
        return integration.draftOrderId;
      }
    } catch {
      // Draft order may have been deleted — skip
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FlowPayload;
    const { trigger } = body;

    // Accept either draft_order_id or order_id (Flow sends order_id for post-payment triggers)
    const rawDraftId = body.draft_order_id;
    const rawOrderId = body.order_id;

    if (!trigger || (!rawDraftId && !rawOrderId)) {
      return NextResponse.json(
        { error: 'Missing required fields: trigger, draft_order_id or order_id' },
        { status: 400 },
      );
    }

    let draft_order_id: number;
    if (rawDraftId) {
      draft_order_id = parseShopifyId(rawDraftId);
    } else {
      // Resolve order_id → draft_order_id by checking our known draft orders
      const orderId = parseShopifyId(rawOrderId!);
      const resolved = await resolveDraftOrderIdFromOrder(orderId);
      if (!resolved) {
        return NextResponse.json(
          { error: `Could not resolve order ${orderId} to a known draft order` },
          { status: 404 },
        );
      }
      draft_order_id = resolved;
    }

    switch (trigger) {
      case 'draft_order_created': {
        const barcode = body.barcode || 'BB-UNKNOWN';
        const itemTitle = body.item_title || 'Unknown Item';
        const estimate = body.estimate || 150;

        const refTracker = createRefTrackerJob(draft_order_id, barcode, itemTitle);
        const techOne = createTechOneWorkOrder(draft_order_id, estimate);

        return NextResponse.json({ ok: true, refTracker, techOne });
      }

      case 'order_paid': {
        const state = getIntegrationState(draft_order_id);
        let techOne = state.techOne;
        // Payment received → close the financial workflow, rest is RefTracker
        if (techOne && techOne.status !== 'closed') {
          techOne = setTechOneStatus(techOne.id, 'closed');
        }
        return NextResponse.json({ ok: true, techOne });
      }

      case 'order_tagged_digitising': {
        const state = getIntegrationState(draft_order_id);
        let refTracker = state.refTracker;
        // Idempotency guard: only advance if RefTracker is before 'scanning'
        // (prevents circular loop when write-back adds the 'digitising' tag)
        if (refTracker) {
          const rtIdx = REFTRACKER_STATUS_ORDER.indexOf(refTracker.status);
          const scanningIdx = REFTRACKER_STATUS_ORDER.indexOf('scanning');
          if (rtIdx < scanningIdx) {
            refTracker = setRefTrackerStatus(refTracker.id, 'scanning', 'Digitisation tag applied');
          }
        }
        return NextResponse.json({ ok: true, refTracker });
      }

      case 'order_fulfilled': {
        const state = getIntegrationState(draft_order_id);
        let refTracker = state.refTracker;
        if (refTracker) {
          refTracker = setRefTrackerStatus(
            refTracker.id,
            'reshelved',
            'Order fulfilled — item reshelved',
          );
        }
        let techOne = state.techOne;
        if (techOne) {
          techOne = setTechOneStatus(techOne.id, 'closed');
        }
        return NextResponse.json({ ok: true, refTracker, techOne });
      }

      default:
        return NextResponse.json({ error: `Unknown trigger: ${trigger}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
