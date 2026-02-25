'use client';

import { SORT_OPTIONS } from '@bowerbird-poc/shared/constants';
import type { SortOption } from '@bowerbird-poc/shared/types';

import { cn } from '@bowerbird-poc/ui/lib/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface SortBarProps {
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  resultCount: number;
  isLoading?: boolean;
  className?: string;
}

export function SortBar({ sort, onSortChange, resultCount, isLoading, className }: SortBarProps) {
  return (
    <div className={cn('mb-6 flex items-center justify-between', className)}>
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          <span className="inline-block h-4 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <>
            <span className="font-bold text-foreground">{resultCount}</span> results
          </>
        )}
      </p>
      <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
