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
import { useCallback } from 'react';

import { useShopifyCart } from '@/hooks/use-shopify-cart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isCustomerLoggedIn?: boolean;
}

export function CartDrawer({ isOpen, onClose, isCustomerLoggedIn }: CartDrawerProps) {
  const { lines, totalQuantity, checkoutUrl, removeFromCart, updateQuantity, cost, isLoading } =
    useShopifyCart();

  const totalAmount = cost?.totalAmount;

  const handleCheckout = useCallback(() => {
    if (!checkoutUrl) return;

    const checkoutUrlObj = new URL(checkoutUrl);
    if (isCustomerLoggedIn) {
      checkoutUrlObj.searchParams.set('logged_in', 'true');
    }

    // Route through Shopify storefront to save headless_origin cookie,
    // then the headless-redirect app extension redirects to checkout
    // (requires store password to have been entered in browser for
    // password-protected dev stores)
    const storeUrl = new URL(checkoutUrlObj.origin);
    storeUrl.searchParams.set('headless_origin', window.location.origin);
    storeUrl.searchParams.set('checkout_url', checkoutUrlObj.toString());
    window.location.href = storeUrl.toString();
  }, [checkoutUrl, isCustomerLoggedIn]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-[450px] flex-col p-0">
        <SheetHeader className="border-b px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-baseline gap-2">
              Your Cart
              {totalQuantity > 0 && (
                <span className="text-muted-foreground text-sm font-medium">({totalQuantity})</span>
              )}
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center py-20">
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
                <li key={lineId} className="border-muted flex flex-col border-b pb-6">
                  <div className="flex gap-4">
                    {image ? (
                      <div
                        className="bg-muted size-24 shrink-0 rounded-lg border bg-cover bg-center"
                        style={{ backgroundImage: `url("${image}")` }}
                      />
                    ) : (
                      <div className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-lg border text-xs">
                        No image
                      </div>
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-sm font-semibold">{title}</p>
                        {variant && variant !== 'Default Title' && (
                          <p className="text-muted-foreground mt-1 text-sm">{variant}</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 rounded-lg border p-1">
                          <button
                            className="text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md"
                            onClick={() => updateQuantity(lineId, qty - 1)}
                            disabled={isLoading || qty <= 1}
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{qty}</span>
                          <button
                            className="text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md"
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
                    className="text-primary mt-3 ml-auto flex items-center gap-1 text-xs font-semibold hover:underline"
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
          <SheetFooter className="bg-background mt-auto flex-col gap-4 border-t p-6">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">Total</span>
              {totalAmount && (
                <span className="text-xl font-extrabold">
                  ${parseFloat(totalAmount.amount || '0').toFixed(2)} {totalAmount.currencyCode}
                </span>
              )}
            </div>
            <Separator />
            <p className="text-muted-foreground text-center text-xs">
              Shipping calculated at checkout
            </p>
            <Button
              className="w-full"
              size="lg"
              disabled={!checkoutUrl || isLoading}
              onClick={handleCheckout}
            >
              Checkout
            </Button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-primary w-full pt-2 text-center text-sm font-semibold"
            >
              Continue Shopping
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
