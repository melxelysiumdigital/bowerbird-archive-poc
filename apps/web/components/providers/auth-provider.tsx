'use client';

import { Auth0Provider } from '@auth0/auth0-react';

const auth0Domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || '';
const auth0ClientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || '';
const auth0Audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || undefined;
const auth0Configured = Boolean(auth0Domain && auth0ClientId);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!auth0Configured) {
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: typeof window !== 'undefined' ? window.location.origin : '',
        ...(auth0Audience ? { audience: auth0Audience } : {}),
      }}
    >
      {children}
    </Auth0Provider>
  );
}
