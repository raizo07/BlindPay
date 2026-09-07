# BlindPay — Starknet Mainnet & `strk20.json`

Hackathon eligibility requires **three mainnet transaction hashes** in [`strk20.json`](../strk20.json) at the repo root. Each hash is verified on-chain: it must succeed, touch the **STRK20 pool**, and (if you list `contracts`) emit an event from your **BlindPayEscrow**.

Official pool (mainnet): [`0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`](https://voyager.online/contract/0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a)

See also: [STRK20 hackathon Day 0 guide](https://github.com/starkience/strk20-hackathon/blob/main/docs/MAINNET-DAY-0.md)

---

## Overview

| Step | What | Who |
|------|------|-----|
| 1 | Deploy `BlindPayEscrow` on mainnet | You (sncast + funded account) |
| 2 | Configure frontend + backend for mainnet | `.env` |
| 3 | Register viewing key in Ready (once) | Ready wallet |
| 4 | Shield USDC/STRK in Ready | Ready wallet |
| 5 | Run 3 pool txs through BlindPay | Ready wallet (2 wallets for pay + claim) |
| 6 | Paste tx hashes into `strk20.json` | Git commit |

---

## Step 1 — Deploy escrow on mainnet

### Prerequisites

- [Scarb 2.12.1](https://docs.swmansion.com/scarb/) + [snforge/sncast 0.50.0](https://foundry-rs.github.io/starknet-foundry/)
- Mainnet STRK on a deployer account

### Create a mainnet sncast account (one-time)

**Ready / Argent wallets cannot declare contracts via sncast** (signature format mismatch). Use Ready for in-app STRK20 payments; use a separate **OpenZeppelin** account for deploy only.

```bash
# Create an OZ deployer (from repo root or contracts/)
sncast account create \
  --name oz_deployer \
  --type oz \
  --url https://rpc.starknet.lava.build/rpc/v0_9

# Fund oz_deployer with ~0.05 STRK from your Ready wallet, then:
sncast account deploy --name oz_deployer --url https://rpc.starknet.lava.build/rpc/v0_9

# Deploy BlindPayEscrow with the OZ account (not Ready):
cd contracts
SNCAST_PROFILE=mainnet SNCAST_ACCOUNT=oz_deployer ./scripts/deploy-mainnet.sh
```

To **import** an existing account (skip if you see "already exists"):

```bash
sncast account import \
  --name mainnet_deployer \
  --address 0xYOUR_ADDRESS \
  --private-key 0xYOUR_PRIVATE_KEY \
  --type ready \
  --url https://rpc.starknet.lava.build/rpc/v0_9
```

Use `--type ready` for Ready/Argent, `--type oz` for OpenZeppelin. Do **not** put `--url` before `sncast` — it belongs on the subcommand.

### Deploy

```bash
cd contracts
chmod +x scripts/deploy-mainnet.sh
SNCAST_PROFILE=mainnet SNCAST_ACCOUNT=oz_deployer ./scripts/deploy-mainnet.sh
```

This writes `contracts/deployments/mainnet.json` with your escrow address.

Constructor arg is the **canonical STRK20 pool** address above.

---

## Step 2 — Configure the app

`frontend/.env`:

```env
VITE_ALCHEMY_API_KEY=your-alchemy-mainnet-key
VITE_STRK20_POOL_ADDRESS_MAINNET=0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a
VITE_STRK20_ESCROW_ADDRESS_MAINNET=0xYOUR_DEPLOYED_ESCROW
VITE_USDC_ADDRESS_MAINNET=0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb
VITE_STRK_ADDRESS_MAINNET=0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
```

Run locally:

```bash
cd backend && docker compose up -d   # or npm start
cd frontend && npm run dev
```

In the app: connect **Ready** on **Mainnet**, switch network to Mainnet on the payment page if prompted.

---

## Step 3 — Ready wallet setup

1. Install [Ready](https://www.argent.xyz/ready) and switch to **Starknet Mainnet**.
2. Enable STRK20 / privacy in Ready settings.
3. **Register viewing key** (one-time) — use [strk20.starknet.io/app](https://strk20.starknet.io/app) or Ready’s shield flow.
4. **Shield** a small amount of USDC or STRK (public deposit into pool).

Use amounts you can afford to lose (a few dollars is enough).

---

## Step 4 — Three mainnet transactions for `strk20.json`

Because you list **your escrow** in `contracts`, each hash must show **pool activity** and an escrow event (`DepositRecorded` or `Claimed`).

Recommended flow (minimum 3 txs):

| # | Action | Wallet | Proves |
|---|--------|--------|--------|
| **1** | Pay invoice (STRK20 deposit → escrow) | Payer Ready | `privacy_invoke(Deposit)` + pool |
| **2** | Pay second invoice (or donation) | Payer Ready | Second `Deposit` |
| **3** | Claim invoice funds | Merchant Ready | `privacy_invoke(Claim)` + pool |

### How to run in BlindPay

1. **Merchant wallet (Mainnet):** Create invoice → copy payment link (no secret in URL).
2. **Payer wallet (Mainnet):** Open link → pay via STRK20.
3. Repeat for a second small invoice (tx **2**).
4. **Merchant wallet:** Profile → **Claim** on a settled invoice (tx **3**).

Copy each tx hash from Ready or [Voyager](https://voyager.online) (private txs may show a **relayer** as sender — that is expected).

---

## Step 5 — Fill `strk20.json`

At repo root:

```json
{
  "transactions": [
    "0xFIRST_PAYMENT_TX",
    "0xSECOND_PAYMENT_TX",
    "0xMERCHANT_CLAIM_TX"
  ],
  "contracts": [
    "0xYOUR_DEPLOYED_BLINDPAY_ESCROW"
  ],
  "demo_video": "https://youtu.be/YOUR_3MIN_DEMO",
  "demo_url": "https://your-demo.example"
}
```

Commit and push. The [hackathon hub](https://github.com/starkience/strk20-hackathon) re-reads this file every ~30 minutes.

### Verify locally (optional)

```bash
node scripts/verify-strk20-txs.mjs 0x... 0x... 0x...
```

Checks each tx succeeded and interacted with the mainnet pool.

---

## Checklist before deadline (Aug 31, 23:59 UTC)

- [ ] `BlindPayEscrow` deployed on mainnet
- [ ] Frontend live on a public URL (Vercel / GitHub Pages)
- [ ] `strk20.json`: 3 verified pool txs + escrow in `contracts`
- [ ] `demo_video` link (≤3 min)
- [ ] README documents what is / isn’t private

---

## Token addresses (mainnet)

| Token | Address |
|-------|---------|
| STRK20 Pool | `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a` |
| STRK | `0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d` |
| USDC (native) | `0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb` |
