import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getRefTrackerJob, advanceRefTrackerJob, setRefTrackerStatus } from '@/lib/mock-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  const job = getRefTrackerJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  return NextResponse.json(job);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const body = await request.json();

    if (body.action === 'advance') {
      const job = advanceRefTrackerJob(jobId, body.note);
      return NextResponse.json(job);
    }

    if (body.action === 'set_status') {
      const job = setRefTrackerStatus(jobId, body.status, body.note);
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
