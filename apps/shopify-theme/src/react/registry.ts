import { HeroBanner } from '@bowerbird-poc/ui/components/hero-banner';
import { ProductCard } from '@bowerbird-poc/ui/components/product-card';

export const registry: Record<string, React.ComponentType<any>> = {
  HeroBanner,
  ProductCard,
};
