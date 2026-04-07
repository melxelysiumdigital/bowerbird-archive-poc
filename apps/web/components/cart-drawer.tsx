'use client';

import { Badge } from '@bowerbird-poc/ui/components/badge';
import { Button } from '@bowerbird-poc/ui/components/button';
import { Separator } from '@bowerbird-poc/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@bowerbird-poc/ui/components/sheet';
import { Textarea } from '@bowerbird-poc/ui/components/textarea';
import { CircleCheckBig, Info, Minus, Plus, Receipt, ScanLine, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { CartRoundUp } from '@/components/cart-round-up';
import type { RequestCartItem } from '@/hooks/use-unified-cart';
import { useUnifiedCart } from '@/hooks/use-unified-cart';

// ─── Shopify line item (digitised / priced) ──────────────────

interface CartLineItemProps {
  line: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  onRemove: (lineId: string) => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  isLoading: boolean;
}

function CartLineItem({ line, onRemove, onUpdateQuantity, isLoading }: CartLineItemProps) {
  const lineId = line.id as string;
  const qty = (line.quantity as number) ?? 1;
  const attrs = (line.attributes ?? []) as Array<{ key: string; value: string }>;
  const title =
    attrs.find((a) => a.key === 'item_title')?.value ?? line.merchandise?.title ?? 'Item';
  const image = attrs.find((a) => a.key === 'item_image')?.value;
  const variant = line.merchandise?.title as string | undefined;
  const price = line.cost?.totalAmount as { amount: string } | undefined;

  return (
    <li className="border-muted flex flex-col border-b pb-6">
      <div className="flex gap-4">
        <ItemImage src={image} />
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
                onClick={() => onUpdateQuantity(lineId, qty - 1)}
                disabled={isLoading || qty <= 1}
              >
                <Minus className="size-3" />
              </button>
              <span className="w-6 text-center text-sm font-bold">{qty}</span>
              <button
                className="text-muted-foreground hover:bg-muted flex size-6 items-center justify-center rounded-md"
                onClick={() => onUpdateQuantity(lineId, qty + 1)}
                disabled={isLoading}
              >
                <Plus className="size-3" />
              </button>
            </div>
            {price && (
              <span className="font-bold">${parseFloat(price.amount || '0').toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
      <button
        className="text-primary mt-3 ml-auto flex items-center gap-1 text-xs font-semibold hover:underline"
        onClick={() => onRemove(lineId)}
        disabled={isLoading}
      >
        <Trash2 className="size-3.5" />
        Remove
      </button>
    </li>
  );
}

// ─── Request line item (copy quote) ─────────────────────────

function RequestCartLineItem({
  item,
  onRemove,
}: {
  item: RequestCartItem;
  onRemove: (localId: string) => void;
}) {
  return (
    <li className="border-muted flex flex-col border-b pb-6">
      <div className="flex gap-4">
        <ItemImage src={item.item.image} />
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <p className="text-sm font-semibold">{item.item.title}</p>
            <Badge variant="secondary" className="mt-1.5 bg-amber-500/10 text-xs text-amber-700">
              <ScanLine className="mr-1 size-3" />
              Copy request
            </Badge>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Qty: 1</span>
            <span className="text-muted-foreground text-sm italic">Quote on request</span>
          </div>
        </div>
      </div>
      <button
        className="text-primary mt-3 ml-auto flex items-center gap-1 text-xs font-semibold hover:underline"
        onClick={() => onRemove(item.localId)}
      >
        <Trash2 className="size-3.5" />
        Remove
      </button>
    </li>
  );
}

// ─── Shared image component ─────────────────────────────────

function ItemImage({ src }: { src?: string }) {
  if (src) {
    return (
      <div
        className="bg-muted size-24 shrink-0 rounded-lg border bg-cover bg-center"
        style={{ backgroundImage: `url("${src}")` }}
      />
    );
  }
  return (
    <div className="bg-muted text-muted-foreground flex size-24 shrink-0 items-center justify-center rounded-lg border text-xs">
      No image
    </div>
  );
}

// ─── Success state after request-only checkout ──────────────

function RequestsSubmittedView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-green-100">
        <CircleCheckBig className="size-7 text-green-600" />
      </div>
      <h3 className="mb-2 text-lg font-bold">Copy Quote Request Submitted</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Our team will review your items and send you a quote via email.
      </p>
      <Button className="w-full gap-2" asChild>
        <Link href="/account/orders">
          <Receipt className="size-4" />
          View Your Requests
        </Link>
      </Button>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-primary mt-4 text-sm font-semibold"
      >
        Continue Shopping
      </button>
    </div>
  );
}

// ─── Cart Drawer Body (extracted to avoid nested ternary) ───

function CartDrawerBody({
  checkoutResult,
  totalQuantity,
  shopifyLines,
  requestItems,
  hasBothTypes,
  isLoading,
  onRemoveShopify,
  onUpdateShopifyQuantity,
  onRemoveRequest,
  requestNotes,
  onRequestNotesChange,
  onClose,
}: {
  checkoutResult: string;
  totalQuantity: number;
  shopifyLines: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  requestItems: RequestCartItem[];
  hasBothTypes: boolean;
  isLoading: boolean;
  onRemoveShopify: (id: string) => void;
  onUpdateShopifyQuantity: (id: string, qty: number) => void;
  onRemoveRequest: (id: string) => void;
  requestNotes: string;
  onRequestNotesChange: (notes: string) => void;
  onClose: () => void;
}) {
  if (checkoutResult === 'requests_submitted') {
    return <RequestsSubmittedView onClose={onClose} />;
  }

  if (totalQuantity === 0) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center py-20">
        <p className="text-sm">Your cart is empty</p>
      </div>
    );
  }

  return (
    <ul className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
      {shopifyLines.length > 0 && (
        <>
          {hasBothTypes && (
            <li className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              Items
            </li>
          )}
          {shopifyLines.map(
            (
              line: any, // eslint-disable-line @typescript-eslint/no-explicit-any
            ) => (
              <CartLineItem
                key={line.id}
                line={line}
                onRemove={onRemoveShopify}
                onUpdateQuantity={onUpdateShopifyQuantity}
                isLoading={isLoading}
              />
            ),
          )}
        </>
      )}

      {requestItems.length > 0 && (
        <>
          {hasBothTypes && <Separator />}
          <li className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
            <ScanLine className="size-3.5" />
            Copy Quote Requests
          </li>
          {requestItems.map((item) => (
            <RequestCartLineItem key={item.localId} item={item} onRemove={onRemoveRequest} />
          ))}
          <li className="flex flex-col gap-1.5">
            <label className="text-muted-foreground text-xs font-semibold">
              Additional information (optional)
            </label>
            <Textarea
              value={requestNotes}
              onChange={(e) => onRequestNotesChange(e.target.value)}
              placeholder="E.g. looking for mention of a specific person in a passenger list, or any other details to help our team."
              rows={3}
              className="text-sm"
            />
          </li>
        </>
      )}
    </ul>
  );
}

