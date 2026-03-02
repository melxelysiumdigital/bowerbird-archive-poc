import type {
  DigitisationRequest,
  IntegrationState,
  CancelledRequestData,
} from '@bowerbird-poc/shared/types';
import { Button } from '@bowerbird-poc/ui/components/button';
import { ScanLine } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import { TabSwitcher, OrdersTab, OrdersHeader, OrdersFooter } from './orders-components';
import type { OrderData, CustomerOrderNode } from './orders-utils';
import { CUSTOMER_ORDERS_QUERY, transformCustomerOrder } from './orders-utils';

import { DigitisationRequestCard } from '@/components/digitisation-request-card';
import type { useAuth } from '@/hooks/use-auth';
import type { useDigitisationRequests } from '@/hooks/use-digitisation-requests';
import type { useMockIntegrations } from '@/hooks/use-mock-integrations';

// ─── useOrdersData hook ──────────────────────────────────────
function useOrdersData({
  client,
  userEmail,
  getRequests,
  getIntegrationState,
}: {
  client: ReturnType<typeof useAuth>['client'];
  userEmail: string | undefined;
  getRequests: ReturnType<typeof useDigitisationRequests>['getRequests'];
  getIntegrationState: ReturnType<typeof useMockIntegrations>['getIntegrationState'];
}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [requests, setRequests] = useState<DigitisationRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [integrationStates, setIntegrationStates] = useState<Record<number, IntegrationState>>({});

  const fetchOrders = useCallback(async () => {
    if (!client) return;
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
  }, [client, expandedOrder]);

  const fetchRequests = useCallback(async () => {
    if (!userEmail) return;
    setIsLoadingRequests(true);
    setRequestsError(null);
    try {
      const data = await getRequests(userEmail);
      setRequests(data);
      if (data.length > 0 && !expandedRequest) {
        setExpandedRequest(data[0].name);
      }
      const states: Record<number, IntegrationState> = {};
      await Promise.all(
        data.map(async (req) => {
          try {
            states[req.id] = await getIntegrationState(req.id);
          } catch {
            // Integration data is optional
          }
        }),
      );
      setIntegrationStates(states);
    } catch (err) {
      setRequestsError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoadingRequests(false);
    }
  }, [userEmail, getRequests, getIntegrationState, expandedRequest]);

  useEffect(() => {
    fetchOrders();
    fetchRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    orders,
    isLoadingOrders,
    ordersError,
    expandedOrder,
    setExpandedOrder,
    fetchOrders,
    requests,
    isLoadingRequests,
    requestsError,
    expandedRequest,
    setExpandedRequest,
    fetchRequests,
    integrationStates,
  };
}

// ─── DigitisationTab ─────────────────────────────────────────
function DigitisationTab({
  isLoading,
  error,
  requests,
  expandedRequest,
  setExpandedRequest,
  cancelRequest,
  recreateRequest,
  fetchRequests,
  integrationStates,
}: {
  isLoading: boolean;
  error: string | null;
  requests: DigitisationRequest[];
  expandedRequest: string | null;
  setExpandedRequest: (name: string | null) => void;
  cancelRequest: (id: number) => Promise<CancelledRequestData>;
  recreateRequest: (data: CancelledRequestData) => Promise<void>;
  fetchRequests: () => Promise<void>;
  integrationStates: Record<number, IntegrationState>;
}) {
  return (
    <>
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading your digitisation requests...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive mb-6 rounded-lg border px-4 py-3">
          {error}
        </div>
      )}

      {!isLoading && requests.length === 0 && !error && (
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

      {!isLoading && (
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
              integrationState={integrationStates[request.id] ?? null}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── AuthenticatedOrders ─────────────────────────────────────
export interface AuthenticatedOrdersProps {
  userEmail: string | undefined;
  logout: () => void;
  client: ReturnType<typeof useAuth>['client'];
  getRequests: ReturnType<typeof useDigitisationRequests>['getRequests'];
  cancelRequest: ReturnType<typeof useDigitisationRequests>['cancelRequest'];
  recreateRequest: ReturnType<typeof useDigitisationRequests>['recreateRequest'];
  getIntegrationState: ReturnType<typeof useMockIntegrations>['getIntegrationState'];
}

export function AuthenticatedOrders({
  userEmail,
  logout,
  client,
  getRequests,
  cancelRequest,
  recreateRequest,
  getIntegrationState,
}: AuthenticatedOrdersProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'digitisation'>('orders');
  const data = useOrdersData({ client, userEmail, getRequests, getIntegrationState });

  const isLoading = activeTab === 'orders' ? data.isLoadingOrders : data.isLoadingRequests;
  const onRefresh = activeTab === 'orders' ? data.fetchOrders : data.fetchRequests;

  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-8">
      <OrdersHeader
        userEmail={userEmail}
        isLoading={isLoading}
        onRefresh={onRefresh}
        onLogout={logout}
      />
      <TabSwitcher
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        ordersCount={data.orders.length}
        requestsCount={data.requests.length}
      />
      {activeTab === 'orders' && (
        <OrdersTab
          isLoading={data.isLoadingOrders}
          error={data.ordersError}
          orders={data.orders}
          expandedOrder={data.expandedOrder}
          setExpandedOrder={data.setExpandedOrder}
        />
      )}
      {activeTab === 'digitisation' && (
        <DigitisationTab
          isLoading={data.isLoadingRequests}
          error={data.requestsError}
          requests={data.requests}
          expandedRequest={data.expandedRequest}
          setExpandedRequest={data.setExpandedRequest}
          cancelRequest={cancelRequest}
          recreateRequest={recreateRequest}
          fetchRequests={data.fetchRequests}
          integrationStates={data.integrationStates}
        />
      )}
      <OrdersFooter />
    </div>
  );
}
