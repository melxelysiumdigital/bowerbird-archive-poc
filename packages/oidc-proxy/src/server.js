// =============================================================================
// server.js — Shopify ↔ Entra OIDC Proxy
// =============================================================================
//
// PURPOSE:
// Microsoft Entra External ID emits email_verified as string "true" in JWTs.
// Shopify requires it as boolean true (per OIDC spec).
// This proxy sits between them, intercepting the token response to fix the type.
//
// FLOW:
//   Shopify → Proxy → Entra (authorize)
//   Entra → Proxy → Shopify (callback with auth code)
//   Shopify → Proxy → Entra (token exchange)
//   Proxy rewrites id_token: email_verified "true" → true, re-signs with our keys
//   Proxy → Shopify (fixed token)
//
// =============================================================================

import express from "express";
import { importJWK, SignJWT, decodeJwt, decodeProtectedHeader } from "jose";
import { readFileSync, appendFileSync } from "fs";
import { config } from "dotenv";

// Simple file logger for debugging
function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    appendFileSync('./debug.log', line);
  } catch (e) { /* ignore */ }
}

config();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const PORT = process.env.PORT || 3000;
const PROXY_BASE_URL = process.env.PROXY_BASE_URL; // e.g. https://abc.ngrok-free.app
const ENTRA_DISCOVERY_URL = process.env.ENTRA_DISCOVERY_URL;
const ENTRA_CLIENT_ID = process.env.ENTRA_CLIENT_ID;
const ENTRA_CLIENT_SECRET = process.env.ENTRA_CLIENT_SECRET;
const KEYS_PATH = process.env.KEYS_PATH || "./keys";

