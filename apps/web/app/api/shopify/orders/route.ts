import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { shopifyAdminFetch } from '@/lib/shopify-admin';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email query parameter is required' }, { status: 400 });
    }

    const data = await shopifyAdminFetch(
      `/orders.json?status=any&email=${encodeURIComponent(email)}&limit=20`,
    );

    return NextResponse.json(data);
  } catch (err) {
    console.error('[orders]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
