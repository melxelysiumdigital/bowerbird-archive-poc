/**
 * Mock search API route — serves filtered/sorted results from a static dataset.
 * Replaces the Azure AI Search integration (kept in route.azure-reference.ts).
 *
 * Accepts the same POST body that `use-azure-search.ts` sends and returns the
 * same `{ value: [...] }` response shape so the hook + all consumers work unchanged.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { MOCK_ITEMS, type MockSearchItem } from '@/data/mock-search-items';

// ---------------------------------------------------------------------------
// Text search — case-insensitive substring match across searchable fields
// ---------------------------------------------------------------------------

function textMatch(item: MockSearchItem, query: string): number {
  if (!query || query === '*') return 1;

  const q = query.toLowerCase();
  const fields = [item.name, item.description, item.shortDescription, item.category, ...item.tags];

  let score = 0;
  for (const field of fields) {
    const lower = field.toLowerCase();
    if (lower.includes(q)) score += 1;
    if (lower.startsWith(q)) score += 2; // boost prefix matches
  }
  // Exact title match gets a big boost
  if (item.name.toLowerCase() === q) score += 5;

  return score;
}

// ---------------------------------------------------------------------------
// OData filter parser — handles the expressions built by buildFilterExpression
// ---------------------------------------------------------------------------

function matchesFilter(item: MockSearchItem, filter: string | undefined): boolean {
  if (!filter) return true;

  // Split on " and " but not inside parentheses
  const parts = splitFilterParts(filter);

  return parts.every((part) => {
    const trimmed = part.trim();

    // search.in(item_type, 'document,photograph', ',')
    const searchInMatch = trimmed.match(/search\.in\((\w+),\s*'([^']+)',\s*'([^']+)'\)/);
    if (searchInMatch) {
      const [, field, values, delimiter] = searchInMatch;
      const allowed = values.split(delimiter);
      const value = getField(item, field) as string;
      return allowed.includes(value);
    }

    // for_sale eq true
    const eqMatch = trimmed.match(/(\w+)\s+eq\s+(true|false|'[^']+')/);
    if (eqMatch) {
      const [, field, rawValue] = eqMatch;
      const value = getField(item, field);
      if (rawValue === 'true') return value === true;
      if (rawValue === 'false') return value === false;
      return value === rawValue.replace(/'/g, '');
    }

    // tags/any(tag: tag eq 'immigration')
    const tagAnyMatch = trimmed.match(/tags\/any\(tag:\s*tag\s+eq\s+'([^']+)'\)/);
    if (tagAnyMatch) {
      return item.tags.includes(tagAnyMatch[1]);
    }

    // Grouped tag clauses: (tags/any(...) and tags/any(...))
    if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
      const inner = trimmed.slice(1, -1);
      return matchesFilter(item, inner);
    }

    return true;
  });
}

function splitFilterParts(filter: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  const tokens = filter.split(/(\s+and\s+)/i);
  for (const token of tokens) {
    if (/^\s+and\s+$/i.test(token) && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      for (const ch of token) {
        if (ch === '(') depth++;
        if (ch === ')') depth--;
      }
      current += token;
    }
  }
  if (current) parts.push(current);
  return parts;
}

function getField(item: MockSearchItem, field: string): unknown {
  return (item as unknown as Record<string, unknown>)[field];
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

function sortItems(items: MockSearchItem[], orderby: string | undefined): MockSearchItem[] {
  if (!orderby) return items;

  const [field, direction] = orderby.trim().split(/\s+/);
  const dir = direction === 'desc' ? -1 : 1;

  return [...items].sort((a, b) => {
    const aVal = getField(a, field);
    const bVal = getField(b, field);

    if (typeof aVal === 'number' && typeof bVal === 'number') return (aVal - bVal) * dir;
    if (typeof aVal === 'string' && typeof bVal === 'string') return aVal.localeCompare(bVal) * dir;
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    search,
    filter,
    orderby,
    top = 20,
  } = body as {
    search?: string;
    filter?: string;
    orderby?: string;
    top?: number;
  };

  const query = search && search !== '*' ? search : '';

  // 1. Score every item by text relevance
  const scored = MOCK_ITEMS.map((item) => ({
    item,
    score: textMatch(item, query),
  }));

  // 2. Filter out non-matching text results (unless browsing all)
  const filtered = query ? scored.filter((s) => s.score > 0) : scored;

  // 3. Apply OData filter
  const oDataFiltered = filtered.filter((s) => matchesFilter(s.item, filter));

  // 4. Sort — explicit orderby wins, otherwise sort by text relevance score
  let results: { item: MockSearchItem; score: number }[];
  if (orderby) {
    const sorted = sortItems(
      oDataFiltered.map((s) => s.item),
      orderby,
    );
    results = sorted.map((item) => ({
      item,
      score: oDataFiltered.find((s) => s.item === item)?.score ?? 1,
    }));
  } else {
    results = [...oDataFiltered].sort((a, b) => b.score - a.score);
  }

  // 5. Limit
  const limited = results.slice(0, top);

  // 6. Shape response to match Azure Search format
  const value = limited.map((r) => ({
    ...r.item,
    '@search.score': r.score,
  }));

  return NextResponse.json({ value });
}
