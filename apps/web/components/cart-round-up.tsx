'use client';

import { Button } from '@bowerbird-poc/ui/components/button';
import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useShopifyCart } from '@/hooks/use-shopify-cart';
import {
  DONATION_PRODUCT_HANDLE,
  fetchDonationProduct,
  type DonationProduct,
} from '@/lib/donation-config';

interface CartRoundUpProps {
  totalAmount: number;
}

export function CartRoundUp({ totalAmount }: CartRoundUpProps) {
  const { addItem, isLoading, lines } = useShopifyCart();
  const [product, setProduct] = useState<DonationProduct | null>(null);

  useEffect(() => {
    fetchDonationProduct(DONATION_PRODUCT_HANDLE).then(setProduct);
  }, []);

  if (!product?.customVariantId) return null;

  // Hide if a donation line already exists
  const allVariantIds = new Set([product.customVariantId, ...product.presets.map((p) => p.id)]);
  const hasDonation = lines.some(
    (line: any) => allVariantIds.has(line.merchandise?.id as string), // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  if (hasDonation) return null;

  // Calculate round-up amount
  const ceilTotal = Math.ceil(totalAmount);
  let roundUpAmount = ceilTotal - totalAmount;
  const roundUpTarget = ceilTotal;

  if (roundUpAmount < 0.01) {
    roundUpAmount = 1.0;
  }

  const handleRoundUp = async () => {
    await addItem(product.customVariantId!, 1, {
      item_title: 'Donation',
      _donation_amount: String(roundUpAmount.toFixed(2)),
      'Donation Amount': `$${roundUpAmount.toFixed(2)}`,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full gap-2"
      disabled={isLoading}
      onClick={handleRoundUp}
    >
      <Heart className="size-3.5" />
      Round up to ${(roundUpAmount < 1 ? roundUpTarget : totalAmount + 1).toFixed(2)} (+$
      {roundUpAmount.toFixed(2)} donation)
    </Button>
  );
}