// ─── Cart Drawer Footer ─────────────────────────────────────

function MixedCartNotice({
  shopifyCount,
  requestCount,
}: {
  shopifyCount: number;
  requestCount: number;
}) {
  return (
    <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div className="text-xs leading-relaxed text-amber-800">
        <p className="font-semibold">Your cart has two types of items:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>
            <strong>
              {shopifyCount} item{shopifyCount > 1 ? 's' : ''}
            </strong>{' '}
            ready for purchase &mdash; you&apos;ll pay for these now at checkout.
          </li>
          <li>
            <strong>
              {requestCount} copy quote request{requestCount > 1 ? 's' : ''}
            </strong>{' '}
            &mdash; these require custom quoting. We&apos;ll contact you directly with a quote.
          </li>
        </ul>
      </div>
    </div>
  );
}

function CartDrawerFooter({
  hasShopifyItems,
  hasRequestItems,
  totalAmount,
  shopifyCount,
  requestCount,
  checkoutLabel,
  checkoutError,
  isLoading,
  isCheckingOut,
  onCheckout,
  onClose,
}: {
  hasShopifyItems: boolean;
  hasRequestItems: boolean;
  totalAmount: { amount: string; currencyCode: string } | undefined;
  shopifyCount: number;
  requestCount: number;
  checkoutLabel: string;
  checkoutError: string | null;
  isLoading: boolean;
  isCheckingOut: boolean;
  onCheckout: () => void;
  onClose: () => void;
}) {
  const hasBoth = hasShopifyItems && hasRequestItems;

  return (
    <SheetFooter className="bg-background mt-auto flex-col gap-4 border-t p-6">
      {hasBoth && <MixedCartNotice shopifyCount={shopifyCount} requestCount={requestCount} />}

      <div className="flex flex-col gap-1">
        {hasShopifyItems && totalAmount && (
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{hasBoth ? 'Due today' : 'Total'}</span>
            <span className="text-xl font-extrabold">
              ${parseFloat(totalAmount.amount || '0').toFixed(2)} {totalAmount.currencyCode}
            </span>
          </div>
        )}
        {hasRequestItems && !hasBoth && (
          <p className="text-muted-foreground text-sm">
            {requestCount} item{requestCount > 1 ? 's' : ''} for copy quote
          </p>
        )}
      </div>

      {hasShopifyItems && totalAmount && (
        <CartRoundUp totalAmount={parseFloat(totalAmount.amount || '0')} />
      )}
      <Separator />

      {hasShopifyItems && (
        <p className="text-muted-foreground text-center text-xs">Shipping calculated at checkout</p>
      )}

      {checkoutError && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm">
          {checkoutError}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={isLoading || isCheckingOut}
        onClick={onCheckout}
      >
        {isCheckingOut ? (
          <>
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Processing...
          </>
        ) : (
          checkoutLabel
        )}
      </Button>
      <button
        onClick={onClose}
        className="text-muted-foreground hover:text-primary w-full pt-2 text-center text-sm font-semibold"
      >
        Continue Shopping
      </button>
    </SheetFooter>
  );
}

// ─── Cart Drawer ────────────────────────────────────────────

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    shopifyLines,
    shopifyCost,
    removeShopifyItem,
    updateShopifyQuantity,
    requestItems,
    removeRequestItem,
    totalQuantity,
    isLoading,
    checkout,
    isCheckingOut,
    checkoutResult,
    checkoutError,
    resetCheckoutResult,
  } = useUnifiedCart();

  const [requestNotes, setRequestNotes] = useState('');

  const totalAmount = shopifyCost?.totalAmount;
  const hasShopifyItems = shopifyLines.length > 0;
  const hasRequestItems = requestItems.length > 0;
  const hasBothTypes = hasShopifyItems && hasRequestItems;

  const handleClose = () => {
    if (checkoutResult !== 'idle') resetCheckoutResult();
    onClose();
  };

  const checkoutLabel = hasShopifyItems ? 'Checkout' : 'Submit Copy Quote Request';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="flex w-full max-w-[450px] flex-col p-0">
        <SheetHeader className="border-b px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-baseline gap-2">
              Your Cart
              {totalQuantity > 0 && (
                <span className="text-muted-foreground text-sm font-medium">({totalQuantity})</span>
              )}
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={handleClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        <CartDrawerBody
          checkoutResult={checkoutResult}
          totalQuantity={totalQuantity}
          shopifyLines={shopifyLines}
          requestItems={requestItems}
          hasBothTypes={hasBothTypes}
          isLoading={isLoading}
          onRemoveShopify={removeShopifyItem}
          onUpdateShopifyQuantity={updateShopifyQuantity}
          onRemoveRequest={removeRequestItem}
          requestNotes={requestNotes}
          onRequestNotesChange={setRequestNotes}
          onClose={handleClose}
        />

        {totalQuantity > 0 && checkoutResult === 'idle' && (
          <CartDrawerFooter
            hasShopifyItems={hasShopifyItems}
            hasRequestItems={hasRequestItems}
            totalAmount={totalAmount}
            shopifyCount={shopifyLines.length}
            requestCount={requestItems.length}
            checkoutLabel={checkoutLabel}
            checkoutError={checkoutError}
            isLoading={isLoading}
            isCheckingOut={isCheckingOut}
            onCheckout={() => checkout(requestNotes || undefined)}
            onClose={handleClose}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
