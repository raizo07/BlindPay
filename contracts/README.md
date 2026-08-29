# BlindPay Contracts (Cairo / STRK20)

BlindPay ships a **Cairo escrow anonymizer** that integrates with the Starknet STRK20 privacy pool via `privacy_invoke`. This matches the [escrow helper PoC](https://github.com/Akashneelesh/awesome-strk20/tree/main/pocs/escrow-helper) pattern used in production STRK20 flows.

## Contract: `BlindPayEscrow`

| Function | Caller | Purpose |
|----------|--------|---------|
| `privacy_invoke(Deposit, …)` | Privacy pool | Record a commitment hash + token + amount after pool withdraw |
| `privacy_invoke(Claim, …)` | Privacy pool | Verify secret preimage, approve pool, return `OpenNoteDeposit` |
| `get_commitment(hash)` | Anyone | Read escrow state for a commitment |
| `compute_commitment_hash(secret)` | Off-chain / tests | `poseidon(ESCROW_COMMITMENT_TAG, secret)` |

## Prerequisites

- [Scarb](https://docs.swmansion.com/scarb/) **2.12.1** (must match CI — newer Scarb builds use syscalls incompatible with snforge 0.50)
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/) (`snforge`) **0.50.0** (must match `snforge_std` in `Scarb.toml`)

## Build & test

```bash
cd contracts
scarb build
snforge test
```

Or from the repo root:

```bash
npm run contracts:build
npm run contracts:test
```

## Deploy (Sepolia or Mainnet)

1. Deploy `BlindPayEscrow` with the STRK20 **privacy pool** address as constructor arg.
2. Register the escrow with the pool as an anonymizer (see [STRK20 docs](https://strk20.starknet.io/docs)).
3. Set `VITE_STRK20_ESCROW_ADDRESS` and `VITE_STRK20_POOL_ADDRESS` in `frontend/.env`.

### Default Sepolia addresses (community escrow helper)

| Contract | Address |
|----------|---------|
| Escrow | `0x01ad75c06ad9086bec4c24c967397c3fdbb32f8c11525bca82e425dc17d270cc` |
| Privacy Pool | `0xd894af9ed2bdede33675049ae5285df000c44258a2250b84a9c3bed0d7c233` |

For **mainnet**, use the deployed mainnet pool + your deployed escrow; point the frontend provider index to Mainnet (see root README).

## Flow

1. **Merchant** creates an invoice off-chain; generates `claimSecret` and `commitment_hash = poseidon(ESCROW_COMMITMENT_TAG, secret)`.
2. **Payer** submits a STRK20 transaction: withdraw to escrow + `privacy_invoke` deposit with commitment hash.
3. **Merchant** claims with `claimSecret` via STRK20: open note + `privacy_invoke` claim into shielded balance.

## References

- [awesome-strk20](https://github.com/Akashneelesh/awesome-strk20)
- [strk20-starter-kit](https://github.com/Akashneelesh/strk20-starter-kit)
- [STRK20 by Example](https://strk20.starknet.io/docs)
