import { ORDER_STATUS_STYLES } from '@bowerbird-poc/shared/constants';
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
  Check,
  Truck,
  Package,
  CircleCheckBig,
  Copy,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Download,
} from 'lucide-react';
import Link from 'next/link';

import type { OrderData } from './orders-utils';

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
export type Tab = 'orders' | 'digitisation' | 'copy-quotes';

// ─── TabSwitcher ─────────────────────────────────────────────
export function TabSwitcher({
  activeTab,
  setActiveTab,
  ordersCount,
  requestsCount,
  copyQuotesCount,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  ordersCount: number;
  requestsCount: number;
  copyQuotesCount?: number;
}) {
  return (
    <div className="bg-muted mb-8 flex w-full flex-col gap-1 rounded-lg p-1 sm:w-fit sm:flex-row sm:flex-wrap">
      <button
        onClick={() => setActiveTab('orders')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all',
          activeTab === 'orders'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Receipt className="size-4 shrink-0" />
        Orders
        {ordersCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {ordersCount}
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
        <ScanLine className="size-4 shrink-0" />
        <span className="truncate">Digitisation Requests</span>
        {requestsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {requestsCount}
          </Badge>
        )}
      </button>
      <button
        onClick={() => setActiveTab('copy-quotes')}
        className={cn(
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition-all',
          activeTab === 'copy-quotes'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <Copy className="size-4 shrink-0" />
        <span className="truncate">Research Centre Requests</span>
        {(copyQuotesCount ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs">
            {copyQuotesCount}
          </Badge>
        )}
      </button>
    </div>
  );
}

// ─── OrderCardHeader ─────────────────────────────────────────
function OrderCardHeader({
  order,
  isExpanded,
  onToggle,
}: {
  order: OrderData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const statusStyle = ORDER_STATUS_STYLES[order.status];

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6',
        isExpanded && 'bg-muted/30 border-b',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-lg font-bold sm:text-xl">{order.id}</span>
          <Badge
            variant="secondary"
            className={cn(statusStyle.bg, statusStyle.color, 'tracking-wider uppercase')}
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
          onToggle();
        }}
        className="text-primary flex items-center gap-1 text-sm font-bold"
      >
        {isExpanded ? 'Collapse' : 'Expand'} Order
        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
    </div>
  );
}

// ─── OrderProgress ───────────────────────────────────────────
function OrderProgress({ order }: { order: OrderData }) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
          Order Progress
        </h3>
        {order.trackingNumber && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm font-medium">{order.carrier}</span>
            <span className="bg-muted rounded px-2 py-0.5 font-mono text-xs">
              {order.trackingNumber}
            </span>
            <button className="text-primary hover:bg-primary/10 rounded p-1 transition-colors">
              <Copy className="size-4" />
            </button>
          </div>
        )}
      </div>
      <div className="hidden items-center justify-between px-2 md:flex">
        <OrderStep step={1} label="Order Placed" currentStep={order.currentStep} />
        <OrderStep step={2} label="Processing" currentStep={order.currentStep} />
        <OrderStep step={3} label="Shipped" currentStep={order.currentStep} />
        <OrderStep step={4} label="Out for Delivery" currentStep={order.currentStep} />
        <OrderStep step={5} label="Delivered" currentStep={order.currentStep} />
      </div>
      {/* Mobile: compact vertical progress */}
      <div className="flex flex-col gap-3 md:hidden">
        {[
          { step: 1, label: 'Order Placed' },
          { step: 2, label: 'Processing' },
          { step: 3, label: 'Shipped' },
          { step: 4, label: 'Out for Delivery' },
          { step: 5, label: 'Delivered' },
        ].map(({ step, label }) => {
          const isCompleted = order.currentStep > step;
          const isCurrent = order.currentStep === step;
          const isPending = order.currentStep < step;
          const StepIcon = STEP_ICONS[step];
          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-full',
                  isCurrent && 'bg-primary size-8 text-white shadow-md',
                  isCompleted && 'bg-primary size-6 text-white',
                  isPending && 'size-6 bg-gray-200 text-gray-400',
                )}
              >
                {isCompleted && <Check className="size-3" />}
                {isCurrent && StepIcon && <StepIcon className="size-4" />}
              </div>
              <span
                className={cn(
                  'text-sm font-bold',
                  isCurrent && 'text-primary',
                  isPending && 'text-gray-400',
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── OrderItemsList ──────────────────────────────────────────
function OrderItemsList({
  items,
  isCompleted,
}: {
  items: NonNullable<OrderData['items']>;
  isCompleted: boolean;
}) {
  return (
    <div className="space-y-4 md:col-span-2">
      <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
        Items in this order
      </h3>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="group hover:border-primary/30 flex flex-col gap-3 rounded-lg border p-3 transition-all"
        >
          <div className="flex items-start gap-3 sm:items-center sm:gap-4">
            <div
              className="bg-muted size-16 shrink-0 rounded bg-cover bg-center sm:size-20"
              style={{ backgroundImage: `url("${item.image}")` }}
            />
            <div className="min-w-0 flex-1">
              <p className="group-hover:text-primary text-sm font-bold transition-colors">
                {item.title}
              </p>
              <p className="text-accent-gold text-xs font-bold">{item.variant}</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-muted-foreground text-xs">Quantity: {item.quantity}</p>
                <p className="text-sm font-bold sm:hidden">{item.price}</p>
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{item.price}</p>
            </div>
          </div>
          {isCompleted && (
            <div className="border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() =>
                  alert(
                    `Mock download: "${item.title}" (${item.variant})\n\nIn production this would download the digitised record file.`,
                  )
                }
              >
                <Download className="size-3.5" />
                Download Record
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── OrderSidebar ────────────────────────────────────────────
function OrderSidebar({ order }: { order: OrderData }) {
  const isCompleted = order.status === 'delivered';

  return (
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
      <div className="space-y-2 border-t pt-4">
        {isCompleted && (
          <Button
            className="w-full gap-2"
            onClick={() =>
              alert(
                'Mock download: All records in this order.\n\nIn production this would download a ZIP of all digitised record files.',
              )
            }
          >
            <Download className="size-4" />
            Download All Records
          </Button>
        )}
        <Button variant={isCompleted ? 'outline' : 'default'} className="w-full">
          Download Invoice
        </Button>
      </div>
    </div>
  );
}

// ─── OrderCard ───────────────────────────────────────────────
function OrderCard({
  order,
  isExpanded,
  onToggle,
}: {
  order: OrderData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'bg-card overflow-hidden rounded-xl border shadow-sm transition-all',
        !isExpanded && 'hover:border-primary/40 cursor-pointer',
      )}
      onClick={() => !isExpanded && onToggle()}
    >
      <OrderCardHeader order={order} isExpanded={isExpanded} onToggle={onToggle} />

      {isExpanded && order.items && (
        <div className="p-4 sm:p-6">
          <OrderProgress order={order} />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <OrderItemsList items={order.items} isCompleted={order.status === 'delivered'} />
            <OrderSidebar order={order} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OrdersTab ───────────────────────────────────────────────
export function OrdersTab({
  isLoading,
  error,
  orders,
  expandedOrder,
  setExpandedOrder,
}: {
  isLoading: boolean;
  error: string | null;
  orders: OrderData[];
  expandedOrder: string | null;
  setExpandedOrder: (id: string | null) => void;
}) {
  return (
    <>
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      )}

      {!isLoading && error && (
        <div className="border-destructive/20 bg-destructive/5 text-destructive mb-6 rounded-lg border px-4 py-3">
          {error}
        </div>
      )}

      {!isLoading && orders.length === 0 && !error && (
        <div className="bg-muted/30 rounded-xl border py-16 text-center">
          <Receipt className="text-muted-foreground/30 mx-auto mb-4 size-16" />
          <h3 className="mb-2 text-xl font-bold">No orders yet</h3>
          <p className="text-muted-foreground mb-6">Start exploring our archive collection!</p>
          <Button asChild>
            <Link href="/search">Browse Collection</Link>
          </Button>
        </div>
      )}

      {!isLoading && (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isExpanded={expandedOrder === order.id}
              onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ─── OrdersHeader ────────────────────────────────────────────
export function OrdersHeader({
  userEmail,
  isLoading,
  onRefresh,
  onLogout,
}: {
  userEmail: string | undefined;
  isLoading: boolean;
  onRefresh: () => void;
  onLogout: () => void;
}) {
  return (
    <>
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

      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Your Orders</h1>
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
            onClick={onRefresh}
          >
            <RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onLogout}>
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </>
  );
}

// ─── OrdersFooter ────────────────────────────────────────────
export function OrdersFooter() {
  return (
    <div className="border-primary/10 bg-primary/5 mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl border p-6 text-center sm:p-8 md:flex-row md:text-left">
      <div>
        <h3 className="text-lg font-bold">Need help with an order?</h3>
        <p className="text-muted-foreground text-sm">
          Our archive specialists are available Mon-Fri, 9am - 5pm AEST.
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <Button variant="outline">Contact Support</Button>
        <Button>Return Policy</Button>
      </div>
    </div>
  );
}