// Validate required config
const required = { PROXY_BASE_URL, ENTRA_DISCOVERY_URL, ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET };
for (const [key, val] of Object.entries(required)) {
  if (!val) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// Load signing keys & Entra discovery
// -----------------------------------------------------------------------------

let privateKey;
let publicJwk;
let entraEndpoints;

async function init() {
  // Load our RSA keys
  try {
    const privJwk = JSON.parse(readFileSync(`${KEYS_PATH}/private.json`, "utf-8"));
    publicJwk = JSON.parse(readFileSync(`${KEYS_PATH}/public.json`, "utf-8"));
    privateKey = await importJWK(privJwk, "RS256");
    console.log(`🔑 Loaded signing keys (kid: ${publicJwk.kid})`);
  } catch (e) {
    console.error("❌ Cannot load keys. Run: npm run generate-keys");
    process.exit(1);
  }

  // Fetch Entra's OIDC discovery document
  console.log(`📡 Fetching Entra discovery: ${ENTRA_DISCOVERY_URL}`);
  const res = await fetch(ENTRA_DISCOVERY_URL);
  if (!res.ok) {
    console.error(`❌ Failed to fetch Entra discovery: ${res.status}`);
    process.exit(1);
  }
  entraEndpoints = await res.json();
  console.log(`✅ Entra endpoints loaded`);
  console.log(`   authorize: ${entraEndpoints.authorization_endpoint}`);
  console.log(`   token:     ${entraEndpoints.token_endpoint}`);
  console.log(`   userinfo:  ${entraEndpoints.userinfo_endpoint}`);
  console.log(`   jwks:      ${entraEndpoints.jwks_uri}`);
}

// -----------------------------------------------------------------------------
// OIDC Discovery Document
// -----------------------------------------------------------------------------
// Shopify fetches this to learn about all the other endpoints.
// We serve our proxy's URLs so everything routes through us.

app.get("/.well-known/openid-configuration", (req, res) => {
  const discovery = {
    issuer: PROXY_BASE_URL,
    authorization_endpoint: `${PROXY_BASE_URL}/authorize`,
    token_endpoint: `${PROXY_BASE_URL}/token`,
    userinfo_endpoint: `${PROXY_BASE_URL}/userinfo`,
    jwks_uri: `${PROXY_BASE_URL}/jwks`,
    scopes_supported: entraEndpoints.scopes_supported || ["openid", "profile", "email"],
    response_types_supported: entraEndpoints.response_types_supported || ["code"],
    grant_types_supported: entraEndpoints.grant_types_supported || ["authorization_code"],
    subject_types_supported: entraEndpoints.subject_types_supported || ["pairwise"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    claims_supported: [
      "sub", "iss", "aud", "exp", "iat", "nonce",
      "name", "given_name", "family_name",
      "email", "email_verified",
      "preferred_username"
    ],
  };

  console.log(`📋 Discovery document requested`);
  res.json(discovery);
});

// -----------------------------------------------------------------------------
// JWKS Endpoint
// -----------------------------------------------------------------------------
// Serves our public key. Shopify uses this to verify the re-signed id_token.

app.get("/jwks", (req, res) => {
  console.log(`🔐 JWKS requested`);
  res.json({
    keys: [publicJwk],
  });
});

// -----------------------------------------------------------------------------
// Authorization Endpoint
// -----------------------------------------------------------------------------
// Shopify redirects the user here. We forward to Entra, but swap the
// redirect_uri so Entra sends the code back to us (not directly to Shopify).

app.get("/authorize", (req, res) => {
  const params = new URLSearchParams(req.query);

  // Log what Shopify is sending
  const shopifyClientId = params.get("client_id");
  log(`\n🔑 Authorize request received`);
  log(`   Shopify's client_id: ${shopifyClientId}`);
  log(`   We will use Entra client_id: ${ENTRA_CLIENT_ID}`);
  if (shopifyClientId !== ENTRA_CLIENT_ID) {
    log(`   ⚠️  CLIENT ID MISMATCH! Shopify expects aud=${shopifyClientId} but token will have aud=${ENTRA_CLIENT_ID}`);
  }

  // Store the original redirect_uri that Shopify expects the code sent to.
  // We pass it through via the state parameter (encoded).
  // In production, use a proper session store instead.
  const originalRedirectUri = params.get("redirect_uri");
  const originalState = params.get("state") || "";

  // Encode into a composite state value (include original client_id for audience fix)
  const proxyState = Buffer.from(
    JSON.stringify({
      redirect_uri: originalRedirectUri,
      state: originalState,
      client_id: shopifyClientId  // Store for token rewriting
    })
  ).toString("base64url");

  // Rewrite params for Entra
  params.set("redirect_uri", `${PROXY_BASE_URL}/callback`);
  params.set("state", proxyState);
  params.set("client_id", ENTRA_CLIENT_ID);

  const entraAuthUrl = `${entraEndpoints.authorization_endpoint}?${params.toString()}`;

  console.log(`🔀 Authorize → redirecting to Entra`);
  console.log(`   Original redirect_uri: ${originalRedirectUri}`);
  console.log(`   Scopes: ${params.get("scope")}`);

  res.redirect(entraAuthUrl);
});

// -----------------------------------------------------------------------------
// Callback Endpoint
// -----------------------------------------------------------------------------
// Entra redirects here after user authenticates. We extract the code and
// forward it back to Shopify's original redirect_uri.

app.get("/callback", (req, res) => {
  const { code, state: proxyState, error, error_description } = req.query;

  // Handle errors from Entra
  if (error) {
    console.error(`❌ Entra auth error: ${error} — ${error_description}`);
    // Try to extract original redirect_uri to send error back to Shopify
    try {
      const { redirect_uri, state } = JSON.parse(
        Buffer.from(proxyState, "base64url").toString()
      );
      const errorParams = new URLSearchParams({ error, error_description, state });
      return res.redirect(`${redirect_uri}?${errorParams.toString()}`);
    } catch {
      return res.status(400).json({ error, error_description });
    }
  }

  // Decode composite state to get Shopify's original redirect_uri
  let originalRedirectUri, originalState;
  try {
    const decoded = JSON.parse(Buffer.from(proxyState, "base64url").toString());
    originalRedirectUri = decoded.redirect_uri;
    originalState = decoded.state;
  } catch (e) {
    console.error(`❌ Failed to decode state: ${e.message}`);
    return res.status(400).json({ error: "invalid_state" });
  }

  console.log(`✅ Callback received from Entra`);
  console.log(`   Code: ${code?.substring(0, 20)}...`);
  console.log(`   Forwarding to: ${originalRedirectUri}`);

  // Forward code to Shopify
  const params = new URLSearchParams({ code, state: originalState });
  res.redirect(`${originalRedirectUri}?${params.toString()}`);
});

// -----------------------------------------------------------------------------
// Token Endpoint
// -----------------------------------------------------------------------------
// Shopify sends the authorization code here. We forward to Entra, then
// intercept the response to fix email_verified in the id_token.

app.post("/token", async (req, res) => {
  log(`\n🔄 Token exchange request received`);
  log(`   Request body keys: ${Object.keys(req.body).join(', ')}`);
  log(`   client_id from body: ${req.body.client_id}`);
  log(`   redirect_uri from Shopify: ${req.body.redirect_uri}`);
  log(`   Authorization header present: ${!!req.headers.authorization}`);

  // Extract client_id - could be in body OR in Basic Auth header
  let shopifyClientId = req.body.client_id;

  // Check for Basic Auth (Shopify uses client_secret_basic method)
  if (!shopifyClientId && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
      const [clientId, clientSecret] = credentials.split(':');
      shopifyClientId = clientId;
      log(`   client_id from Basic Auth: ${shopifyClientId}`);
    }
  }

  log(`   Final client_id for audience: ${shopifyClientId}`);

  // Build the request to Entra's token endpoint
  const entraParams = new URLSearchParams();

  // Forward standard OAuth params
  entraParams.set("grant_type", req.body.grant_type || "authorization_code");
  entraParams.set("code", req.body.code);
  entraParams.set("redirect_uri", `${PROXY_BASE_URL}/callback`); // Must match authorize step
  entraParams.set("client_id", ENTRA_CLIENT_ID);
  entraParams.set("client_secret", ENTRA_CLIENT_SECRET);

  // Forward PKCE code_verifier if present
  if (req.body.code_verifier) {
    entraParams.set("code_verifier", req.body.code_verifier);
  }

  // Forward scope if present
  if (req.body.scope) {
    entraParams.set("scope", req.body.scope);
  }

  try {
    // Exchange code with Entra
    console.log(`   → Forwarding to Entra token endpoint`);
    const entraRes = await fetch(entraEndpoints.token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: entraParams.toString(),
    });

    const entraBody = await entraRes.json();

    if (!entraRes.ok) {
      console.error(`   ❌ Entra token error: ${JSON.stringify(entraBody)}`);
      return res.status(entraRes.status).json(entraBody);
    }

    console.log(`   ✅ Got tokens from Entra`);

    // Rewrite the id_token
    if (entraBody.id_token) {
      try {
        entraBody.id_token = await rewriteIdToken(entraBody.id_token, shopifyClientId);
        log(`   ✅ Token rewritten successfully`);
      } catch (rewriteErr) {
        log(`   ❌ Token rewrite failed: ${rewriteErr.message}`);
        log(`   Stack: ${rewriteErr.stack}`);
        throw rewriteErr;
      }
    }

    // Log what we're returning
    log(`   📤 Returning token response to Shopify`);
    log(`   Response keys: ${Object.keys(entraBody).join(', ')}`);
    log(`   access_token present: ${!!entraBody.access_token}`);
    log(`   id_token present: ${!!entraBody.id_token}`);
    log(`   id_token (first 100 chars): ${entraBody.id_token?.substring(0, 100)}...`);
    log(`   refresh_token present: ${!!entraBody.refresh_token}`);
    log(`   token_type: ${entraBody.token_type}`);
    log(`   expires_in: ${entraBody.expires_in}`);
    log(`   scope: ${entraBody.scope}`);

    // Return modified response to Shopify
    res.json(entraBody);
  } catch (e) {
    log(`   ❌ Token exchange failed: ${e.message}`);
    log(`   Stack: ${e.stack}`);
    res.status(500).json({ error: "proxy_error", error_description: e.message });
  }
});

