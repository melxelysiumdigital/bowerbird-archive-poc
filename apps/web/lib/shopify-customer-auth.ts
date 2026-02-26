/**
 * Shopify Customer Account API — OAuth 2.0 PKCE client for Next.js.
 *
 * All token exchange and GraphQL calls are proxied through Next.js API routes
 * to avoid CORS issues with Shopify's endpoints.
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || '';
const SHOP_ID = process.env.NEXT_PUBLIC_SHOPIFY_SHOP_ID || '';
const STORAGE_KEY = 'shopify_customer_tokens';

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_at: number;
}

// ─── PKCE helpers ────────────────────────────────────────────

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

// ─── Token storage ───────────────────────────────────────────

function getStoredTokens(): StoredTokens | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : null;
  } catch {
    return null;
  }
}

function storeTokens(tokens: StoredTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
}

function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── JWT decode (payload only) ───────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payload = token.split('.')[1];
  const padded = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(padded));
}

// ─── ShopifyCustomerAuth ─────────────────────────────────────

export class ShopifyCustomerAuth {
  private shopId = SHOP_ID;
  private clientId = CLIENT_ID;

  get configured(): boolean {
    return Boolean(this.clientId && this.shopId);
  }

  /** Build the Shopify OAuth authorization URL and stash PKCE values. */
  async getAuthorizationUrl(): Promise<string> {
    const verifier = generateRandomString(64);
    const challenge = await generateCodeChallenge(verifier);
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // Store PKCE values for the callback
    sessionStorage.setItem('shopify_pkce_verifier', verifier);
    sessionStorage.setItem('shopify_pkce_state', state);
    sessionStorage.setItem('shopify_pkce_nonce', nonce);

    const redirectUri = `${window.location.origin}/account/callback`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid email customer-account-api:full',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return `https://shopify.com/authentication/${this.shopId}/oauth/authorize?${params}`;
  }

  /** Exchange the authorization code for tokens via the API route proxy. */
  async handleCallback(code: string, state: string): Promise<void> {
    const storedState = sessionStorage.getItem('shopify_pkce_state');
    if (state !== storedState) {
      throw new Error('OAuth state mismatch — possible CSRF attack');
    }

    const verifier = sessionStorage.getItem('shopify_pkce_verifier');
    if (!verifier) {
      throw new Error('Missing PKCE verifier — please try logging in again');
    }

    const redirectUri = `${window.location.origin}/account/callback`;

    const res = await fetch('/api/auth/shopify/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Token exchange failed: ${text}`);
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      id_token: string;
      expires_in: number;
    };

    storeTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      expires_at: Date.now() + data.expires_in * 1000,
    });

    // Clean up PKCE session values
    sessionStorage.removeItem('shopify_pkce_verifier');
    sessionStorage.removeItem('shopify_pkce_state');
    sessionStorage.removeItem('shopify_pkce_nonce');
  }

  /** Return a valid access token, refreshing if within 5 minutes of expiry. */
  async getAccessToken(): Promise<string | null> {
    const tokens = getStoredTokens();
    if (!tokens) return null;

    const FIVE_MINUTES = 5 * 60 * 1000;
    if (tokens.expires_at - Date.now() > FIVE_MINUTES) {
      return tokens.access_token;
    }

    // Refresh
    try {
      const res = await fetch('/api/auth/shopify/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          refresh_token: tokens.refresh_token,
        }),
      });

      if (!res.ok) {
        clearTokens();
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        id_token: string;
        expires_in: number;
      };

      storeTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        expires_at: Date.now() + data.expires_in * 1000,
      });

      return data.access_token;
    } catch {
      clearTokens();
      return null;
    }
  }

  /** Execute a Customer Account API GraphQL query via the API route proxy. */
  async query<T>(graphql: string, variables: Record<string, unknown> = {}): Promise<T> {
    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    const res = await fetch('/api/auth/shopify/customer-graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: graphql, variables, accessToken }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Customer API query failed: ${text}`);
    }

    const json = (await res.json()) as { data?: T; errors?: unknown[] };
    if (json.errors) {
      throw new Error(`Customer API errors: ${JSON.stringify(json.errors)}`);
    }

    return json.data as T;
  }

  /** Decode the ID token JWT payload to extract user info. */
  getUserFromIdToken(): { email?: string; name?: string; sub?: string } | null {
    const tokens = getStoredTokens();
    if (!tokens?.id_token) return null;

    try {
      const payload = decodeJwtPayload(tokens.id_token);
      return {
        email: payload.email as string | undefined,
        name:
          (payload.name as string | undefined) ??
          ([payload.given_name, payload.family_name].filter(Boolean).join(' ') || undefined),
        sub: payload.sub as string | undefined,
      };
    } catch {
      return null;
    }
  }

  /** Check if the user has valid stored tokens. */
  isAuthenticated(): boolean {
    const tokens = getStoredTokens();
    if (!tokens) return false;
    return tokens.expires_at > Date.now();
  }

  /** Clear tokens and redirect to Shopify logout. */
  logout(): void {
    const tokens = getStoredTokens();
    const idToken = tokens?.id_token;
    clearTokens();

    if (idToken) {
      const params = new URLSearchParams({
        id_token_hint: idToken,
        post_logout_redirect_uri: window.location.origin,
      });
      window.location.href = `https://shopify.com/authentication/${this.shopId}/logout?${params}`;
    } else {
      window.location.href = window.location.origin;
    }
  }
}
