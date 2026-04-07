'use client';

import { useState, useEffect, useRef } from 'react';

import { CartDrawer } from './cart-drawer';
import { DiscountPopup } from './discount-popup';
import { DonationDrawer } from './donation-drawer';
import { Navbar } from './navbar';

import { useAuth } from '@/hooks/use-auth';
import { useShopifyCart } from '@/hooks/use-shopify-cart';
import { useUnifiedCart } from '@/hooks/use-unified-cart';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);
  const { isAuthenticated, user, loginWithRedirect, client } = useAuth();
  const { attachCustomer } = useShopifyCart();
  const { totalQuantity } = useUnifiedCart();
  const hasAttached = useRef(false);

  // Attach customer identity to cart so checkout recognises the user
  useEffect(() => {
    if (!isAuthenticated || !client || hasAttached.current) return;
    hasAttached.current = true;

    client.getAccessToken().then((token) => {
      if (token) {
        attachCustomer(token);
      }
    });
  }, [isAuthenticated, client, attachCustomer]);

  return (
    <>
      <Navbar
        onCartClick={() => setCartOpen(true)}
        onDonateClick={() => setDonationOpen(true)}
        cartCount={totalQuantity}
        isAuthenticated={isAuthenticated}
        userAvatar={(user as { picture?: string })?.picture}
        onLoginClick={() => loginWithRedirect()}
      />
      {children}
      <DiscountPopup />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <DonationDrawer isOpen={donationOpen} onClose={() => setDonationOpen(false)} />
    </>
  );
}
