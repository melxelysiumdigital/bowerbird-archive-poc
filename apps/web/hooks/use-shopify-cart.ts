'use client';

import type { ItemProperties } from '@bowerbird-poc/shared/types';
import { useCart } from '@shopify/hydrogen-react';
import { useCallback } from 'react';


export function useShopifyCart() {
  const cartData = useCart();
  const {
    status,
    totalQuantity,
    checkoutUrl,
    lines,
    linesAdd,
    linesRemove,
    linesUpdate,
    error,
  } = cartData;

  const isLoading = status === 'creating' || status === 'updating';

  const addItem = useCallback(
    async (variantId: string, quantity: number, itemProperties: ItemProperties) => {
      const attributes = Object.entries(itemProperties)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => ({ key, value: String(value) }));

      linesAdd([
        {
          merchandiseId: variantId,
          quantity,
          attributes,
        },
      ]);
    },
    [linesAdd],
  );

  const removeFromCart = useCallback(
    (lineId: string) => {
      linesRemove([lineId]);
    },
    [linesRemove],
  );

  const updateQuantity = useCallback(
    (lineId: string, quantity: number) => {
      linesUpdate([{ id: lineId, quantity }]);
    },
    [linesUpdate],
  );

  return {
    cost: (cartData as unknown as { cost?: { totalAmount?: { amount: string; currencyCode: string } } }).cost,
    isLoading,
    totalQuantity: totalQuantity ?? 0,
    checkoutUrl: checkoutUrl ?? null,
    addItem,
    removeFromCart,
    updateQuantity,
    lines: lines ?? [],
    error: error ? new Error(String(error)) : null,
  };
}
