'use client';

import { ITEM_TYPE_STYLE } from '@bowerbird-poc/shared/constants';
import type { SearchFilters, SearchItem, ItemType } from '@bowerbird-poc/shared/types';
import * as React from 'react';

import { cn } from '@bowerbird-poc/ui/lib/utils';

import { Checkbox } from './checkbox';
import { Label } from './label';

interface FilterSidebarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  items: SearchItem[];
  className?: string;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-black tracking-[0.15em] text-gray-400 uppercase">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function FilterSidebar({ filters, onChange, items, className }: FilterSidebarProps) {
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    items.forEach((item) => {
      if (item.category) cats.add(item.category);
    });
    return Array.from(cats).sort();
  }, [items]);

  const tags = React.useMemo(() => {
    const tagSet = new Set<string>();
    items.forEach((item) => item.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [items]);

  const itemTypes: ItemType[] = ['document', 'photograph', 'film', 'audio', 'map', 'microfilm'];

  const toggleItemType = (type: ItemType) => {
    const next = filters.itemTypes.includes(type)
      ? filters.itemTypes.filter((t) => t !== type)
      : [...filters.itemTypes, type];
    onChange({ ...filters, itemTypes: next });
  };

  const toggleCategory = (cat: string) => {
    const next = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onChange({ ...filters, categories: next });
  };

  const toggleTag = (tag: string) => {
    const next = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags: next });
  };

  return (
    <aside className={cn('w-full space-y-8 lg:w-64 lg:shrink-0', className)}>
      <FilterGroup title="Item Type">
        {itemTypes.map((type) => {
          const style = ITEM_TYPE_STYLE[type];
          return (
            <div key={type} className="flex items-center gap-2">
              <Checkbox
                id={`type-${type}`}
                checked={filters.itemTypes.includes(type)}
                onCheckedChange={() => toggleItemType(type)}
              />
              <Label htmlFor={`type-${type}`} className="flex items-center gap-2 text-sm">
                <span className={cn('size-2 rounded-full', style.dot)} />
                {style.label}
              </Label>
            </div>
          );
        })}
      </FilterGroup>

      {categories.length > 0 && (
        <FilterGroup title="Category">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={filters.categories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              <Label htmlFor={`cat-${cat}`} className="text-sm">
                {cat}
              </Label>
            </div>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="Availability">
        <div className="flex items-center gap-2">
          <Checkbox
            id="for-sale"
            checked={filters.forSaleOnly}
            onCheckedChange={(checked) => onChange({ ...filters, forSaleOnly: checked === true })}
          />
          <Label htmlFor="for-sale" className="text-sm">
            Available for purchase
          </Label>
        </div>
      </FilterGroup>

      {tags.length > 0 && (
        <FilterGroup title="Tags">
          {tags.slice(0, 15).map((tag) => (
            <div key={tag} className="flex items-center gap-2">
              <Checkbox
                id={`tag-${tag}`}
                checked={filters.tags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
              />
              <Label htmlFor={`tag-${tag}`} className="text-sm">
                {tag}
              </Label>
            </div>
          ))}
        </FilterGroup>
      )}
    </aside>
  );
}
