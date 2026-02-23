import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'Bowerbird Archive',
  description: 'Bowerbird Archive POC',
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
