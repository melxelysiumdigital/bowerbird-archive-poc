'use client';


import type { SearchItem } from '@bowerbird-poc/shared/types';
import { createSlug } from '@bowerbird-poc/shared/utils/slug';
import { PolaroidCard, SkeletonCard } from '@bowerbird-poc/ui/components/polaroid-card';
import Link from 'next/link';

export function FeaturedSection({
  items,
  isLoading,
}: {
  items: SearchItem[];
  isLoading: boolean;
}) {
  return (
    <section id="collection" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="mb-2 text-3xl font-bold tracking-tight">Featured Artifacts</h2>
          <div className="h-1 w-20 bg-accent-gold" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {isLoading && items.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : items.slice(0, 8).map((item) => (
              <Link key={item.id} href={`/products/${createSlug(item.title)}`}>
                <PolaroidCard item={item} />
              </Link>
            ))}
      </div>
    </section>
  );
}
