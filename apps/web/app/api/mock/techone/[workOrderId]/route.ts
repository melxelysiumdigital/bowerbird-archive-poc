import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  getTechOneWorkOrder,
  advanceTechOneWorkOrder,
  setTechOneStatus,
  addTechOneCostLine,
} from '@/lib/mock-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workOrderId: string }> },
) {
  const { workOrderId } = await params;
  const wo = getTechOneWorkOrder(workOrderId);
  if (!wo) {
    return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
  }
  return NextResponse.json(wo);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ workOrderId: string }> },
) {
  try {
    const { workOrderId } = await params;
    const body = await request.json();

    if (body.action === 'advance') {
      const wo = advanceTechOneWorkOrder(workOrderId);
      return NextResponse.json(wo);
    }

    if (body.action === 'set_status') {
      const wo = setTechOneStatus(workOrderId, body.status);
      return NextResponse.json(wo);
    }

    if (body.action === 'add_cost_line') {
      const wo = addTechOneCostLine(workOrderId, body.costLine);
      return NextResponse.json(wo);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
