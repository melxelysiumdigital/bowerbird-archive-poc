'use client';

import { cn } from '@bowerbird-poc/ui/lib/utils';

interface PriceDisplayProps {
  price: number | string;
  currencyCode?: string;
  compareAtPrice?: number | string;
  quantity?: number;
  className?: string;
}

function formatPrice(price: number | string, currencyCode = 'AUD'): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(amount)) return String(price);
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount);
}

export function PriceDisplay({
  price,
  currencyCode = 'AUD',
  compareAtPrice,
  quantity = 1,
  className,
}: PriceDisplayProps) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const total = isNaN(numPrice) ? price : numPrice * quantity;
  const hasCompare = compareAtPrice !== undefined && compareAtPrice !== price;

  return (
    <span className={cn('tabular-nums', className)}>
      <span className={cn('text-xl font-bold', hasCompare ? 'text-destructive' : 'text-primary')}>
        {typeof total === 'number' ? formatPrice(total, currencyCode) : total}
      </span>
      {hasCompare && (
        <span className="ml-2 text-sm text-muted-foreground line-through">
          {formatPrice(compareAtPrice, currencyCode)}
        </span>
      )}
    </span>
  );
}
