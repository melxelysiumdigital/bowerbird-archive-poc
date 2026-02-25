'use client';

import type { ItemType, SearchItem, SearchFilters, SortOption } from '@bowerbird-poc/shared/types';
import { useState, useCallback, useRef, useEffect } from 'react';


interface AzureSearchResult {
  product_id: string;
  name: string;
  item_type: ItemType;
  series: string;
  controlSymbol: string;
  barcode: string;
  description: string;
  shortDescription: string;
  category: string;
  price: string;
  image_url: string;
  specs: {
    pages: string;
    dimensions: string;
    resolution: string;
    format: string;
  };
  tags: string[];
  release: string;
  for_sale: boolean;
  '@search.score'?: number;
}

interface SearchState {
  items: SearchItem[];
  isLoading: boolean;
  error: string | null;
  query: string;
  hasSearched: boolean;
}

function mapResult(result: AzureSearchResult): SearchItem {
  return {
    id: result.product_id,
    title: result.name,
    itemType: result.item_type,
    series: result.series || '',
    controlSymbol: result.controlSymbol || '',
    barcode: result.barcode || '',
    description: result.description || '',
    shortDescription: result.shortDescription || '',
    category: result.category || '',
    price: result.price || '',
    image: result.image_url || '',
    specs: result.specs || { pages: '', dimensions: '', resolution: '', format: '' },
    tags: result.tags || [],
    release: result.release || '',
    forSale: result.for_sale ?? true,
    score: result['@search.score'] ?? 0,
  };
}

function buildFilterExpression(filters?: SearchFilters): string | undefined {
  if (!filters) return undefined;
  const parts: string[] = [];

  if (filters.itemTypes.length > 0) {
    parts.push(`search.in(item_type, '${filters.itemTypes.join(',')}', ',')`);
  }
  if (filters.categories.length > 0) {
    parts.push(`search.in(category, '${filters.categories.join('|')}', '|')`);
  }
  if (filters.forSaleOnly) {
    parts.push('for_sale eq true');
  }
  if (filters.tags.length > 0) {
    const tagClauses = filters.tags.map((t) => `tags/any(tag: tag eq '${t}')`);
    parts.push(`(${tagClauses.join(' and ')})`);
  }

  return parts.length > 0 ? parts.join(' and ') : undefined;
}

function buildOrderBy(sort?: SortOption): string | undefined {
  switch (sort) {
    case 'price_asc':
      return 'price_value asc';
    case 'price_desc':
      return 'price_value desc';
    case 'newest':
      return 'release desc';
    case 'title_az':
      return 'name asc';
    case 'relevance':
    default:
      return undefined;
  }
}

export function useAzureSearch(debounceMs = 300) {
  const [state, setState] = useState<SearchState>({
    items: [],
    isLoading: false,
    error: null,
    query: '',
    hasSearched: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (query: string, filters?: SearchFilters, sort?: SortOption) => {
      abortControllerRef.current?.abort();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setState((prev) => ({ ...prev, isLoading: true, error: null, query }));

      const filterStr = buildFilterExpression(filters);
      const orderBy = buildOrderBy(sort);

      const body: Record<string, unknown> = {
        search: query || '*',
        searchFields: 'name, description, shortDescription, category, tags, title',
        select:
          'product_id, name, item_type, series, controlSymbol, barcode, description, shortDescription, category, price, price_value, image_url, tags, release, for_sale, specs',
        top: 20,
      };

      if (!orderBy) {
        body.vectorQueries = [
          {
            kind: 'text',
            text: query || 'historical archival documents and records',
            fields: 'content_vector',
            k: 20,
          },
        ];
      }

      if (filterStr) body.filter = filterStr;
      if (orderBy) body.orderby = orderBy;

      try {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Search failed (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        const items = (data.value || []).map(mapResult);

        setState({ items, isLoading: false, error: null, query, hasSearched: true });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Search failed',
        }));
      }
    },
    [],
  );

  const debouncedSearch = useCallback(
    (query: string, filters?: SearchFilters, sort?: SortOption) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setState((prev) => ({ ...prev, query }));
      debounceTimerRef.current = setTimeout(() => search(query, filters, sort), debounceMs);
    },
    [search, debounceMs],
  );

  useEffect(() => {
    search('');
  }, [search]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return { ...state, search, debouncedSearch };
}
