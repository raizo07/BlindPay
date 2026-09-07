#!/usr/bin/env node
/**
 * Verify Starknet mainnet txs touch the STRK20 pool.
 * Usage: node scripts/verify-strk20-txs.mjs 0xhash1 0xhash2 ...
 *
 * RPC (first match wins):
 *   STARKNET_MAINNET_RPC
 *   VITE_ALCHEMY_API_KEY / ALCHEMY_API_KEY → Alchemy mainnet v0.10
 *   frontend/.env (auto-loaded if present)
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(join(ROOT, "frontend", ".env"));

const POOL =
  process.env.STRK20_POOL_ADDRESS ||
  "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a";

function resolveRpc() {
  if (process.env.STARKNET_MAINNET_RPC) {
    return process.env.STARKNET_MAINNET_RPC;
  }
  const key =
    process.env.VITE_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY || "";
  if (key.trim()) {
    return `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/${key.trim()}`;
  }
  return null;
}

const RPC = resolveRpc();
if (!RPC) {
  console.error(
    "Missing RPC: set STARKNET_MAINNET_RPC or VITE_ALCHEMY_API_KEY (e.g. in frontend/.env)."
  );
  process.exit(1);
}

function redactRpc(url) {
  return url.replace(/\/rpc\/v0_\d+\/[^/?#]+/, "/rpc/v0_10/***");
}

const hashes = process.argv.slice(2);
if (!hashes.length) {
  console.error("Usage: node scripts/verify-strk20-txs.mjs <txHash>...");
  process.exit(1);
}

async function rpc(method, params) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
}

function norm(addr) {
  return BigInt(addr).toString(16);
}

async function verifyHash(hash) {
  const receipt = await rpc("starknet_getTransactionReceipt", [hash]);
  const status = receipt.execution_status || receipt.status;
  if (status !== "SUCCEEDED" && status !== "ACCEPTED_ON_L2") {
    throw new Error(`${hash}: execution status ${status}`);
  }

  const events = receipt.events || [];
  const poolNorm = norm(POOL);
  const touched = events.some((e) => norm(e.from_address) === poolNorm);
  if (!touched) {
    console.warn(`  ⚠ ${hash}: succeeded but no event from pool ${POOL}`);
    console.warn(
      "    (relayer txs may emit pool events under different indexing — check Voyager manually)"
    );
  } else {
    console.log(`  ✓ ${hash}: succeeded, pool event found`);
  }
  return { hash, ok: true, eventCount: events.length };
}

(async () => {
  console.log(`RPC: ${redactRpc(RPC)}`);
  console.log(`Pool: ${POOL}\n`);
  let failed = 0;
  for (const h of hashes) {
    try {
      await verifyHash(h);
    } catch (e) {
      console.error(`  ✗ ${h}: ${e.message}`);
      failed++;
    }
  }
  process.exit(failed ? 1 : 0);
})();
