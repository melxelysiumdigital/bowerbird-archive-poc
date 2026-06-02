# @bowerbird-poc/oidc-proxy

OIDC proxy that sits between Shopify and Microsoft Entra External ID to fix a spec-compliance issue with the `email_verified` claim.

## The Problem

Shopify's native OIDC integration (Customer Account API on Plus stores) requires `email_verified` to be a **boolean** (`true` / `false`) per the [OIDC Core spec §5.1](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims).

Microsoft Entra External ID emits it as a **string** (`"true"` / `"false"`). This is a known Entra limitation — they put the correct boolean value in a proprietary claim called `xms_edov` instead, which Shopify doesn't know about.

The result: Shopify rejects the id_token and login fails.

## The Fix

This proxy transparently intercepts the OIDC flow between Shopify and Entra:

```
Shopify  ←→  Proxy  ←→  Entra External ID
```

At the token exchange step, it:

1. Receives the id_token from Entra
2. Converts `email_verified` from string `"true"` to boolean `true`
3. Strips Entra-internal claims (`xms_edov`, `aio`, `rh`, `uti`)
4. Rewrites the issuer to match the proxy's discovery document
5. Re-signs the JWT with its own RSA key pair
6. Returns the fixed token to Shopify

Shopify sees a spec-compliant OIDC response and the login succeeds.

## Architecture

The proxy implements a full OIDC provider facade:

| Endpoint                            | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `/.well-known/openid-configuration` | Discovery document (proxy URLs)                    |
| `/authorize`                        | Forwards to Entra, rewrites redirect_uri           |
| `/callback`                         | Receives auth code from Entra, forwards to Shopify |
| `/token`                            | **Core fix** — exchanges code, rewrites id_token   |
| `/userinfo`                         | Proxies to Entra, fixes email_verified there too   |
| `/jwks`                             | Serves proxy's RSA public key                      |
| `/health`                           | Status check                                       |
| `/debug/decode?token=...`           | JWT decoder (dev only)                             |

State is passed through the authorize→callback round-trip via a composite base64url-encoded state parameter containing Shopify's original `redirect_uri` and `state`.

## Setup

### 1. Install dependencies

```bash
cd packages/oidc-proxy
npm install
```

### 2. Generate signing keys

```bash
npm run generate-keys
```

This creates `keys/private.json` and `keys/public.json` (RSA-2048, RS256). These are gitignored — each environment needs its own key pair.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add:

- `ENTRA_CLIENT_SECRET` — from the Entra app registration (Cool Cat Shopify POC)
- `PROXY_BASE_URL` — the public URL of the proxy (ngrok for dev, real domain for prod)

The Entra tenant and client ID are pre-filled for the Cool Cat POC:

- Tenant: `ShopifyExternalPOC.onmicrosoft.com` (`a6967e10-cc01-448b-af96-d0a13086b19e`)
- App: Cool Cat Shopify POC (`cd75e1a7-8f0a-48f4-92da-9606ade41f41`)

### 4. Start the proxy

```bash
npm start
# or for dev with auto-restart:
npm run dev
```

### 5. Expose locally (dev)

```bash
ngrok http 3000
```

Then update `PROXY_BASE_URL` in `.env` with the ngrok URL and restart.

### 6. Configure Entra

Add `https://{proxy-url}/callback` as a redirect URI in the Entra app registration.

### 7. Configure Shopify

In the Shopify Plus admin under Customer Accounts → OIDC:

| Setting       | Value                                  |
| ------------- | -------------------------------------- |
| Issuer URL    | `https://{proxy-url}`                  |
| Client ID     | `cd75e1a7-8f0a-48f4-92da-9606ade41f41` |
| Client Secret | (same Entra client secret)             |

## Testing

Run the JWT rewrite test to verify the boolean fix works:

```bash
npm test
```

This creates a fake Entra token with `email_verified: "true"` (string), runs it through the same rewrite logic as the server, and verifies:

- ✅ `email_verified` is boolean `true` (not string)
- ✅ `nonce`, `email`, `sub` preserved
- ✅ Entra-specific claims removed
- ✅ Issuer rewritten
- ✅ JWT signature valid

## Production Considerations

This is a POC. For production:

- **Deploy** to Azure App Service or Container Apps (not ngrok)
- **TLS** — use a proper domain with a certificate
- **Key management** — store signing keys in Azure Key Vault, rotate periodically
- **Session store** — the composite state parameter works for POC but consider Redis/server-side storage for production
- **Monitoring** — add structured logging, health check alerts
- **Rate limiting** — protect the token and authorize endpoints
- **CORS** — configure if needed for your Shopify storefront

## Why Not miniOrange?

Products like [miniOrange SSO](https://plugins.miniorange.com/shopify-single-sign-on) solve a similar problem (brokering between Shopify and Entra) but they're full commercial SSO products ($89-199/mo) that replace Shopify's native auth with their own flow (typically using Multipass). This proxy is a lightweight, self-hosted shim that preserves Shopify's native OIDC integration and fixes exactly one bug. If Microsoft ever fixes Entra External ID to emit proper booleans, this proxy becomes unnecessary.

## Dependencies

- **express** — HTTP server
- **jose** — JWT signing/verification (OIDC-compliant)
- **dotenv** — Environment config

Requires Node.js 18+ (uses native `fetch`).
