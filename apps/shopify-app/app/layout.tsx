import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Bowerbird Archive — Shopify App',
  description: 'Bowerbird Archive Shopify embedded app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
