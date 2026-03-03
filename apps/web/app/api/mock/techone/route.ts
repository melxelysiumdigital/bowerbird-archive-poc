import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getAllTechOneWorkOrders, createTechOneWorkOrder } from '@/lib/mock-store';

export async function GET(request: NextRequest) {
  const draftOrderId = request.nextUrl.searchParams.get('draftOrderId');
  const orders = getAllTechOneWorkOrders();

  if (draftOrderId) {
    const filtered = orders.filter((w) => w.draftOrderId === Number(draftOrderId));
    return NextResponse.json(filtered);
  }

  return NextResponse.json(orders);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftOrderId, estimate } = body;

    if (!draftOrderId || estimate == null) {
      return NextResponse.json(
        { error: 'Missing required fields: draftOrderId, estimate' },
        { status: 400 },
      );
    }

    const wo = createTechOneWorkOrder(draftOrderId, estimate);
    return NextResponse.json(wo, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
