#!/usr/bin/env node
/**
 * OAuth flow to get Shopify Admin API access token
 *
 * Usage:
 *   SHOPIFY_CLIENT_SECRET=your_secret node scripts/get-admin-token.js
 *
 * Prerequisites:
 *   1. Deploy the app first: cd apps/shopify-thank-you && npx shopify app deploy
 *   2. Get the client secret from the Partners dashboard
 *   3. Ensure http://localhost:3456/auth/callback is in the app's redirect URLs
 */

import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  clientId: '3a53c081be65c9e6f9d631cf0b0ec08b',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  shop: 'bowerbird-archives.myshopify.com',
  scopes:
    'read_checkout_branding_settings,write_checkout_branding_settings,read_orders,read_draft_orders,write_draft_orders,read_themes,write_themes',
  redirectUri: 'http://localhost:3456/auth/callback',
  port: 3456,
};

if (!CONFIG.clientSecret) {
  console.error('\n❌ Missing SHOPIFY_CLIENT_SECRET!');
  console.error('\nGet the secret from the Partners dashboard:');
  console.error(
    '  https://admin.shopify.com/store/bowerbird-archives/headless (or Partners > Apps > bowerbird-archive-thank-you > Credentials)',
  );
  console.error('\nThen run:');
  console.error(`  SHOPIFY_CLIENT_SECRET=your_secret node scripts/get-admin-token.js\n`);
  process.exit(1);
}

const state = crypto.randomBytes(16).toString('hex');

const authUrl = new URL(`https://${CONFIG.shop}/admin/oauth/authorize`);
authUrl.searchParams.set('client_id', CONFIG.clientId);
authUrl.searchParams.set('scope', CONFIG.scopes);
authUrl.searchParams.set('redirect_uri', CONFIG.redirectUri);
authUrl.searchParams.set('state', state);

console.log('\n🔐 Shopify Admin OAuth Token Generator\n');
console.log('Step 1: Open this URL in your browser:\n');
console.log(`   ${authUrl.toString()}\n`);
console.log('Step 2: Approve the app when prompted');
console.log("Step 3: You'll be redirected back here automatically\n");
console.log('Waiting for callback...\n');

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${CONFIG.port}`);

  if (url.pathname === '/auth/callback') {
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');

    if (returnedState !== state) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: State mismatch</h1>');
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h1>Error: No code received</h1>');
      return;
    }

    console.log('✅ Received authorization code');
    console.log('   Exchanging for access token...\n');

    try {
      const tokenResponse = await fetch(`https://${CONFIG.shop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: CONFIG.clientId,
          client_secret: CONFIG.clientSecret,
          code: code,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${error}`);
      }

      const tokenData = await tokenResponse.json();
      const adminToken = tokenData.access_token;

      console.log('✅ Got Admin API access token');
      console.log(
        `   Token: ${adminToken.substring(0, 10)}...${adminToken.substring(adminToken.length - 4)}\n`,
      );

      // Save token
      const tokenPath = path.join(__dirname, '..', '.shopify-admin-token');
      fs.writeFileSync(tokenPath, adminToken);
      console.log(`✅ Saved to ${tokenPath}\n`);

      // Now run the hide-footer mutation
      console.log('   Hiding default checkout footer...\n');

      // Step 1: Get checkout profile ID
      const profileRes = await fetch(`https://${CONFIG.shop}/admin/api/2025-10/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': adminToken,
        },
        body: JSON.stringify({
          query: `query { checkoutProfiles(first: 1, query: "is_published:true") { nodes { id name } } }`,
        }),
      });

      const profileData = await profileRes.json();
      const profileId = profileData.data?.checkoutProfiles?.nodes?.[0]?.id;

      if (!profileId) {
        console.log(
          '⚠️  Could not find checkout profile. You may need Shopify Plus for checkout branding.',
        );
        console.log('   Token is still saved — you can use it for other admin API calls.\n');
      } else {
        console.log(`   Found checkout profile: ${profileId}`);

        // Step 2: Hide footer
        const brandingRes = await fetch(`https://${CONFIG.shop}/admin/api/2025-10/graphql.json`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': adminToken,
          },
          body: JSON.stringify({
            query: `mutation($id: ID!) {
              checkoutBrandingUpsert(checkoutProfileId: $id, checkoutBrandingInput: {
                customizations: { footer: { visibility: HIDDEN } }
              }) {
                checkoutBranding { customizations { footer { visibility } } }
                userErrors { field message }
              }
            }`,
            variables: { id: profileId },
          }),
        });

        const brandingData = await brandingRes.json();
        const errors = brandingData.data?.checkoutBrandingUpsert?.userErrors;

        if (errors?.length > 0) {
          console.log(`⚠️  Checkout branding errors: ${JSON.stringify(errors)}`);
        } else {
          console.log('✅ Default checkout footer hidden!\n');
        }
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>✅ Success!</h1>
          <p>Admin token saved to <code>.shopify-admin-token</code></p>
          <p>Token: <code>${adminToken.substring(0, 10)}...${adminToken.substring(adminToken.length - 4)}</code></p>
          <p>You can close this window.</p>
        </body></html>
      `);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error</h1><pre>${error.message}</pre>`);
      server.close();
      process.exit(1);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(CONFIG.port, () => {
  console.log(`Server listening on http://localhost:${CONFIG.port}`);
});
