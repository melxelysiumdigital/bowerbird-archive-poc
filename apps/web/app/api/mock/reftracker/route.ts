import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getAllRefTrackerJobs, createRefTrackerJob } from '@/lib/mock-store';

export async function GET(request: NextRequest) {
  const draftOrderId = request.nextUrl.searchParams.get('draftOrderId');
  const jobs = getAllRefTrackerJobs();

  if (draftOrderId) {
    const filtered = jobs.filter((j) => j.draftOrderId === Number(draftOrderId));
    return NextResponse.json(filtered);
  }

  return NextResponse.json(jobs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { draftOrderId, barcode, itemTitle } = body;

    if (!draftOrderId || !barcode || !itemTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: draftOrderId, barcode, itemTitle' },
        { status: 400 },
      );
    }

    const job = createRefTrackerJob(draftOrderId, barcode, itemTitle);
    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
