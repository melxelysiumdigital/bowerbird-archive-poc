// =============================================================================
// test-rewrite.js — Verify JWT rewriting works correctly
// =============================================================================
// Simulates what Entra returns and confirms email_verified becomes boolean

import { importJWK, SignJWT, decodeJwt, jwtVerify } from "jose";
import { readFileSync } from "fs";
import { generateKeyPairSync } from "crypto";
import { exportJWK } from "jose";
import { config } from "dotenv";

config();

const KEYS_PATH = process.env.KEYS_PATH || "./keys";

async function test() {
  console.log("🧪 Testing JWT rewrite flow\n");

  // 1. Create a fake "Entra" id_token with string email_verified
  console.log("1️⃣  Creating fake Entra id_token (string email_verified)...");

  const { privateKey: entraKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const entraJwk = await exportJWK(entraKey);

  const fakeEntraToken = await new SignJWT({
    sub: "user-123-abc",
    email: "test@example.com",
    email_verified: "true",    // ← THE PROBLEM: string, not boolean
    name: "Test User",
    given_name: "Test",
    family_name: "User",
    preferred_username: "test@example.com",
    nonce: "abc-123-nonce",
    xms_edov: true,            // Entra's boolean version (wrong claim name)
    aud: "cd75e1a7-8f0a-48f4-92da-9606ade41f41",
    iss: "https://ShopifyExternalPOC.ciamlogin.com/a6967e10-cc01-448b-af96-d0a13086b19e/v2.0",
    aio: "some-entra-internal-value",
    rh: "another-entra-value",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(entraKey);

  const originalClaims = decodeJwt(fakeEntraToken);
  console.log(`   email_verified: ${JSON.stringify(originalClaims.email_verified)} (${typeof originalClaims.email_verified})`);
  console.log(`   xms_edov: ${JSON.stringify(originalClaims.xms_edov)} (${typeof originalClaims.xms_edov})`);
  console.log(`   iss: ${originalClaims.iss}`);

  // 2. Rewrite it using our proxy keys (same logic as server.js)
  console.log("\n2️⃣  Rewriting with proxy keys...");

  const proxyPrivJwk = JSON.parse(readFileSync(`${KEYS_PATH}/private.json`, "utf-8"));
  const proxyPubJwk = JSON.parse(readFileSync(`${KEYS_PATH}/public.json`, "utf-8"));
  const proxyPrivKey = await importJWK(proxyPrivJwk, "RS256");
  const proxyPubKey = await importJWK(proxyPubJwk, "RS256");

  // Apply the same transforms as server.js
  const claims = { ...originalClaims };
  
  // Fix email_verified
  claims.email_verified = claims.email_verified === true || claims.email_verified === "true";
  
  // Remove Entra-specific claims
  delete claims.xms_edov;
  delete claims.aio;
  delete claims.rh;

  // Rewrite issuer
  claims.iss = "https://proxy.example.com";

  // Extract timing
  const { iat, exp, nbf, ...restClaims } = claims;

  const rewrittenToken = await new SignJWT(restClaims)
    .setProtectedHeader({ alg: "RS256", kid: proxyPubJwk.kid, typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(proxyPrivKey);

  // 3. Verify the rewritten token
  console.log("\n3️⃣  Verifying rewritten token...");

  const { payload } = await jwtVerify(rewrittenToken, proxyPubKey, {
    issuer: "https://proxy.example.com",
    audience: "cd75e1a7-8f0a-48f4-92da-9606ade41f41",
  });

  console.log(`   ✅ Signature valid`);
  console.log(`   ✅ Issuer verified: ${payload.iss}`);
  console.log(`   ✅ Audience verified: ${payload.aud}`);

  // 4. Check the critical claims
  console.log("\n4️⃣  Checking claims...");
  
  const checks = [
    {
      name: "email_verified is boolean",
      pass: typeof payload.email_verified === "boolean",
      detail: `${JSON.stringify(payload.email_verified)} (${typeof payload.email_verified})`,
    },
    {
      name: "email_verified is true",
      pass: payload.email_verified === true,
      detail: `${payload.email_verified}`,
    },
    {
      name: "nonce preserved",
      pass: payload.nonce === "abc-123-nonce",
      detail: payload.nonce,
    },
    {
      name: "email preserved",
      pass: payload.email === "test@example.com",
      detail: payload.email,
    },
    {
      name: "sub preserved",
      pass: payload.sub === "user-123-abc",
      detail: payload.sub,
    },
    {
      name: "xms_edov removed",
      pass: payload.xms_edov === undefined,
      detail: `${payload.xms_edov}`,
    },
    {
      name: "aio removed",
      pass: payload.aio === undefined,
      detail: `${payload.aio}`,
    },
    {
      name: "issuer rewritten",
      pass: payload.iss === "https://proxy.example.com",
      detail: payload.iss,
    },
  ];

  let allPassed = true;
  for (const check of checks) {
    const icon = check.pass ? "✅" : "❌";
    console.log(`   ${icon} ${check.name}: ${check.detail}`);
    if (!check.pass) allPassed = false;
  }

  // 5. Show raw comparison
  console.log("\n5️⃣  Raw JWT payload comparison:");
  console.log("\n   BEFORE (Entra):");
  console.log(`   ${JSON.stringify({ email_verified: originalClaims.email_verified, xms_edov: originalClaims.xms_edov, iss: originalClaims.iss }, null, 2).split("\n").join("\n   ")}`);
  console.log("\n   AFTER (Proxy):");
  console.log(`   ${JSON.stringify({ email_verified: payload.email_verified, xms_edov: payload.xms_edov, iss: payload.iss }, null, 2).split("\n").join("\n   ")}`);

  console.log(`\n${allPassed ? "🎉 ALL CHECKS PASSED" : "💥 SOME CHECKS FAILED"}`);
  
  // Bonus: show what JSON.stringify does (this is what's in the JWT payload)
  console.log("\n📝 JSON serialization proof:");
  console.log(`   Before: "email_verified":${JSON.stringify(originalClaims.email_verified)}`);
  console.log(`   After:  "email_verified":${JSON.stringify(payload.email_verified)}`);
  console.log(`   (Shopify decodes the JWT and checks typeof email_verified === 'boolean')`);
}

test().catch(console.error);
