export type ItemType = 'document' | 'photograph' | 'film' | 'audio' | 'map' | 'microfilm';

export interface ItemProperties {
  item_title: string;
  item_type: ItemType;
  series_number?: string;
  control_symbol?: string;
  barcode?: string;
  item_id?: string;
  item_image?: string;
}

export interface SearchItem {
  id: string;
  title: string;
  itemType: ItemType;
  series: string;
  controlSymbol: string;
  barcode: string;
  description: string;
  shortDescription: string;
  category: string;
  price: string;
  image: string;
  specs: {
    pages: string;
    dimensions: string;
    resolution: string;
    format: string;
  };
  tags: string[];
  release: string;
  forSale: boolean;
  score: number;
}

export type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'title_az';

export interface SearchFilters {
  itemTypes: ItemType[];
  categories: string[];
  forSaleOnly: boolean;
  tags: string[];
}
