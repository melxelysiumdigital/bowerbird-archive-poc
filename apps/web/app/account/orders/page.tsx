'use client';

import { ORDER_STATUS_STYLES } from '@bowerbird-poc/shared/constants';
import type { OrderStatus, DigitisationRequest } from '@bowerbird-poc/shared/types';
import { Badge } from '@bowerbird-poc/ui/components/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@bowerbird-poc/ui/components/breadcrumb';
import { Button } from '@bowerbird-poc/ui/components/button';
import { cn } from '@bowerbird-poc/ui/lib/utils';
import {
  Receipt,
  ScanLine,
  RefreshCw,
  LogOut,
  User,
  LogIn,
  Info,
  Check,
  Truck,
  Package,
  CircleCheckBig,
  Copy,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { DigitisationRequestCard } from '@/components/digitisation-request-card';
import { useAuth } from '@/hooks/use-auth';
import { useDigitisationRequests } from '@/hooks/use-digitisation-requests';

// ─── Customer Account API GraphQL query ─────────────────────
const CUSTOMER_ORDERS_QUERY = `
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
interface OrderData {
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
interface CustomerLineItem {
  title: string;
  quantity: number;
  variantTitle?: string;
  price?: { amount: string; currencyCode: string };
  image?: { url: string; altText?: string };
  customAttributes: Array<{ key: string; value: string }>;
}

interface CustomerOrderNode {
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
function transformCustomerOrder(order: CustomerOrderNode): OrderData {
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

// ─── Order Step ─────────────────────────────────────────────
const STEP_ICONS: Record<number, React.ComponentType<{ className?: string }>> = {
  3: Truck,
  4: Package,
  5: CircleCheckBig,
};

function OrderStep({
  step,
  label,
  currentStep,
}: {
  step: number;
  label: string;
  currentStep: number;
}) {
  const isCompleted = currentStep > step;
  const isCurrent = currentStep === step;
  const isPending = currentStep < step;
  const Icon = STEP_ICONS[step];

  return (
    <>
      <div className="flex flex-1 flex-col items-center gap-2">
        <div
          className={cn(
            'flex items-center justify-center rounded-full transition-all',
            isCurrent &&
              'border-primary/20 bg-primary shadow-primary/30 -mt-2 size-10 border-4 text-white shadow-lg',
            isCompleted && 'bg-primary size-6 text-white',
            isPending && 'size-6 bg-gray-200 text-gray-400',
          )}
        >
          {isCompleted && <Check className="size-3" />}
          {isCurrent && Icon && <Icon className="size-4" />}
        </div>
        <span
          className={cn(
            'text-center text-[11px] font-bold',
            isCurrent && 'text-primary',
            isPending && 'text-gray-400',
          )}
        >
          {label}
        </span>
      </div>
      {step < 5 && (
        <div className={cn('h-0.5 flex-grow', currentStep > step ? 'bg-primary' : 'bg-gray-200')} />
      )}
    </>
  );
}

// ─── Tab type ────────────────────────────────────────────────
type Tab = 'orders' | 'digitisation';

// ─── Page ────────────────────────────────────────────────────
export default function OrdersPage() {
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
    user,
    loginWithRedirect,
    logout,
    client,
  } = useAuth();
  const { getRequests, cancelRequest, recreateRequest } = useDigitisationRequests();
  const userEmail = user?.email;

  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [requests, setRequests] = useState<DigitisationRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !client) return;
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const data = await client.query<{
        customer: { orders: { nodes: CustomerOrderNode[] } };
      }>(CUSTOMER_ORDERS_QUERY, { first: 20 });

      const transformedOrders = data.customer.orders.nodes.map(transformCustomerOrder);
      setOrders(transformedOrders);
      if (transformedOrders.length > 0 && !expandedOrder) {
        setExpandedOrder(transformedOrders[0].id);
      }
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  }, [isAuthenticated, client, expandedOrder]);

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated || !userEmail) return;
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      const data = await getRequests(userEmail);
      setRequests(data);
      if (data.length > 0 && !expandedRequest) {
        setExpandedRequest(data[0].name);
      }
    } catch (err) {
      setRequestsError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [isAuthenticated, userEmail, getRequests, expandedRequest]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchRequests();
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isAuthLoading) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-6 py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-6 py-8">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Sign In</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="py-12">
          <div className="bg-card mx-auto max-w-md rounded-xl border p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="bg-primary/10 mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                <User className="text-primary size-8" />
              </div>
              <h2 className="text-2xl font-bold">Sign in to view orders</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Sign in with your account to view your order history
              </p>
            </div>
            <Button className="w-full gap-2" onClick={() => loginWithRedirect()}>
              <LogIn className="size-4" />
              Sign in
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <Info className="size-5 shrink-0 text-amber-600" />
            <div>
              <h4 className="font-bold text-amber-800">Secure Sign In</h4>
              <p className="mt-1 text-sm text-amber-700">
                Sign in or create an account to view your order history and track your archival
                acquisitions.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = activeTab === 'orders' ? isLoadingOrders : isLoadingRequests;

  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/account/orders">Account</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Orders</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Your Orders</h1>
          <p className="text-muted-foreground mt-2">
            Signed in as <span className="text-foreground font-semibold">{userEmail}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            disabled={isLoading}
            onClick={activeTab === 'orders' ? fetchOrders : fetchRequests}
          >
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={logout}>
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-muted mb-8 flex w-fit gap-1 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all',
            activeTab === 'orders'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Receipt className="size-4" />
          Orders
          {orders.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {orders.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('digitisation')}
          className={cn(
            'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all',
            activeTab === 'digitisation'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ScanLine className="size-4" />
          Digitisation Requests
          {requests.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {requests.length}
            </Badge>
          )}
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {isLoadingOrders && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-muted-foreground">Loading your orders...</p>
            </div>
          )}

          {!isLoadingOrders && ordersError && (
            <div className="border-destructive/20 bg-destructive/5 text-destructive mb-6 rounded-lg border px-4 py-3">
              {ordersError}
            </div>
          )}

          {!isLoadingOrders && orders.length === 0 && !ordersError && (
            <div className="bg-muted/30 rounded-xl border py-16 text-center">
              <Receipt className="text-muted-foreground/30 mx-auto mb-4 size-16" />
              <h3 className="mb-2 text-xl font-bold">No orders yet</h3>
              <p className="text-muted-foreground mb-6">Start exploring our archive collection!</p>
              <Button asChild>
                <Link href="/search">Browse Collection</Link>
              </Button>
            </div>
          )}

          {!isLoadingOrders && (
            <div className="space-y-6">
              {orders.map((order) => {
                const isExpanded = expandedOrder === order.id;
                const statusStyle = ORDER_STATUS_STYLES[order.status];

                return (
                  <div
                    key={order.id}
                    className={cn(
                      'bg-card overflow-hidden rounded-xl border shadow-sm transition-all',
                      !isExpanded && 'hover:border-primary/40 cursor-pointer',
                    )}
                    onClick={() => !isExpanded && setExpandedOrder(order.id)}
                  >
                    <div
                      className={cn(
                        'flex flex-wrap items-center justify-between gap-4 p-6',
                        isExpanded && 'bg-muted/30 border-b',
                      )}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold">{order.id}</span>
                          <Badge
                            variant="secondary"
                            className={cn(
                              statusStyle.bg,
                              statusStyle.color,
                              'tracking-wider uppercase',
                            )}
                          >
                            {statusStyle.label}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          Ordered on {order.date} &middot; {order.itemCount}{' '}
                          {order.itemCount === 1 ? 'Item' : 'Items'} &middot;{' '}
                          <span className="text-foreground font-semibold">{order.total}</span>
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrder(isExpanded ? null : order.id);
                        }}
                        className="text-primary flex items-center gap-1 text-sm font-bold"
                      >
                        {isExpanded ? 'Collapse' : 'Expand'} Order
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    </div>

                    {isExpanded && order.items && (
                      <div className="p-6">
                        <div className="mb-10">
                          <div className="mb-4 flex justify-between">
                            <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
                              Order Progress
                            </h3>
                            {order.trackingNumber && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm font-medium">
                                  {order.carrier}
                                </span>
                                <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
                                  {order.trackingNumber}
                                </span>
                                <button className="text-primary hover:bg-primary/10 rounded p-1 transition-colors">
                                  <Copy className="size-4" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between px-2">
                            <OrderStep
                              step={1}
                              label="Order Placed"
                              currentStep={order.currentStep}
                            />
                            <OrderStep
                              step={2}
                              label="Processing"
                              currentStep={order.currentStep}
                            />
                            <OrderStep step={3} label="Shipped" currentStep={order.currentStep} />
                            <OrderStep
                              step={4}
                              label="Out for Delivery"
                              currentStep={order.currentStep}
                            />
                            <OrderStep step={5} label="Delivered" currentStep={order.currentStep} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                          <div className="space-y-4 md:col-span-2">
                            <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
                              Items in this order
                            </h3>
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="group hover:border-primary/30 flex items-center gap-4 rounded-lg border p-3 transition-all"
                              >
                                <div
                                  className="bg-muted size-20 shrink-0 rounded bg-cover bg-center"
                                  style={{ backgroundImage: `url("${item.image}")` }}
                                />
                                <div className="flex-1">
                                  <p className="group-hover:text-primary text-sm font-bold transition-colors">
                                    {item.title}
                                  </p>
                                  <p className="text-accent-gold text-xs font-bold">
                                    {item.variant}
                                  </p>
                                  <p className="text-muted-foreground mt-1 text-xs">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold">{item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-muted/30 space-y-6 rounded-xl p-4">
                            {order.shippingAddress && (
                              <div>
                                <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
                                  Shipping Address
                                </h4>
                                <p className="text-sm leading-relaxed font-medium">
                                  {order.shippingAddress.name}
                                  <br />
                                  {order.shippingAddress.line1}
                                  <br />
                                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                                  {order.shippingAddress.postcode}
                                  <br />
                                  {order.shippingAddress.country}
                                </p>
                              </div>
                            )}
                            {order.paymentMethod && (
                              <div>
                                <h4 className="text-muted-foreground mb-2 text-[10px] font-black tracking-[0.2em] uppercase">
                                  Payment Method
                                </h4>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="text-primary size-4" />
                                  <p className="text-sm font-medium">{order.paymentMethod}</p>
                                </div>
                              </div>
                            )}
                            <div className="border-t pt-4">
                              <Button className="w-full">Download Invoice</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Digitisation Requests Tab */}
      {activeTab === 'digitisation' && (
        <>
          {isLoadingRequests && (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
              <p className="text-muted-foreground">Loading your digitisation requests...</p>
            </div>
          )}

          {!isLoadingRequests && requestsError && (
            <div className="border-destructive/20 bg-destructive/5 text-destructive mb-6 rounded-lg border px-4 py-3">
              {requestsError}
            </div>
          )}

          {!isLoadingRequests && requests.length === 0 && !requestsError && (
            <div className="bg-muted/30 rounded-xl border py-16 text-center">
              <ScanLine className="text-muted-foreground/30 mx-auto mb-4 size-16" />
              <h3 className="mb-2 text-xl font-bold">No digitisation requests yet</h3>
              <p className="text-muted-foreground mb-6">
                Browse our collection to find items that can be digitised on request.
              </p>
              <Button asChild>
                <Link href="/search">Browse Collection</Link>
              </Button>
            </div>
          )}

          {!isLoadingRequests && (
            <div className="space-y-6">
              {requests.map((request) => (
                <DigitisationRequestCard
                  key={request.id}
                  request={request}
                  isExpanded={expandedRequest === request.name}
                  onToggle={() =>
                    setExpandedRequest(expandedRequest === request.name ? null : request.name)
                  }
                  onCancel={cancelRequest}
                  onRecreate={recreateRequest}
                  onRefresh={fetchRequests}
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="border-primary/10 bg-primary/5 mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border p-8 md:flex-row">
        <div>
          <h3 className="text-lg font-bold">Need help with an order?</h3>
          <p className="text-muted-foreground text-sm">
            Our archive specialists are available Mon-Fri, 9am - 5pm AEST.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline">Contact Support</Button>
          <Button>Return Policy</Button>
        </div>
      </div>
    </div>
  );
}
