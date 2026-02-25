'use client';

import { ITEM_TYPE_STYLE } from '@bowerbird-poc/shared/constants';
import type { SearchItem } from '@bowerbird-poc/shared/types';

import { cn } from '@bowerbird-poc/ui/lib/utils';

import { Badge } from './badge';
import { Skeleton } from './skeleton';

interface PolaroidCardProps {
  item: SearchItem;
  onClick?: () => void;
  className?: string;
}

export function PolaroidCard({ item, onClick, className }: PolaroidCardProps) {
  const style = ITEM_TYPE_STYLE[item.itemType];

  return (
    <div
      className={cn(
        'group cursor-pointer rounded-xl border-[12px] border-white bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg',
        className,
      )}
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-muted">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}
        {style && (
          <Badge
            variant="secondary"
            className={cn('absolute top-2 left-2', style.bg, style.color)}
          >
            {style.label}
          </Badge>
        )}
      </div>
      <div className="pb-3 pt-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-tight group-hover:text-primary">
          {item.title}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{item.category}</p>
        {item.forSale && item.price && (
          <p className="mt-2 text-sm font-bold text-primary">{item.price}</p>
        )}
        {!item.forSale && (
          <p className="mt-2 text-xs font-medium text-amber-600">Digitisation on request</p>
        )}
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border-[12px] border-white bg-white shadow-md">
      <Skeleton className="aspect-[3/4] w-full rounded-sm" />
      <div className="pb-3 pt-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-3 h-4 w-16" />
      </div>
    </div>
  );
}
