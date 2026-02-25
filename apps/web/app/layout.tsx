import type { Metadata } from 'next';
import { Manrope, Playfair_Display } from 'next/font/google';

import { AppShell } from '@/components/app-shell';
import { Footer } from '@/components/footer';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ShopifyProviderWrapper } from '@/components/providers/shopify-provider';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bowerbird Archive',
  description:
    'Preserving and providing access to Australia\u2019s historical records. Browse, purchase, and request digitisation of archival materials.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfairDisplay.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ShopifyProviderWrapper>
            <div className="flex min-h-screen flex-col">
              <AppShell>
                <main className="flex-1">{children}</main>
              </AppShell>
              <Footer />
            </div>
          </ShopifyProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
