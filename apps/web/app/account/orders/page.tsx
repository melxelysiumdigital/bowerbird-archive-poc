'use client';

import { AuthenticatedOrders } from './authenticated-orders';
import { SignInPrompt } from './sign-in-prompt';

import { useAuth } from '@/hooks/use-auth';
import { useDigitisationRequests } from '@/hooks/use-digitisation-requests';
import { useMockIntegrations } from '@/hooks/use-mock-integrations';

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
  const { getIntegrationState } = useMockIntegrations();

  if (isAuthLoading) {
    return (
      <div className="mx-auto w-full max-w-[960px] px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-col items-center justify-center py-20">
          <span className="border-primary mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <SignInPrompt loginWithRedirect={loginWithRedirect} />;
  }

  return (
    <AuthenticatedOrders
      userEmail={user?.email}
      logout={logout}
      client={client}
      getRequests={getRequests}
      cancelRequest={cancelRequest}
      recreateRequest={recreateRequest}
      getIntegrationState={getIntegrationState}
    />
  );
}
