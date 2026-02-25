import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { shopifyAdminFetch, shopifyGraphQL } from '@/lib/shopify-admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

function transformGQLDraftToRest(node: any) {
  const statusMap: Record<string, string> = {
    OPEN: 'open',
    INVOICE_SENT: 'invoice_sent',
    COMPLETED: 'completed',
  };
  return {
    id: parseInt(node.legacyResourceId, 10),
    name: node.name,
    status: statusMap[node.status] || 'open',
    created_at: node.createdAt,
    invoice_url: node.invoiceUrl,
    total_price: node.totalPriceSet?.shopMoney?.amount || '0.00',
    currency: node.totalPriceSet?.shopMoney?.currencyCode || 'AUD',
    note: node.note2,
    tags: Array.isArray(node.tags) ? node.tags.join(', ') : node.tags || '',
    line_items: (node.lineItems?.nodes || []).map((li: any) => ({
      title: li.title,
      price: li.originalUnitPriceSet?.shopMoney?.amount || '0.00',
      quantity: li.quantity,
      properties: (li.customAttributes || []).map((a: any) => ({
        name: a.key,
        value: a.value,
      })),
    })),
    customer: node.customer
      ? {
          id: parseInt(node.customer.legacyResourceId, 10),
          email: node.customer.email,
          first_name: node.customer.firstName,
          last_name: node.customer.lastName,
        }
      : null,
    order_id: node.order ? parseInt(node.order.legacyResourceId, 10) : null,
    order_tags: node.order?.tags
      ? Array.isArray(node.order.tags)
        ? node.order.tags.join(', ')
        : node.order.tags
      : '',
    order_fulfillment: node.order?.displayFulfillmentStatus || null,
    order_cancelled: Boolean(node.order?.cancelledAt),
  };
}

function buildLineItem(item: any) {
  return {
    title: item.title || 'Digitisation Request',
    price: '0.00',
    quantity: 1,
    requires_shipping: false,
    properties: [
      { name: 'item_id', value: item.id || '' },
      { name: 'item_type', value: item.itemType || '' },
      { name: 'item_title', value: item.title || '' },
      { name: 'control_symbol', value: item.controlSymbol || '' },
      { name: 'barcode', value: item.barcode || '' },
      { name: 'series_number', value: item.series || '' },
      { name: 'item_image', value: item.image || '' },
    ],
  };
}

async function findOrCreateCustomer(email: string, firstName?: string, lastName?: string) {
  const searchData = (await shopifyAdminFetch(
    `/customers/search.json?query=email:${encodeURIComponent(email)}&fields=id`,
  )) as { customers?: Array<{ id: number }> };

  if (searchData.customers && searchData.customers.length > 0) {
    return searchData.customers[0].id;
  }

  const createData = (await shopifyAdminFetch('/customers.json', {
    method: 'POST',
    body: JSON.stringify({
      customer: {
        email,
        first_name: firstName || '',
        last_name: lastName || '',
        verified_email: true,
        send_email_welcome: false,
      },
    }),
  })) as { customer: { id: number } };

  return createData.customer.id;
}

