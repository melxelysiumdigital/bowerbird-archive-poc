'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@bowerbird-poc/ui/components/card';
import { AlertCircle, CheckCircle, ExternalLink, LogOut, RefreshCw, XCircle } from 'lucide-react';

import type { MembershipStatus } from '@/hooks/use-membership';
import { useMembership } from '@/hooks/use-membership';

const SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID || '';

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ActiveCard({ membership }: { membership: MembershipStatus }) {
  const order = membership.subscriptionOrder;
  const orderUrl =
    order && SHOP_ID ? `https://shopify.com/${SHOP_ID}/account/orders/${order.id}` : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Membership</CardTitle>
          <Badge variant="outline" className="border-green-200 bg-green-100 text-green-800">
            <CheckCircle className="mr-1 size-3" />
            Active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {membership.customerSince && (
          <p className="text-muted-foreground text-sm">
            Member since {formatDate(membership.customerSince)}
          </p>
        )}
        <p className="text-sm">
          Your membership is active. To manage your subscription, billing, or payment details, visit
          your order on Shopify.
        </p>
        {orderUrl && (
          <Button variant="outline" size="sm" asChild>
            <a href={orderUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 size-4" />
              Manage Subscription ({order!.name})
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function InactiveCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">Membership</CardTitle>
          <Badge variant="outline" className="border-gray-200 bg-gray-100 text-gray-800">
            <XCircle className="mr-1 size-3" />
            Not a member
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">You don&apos;t have an active membership.</p>
        <Button size="sm" asChild>
          <a href="/search">Browse membership options</a>
        </Button>
      </CardContent>
    </Card>
  );
}

export function MembershipContent({
  email,
  logout,
}: {
  email: string | undefined;
  logout: () => void;
}) {
  const { membership, isLoading, error, refresh } = useMembership(email);

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
            <BreadcrumbPage>Membership</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membership</h1>
          <p className="text-muted-foreground mt-1 text-sm">{email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={`mr-1 size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1 size-4" />
            Sign out
          </Button>
        </div>
      </div>

      {isLoading && !membership && (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Checking membership...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {membership &&
        (membership.isMember ? <ActiveCard membership={membership} /> : <InactiveCard />)}
    </div>
  );
}
