export const DONATION_PRODUCT_HANDLE =
  process.env.NEXT_PUBLIC_DONATION_PRODUCT_HANDLE ?? 'donation';

export interface DonationVariant {
  id: string;
  title: string;
  amount: number;
}

export interface DonationProduct {
  presets: DonationVariant[];
  customVariantId: string | null;
}

const STOREFRONT_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ?? '';
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ?? '';

export async function fetchDonationProduct(handle: string): Promise<DonationProduct | null> {
  if (!STOREFRONT_DOMAIN || !STOREFRONT_TOKEN) return null;

  const query = `query DonationProduct($handle: String!) {
    product(handle: $handle) {
      variants(first: 20) {
        nodes {
          id
          title
          price { amount }
        }
      }
    }
  }`;

  const res = await fetch(`https://${STOREFRONT_DOMAIN}/api/2025-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables: { handle } }),
  });

  if (!res.ok) return null;

  const json = (await res.json()) as {
    data?: {
      product?: {
        variants?: { nodes: Array<{ id: string; title: string; price: { amount: string } }> };
      };
    };
  };

  const nodes = json.data?.product?.variants?.nodes;
  if (!nodes?.length) return null;

  const presets: DonationVariant[] = [];
  let customVariantId: string | null = null;

  for (const v of nodes) {
    const amount = parseFloat(v.price.amount);
    if (amount === 0) {
      customVariantId = v.id;
    } else {
      presets.push({ id: v.id, title: `$${amount.toFixed(0)}`, amount });
    }
  }

  // Sort presets by amount ascending
  presets.sort((a, b) => a.amount - b.amount);

  return { presets, customVariantId };
}
