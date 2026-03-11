'use client';

import { Button } from '@bowerbird-poc/ui/components/button';
import { Input } from '@bowerbird-poc/ui/components/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@bowerbird-poc/ui/components/sheet';
import { Heart, X, Check, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { useShopifyCart } from '@/hooks/use-shopify-cart';
import {
  DONATION_PRODUCT_HANDLE,
  fetchDonationProduct,
  type DonationProduct,
} from '@/lib/donation-config';

function DonationSuccess() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-full">
        <Check className="size-8" />
      </div>
      <p className="text-lg font-semibold">Thank you!</p>
      <p className="text-muted-foreground text-sm">Your donation has been added to the cart.</p>
    </div>
  );
}

interface DonationFormProps {
  product: DonationProduct;
  onSuccess: () => void;
}

function DonationForm({ product, onSuccess }: DonationFormProps) {
  const { addItem, isLoading } = useShopifyCart();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const handleAddDonation = useCallback(async () => {
    if (customMode && product.customVariantId) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 1) return;
      await addItem(product.customVariantId, 1, {
        item_title: 'Donation',
        _donation_amount: String(amount),
        'Donation Amount': `$${amount.toFixed(2)}`,
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (selectedPreset !== null) {
      const preset = product.presets[selectedPreset];
      if (!preset) return;
      await addItem(preset.id, 1, { item_title: 'Donation' } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    onSuccess();
  }, [customMode, customAmount, selectedPreset, addItem, product, onSuccess]);

  const customAmountNum = parseFloat(customAmount);
  const canAdd = customMode
    ? !isNaN(customAmountNum) && customAmountNum >= 1
    : selectedPreset !== null;

  return (
    <>
      <p className="text-muted-foreground text-sm">
        Support the Bowerbird Archive. Choose a preset amount or enter a custom donation.
      </p>

      <div className="flex gap-3">
        {product.presets.map((preset, idx) => (
          <Button
            key={preset.id}
            variant={selectedPreset === idx && !customMode ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setSelectedPreset(idx);
              setCustomMode(false);
            }}
          >
            {preset.title}
          </Button>
        ))}
        {product.customVariantId && (
          <Button
            variant={customMode ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => {
              setCustomMode(true);
              setSelectedPreset(null);
            }}
          >
            Custom
          </Button>
        )}
      </div>

      {customMode && (
        <div className="relative">
          <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium">
            $
          </span>
          <Input
            type="number"
            min="1"
            step="0.01"
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="pl-7"
          />
          {customAmount && customAmountNum < 1 && (
            <p className="text-destructive mt-1 text-xs">Minimum donation is $1.00</p>
          )}
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!canAdd || isLoading}
        onClick={handleAddDonation}
      >
        {isLoading ? 'Adding...' : 'Add Donation'}
      </Button>
    </>
  );
}

interface DonationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DonationDrawer({ isOpen, onClose }: DonationDrawerProps) {
  const [success, setSuccess] = useState(false);
  const [product, setProduct] = useState<DonationProduct | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSuccess(false);

    // Fetch once, cache in state
    if (product) return;
    setLoading(true);
    fetchDonationProduct(DONATION_PRODUCT_HANDLE)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [isOpen, product]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full max-w-[450px] flex-col p-0">
        <SheetHeader className="border-b px-6 py-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Heart className="size-5" />
              Make a Donation
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-6 px-6 py-6">
          {loading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}
          {!loading && !product && (
            <p className="text-muted-foreground text-sm">
              Donation options are not available right now.
            </p>
          )}
          {!loading && product && !success && (
            <DonationForm product={product} onSuccess={() => setSuccess(true)} />
          )}
          {success && <DonationSuccess />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
