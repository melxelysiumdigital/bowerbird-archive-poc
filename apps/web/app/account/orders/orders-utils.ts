import type { OrderStatus } from '@bowerbird-poc/shared/types';

// ─── Customer Account API GraphQL query ─────────────────────
export const CUSTOMER_ORDERS_QUERY = `
  query CustomerOrders($first: Int!) {
    customer {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          number
          name
          processedAt
          financialStatus
          fulfillmentStatus
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 20) {
            nodes {
              title
              quantity
              variantTitle
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              customAttributes {
                key
                value
              }
            }
          }
          shippingAddress {
            firstName
            lastName
            address1
            address2
            city
            province
            zip
            country
          }
          fulfillments(first: 5) {
            nodes {
              trackingInformation {
                company
                number
                url
              }
            }
          }
        }
      }
    }
  }
`;

// ─── Order data shape ────────────────────────────────────────
export interface OrderData {
  id: string;
  date: string;
  status: OrderStatus;
  total: string;
  itemCount: number;
  trackingNumber?: string;
  carrier?: string;
  items?: Array<{
    title: string;
    variant: string;
    price: string;
    quantity: number;
    image: string;
  }>;
  shippingAddress?: {
    name: string;
    line1: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  paymentMethod?: string;
  currentStep: number;
}

// ─── Customer Account API response types ─────────────────────
export interface CustomerLineItem {
  title: string;
  quantity: number;
  variantTitle?: string;
  price?: { amount: string; currencyCode: string };
  image?: { url: string; altText?: string };
  customAttributes: Array<{ key: string; value: string }>;
}

export interface CustomerOrderNode {
  id: string;
  number: number;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: { amount: string; currencyCode: string };
  lineItems: { nodes: CustomerLineItem[] };
  shippingAddress?: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  fulfillments: {
    nodes: Array<{
      trackingInformation: Array<{
        company?: string;
        number?: string;
        url?: string;
      }>;
    }>;
  };
}

// ─── Transform Customer Account API Order ────────────────────
export function transformCustomerOrder(order: CustomerOrderNode): OrderData {
  const statusMap: Record<string, OrderStatus> = {
    UNFULFILLED: 'processing',
    PARTIALLY_FULFILLED: 'processing',
    FULFILLED: 'delivered',
    RESTOCKED: 'cancelled',
  };

  const fulfillmentStatus = order.fulfillmentStatus || 'UNFULFILLED';
  const status = statusMap[fulfillmentStatus] || 'processing';

  const stepMap: Record<OrderStatus, number> = {
    processing: 2,
    shipped: 3,
    out_for_delivery: 4,
    delivered: 5,
    cancelled: 1,
  };

  const fulfillment = order.fulfillments.nodes[0];
  const tracking = fulfillment?.trackingInformation[0];

  const items = order.lineItems.nodes.map((item) => {
    const imageAttr = item.customAttributes.find((a) => a.key === 'item_image');
    const titleAttr = item.customAttributes.find((a) => a.key === 'item_title');

    return {
      title: titleAttr?.value || item.title,
      variant: item.variantTitle || 'Standard',
      price: item.price ? `$${parseFloat(item.price.amount).toFixed(2)}` : '$0.00',
      quantity: item.quantity,
      image: imageAttr?.value || item.image?.url || '',
    };
  });

  return {
    id: order.name,
    date: new Date(order.processedAt).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    status,
    total: `$${parseFloat(order.totalPrice.amount).toFixed(2)} ${order.totalPrice.currencyCode}`,
    itemCount: order.lineItems.nodes.reduce((sum, item) => sum + item.quantity, 0),
    trackingNumber: tracking?.number ?? undefined,
    carrier: tracking?.company ?? undefined,
    items,
    shippingAddress: order.shippingAddress
      ? {
          name: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
          line1:
            order.shippingAddress.address1 +
            (order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ''),
          city: order.shippingAddress.city,
          state: order.shippingAddress.province,
          postcode: order.shippingAddress.zip,
          country: order.shippingAddress.country,
        }
      : undefined,
    currentStep: stepMap[status],
  };
}
