#!/usr/bin/env node
/**
 * OAuth flow to get Shopify Admin API access token for the digitisation app.
 *
 * Usage:
 *   SHOPIFY_CLIENT_SECRET=your_secret node scripts/get-admin-token.js
 *
 * Prerequisites:
 *   1. Deploy the app first: cd apps/shopify-digitisation && pnpm deploy
 *   2. Get the client secret from the Partners dashboard
 *   3. Ensure http://localhost:3457/auth/callback is in the app's redirect URLs
 */

import http from 'http';
import crypto from 'crypto';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CONFIG = {
  clientId: '4688fee15f452c2b8d610a199172e1af',
  clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
  shop: 'bowerbird-archives.myshopify.com',
  scopes: 'read_customers,write_customers,read_draft_orders,write_draft_orders,read_orders',
  redirectUri: 'http://localhost:3457/auth/callback',
  port: 3457,
};

if (!CONFIG.clientId) {
  console.error('\n\u274C Missing clientId in CONFIG!');
  console.error('\nRun `pnpm shopify app config link` first, then copy the client_id');
  console.error('from the generated .toml into this script.\n');
  process.exit(1);
}

if (!CONFIG.clientSecret) {
  console.error('\n\u274C Missing SHOPIFY_CLIENT_SECRET!');
  console.error('\nGet the secret from the Partners dashboard:');
  console.error('  Partners > Apps > bowerbird-archive-digitisation > Credentials');
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

console.log('\n\uD83D\uDD10 Shopify Admin OAuth Token Generator (Digitisation App)\n');
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

    console.log('\u2705 Received authorization code');
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

      console.log('\u2705 Got Admin API access token');
      console.log(
        `   Token: ${adminToken.substring(0, 10)}...${adminToken.substring(adminToken.length - 4)}\n`,
      );

      // Save token
      const tokenPath = path.join(__dirname, '..', '.shopify-admin-token');
      fs.writeFileSync(tokenPath, adminToken);
      console.log(`\u2705 Saved to ${tokenPath}`);
      console.log('\n   Copy this token to apps/web/.env.local as SHOPIFY_ADMIN_ACCESS_TOKEN\n');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html><body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>\u2705 Success!</h1>
          <p>Admin token saved to <code>.shopify-admin-token</code></p>
          <p>Token: <code>${adminToken.substring(0, 10)}...${adminToken.substring(adminToken.length - 4)}</code></p>
          <p>Copy this token to <code>apps/web/.env.local</code> as <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code></p>
          <p>You can close this window.</p>
        </body></html>
      `);

      setTimeout(() => {
        server.close();
        process.exit(0);
      }, 1000);
    } catch (error) {
      console.error('\u274C Error:', error.message);
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
