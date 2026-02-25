'use client';

import { ShopifyProvider, CartProvider } from '@shopify/hydrogen-react';

const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const storefrontToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN || '';

export function ShopifyProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!storeDomain || !storefrontToken) {
    console.warn('Shopify env vars missing — cart features will be unavailable');
    return (
      <ShopifyProvider
        storeDomain="placeholder.myshopify.com"
        storefrontToken="placeholder"
        storefrontApiVersion="2025-01"
        countryIsoCode="AU"
        languageIsoCode="EN"
      >
        <CartProvider>{children}</CartProvider>
      </ShopifyProvider>
    );
  }

  return (
    <ShopifyProvider
      storeDomain={storeDomain}
      storefrontToken={storefrontToken}
      storefrontApiVersion="2025-01"
      countryIsoCode="AU"
      languageIsoCode="EN"
    >
      <CartProvider>{children}</CartProvider>
    </ShopifyProvider>
  );
}
