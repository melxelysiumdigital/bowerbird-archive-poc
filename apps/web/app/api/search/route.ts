import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';

const AZURE_SEARCH_ENDPOINT =
  process.env.AZURE_SEARCH_ENDPOINT || 'https://azure-ai-searchpoc.search.windows.net';
const AZURE_SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX || 'fulltext-poc';
const AZURE_SEARCH_API_KEY = process.env.AZURE_SEARCH_API_KEY || '';

export async function POST(request: NextRequest) {
  if (!AZURE_SEARCH_API_KEY) {
    return NextResponse.json({ error: 'Azure Search not configured' }, { status: 500 });
  }

  const body = await request.json();
  const url = `${AZURE_SEARCH_ENDPOINT}/indexes/${AZURE_SEARCH_INDEX}/docs/search?api-version=2024-07-01`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_SEARCH_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
