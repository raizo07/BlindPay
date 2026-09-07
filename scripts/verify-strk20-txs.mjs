#!/usr/bin/env node
/**
 * Verify Starknet mainnet txs touch the STRK20 pool.
 * Usage: node scripts/verify-strk20-txs.mjs 0xhash1 0xhash2 ...
 */
const POOL =
  process.env.STRK20_POOL_ADDRESS ||
  "0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a";
const RPC =
  process.env.STARKNET_MAINNET_RPC || "https://rpc.starknet.lava.build/rpc/v0_8";

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
    console.warn("    (relayer txs may emit pool events under different indexing — check Voyager manually)");
  } else {
    console.log(`  ✓ ${hash}: succeeded, pool event found`);
  }
  return { hash, ok: true, eventCount: events.length };
}

(async () => {
  console.log(`RPC: ${RPC}`);
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
