# BlindPay

**Privacy-first invoice and payment protocol on Starknet STRK20**

BlindPay lets merchants create invoices and receive payments through the [STRK20 privacy pool](https://strk20.starknet.io/docs). Payers deposit into a privacy escrow via shielded notes; merchants claim with a shared secret. Sender, recipient, and in-pool amounts stay hidden — settlement is verifiable without linking identities on-chain.

| Create Invoice | Private Pay | Merchant Claim | Scan QR |
|:-:|:-:|:-:|:-:|
| <img src="assets/screenshots/create-invoice.png" alt="Create Invoice" width="200" /> | <img src="assets/screenshots/pay-usdc.png" alt="Pay with USDC" width="200" /> | <img src="assets/screenshots/pay-eth.png" alt="Claim" width="200" /> | <img src="assets/screenshots/scan-qr.png" alt="Scan QR Code" width="200" /> |

**Chain:** Starknet (Sepolia / Mainnet)  
**Privacy:** STRK20 shielded notes + Cairo escrow anonymizer  
**Wallet:** Privacy-enabled wallet ([Ready](https://www.argent.xyz/ready)) via [Privacy Wallet API](https://github.com/Akashneelesh/awesome-strk20)

---

## Hackathon alignment

BlindPay is built for the STRK20 / Starknet privacy hackathon. How it maps to the judging criteria:

| Weight | Criterion | How BlindPay delivers |
|--------|-----------|------------------------|
| **30%** | STRK20 integration depth | Shielded balances (`strk20Balances`), private transfers via `strk20InvokeTransaction`, escrow **anonymizer** contract with `privacy_invoke`, Poseidon commitments, [strk20-starter-kit](https://github.com/Akashneelesh/strk20-starter-kit) SDK patterns, Ready wallet Privacy Wallet API |
| **30%** | Working mainnet product | Full create → pay → claim flow on Starknet; switch provider to Mainnet (see below); real Ready wallet transactions |
| **25%** | Innovation | Private **invoicing** + merchant dashboard on STRK20 — Stripe-like checkout/API for shielded payments, not just a transfer demo |
| **15%** | Documentation & OSS | This README, [`contracts/README.md`](contracts/README.md), MIT [LICENSE](LICENSE), Cairo tests (`snforge test`), monorepo SDK/CLI/MCP |

---

## Features

### Core

- **Private invoice links** — QR codes and URLs with escrow commitment secrets
- **STRK20 escrow deposits** — Payers fund invoices through the privacy pool without revealing identity
- **Secret-based claims** — Merchants claim into shielded balances using `claimSecret`
- **Shielded balance dashboard** — Merchant profile reads STRK20 notes via wallet API
- **Multi-token** — STRK and USDC on Starknet
- **Invoice types** — Standard, multi-pay, and donation
- **Merchant API** — Checkout sessions, webhooks, analytics (Stripe-like)
- **SDK / CLI / MCP** — Integrate BlindPay into your stack

### Developer experience

- **starknet.js v10** + `WalletAccountV6` for STRK20 actions
- **get-starknet v6** wallet discovery (Ready, Xverse)
- **Cairo contracts** — `BlindPayEscrow` with snforge integration tests
- **Backend indexer** — Fast invoice lookups, encrypted merchant metadata
- **React frontend** — Desktop and mobile UI

---

## Architecture

```
Merchant                          Payer
   │                                │
   ├─ Generate salt + claimSecret   │
   ├─ commitment_hash (Poseidon)    │
   ├─ Save invoice (backend)        │
   ├─ Share payment link ─────────► │
   │                                ├─ STRK20: withdraw → escrow
   │                                ├─ privacy_invoke(deposit)
   │                                │
   ├─ STRK20: open note + claim ◄───│
   └─ Shielded balance              └─
```

### Layers

1. **STRK20 (on-chain)** — Privacy pool + Cairo [`BlindPayEscrow`](contracts/src/escrow.cairo) anonymizer
2. **Frontend** — React + starknet.js + Privacy Wallet API
3. **Backend** — Node.js indexer/API (PostgreSQL)

---

## Quick start

### Prerequisites

- Node.js 18+
- [Scarb](https://docs.swmansion.com/scarb/) 2.12+ and [snforge](https://foundry-rs.github.io/starknet-foundry/) (for contracts)
- [Alchemy](https://alchemy.com) Starknet RPC key
- [Ready wallet](https://www.argent.xyz/ready) with STRK20 enabled (Sepolia or Mainnet)

### Install

```bash
npm install
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

### Build & test

```bash
# Cairo escrow contract
npm run contracts:build
npm run contracts:test

# Frontend production build
npm run frontend:build
```

### Configure frontend (`frontend/.env`)

**Sepolia (default):**

```env
VITE_API_URL=http://localhost:3000/api
VITE_ALCHEMY_API_KEY=your-alchemy-key
VITE_STRK20_ESCROW_ADDRESS=0x01ad75c06ad9086bec4c24c967397c3fdbb32f8c11525bca82e425dc17d270cc
VITE_STRK20_POOL_ADDRESS=0xd894af9ed2bdede33675049ae5285df000c44258a2250b84a9c3bed0d7c233
```

**Mainnet:** use mainnet pool + escrow addresses from [STRK20 docs](https://strk20.starknet.io/docs) or your deployment, then in the app switch network to **Mainnet** (provider index 0). Ensure Ready is on Starknet Mainnet with STRK20 enabled.

### Run locally

```bash
# Terminal 1 — backend
cd backend && npm install && npm start

# Terminal 2 — frontend
cd frontend && npm install && npm run dev
```

Open http://localhost:5173

### End-to-end demo (Sepolia or Mainnet)

1. Connect **Ready** wallet (STRK20 enabled).
2. **Create invoice** — note the payment link (includes claim secret).
3. **Pay** (second wallet or incognito) — STRK20 withdraw → escrow + deposit invoke.
4. **Claim** on merchant wallet — open note + claim invoke; check shielded balance on Profile.

---

## STRK20 resources

- [awesome-strk20](https://github.com/Akashneelesh/awesome-strk20) — libraries, PoCs, escrow helper
- [strk20-starter-kit](https://github.com/Akashneelesh/strk20-starter-kit) — WalletAccountV6 integration reference
- [STRK20 by Example](https://strk20.starknet.io/docs) — integration guides
- [Private Escrow PoC](https://github.com/Akashneelesh/awesome-strk20/tree/main/pocs/private-escrow) — same pattern BlindPay uses

---

## Monorepo layout

```
BlindPay/
├── frontend/          # React app (STRK20 + Ready wallet)
├── backend/           # Indexer + merchant API
├── contracts/         # Cairo BlindPayEscrow + snforge tests
└── packages/
    ├── sdk/           # @blindpay/node
    ├── cli/           # blindpay CLI
    └── mcp-server/    # MCP tools for agents
```

---

## License

MIT — see [LICENSE](LICENSE).
