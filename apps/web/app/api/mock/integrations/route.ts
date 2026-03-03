import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getIntegrationState, getAllIntegrations } from '@/lib/mock-store';

export async function GET(request: NextRequest) {
  const draftOrderId = request.nextUrl.searchParams.get('draftOrderId');

  if (draftOrderId) {
    const state = getIntegrationState(Number(draftOrderId));
    return NextResponse.json(state);
  }

  const all = getAllIntegrations();
  return NextResponse.json(all);
}
