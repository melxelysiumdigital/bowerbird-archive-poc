'use client';

import { ITEM_TYPE_STYLE } from '@bowerbird-poc/shared/constants';
import type { ItemType, SearchItem } from '@bowerbird-poc/shared/types';
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
import { ChevronDown, ZoomIn, SearchX, ShoppingCart, Check, Info } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState, useCallback } from 'react';

import { RequestQuoteCard } from '@/components/request-quote-card';
import { ResearchCentreRequest } from '@/components/research-centre-request';
import { useAuth } from '@/hooks/use-auth';
import { useAzureSearch } from '@/hooks/use-azure-search';
import { useShopifyCart } from '@/hooks/use-shopify-cart';
import { useUnifiedCart } from '@/hooks/use-unified-cart';
import { ITEM_TYPE_TO_PRODUCT_HANDLE } from '@/lib/shopify-product-map';

// ─── Storefront API variant fetcher ──────────────────────────

interface ShopifyVariant {
  id: string;
  title: string;
  price: { amount: string; currencyCode: string };
}

const variantCache = new Map<string, ShopifyVariant[]>();

async function fetchVariantsForHandle(handle: string): Promise<ShopifyVariant[]> {
  if (variantCache.has(handle)) return variantCache.get(handle)!;

  const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
  if (!domain || !token) return [];

  const query = `{
    productByHandle(handle: "${handle}") {
      variants(first: 20) {
        nodes { id title price { amount currencyCode } }
      }
    }
  }`;

  const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) return [];
  const json = await res.json();
  const variants: ShopifyVariant[] = json.data?.productByHandle?.variants?.nodes ?? [];
  variantCache.set(handle, variants);
  return variants;
}

// ─── Sub-components ──────────────────────────────────────────

function OrderItemMeta({ item }: { item: SearchItem }) {
  return (
    <div className="border-b px-6 py-4">
      <dl className="text-sm">
        {[
          ['Item title', item.title],
          ['Series number', item.series],
          ['Control symbol', item.controlSymbol],
          ['Barcode', item.barcode],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-2 py-1">
            <dt className="font-semibold">{label}:</dt>
            <dd className="text-muted-foreground">{value}</dd>
          </div>
        ))}
        <div className="flex gap-2 py-1">
          <dt className="font-semibold">Access status:</dt>
          <dd className="font-medium text-green-600">Open</dd>
        </div>
      </dl>
    </div>
  );
}

