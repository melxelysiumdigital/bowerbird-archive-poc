import '@shopify/shopify-api/adapters/web-api';

import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || '',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || '',
  scopes: (process.env.SHOPIFY_SCOPES || '').split(','),
  hostName: process.env.SHOPIFY_HOST_NAME || 'localhost:3001',
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
});

export default shopify;
