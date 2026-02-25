'use client';

import { ArchiveHero } from '@bowerbird-poc/ui/components/archive-hero';
import Link from 'next/link';

export function HeroSection() {
  return (
    <ArchiveHero
      renderLink={({ href, className, children }) => (
        <Link href={href} className={className}>
          {children}
        </Link>
      )}
    />
  );
}
