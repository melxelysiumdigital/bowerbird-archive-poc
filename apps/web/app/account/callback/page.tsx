'use client';

import { Button } from '@bowerbird-poc/ui/components/button';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ShopifyCustomerAuth } from '@/lib/shopify-customer-auth';

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      setError('Missing authorization parameters');
      return;
    }

    const client = new ShopifyCustomerAuth();
    client
      .handleCallback(code, state)
      .then(() => router.replace('/account/orders'))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Authentication failed'),
      );
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-md px-6 py-20 text-center">
        <h2 className="mb-4 text-2xl font-bold">Sign in failed</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
      <p className="text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </React.Suspense>
  );
}
