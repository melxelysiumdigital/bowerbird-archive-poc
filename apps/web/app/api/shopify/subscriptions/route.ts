import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { shopifyGraphQL } from '@/lib/shopify-admin';

/* eslint-disable @typescript-eslint/no-explicit-any */

const CUSTOMER_QUERY = `
  query customers($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        email
        tags
        createdAt
        orders(first: 10, reverse: true) {
          nodes {
            id
            legacyResourceId
            name
            createdAt
            lineItems(first: 5) {
              nodes {
                sellingPlan {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

function findSubscriptionOrder(customer: any): { id: string; name: string } | null {
  const orders = customer.orders?.nodes ?? [];
  for (const order of orders) {
    const hasSellingPlan = (order.lineItems?.nodes ?? []).some(
      (li: any) => li.sellingPlan !== null,
    );
    if (hasSellingPlan) {
      return { id: order.legacyResourceId, name: order.name };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const data = await shopifyGraphQL(CUSTOMER_QUERY, {
      query: `email:'${email}'`,
    });

    const nodes = (data.customers as any)?.nodes ?? [];
    const customer = nodes.find((n: any) => (n.email || '').toLowerCase() === email.toLowerCase());

    if (!customer) {
      return NextResponse.json({ isMember: false, tags: [] });
    }

    const tags: string[] = customer.tags || [];
    const isMember = tags.some((t: string) => t.toLowerCase() === 'member-active');
    const subscriptionOrder = isMember ? findSubscriptionOrder(customer) : null;

    return NextResponse.json({
      isMember,
      tags: tags.filter((t: string) => t.toLowerCase().startsWith('member')),
      customerSince: customer.createdAt,
      subscriptionOrder,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[subscriptions GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

/* eslint-enable @typescript-eslint/no-explicit-any */
