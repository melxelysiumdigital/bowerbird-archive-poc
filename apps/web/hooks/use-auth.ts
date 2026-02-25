'use client';

import { useAuth0 } from '@auth0/auth0-react';

const auth0Configured = Boolean(
  process.env.NEXT_PUBLIC_AUTH0_DOMAIN && process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
);

export function useAuth() {
  if (!auth0Configured) {
    return {
      isAuthenticated: false,
      isLoading: false,
      user: undefined as undefined | { email?: string; name?: string; picture?: string },
      loginWithRedirect: () => Promise.resolve(),
      logout: () => {},
      getAccessTokenSilently: () => Promise.resolve(''),
    };
  }

   
  const {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const logout = () => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  return {
    isAuthenticated,
    isLoading,
    user,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
  };
}