// POST — Create or bundle digitisation request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, notes, item } = body;

    if (!email || (!item && !body.recreate)) {
      return NextResponse.json({ error: 'Email and item are required' }, { status: 400 });
    }

    let customerId: number | undefined;
    try {
      customerId = await findOrCreateCustomer(email, firstName, lastName);
    } catch {
      // Continue without customer ID
    }

    // Recreate from cancelled request
    if (body.recreate && Array.isArray(body.items)) {
      const lineItems = body.items.map(buildLineItem);
      const recreateNote =
        `Recreated from ${body.originalName || 'cancelled request'}.\n${notes || ''}`.trim();

      const data = (await shopifyAdminFetch('/draft_orders.json', {
        method: 'POST',
        body: JSON.stringify({
          draft_order: {
            line_items: lineItems,
            ...(customerId ? { customer: { id: customerId } } : { email }),
            tags: 'digitisation-request',
            note: recreateNote,
          },
        }),
      })) as { draft_order: any };

      return NextResponse.json(data.draft_order, { status: 201 });
    }

    const newLineItem = buildLineItem(item);

    // Check for existing open draft to bundle into
    let existingDraft: any = null;
    try {
      const gqlData = await shopifyGraphQL(`{
        draftOrders(first: 10, query: "tag:digitisation-request status:open") {
          nodes { legacyResourceId email invoiceUrl customer { email } }
        }
      }`);

      const nodes = (gqlData.draftOrders as any)?.nodes ?? [];
      const match = nodes.find((n: any) => {
        const ce = (n.customer?.email || n.email || '').toLowerCase();
        return ce === email.toLowerCase();
      });

      if (match) {
        const restData = (await shopifyAdminFetch(
          `/draft_orders/${match.legacyResourceId}.json`,
        )) as { draft_order: any };
        existingDraft = restData.draft_order;
      }
    } catch {
      // Fall through to create new
    }

    if (existingDraft) {
      const updatedNote = existingDraft.note
        ? `${existingDraft.note}\n---\n${notes || ''}`
        : notes || '';

      const updateData = (await shopifyAdminFetch(
        `/draft_orders/${existingDraft.id}.json`,
        {
          method: 'PUT',
          body: JSON.stringify({
            draft_order: {
              line_items: [...(existingDraft.line_items as unknown[]), newLineItem],
              note: updatedNote,
            },
          }),
        },
      )) as { draft_order: any };

      // 200 = bundled into existing
      return NextResponse.json(updateData.draft_order, { status: 200 });
    }

    // Create new draft order
    const data = (await shopifyAdminFetch('/draft_orders.json', {
      method: 'POST',
      body: JSON.stringify({
        draft_order: {
          line_items: [newLineItem],
          ...(customerId ? { customer: { id: customerId } } : { email }),
          tags: 'digitisation-request',
          note: notes || '',
        },
      }),
    })) as { draft_order: any };

    return NextResponse.json(data.draft_order, { status: 201 });
  } catch (err) {
    console.error('[draft-orders POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET — Fetch user's digitisation requests
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json(
        { error: 'Email query parameter is required' },
        { status: 400 },
      );
    }

    const gqlData = await shopifyGraphQL(`{
      draftOrders(first: 100, query: "tag:digitisation-request", reverse: true) {
        nodes {
          legacyResourceId
          name
          status
          tags
          note2
          email
          invoiceUrl
          createdAt
          customer {
            legacyResourceId
            email
            firstName
            lastName
          }
          lineItems(first: 20) {
            nodes {
              title
              quantity
              originalUnitPriceSet { shopMoney { amount } }
              customAttributes { key value }
            }
          }
          order { legacyResourceId tags displayFulfillmentStatus cancelledAt }
          totalPriceSet { shopMoney { amount currencyCode } }
        }
      }
    }`);

    const nodes = (gqlData.draftOrders as any)?.nodes ?? [];
    const filtered = nodes.filter((n: any) => {
      const ce = (n.customer?.email || n.email || '').toLowerCase();
      return ce === email.toLowerCase();
    });

    const draftOrders = filtered.map(transformGQLDraftToRest);
    return NextResponse.json({ draft_orders: draftOrders });
  } catch (err) {
    console.error('[draft-orders GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// DELETE — Cancel a digitisation request
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Draft order ID is required' },
        { status: 400 },
      );
    }

    // Fetch full draft before deleting (for recreation data)
    const draftData = (await shopifyAdminFetch(`/draft_orders/${id}.json`)) as {
      draft_order: any;
    };
    const draft = draftData.draft_order;

    const items = (draft.line_items || []).map((li: any) => {
      const prop = (name: string) =>
        (li.properties || []).find((p: any) => p.name === name)?.value || '';
      return {
        id: prop('item_id'),
        title: prop('item_title') || li.title,
        itemType: prop('item_type'),
        controlSymbol: prop('control_symbol'),
        barcode: prop('barcode'),
        series: prop('series_number'),
        image: prop('item_image'),
      };
    });

    // Delete the draft order
    const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
    const adminToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
    await fetch(
      `https://${storeDomain}/admin/api/2025-01/draft_orders/${id}.json`,
      {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': adminToken },
      },
    );

    return NextResponse.json({
      originalName: draft.name,
      email: draft.customer?.email || draft.email || '',
      firstName: draft.customer?.first_name || '',
      lastName: draft.customer?.last_name || '',
      items,
      notes: draft.note || '',
    });
  } catch (err) {
    console.error('[draft-orders DELETE]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
