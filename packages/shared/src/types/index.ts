export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type { ItemType, ItemProperties, SearchItem, SortOption, SearchFilters } from './search';
export type { OrderStatus, CustomerOrder, CustomerOrderLineItem } from './orders';
export type {
  DigitisationStatus,
  DigitisationRequest,
  DigitisationRequestItem,
  CancelledRequestData,
} from './digitisation';
export type { AdminOrder, AdminDraftOrder } from './shopify-admin';
export type { CustomerInfo } from './auth';
