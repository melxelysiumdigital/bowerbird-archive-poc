import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

import { shopifyAdminFetch } from '@/lib/shopify-admin';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Search for existing customer
    const searchData = (await shopifyAdminFetch(
      `/customers/search.json?query=email:${encodeURIComponent(email)}&fields=id,email,first_name,last_name`,
    )) as { customers?: Array<Record<string, unknown>> };

    if (searchData.customers && searchData.customers.length > 0) {
      return NextResponse.json(searchData.customers[0]);
    }

    // Create new customer
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
    })) as { customer: Record<string, unknown> };

    return NextResponse.json(createData.customer, { status: 201 });
  } catch (err) {
    console.error('[sync-customer]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
