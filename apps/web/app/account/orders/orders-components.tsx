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
export type Tab = 'orders' | 'digitisation';

// ─── SignInPrompt ────────────────────────────────────────────
export function SignInPrompt({ loginWithRedirect }: { loginWithRedirect: () => void }) {
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

// ─── TabSwitcher ─────────────────────────────────────────────
export function TabSwitcher({
  activeTab,
  setActiveTab,
  ordersCount,
  requestsCount,
}: {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  ordersCount: number;
  requestsCount: number;
}) {
  return (
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
        <ScanLine className="size-4" />
        Digitisation Requests
        {requestsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {requestsCount}
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
        'flex flex-wrap items-center justify-between gap-4 p-6',
        isExpanded && 'bg-muted/30 border-b',
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold">{order.id}</span>
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
      <div className="mb-4 flex justify-between">
        <h3 className="text-muted-foreground text-sm font-bold tracking-widest uppercase">
          Order Progress
        </h3>
        {order.trackingNumber && (
          <div className="flex items-center gap-2">
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
      <div className="flex items-center justify-between px-2">
        <OrderStep step={1} label="Order Placed" currentStep={order.currentStep} />
        <OrderStep step={2} label="Processing" currentStep={order.currentStep} />
        <OrderStep step={3} label="Shipped" currentStep={order.currentStep} />
        <OrderStep step={4} label="Out for Delivery" currentStep={order.currentStep} />
        <OrderStep step={5} label="Delivered" currentStep={order.currentStep} />
      </div>
    </div>
  );
}

// ─── OrderItemsList ──────────────────────────────────────────
function OrderItemsList({ items }: { items: NonNullable<OrderData['items']> }) {
  return (
    <div className="space-y-4 md:col-span-2">
      <h3 className="text-muted-foreground mb-4 text-sm font-bold tracking-widest uppercase">
        Items in this order
      </h3>
      {items.map((item, idx) => (
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
            <p className="text-accent-gold text-xs font-bold">{item.variant}</p>
            <p className="text-muted-foreground mt-1 text-xs">Quantity: {item.quantity}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">{item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── OrderSidebar ────────────────────────────────────────────
function OrderSidebar({ order }: { order: OrderData }) {
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
      <div className="border-t pt-4">
        <Button className="w-full">Download Invoice</Button>
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
        <div className="p-6">
          <OrderProgress order={order} />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <OrderItemsList items={order.items} />
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
  );
}