function OrderPriceBreakdown({ price, gst, total }: { price: number; gst: number; total: number }) {
  return (
    <div className="border-b px-6 py-4">
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sub-Total</span>
          <span className="font-medium">${price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            GST<sup>*</sup>
          </span>
          <span className="font-medium">${gst.toFixed(2)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t pt-2">
          <span className="font-semibold">
            Total (inc GST)<sup>**</sup>
          </span>
          <span className="font-bold">${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function OrderFootnotes() {
  return (
    <div className="border-b px-6 py-4">
      <div className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
        <Info className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
        <div>
          <p>
            <sup>*</sup>GST (10%) will be added at checkout for all orders with an Australian
            address.
          </p>
          <p className="mt-2">
            <sup>**</sup>National Archives of Australia is currently upgrading its
            digitisation-on-demand service. As we transition to a new payment system, fees for
            standard public paper digitisation services will be temporarily waived.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductOrderCard({
  item,
  chosenVariant,
  variants,
  selectedVariant,
  onSelectVariant,
  onAddToCart,
  isCartLoading,
  addedToCart,
}: {
  item: SearchItem;
  chosenVariant: ShopifyVariant | undefined;
  variants: ShopifyVariant[];
  selectedVariant: string | null;
  onSelectVariant: (id: string) => void;
  onAddToCart: () => void;
  isCartLoading: boolean;
  addedToCart: boolean;
}) {
  const price = chosenVariant ? parseFloat(chosenVariant.price.amount) : 0;
  const gst = price * 0.1;
  const total = price + gst;
  const currency = chosenVariant?.price.currencyCode ?? 'AUD';

  return (
    <div className="bg-card flex flex-col gap-0 rounded-xl border shadow-sm">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h3 className="text-lg font-bold">Request a Copy</h3>
      </div>

      <OrderItemMeta item={item} />

      {/* Product selector */}
      <div className="border-b px-6 py-4">
        <label className="text-sm font-semibold">Please select a product:</label>
        <select
          className="border-input bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
          value={selectedVariant ?? ''}
          onChange={(e) => onSelectVariant(e.target.value)}
        >
          <option value="" disabled>
            -- Please select product --
          </option>
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title} ${parseFloat(v.price.amount).toFixed(2)}({currency})
            </option>
          ))}
        </select>
      </div>

      <OrderPriceBreakdown price={price} gst={gst} total={total} />
      <OrderFootnotes />

      {/* Action */}
      <div className="px-6 py-4">
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!selectedVariant || isCartLoading}
          onClick={onAddToCart}
        >
          {addedToCart ? (
            <>
              <Check className="size-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="size-5" />
              Proceed to Checkout
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function ProductSpecs({
  specs,
}: {
  specs: { pages: string; dimensions: string; resolution: string; format: string };
}) {
  return (
    <div className="flex flex-col divide-y border-t">
      <details className="group py-4" open>
        <summary className="flex cursor-pointer list-none items-center justify-between font-bold">
          <span>Specifications</span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="text-muted-foreground space-y-2 pt-4 font-mono text-sm">
          {[
            ['Page Count', specs.pages],
            ['Dimensions', specs.dimensions],
            ['Scan Resolution', specs.resolution],
            ['File Format', specs.format],
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
        <div className="text-muted-foreground pt-4 text-sm leading-relaxed">
          Digital downloads are processed instantly and a link will be emailed to your account
          address. Physical facsimiles are produced on-demand using acid-free archival paper and
          shipped within 3-5 business days via secure courier.
        </div>
      </details>
    </div>
  );
}

function RelatedCollections({
  relatedItems,
}: {
  relatedItems: { id: string; title: string; image: string; category: string }[];
}) {
  if (relatedItems.length === 0) return null;

  return (
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
            <h4 className="group-hover:text-primary text-sm font-bold transition-colors">
              {relatedItem.title}
            </h4>
            <p className="text-muted-foreground text-xs">{relatedItem.category}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── ProductImage ────────────────────────────────────────────

function ProductImage({ src }: { src: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="group bg-card relative w-full cursor-zoom-in rounded-xl border p-4 shadow-sm">
        <div
          className="aspect-[3/4] w-full rounded-lg bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${src}")` }}
        />
        <div className="bg-background/90 absolute right-8 bottom-8 rounded-full p-3 opacity-0 shadow-lg backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <ZoomIn className="text-primary size-5" />
        </div>
      </div>
    </div>
  );
}

// ─── ProductDetails (right column) ───────────────────────────

function ProductDetails({
  item,
  style,
  variants,
  selectedVariant,
  chosenVariant,
  onSelectVariant,
  onAddToCart,
  onAddRequestToCart,
  isCartLoading,
  addedToCart,
  requestInCart,
  isAuthenticated,
}: {
  item: SearchItem;
  style: (typeof ITEM_TYPE_STYLE)[keyof typeof ITEM_TYPE_STYLE] | undefined;
  variants: ShopifyVariant[];
  selectedVariant: string | null;
  chosenVariant: ShopifyVariant | undefined;
  onSelectVariant: (id: string) => void;
  onAddToCart: () => void;
  onAddRequestToCart: () => void;
  isCartLoading: boolean;
  addedToCart: boolean;
  requestInCart: boolean;
  isAuthenticated: boolean;
}) {
  return (
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
        <h1 className="mb-2 text-4xl leading-tight font-extrabold">{item.title}</h1>
        <div className="text-muted-foreground font-mono text-sm tracking-tight">
          Series {item.series} &middot; Control Symbol {item.controlSymbol}
        </div>
      </div>

      <div className="text-muted-foreground leading-relaxed">
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

      {item.forSale ? (
        <ProductOrderCard
          item={item}
          chosenVariant={chosenVariant}
          variants={variants}
          selectedVariant={selectedVariant}
          onSelectVariant={onSelectVariant}
          onAddToCart={onAddToCart}
          isCartLoading={isCartLoading}
          addedToCart={addedToCart}
        />
      ) : (
        <RequestQuoteCard
          item={item}
          onAddToCart={onAddRequestToCart}
          alreadyInCart={requestInCart}
        />
      )}

      {isAuthenticated && <ResearchCentreRequest item={item} />}

      <ProductSpecs specs={item.specs} />
    </div>
  );
}

// ─── ProductNotFound ─────────────────────────────────────────

function ProductNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <SearchX className="text-muted-foreground/30 mb-4 size-16" />
      <h2 className="mb-2 text-2xl font-bold">Item not found</h2>
      <p className="text-muted-foreground mb-6">This item may no longer be available.</p>
      <Button asChild>
        <Link href="/search">Browse Collection</Link>
      </Button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { items, isLoading, search } = useAzureSearch();
  const { isAuthenticated } = useAuth();
  const { addItem, isLoading: isCartLoading } = useShopifyCart();
  const { addRequestItem, hasRequestItem } = useUnifiedCart();

  const [variants, setVariants] = useState<ShopifyVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      search('');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const item = items.find((i) => createSlug(i.title) === slug || i.id === slug);

  useEffect(() => {
    if (!item?.forSale) return;
    const handle = ITEM_TYPE_TO_PRODUCT_HANDLE[item.itemType as ItemType];
    if (!handle) return;

    fetchVariantsForHandle(handle).then((v) => {
      setVariants(v);
      if (v.length > 0) setSelectedVariant(v[0].id);
    });
  }, [item?.forSale, item?.itemType]);

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || !item) return;
    addItem(selectedVariant, 1, {
      item_title: item.title,
      item_type: item.itemType,
      series_number: item.series,
      control_symbol: item.controlSymbol,
      barcode: item.barcode,
      item_id: item.id,
      item_image: item.image,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [selectedVariant, item, addItem]);

  const handleAddRequestToCart = useCallback(() => {
    if (!item) return;
    addRequestItem(item);
  }, [item, addRequestItem]);

  if (isLoading && !item) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="border-primary inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }
  if (!item) return <ProductNotFound />;

  const style = ITEM_TYPE_STYLE[item.itemType];
  const relatedItems = items.filter((i) => i.id !== item.id).slice(0, 4);
  const chosenVariant = variants.find((v) => v.id === selectedVariant);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
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
        <ProductImage src={item.image} />

        <ProductDetails
          item={item}
          style={style}
          variants={variants}
          selectedVariant={selectedVariant}
          chosenVariant={chosenVariant}
          onSelectVariant={setSelectedVariant}
          onAddToCart={handleAddToCart}
          onAddRequestToCart={handleAddRequestToCart}
          isCartLoading={isCartLoading}
          addedToCart={addedToCart}
          requestInCart={item ? hasRequestItem(item.id) : false}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <RelatedCollections relatedItems={relatedItems} />
    </div>
  );
}
