'use client';

import type { ItemProperties, SearchItem } from '@bowerbird-poc/shared/types';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { useShopifyCart } from '@/hooks/use-shopify-cart';

// ─── Types ───────────────────────────────────────────────────

/** A non-digitised item held locally until checkout creates a draft order. */
export interface RequestCartItem {
  /** Stable local id (item_id based) */
  localId: string;
  item: {
    id: string;
    title: string;
    itemType: string;
    controlSymbol: string;
    barcode: string;
    series: string;
    image: string;
  };
  addedAt: number;
}

export type CheckoutResult = 'idle' | 'requests_submitted' | 'error';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface UnifiedCartContextValue {
  // --- Shopify (digitised) side ---
  shopifyLines: any[];
  shopifyTotalQuantity: number;
  shopifyCheckoutUrl: string | null;
  shopifyCost: { totalAmount?: { amount: string; currencyCode: string } } | undefined;
  addShopifyItem: (variantId: string, quantity: number, props: ItemProperties) => void;
  removeShopifyItem: (lineId: string) => void;
  updateShopifyQuantity: (lineId: string, quantity: number) => void;

  // --- Request (non-digitised) side ---
  requestItems: RequestCartItem[];
  addRequestItem: (item: SearchItem) => void;
  removeRequestItem: (localId: string) => void;
  hasRequestItem: (itemId: string) => boolean;

  // --- Combined ---
  totalQuantity: number;
  isLoading: boolean;

  // --- Checkout ---
  checkout: (requestNotes?: string) => Promise<void>;
  isCheckingOut: boolean;
  checkoutResult: CheckoutResult;
  checkoutError: string | null;
  resetCheckoutResult: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const UnifiedCartContext = createContext<UnifiedCartContextValue | null>(null);

// ─── localStorage helpers ────────────────────────────────────

const STORAGE_KEY = 'bowerbird_request_cart';

function loadRequestItems(): RequestCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRequestItems(items: RequestCartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Provider ────────────────────────────────────────────────

export function UnifiedCartProvider({ children }: { children: React.ReactNode }) {
  const shopify = useShopifyCart();
  const { lines: shopifyLines, checkoutUrl: shopifyCheckoutUrl, updateCartAttributes } = shopify;
  const { isAuthenticated, user, loginWithRedirect } = useAuth();

  const [requestItems, setRequestItems] = useState<RequestCartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setRequestItems(loadRequestItems());
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    saveRequestItems(requestItems);
  }, [requestItems]);

  const addRequestItem = useCallback(
    (searchItem: SearchItem) => {
      setRequestItems((prev) => {
        if (prev.some((r) => r.item.id === searchItem.id)) return prev;
        return [
          ...prev,
          {
            localId: `req_${searchItem.id}`,
            item: {
              id: searchItem.id,
              title: searchItem.title,
              itemType: searchItem.itemType,
              controlSymbol: searchItem.controlSymbol,
              barcode: searchItem.barcode,
              series: searchItem.series,
              image: searchItem.image,
            },
            addedAt: Date.now(),
          },
        ];
      });
      // Set cart attribute so checkout extension knows request items exist
      updateCartAttributes([{ key: 'has_request_items', value: 'true' }]);
    },
    [updateCartAttributes],
  );

  const removeRequestItem = useCallback(
    (localId: string) => {
      setRequestItems((prev) => {
        const next = prev.filter((r) => r.localId !== localId);
        if (next.length === 0) {
          updateCartAttributes([{ key: 'has_request_items', value: 'false' }]);
        }
        return next;
      });
    },
    [updateCartAttributes],
  );

  const hasRequestItem = useCallback(
    (itemId: string) => requestItems.some((r) => r.item.id === itemId),
    [requestItems],
  );

  const resetCheckoutResult = useCallback(() => {
    setCheckoutResult('idle');
    setCheckoutError(null);
  }, []);

  const totalQuantity = (shopify.totalQuantity ?? 0) + requestItems.length;

  /**
   * Split checkout:
   * 1. Auth-gate if request items exist (need email for draft order)
   * 2. Create draft order for all request items in one batch call
   * 3. Redirect to Shopify checkout for paid items (if any)
   * 4. If only request items, show success state
   */
  const checkout = useCallback(
    async (requestNotes?: string) => {
      setIsCheckingOut(true);
      setCheckoutResult('idle');
      setCheckoutError(null);

      try {
        // --- Auth gate: request items need an email ---
        if (requestItems.length > 0 && !isAuthenticated) {
          loginWithRedirect();
          return;
        }

        // --- Create draft order for request items (single batch call) ---
        const hadRequestItems = requestItems.length > 0;
        if (hadRequestItems) {
          const email =
            (user as { email?: string })?.email ||
            (user as { sub?: string })?.sub ||
            '';
          const name = (user as { name?: string })?.name || '';
          const [firstName, ...rest] = name.trim().split(' ');

          const res = await fetch('/api/shopify/draft-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email || '',
              firstName: firstName || '',
              lastName: rest.join(' '),
              notes: requestNotes
                ? `Additional information:\n${requestNotes}`
                : 'Submitted via unified cart checkout',
              items: requestItems.map((r) => r.item),
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed to create digitisation request');
          }

          // Clear request items from local cart
          setRequestItems([]);
          saveRequestItems([]);
        }

        // --- Redirect to Shopify checkout for paid items ---
        if (shopifyLines.length > 0 && shopifyCheckoutUrl) {
          const checkoutUrlObj = new URL(shopifyCheckoutUrl);
          if (isAuthenticated) {
            checkoutUrlObj.searchParams.set('logged_in', 'true');
          }
          const storeUrl = new URL(checkoutUrlObj.origin);
          storeUrl.searchParams.set('headless_origin', window.location.origin);
          storeUrl.searchParams.set('has_request_items', hadRequestItems ? 'true' : 'false');
          storeUrl.searchParams.set('checkout_url', checkoutUrlObj.toString());
          window.location.href = storeUrl.toString();
          return; // page is navigating away
        }

        // Only had request items — show success state
        setCheckoutResult('requests_submitted');
      } catch (err) {
        setCheckoutResult('error');
        setCheckoutError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsCheckingOut(false);
      }
    },
    [
      requestItems,
      shopifyLines,
      shopifyCheckoutUrl,
      updateCartAttributes,
      isAuthenticated,
      user,
      loginWithRedirect,
    ],
  );

  const value: UnifiedCartContextValue = {
    shopifyLines: shopify.lines,
    shopifyTotalQuantity: shopify.totalQuantity ?? 0,
    shopifyCheckoutUrl: shopify.checkoutUrl,
    shopifyCost: shopify.cost,
    addShopifyItem: shopify.addItem,
    removeShopifyItem: shopify.removeFromCart,
    updateShopifyQuantity: shopify.updateQuantity,
    requestItems,
    addRequestItem,
    removeRequestItem,
    hasRequestItem,
    totalQuantity,
    isLoading: shopify.isLoading,
    checkout,
    isCheckingOut,
    checkoutResult,
    checkoutError,
    resetCheckoutResult,
  };

  return <UnifiedCartContext.Provider value={value}>{children}</UnifiedCartContext.Provider>;
}

export function useUnifiedCart() {
  const ctx = useContext(UnifiedCartContext);
  if (!ctx) throw new Error('useUnifiedCart must be used within UnifiedCartProvider');
  return ctx;
}
