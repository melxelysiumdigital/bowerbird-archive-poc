'use client';

import type { AdminOrder } from '@bowerbird-poc/shared/types';
import { useCallback } from 'react';


import { useAuth } from './use-auth';

interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export function useShopifySync() {
  const { getAccessTokenSilently } = useAuth();

  const syncCustomer = useCallback(
    async (
      email: string,
      firstName?: string,
      lastName?: string,
    ): Promise<ShopifyCustomer> => {
      const token = await getAccessTokenSilently();
      const res = await fetch('/api/shopify/sync-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, firstName, lastName }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Customer sync failed: ${text}`);
      }
      return res.json();
    },
    [getAccessTokenSilently],
  );

  const getOrders = useCallback(
    async (email: string): Promise<AdminOrder[]> => {
      const token = await getAccessTokenSilently();
      const res = await fetch(`/api/shopify/orders?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch orders: ${text}`);
      }
      const data = await res.json();
      return data.orders ?? [];
    },
    [getAccessTokenSilently],
  );

  return { syncCustomer, getOrders };
}
