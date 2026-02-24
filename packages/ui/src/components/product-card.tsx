import { cn } from '../lib/utils';

import { Button } from './button';
import { Card, CardContent, CardFooter } from './card';

export interface ProductCardProps {
  title: string;
  price: string;
  compareAtPrice?: string;
  imageUrl?: string;
  imageAlt?: string;
  vendor?: string;
  url?: string;
  badge?: string;
  available?: boolean;
}

export function ProductCard({
  title,
  price,
  compareAtPrice,
  imageUrl,
  imageAlt,
  vendor,
  url,
  badge,
  available = true,
}: ProductCardProps) {
  const isOnSale = compareAtPrice && compareAtPrice !== price;

  return (
    <Card className="group/product-card pt-0">
      <a href={url ?? '#'} className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt ?? title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/product-card:scale-105"
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        {badge && (
          <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded-full px-2 py-0.5 text-xs font-medium">
            {badge}
          </span>
        )}
      </a>

      <CardContent className="flex flex-1 flex-col gap-1">
        {vendor && (
          <span className="text-muted-foreground text-xs tracking-wide uppercase">{vendor}</span>
        )}
        <a href={url ?? '#'} className="hover:underline">
          <h3 className="leading-tight font-medium">{title}</h3>
        </a>
        <div className="mt-auto flex items-center gap-2 pt-2">
          <span className={cn('font-semibold', isOnSale && 'text-destructive')}>{price}</span>
          {isOnSale && (
            <span className="text-muted-foreground text-sm line-through">{compareAtPrice}</span>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full" disabled={!available} size="sm">
          {available ? 'Add to Cart' : 'Sold Out'}
        </Button>
      </CardFooter>
    </Card>
  );
}
