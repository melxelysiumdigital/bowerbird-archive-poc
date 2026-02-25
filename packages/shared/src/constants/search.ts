import type { ItemType, SearchFilters, SortOption } from '../types/search';

export const EMPTY_FILTERS: SearchFilters = {
  itemTypes: [],
  categories: [],
  forSaleOnly: false,
  tags: [],
};

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'title_az', label: 'Title A\u2013Z' },
];

export const ITEM_TYPE_STYLE: Record<
  ItemType,
  { label: string; color: string; bg: string; dot: string }
> = {
  document: { label: 'Document', color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-blue-500' },
  photograph: {
    label: 'Photograph',
    color: 'text-amber-600',
    bg: 'bg-amber-500/10',
    dot: 'bg-amber-500',
  },
  film: { label: 'Film', color: 'text-red-600', bg: 'bg-red-500/10', dot: 'bg-red-500' },
  audio: {
    label: 'Audio',
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
    dot: 'bg-purple-500',
  },
  map: {
    label: 'Map',
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    dot: 'bg-emerald-500',
  },
  microfilm: {
    label: 'Microfilm',
    color: 'text-gray-600',
    bg: 'bg-gray-500/10',
    dot: 'bg-gray-500',
  },
};
