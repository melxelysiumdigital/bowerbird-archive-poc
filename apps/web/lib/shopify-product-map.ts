import type { ItemType } from '@bowerbird-poc/shared/types';

/**
 * Maps archive item types to their corresponding Shopify service product handles.
 * These are the digitisation/copy service products in the bowerbird-archives store.
 */
export const ITEM_TYPE_TO_PRODUCT_HANDLE: Record<ItemType, string> = {
  document: 'recordsearch-digitisation',
  photograph: 'photograph-copy-service',
  film: 'audiovisual-copy-service',
  audio: 'audiovisual-copy-service',
  map: 'photograph-copy-service',
  microfilm: 'recordsearch-digitisation',
};
