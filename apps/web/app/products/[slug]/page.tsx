'use client';


import { ITEM_TYPE_STYLE } from '@bowerbird-poc/shared/constants';
import { createSlug } from '@bowerbird-poc/shared/utils/slug';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bowerbird-poc/ui/components/breadcrumb';
import { Button } from '@bowerbird-poc/ui/components/button';
import { ChevronDown, ZoomIn, SearchX } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect } from 'react';

import { DigitisationRequestForm } from '@/components/digitisation-request-form';
import { useAuth } from '@/hooks/use-auth';
import { useAzureSearch } from '@/hooks/use-azure-search';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { items, isLoading, search } = useAzureSearch();
  const { isAuthenticated, user, loginWithRedirect } = useAuth();

  useEffect(() => {
    if (items.length === 0) {
      search('');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const item = items.find((i) => createSlug(i.title) === slug || i.id === slug);

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="inline-block size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <SearchX className="mb-4 size-16 text-muted-foreground/30" />
        <h2 className="mb-2 text-2xl font-bold">Item not found</h2>
        <p className="mb-6 text-muted-foreground">This item may no longer be available.</p>
        <Button asChild>
          <Link href="/search">Browse Collection</Link>
        </Button>
      </div>
    );
  }

  const style = ITEM_TYPE_STYLE[item.itemType];

  const relatedItems = items.filter((i) => i.id !== item.id).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      {/* Breadcrumbs */}
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/search">{item.category || 'Collection'}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{item.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="flex flex-col gap-4">
          <div className="group relative w-full cursor-zoom-in rounded-xl border bg-card p-4 shadow-sm">
            <div
              className="aspect-[3/4] w-full rounded-lg bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${item.image}")` }}
            />
            <div className="absolute bottom-8 right-8 rounded-full bg-background/90 p-3 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <ZoomIn className="size-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-4 flex gap-3">
              {style && (
                <Badge variant="secondary" className={`${style.bg} ${style.color}`}>
                  {style.label}
                </Badge>
              )}
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                Historical Archive
              </Badge>
            </div>
            <h1 className="mb-2 text-4xl font-extrabold leading-tight">{item.title}</h1>
            <div className="font-mono text-sm tracking-tight text-muted-foreground">
              Series {item.series} &middot; Control Symbol {item.controlSymbol}
            </div>
          </div>

          <div className="leading-relaxed text-muted-foreground">
            <p>{item.description}</p>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Order Card or Digitisation Request Form */}
          {item.forSale ? (
            <div className="flex flex-col gap-6 rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                    Price
                  </span>
                  <span className="text-3xl font-bold text-primary">{item.price}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-green-600">
                  <span className="size-2 rounded-full bg-green-500" />
                  In Stock
                </div>
              </div>
              <Button size="lg" className="w-full">
                Add to Cart
              </Button>
            </div>
          ) : (
            <DigitisationRequestForm
              item={item}
              isAuthenticated={isAuthenticated}
              userEmail={user?.email}
              userName={(user as { name?: string })?.name}
              onLogin={() => loginWithRedirect()}
            />
          )}

          {/* Accordions */}
          <div className="flex flex-col divide-y border-t">
            <details className="group py-4" open>
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                <span>Specifications</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-2 pt-4 font-mono text-sm text-muted-foreground">
                {[
                  ['Page Count', item.specs.pages],
                  ['Dimensions', item.specs.dimensions],
                  ['Scan Resolution', item.specs.resolution],
                  ['File Format', item.specs.format],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-dotted border-current pb-1"
                  >
                    <span>{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </details>
            <details className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
                <span>Delivery Information</span>
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="pt-4 text-sm leading-relaxed text-muted-foreground">
                Digital downloads are processed instantly and a link will be emailed to your account
                address. Physical facsimiles are produced on-demand using acid-free archival paper
                and shipped within 3-5 business days via secure courier.
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Related Collections */}
      {relatedItems.length > 0 && (
        <div className="mt-20 border-t pt-12">
          <h3 className="mb-6 text-xl font-bold">Explore Related Collections</h3>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {relatedItems.map((relatedItem) => (
              <Link
                key={relatedItem.id}
                href={`/products/${createSlug(relatedItem.title)}`}
                className="group"
              >
                <div className="mb-3 aspect-video overflow-hidden rounded-lg border">
                  <div
                    className="h-full w-full bg-cover bg-center transition-transform group-hover:scale-105"
                    style={{ backgroundImage: `url("${relatedItem.image}")` }}
                  />
                </div>
                <h4 className="text-sm font-bold transition-colors group-hover:text-primary">
                  {relatedItem.title}
                </h4>
                <p className="text-xs text-muted-foreground">{relatedItem.category}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
