'use client';


import { Button } from '@bowerbird-poc/ui/components/button';
import { Separator } from '@bowerbird-poc/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@bowerbird-poc/ui/components/sheet';
import { Minus, Plus, Trash2, X } from 'lucide-react';

import { useShopifyCart } from '@/hooks/use-shopify-cart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { lines, totalQuantity, checkoutUrl, removeFromCart, updateQuantity, cost, isLoading } =
    useShopifyCart();

  const totalAmount = cost?.totalAmount;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-[450px] flex-col p-0">
        <SheetHeader className="border-b px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-baseline gap-2">
              Your Cart
              {totalQuantity > 0 && (
                <span className="text-sm font-medium text-muted-foreground">
                  ({totalQuantity})
                </span>
              )}
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-sm">Your cart is empty</p>
          </div>
        ) : (
          <ul className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {lines.map((line: any) => {
              const lineId = line.id as string;
              const qty = (line.quantity as number) ?? 1;
              const attrs = (line.attributes ?? []) as Array<{ key: string; value: string }>;
              const title =
                attrs.find((a) => a.key === 'item_title')?.value ??
                line.merchandise?.title ??
                'Item';
              const image = attrs.find((a) => a.key === 'item_image')?.value;
              const variant = line.merchandise?.title as string | undefined;
              const price = line.cost?.totalAmount as { amount: string } | undefined;

              return (
                <li key={lineId} className="flex flex-col border-b border-muted pb-6">
                  <div className="flex gap-4">
                    {image ? (
                      <div
                        className="size-24 shrink-0 rounded-lg border bg-muted bg-cover bg-center"
                        style={{ backgroundImage: `url("${image}")` }}
                      />
                    ) : (
                      <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border bg-muted text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        {variant && variant !== 'Default Title' && (
                          <p className="mt-1 text-sm text-muted-foreground">{variant}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-lg border p-1">
                          <button
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            onClick={() => updateQuantity(lineId, qty - 1)}
                            disabled={isLoading || qty <= 1}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">
                            {qty}
                          </span>
                          <button
                            className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                            onClick={() => updateQuantity(lineId, qty + 1)}
                            disabled={isLoading}
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        {price && (
                          <span className="font-bold">
                            ${parseFloat(price.amount || '0').toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="ml-auto mt-3 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    onClick={() => removeFromCart(lineId)}
                    disabled={isLoading}
                  >
                    <Trash2 className="size-3.5" />
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {lines.length > 0 && (
          <SheetFooter className="mt-auto flex-col gap-4 border-t bg-background p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              {totalAmount && (
                <span className="text-xl font-extrabold">
                  ${parseFloat(totalAmount.amount || '0').toFixed(2)}{' '}
                  {totalAmount.currencyCode}
                </span>
              )}
            </div>
            <Separator />
            <p className="text-center text-xs text-muted-foreground">
              Shipping calculated at checkout
            </p>
            <Button asChild className="w-full" size="lg" disabled={!checkoutUrl}>
              <a href={checkoutUrl || '#'}>Checkout</a>
            </Button>
            <button
              onClick={onClose}
              className="w-full pt-2 text-center text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              Continue Shopping
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