// -----------------------------------------------------------------------------
// UserInfo Endpoint
// -----------------------------------------------------------------------------
// Proxies to Entra's userinfo. Shopify calls this after id_token validates.

app.get("/userinfo", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "missing_authorization" });
  }

  console.log(`👤 UserInfo request — proxying to Entra`);

  try {
    const entraRes = await fetch(entraEndpoints.userinfo_endpoint, {
      headers: { Authorization: authHeader },
    });

    const data = await entraRes.json();

    console.log(`   📥 Entra userinfo: ${JSON.stringify(data, null, 2)}`);

    // Apply same fixes as id_token
    // 1. Fix email_verified
    if (data.email_verified !== undefined) {
      data.email_verified = data.email_verified === true || data.email_verified === "true";
    }

    // 2. Fix upn - set to email so Shopify shows correct email
    if (data.email) {
      data.upn = data.email;
    }

    // 3. Fix name - construct from given_name + family_name if "unknown"
    if (!data.name || data.name === "unknown") {
      const nameParts = [data.given_name, data.family_name].filter(Boolean);
      if (nameParts.length > 0) {
        data.name = nameParts.join(' ');
      }
    }

    // 4. Add first_name/last_name aliases
    if (data.given_name) {
      data.first_name = data.given_name;
    }
    if (data.family_name) {
      data.last_name = data.family_name;
    }

    console.log(`   📤 Fixed userinfo: ${JSON.stringify(data, null, 2)}`);

    res.status(entraRes.status).json(data);
  } catch (e) {
    console.error(`   ❌ UserInfo proxy failed: ${e.message}`);
    res.status(502).json({ error: "proxy_error" });
  }
});

