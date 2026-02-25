const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '';
const SHOPIFY_ADMIN_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || '';
const API_VERSION = '2025-01';
const BASE_URL = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}`;

export async function shopifyAdminFetch(
  urlPath: string,
  options: RequestInit = {},
): Promise<Record<string, unknown>> {
  if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is not configured');
  }

  const res = await fetch(`${BASE_URL}${urlPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify Admin API ${res.status}: ${text}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}

export async function shopifyGraphQL(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  if (!SHOPIFY_ADMIN_ACCESS_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_ACCESS_TOKEN is not configured');
  }

  const res = await fetch(`${BASE_URL}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify GraphQL ${res.status}: ${text}`);
  }

  const json = (await res.json()) as {
    data?: Record<string, unknown>;
    errors?: unknown[];
  };

  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data!;
}
