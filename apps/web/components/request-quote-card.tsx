'use client';

import type { SearchItem } from '@bowerbird-poc/shared/types';
import { Alert, AlertDescription } from '@bowerbird-poc/ui/components/alert';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Check, Info, ScanLine, ShoppingCart } from 'lucide-react';

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

export function RequestQuoteCard({
  item,
  onAddToCart,
  alreadyInCart,
}: {
  item: SearchItem;
  onAddToCart: () => void;
  alreadyInCart: boolean;
}) {
  return (
    <div className="bg-card flex flex-col gap-0 rounded-xl border shadow-sm">
      <div className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <ScanLine className="text-primary size-5" />
          <h3 className="text-lg font-bold">Request for Copy Quote</h3>
        </div>
      </div>

      <OrderItemMeta item={item} />

      <div className="border-b px-6 py-4">
        <Alert variant="default" className="border-amber-200 bg-amber-50">
          <Info className="size-4 text-amber-600" />
          <AlertDescription className="text-xs leading-relaxed text-amber-700">
            This item hasn&apos;t been digitised yet. Add it to your cart and we&apos;ll include it
            as a copy quote request when you check out. Our team will review and send you a quote.
          </AlertDescription>
        </Alert>
      </div>

      <div className="border-b px-6 py-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Price</span>
          <span className="font-medium">Quote on request</span>
        </div>
      </div>

      <div className="px-6 py-4">
        <Button
          size="lg"
          className="w-full gap-2"
          variant={alreadyInCart ? 'secondary' : 'default'}
          onClick={onAddToCart}
          disabled={alreadyInCart}
        >
          {alreadyInCart ? (
            <>
              <Check className="size-5" />
              Added to Cart
            </>
          ) : (
            <>
              <ShoppingCart className="size-5" />
              Add to Cart
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
