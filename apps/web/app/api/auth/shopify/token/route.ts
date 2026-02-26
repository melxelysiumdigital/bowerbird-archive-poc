import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID || '';
const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const formBody = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        formBody.set(key, value);
      }
    }

    const res = await fetch(`https://shopify.com/authentication/${SHOP_ID}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: `https://${STORE_DOMAIN}`,
      },
      body: formBody.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[shopify-token]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Token exchange failed' },
      { status: 500 },
    );
  }
}
