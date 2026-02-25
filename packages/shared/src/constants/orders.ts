import type { OrderStatus } from '../types/orders';

export const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { label: string; color: string; bg: string }
> = {
  processing: { label: 'Processing', color: 'text-amber-600', bg: 'bg-amber-500/10' },
  shipped: { label: 'Shipped', color: 'text-primary', bg: 'bg-primary/10' },
  out_for_delivery: {
    label: 'Out for Delivery',
    color: 'text-purple-600',
    bg: 'bg-purple-500/10',
  },
  delivered: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-500/10' },
};
