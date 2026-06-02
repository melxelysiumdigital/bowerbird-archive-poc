// =============================================================================
// generate-keys.js — Create RSA key pair for signing rewritten JWTs
// =============================================================================
// Run once before starting the proxy: npm run generate-keys
// Keys are saved to the KEYS_PATH directory (default: ./keys)

import { exportJWK } from "jose";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { randomUUID, generateKeyPairSync } from "crypto";
import { config } from "dotenv";

config();

const keysPath = process.env.KEYS_PATH || "./keys";

async function generate() {
  if (existsSync(`${keysPath}/private.json`)) {
    console.log("⚠️  Keys already exist. Delete the keys/ directory to regenerate.");
    console.log(`   ${keysPath}/private.json`);
    console.log(`   ${keysPath}/public.json`);
    process.exit(0);
  }

  console.log("🔑 Generating RSA-2048 key pair...\n");

  // Use Node crypto for extractable keys
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });

  const privateJwk = await exportJWK(privateKey);
  const publicJwk = await exportJWK(publicKey);

  // Add key ID — Shopify uses this to match against JWKS
  const kid = randomUUID();
  privateJwk.kid = kid;
  privateJwk.use = "sig";
  privateJwk.alg = "RS256";
  publicJwk.kid = kid;
  publicJwk.use = "sig";
  publicJwk.alg = "RS256";

  mkdirSync(keysPath, { recursive: true });
  writeFileSync(`${keysPath}/private.json`, JSON.stringify(privateJwk, null, 2));
  writeFileSync(`${keysPath}/public.json`, JSON.stringify(publicJwk, null, 2));

  console.log(`✅ Keys written to ${keysPath}/`);
  console.log(`   Key ID (kid): ${kid}`);
  console.log(`   Algorithm: RS256`);
  console.log(`\n   private.json — used by proxy to sign JWTs (keep secret!)`);
  console.log(`   public.json  — served at /jwks for Shopify to verify`);
}

generate().catch(console.error);
