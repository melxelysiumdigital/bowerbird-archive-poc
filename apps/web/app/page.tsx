'use client';

import { CategoryGrid } from '@/components/home/category-grid';
import { FeaturedSection } from '@/components/home/featured-section';
import { HeroSection } from '@/components/home/hero-section';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { PhilosophySection } from '@/components/home/philosophy-section';
import { useAzureSearch } from '@/hooks/use-azure-search';

export default function HomePage() {
  const { items, isLoading } = useAzureSearch();

  return (
    <>
      <HeroSection />
      <PhilosophySection />
      <FeaturedSection items={items} isLoading={isLoading} />
      <CategoryGrid />
      <NewsletterSection />
    </>
  );
}
