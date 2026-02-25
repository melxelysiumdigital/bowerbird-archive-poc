export type OrderStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface CustomerOrderLineItem {
  title: string;
  quantity: number;
  variant?: {
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    image?: {
      url: string;
      altText?: string;
    };
  };
  customAttributes: Array<{
    key: string;
    value: string;
  }>;
}

export interface CustomerOrder {
  id: string;
  orderNumber: number;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  lineItems: {
    nodes: CustomerOrderLineItem[];
  };
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
  successfulFulfillments?: Array<{
    trackingCompany?: string;
    trackingInfo: Array<{
      number: string;
      url?: string;
    }>;
  }>;
}
