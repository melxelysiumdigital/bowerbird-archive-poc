import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID || '';
const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

export async function POST(request: NextRequest) {
  try {
    const { query, variables, accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: 'Missing access token' }, { status: 401 });
    }

    const res = await fetch(`https://shopify.com/${SHOP_ID}/account/customer/api/2025-01/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken,
        Origin: `https://${STORE_DOMAIN}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[customer-graphql]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Customer API query failed' },
      { status: 500 },
    );
  }
}
