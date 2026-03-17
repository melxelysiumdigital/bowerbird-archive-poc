'use client';

import { MembershipContent } from './membership-content';
import { SignInPrompt } from './sign-in-prompt';

import { useAuth } from '@/hooks/use-auth';

export default function MembershipPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user, loginWithRedirect, logout } = useAuth();

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
    return <SignInPrompt loginWithRedirect={loginWithRedirect} />;
  }

  return <MembershipContent email={user?.email} logout={logout} />;
}
