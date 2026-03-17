'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MembershipStatus {
  isMember: boolean;
  tags: string[];
  customerSince: string | null;
  subscriptionOrder: { id: string; name: string } | null;
}

export function useMembership(email: string | undefined) {
  const [membership, setMembership] = useState<MembershipStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    if (!email) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopify/subscriptions?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to check membership');
      }
      const data = await res.json();
      setMembership(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check membership');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  return { membership, isLoading, error, refresh: fetchMembership };
}
