'use client';

import { useState, useEffect, useRef } from 'react';

import { CartDrawer } from './cart-drawer';
import { DiscountPopup } from './discount-popup';
import { Navbar } from './navbar';

import { useAuth } from '@/hooks/use-auth';
import { useShopifyCart } from '@/hooks/use-shopify-cart';
import { useShopifySync } from '@/hooks/use-shopify-sync';


export function AppShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect } = useAuth();
  const { syncCustomer } = useShopifySync();
  const { totalQuantity } = useShopifyCart();
  const hasSynced = useRef(false);

  // Sync Auth0 user to Shopify on first login
  useEffect(() => {
    if (isAuthenticated && user?.email && !hasSynced.current) {
      hasSynced.current = true;
      const auth0User = user as { email?: string; given_name?: string; family_name?: string };
      syncCustomer(user.email, auth0User.given_name, auth0User.family_name).catch((err: unknown) =>
        console.error('Customer sync failed:', err),
      );
    }
  }, [isAuthenticated, user, syncCustomer]);

  return (
    <>
      <Navbar
        onCartClick={() => setCartOpen(true)}
        cartCount={totalQuantity}
        isAuthenticated={isAuthenticated}
        userAvatar={(user as { picture?: string })?.picture}
        onLoginClick={() => loginWithRedirect()}
      />
      {children}
      <DiscountPopup />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
