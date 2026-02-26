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
    buyerIdentityUpdate,
    cartAttributesUpdate,
    error,
  } = cartData;

  const isLoading = status === 'creating' || status === 'updating';

  const addItem = useCallback(
    async (variantId: string, quantity: number, itemProperties: ItemProperties) => {
      const attributes = Object.entries(itemProperties)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([key, value]) => ({ key, value: String(value) }));

      // Include headless_origin so the thank-you checkout extension
      // knows where to redirect back to
      if (typeof window !== 'undefined') {
        attributes.push({ key: 'headless_origin', value: window.location.origin });
      }

      linesAdd([
        {
          merchandiseId: variantId,
          quantity,
          attributes,
        },
      ]);

      // Also set headless_origin as a cart-level attribute so the checkout
      // extension can read it from shopify.attributes.current
      if (typeof window !== 'undefined') {
        cartAttributesUpdate([{ key: 'headless_origin', value: window.location.origin }]);
      }
    },
    [linesAdd, cartAttributesUpdate],
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

  const attachCustomer = useCallback(
    (customerAccessToken: string) => {
      buyerIdentityUpdate({ customerAccessToken });
    },
    [buyerIdentityUpdate],
  );

  return {
    cost: (
      cartData as unknown as { cost?: { totalAmount?: { amount: string; currencyCode: string } } }
    ).cost,
    isLoading,
    totalQuantity: totalQuantity ?? 0,
    checkoutUrl: checkoutUrl ?? null,
    addItem,
    removeFromCart,
    updateQuantity,
    attachCustomer,
    lines: lines ?? [],
    error: error ? new Error(String(error)) : null,
  };
}
