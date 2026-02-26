'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { ShopifyCustomerAuth } from '@/lib/shopify-customer-auth';

const client = typeof window !== 'undefined' ? new ShopifyCustomerAuth() : null;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; name?: string; picture?: string } | undefined>(
    undefined,
  );
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current || !client) return;
    initRef.current = true;

    if (!client.configured) {
      setIsLoading(false);
      return;
    }

    if (client.isAuthenticated()) {
      // Pre-emptively refresh if near expiry
      client
        .getAccessToken()
        .then((token) => {
          if (token) {
            setIsAuthenticated(true);
            setUser(client.getUserFromIdToken() ?? undefined);
          }
        })
        .catch(() => {
          // Token refresh failed — treat as logged out
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const loginWithRedirect = useCallback(async () => {
    if (!client?.configured) return;
    const url = await client.getAuthorizationUrl();
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    if (!client?.configured) return;
    client.logout();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    client,
  };
}