// -----------------------------------------------------------------------------
// JWT Rewriting
// -----------------------------------------------------------------------------
// Decodes the Entra id_token, fixes claim types, re-signs with our RSA key.

async function rewriteIdToken(originalToken, shopifyClientId) {
  // Decode the original claims (no verification needed — we trust Entra)
  const claims = decodeJwt(originalToken);

  log(`🔍 Original claims: ${JSON.stringify(claims, null, 2)}`);

  // --- MINIMAL FIX: Only what's strictly necessary ---

  // 1. Fix email_verified: string → boolean (the core bug fix)
  if (claims.email_verified !== undefined) {
    claims.email_verified = claims.email_verified === true || claims.email_verified === "true";
  }

  // 2. Rewrite issuer to match our proxy's discovery document
  claims.iss = PROXY_BASE_URL;

  // 3. Strip Entra internal claims
  delete claims.xms_edov;
  delete claims.aio;
  delete claims.rh;
  delete claims.uti;

  // 4. Fix upn - Shopify prefers this over email, so set it to the actual email
  if (claims.email) {
    claims.upn = claims.email;
  }

  // 5. Fix name - Entra returns "unknown", construct from given_name + family_name
  if (!claims.name || claims.name === "unknown") {
    const nameParts = [claims.given_name, claims.family_name].filter(Boolean);
    if (nameParts.length > 0) {
      claims.name = nameParts.join(' ');
    }
  }

  // 6. Add first_name/last_name aliases - Shopify may use these instead of given_name/family_name
  if (claims.given_name) {
    claims.first_name = claims.given_name;
  }
  if (claims.family_name) {
    claims.last_name = claims.family_name;
  }

  // Extract timing claims
  const { iat, exp, nbf, ...restClaims } = claims;

  // Re-sign with our private key
  const newToken = await new SignJWT(restClaims)
    .setProtectedHeader({ alg: "RS256", kid: publicJwk.kid, typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(privateKey);

  const newClaims = decodeJwt(newToken);
  log(`📦 Rewritten token claims: ${JSON.stringify(newClaims, null, 2)}`);

  return newToken;
}

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    proxy: PROXY_BASE_URL,
    entra_tenant: ENTRA_DISCOVERY_URL,
    key_id: publicJwk?.kid,
  });
});

// -----------------------------------------------------------------------------
// Debug: decode any JWT (useful during development)
// -----------------------------------------------------------------------------

app.get("/debug/decode", (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "provide ?token=..." });
  try {
    const claims = decodeJwt(token);
    const header = decodeProtectedHeader(token);
    res.json({ header, claims });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// -----------------------------------------------------------------------------
// Catch-all for debugging
// -----------------------------------------------------------------------------

app.use((req, res, next) => {
  log(`\n⚠️  Unhandled request: ${req.method} ${req.path}`);
  log(`   Query: ${JSON.stringify(req.query)}`);
  log(`   Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// -----------------------------------------------------------------------------
// Start
// -----------------------------------------------------------------------------

init().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 Shopify OIDC Proxy running on port ${PORT}`);
    console.log(`\n📋 Configure Shopify with these OIDC settings:`);
    console.log(`   Issuer URL:     ${PROXY_BASE_URL}`);
    console.log(`   Discovery:      ${PROXY_BASE_URL}/.well-known/openid-configuration`);
    console.log(`   Client ID:      ${ENTRA_CLIENT_ID}`);
    console.log(`   Client Secret:  (same as Entra app)`);
    console.log(`\n   Health check:   ${PROXY_BASE_URL}/health`);
    console.log(`   JWKS:           ${PROXY_BASE_URL}/jwks`);
  });
});
