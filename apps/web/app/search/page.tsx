'use client';

import { EMPTY_FILTERS } from '@bowerbird-poc/shared/constants';
import type { SearchFilters, SortOption } from '@bowerbird-poc/shared/types';
import { createSlug } from '@bowerbird-poc/shared/utils/slug';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bowerbird-poc/ui/components/breadcrumb';
import { Button } from '@bowerbird-poc/ui/components/button';
import { FilterSidebar } from '@bowerbird-poc/ui/components/filter-sidebar';
import { PolaroidCard, SkeletonCard } from '@bowerbird-poc/ui/components/polaroid-card';
import { SortBar } from '@bowerbird-poc/ui/components/sort-bar';
import { SlidersHorizontal, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect, useCallback } from 'react';

import { useAzureSearch } from '@/hooks/use-azure-search';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { items, isLoading, error, search } = useAzureSearch();

  // Search when query, filters, or sort changes
  useEffect(() => {
    search(query, filters, sort);
  }, [query, filters, sort, search]);

  const handleFiltersChange = useCallback((next: SearchFilters) => setFilters(next), []);
  const handleSortChange = useCallback((next: SortOption) => setSort(next), []);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Search</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight">
          {query ? (
            <>
              Results for &ldquo;<span className="text-primary">{query}</span>&rdquo;
            </>
          ) : (
            'All Artifacts'
          )}
        </h1>
      </div>

      {error && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive mb-6 rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="mb-4 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <SlidersHorizontal className="mr-2 size-4" />
        {sidebarOpen ? 'Hide Filters' : 'Show Filters'}
      </Button>

      <div className="flex flex-col gap-12 lg:flex-row">
        {sidebarOpen && (
          <FilterSidebar filters={filters} onChange={handleFiltersChange} items={items} />
        )}

        <div className="flex-1">
          <SortBar
            sort={sort}
            onSortChange={handleSortChange}
            resultCount={items.length}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {isLoading && items.length === 0
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : items.map((item) => (
                  <Link key={item.id} href={`/products/${createSlug(item.title)}`}>
                    <PolaroidCard item={item} />
                  </Link>
                ))}
          </div>

          {!isLoading && items.length === 0 && !error && (
            <div className="bg-muted/30 rounded-xl border py-16 text-center">
              <SearchX className="text-muted-foreground/30 mx-auto mb-4 size-16" />
              <h3 className="mb-2 text-xl font-bold">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try a different search term or adjust your filters.
              </p>
              <Button asChild>
                <Link href="/search">Browse Collection</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
