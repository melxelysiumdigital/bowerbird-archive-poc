export interface AdminOrder {
  id: number;
  name: string;
  created_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  currency: string;
  line_items: Array<{
    name: string;
    title: string;
    quantity: number;
    price: string;
    variant_title: string | null;
    properties: Array<{ name: string; value: string }>;
  }>;
  shipping_address?: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  fulfillments: Array<{
    tracking_company: string | null;
    tracking_number: string | null;
    tracking_url: string | null;
  }>;
}

export interface AdminDraftOrder {
  id: number;
  name: string;
  status: 'open' | 'invoice_sent' | 'completed';
  created_at: string;
  invoice_url: string | null;
  total_price: string;
  currency: string;
  note: string | null;
  tags: string;
  line_items: Array<{
    title: string;
    price: string;
    quantity: number;
    properties: Array<{ name: string; value: string }>;
  }>;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | null;
  order_id: number | null;
  order_tags: string;
  order_fulfillment: string | null;
  order_cancelled: boolean;
}
