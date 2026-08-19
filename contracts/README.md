# BlindPay Contracts (STRK20)

BlindPay no longer uses custom Solidity contracts on Ethereum. Private invoice settlement runs through **Starknet STRK20**:

- **Privacy pool** — shielded notes and private transfers
- **Escrow helper** — deferred delivery via `privacy_invoke` (commitment hash + secret claim)

## Deployed on Starknet Sepolia

| Contract | Address |
|----------|---------|
| Escrow | `0x01ad75c06ad9086bec4c24c967397c3fdbb32f8c11525bca82e425dc17d270cc` |
| Privacy Pool | `0xd894af9ed2bdede33675049ae5285df000c44258a2250b84a9c3bed0d7c233` |

Configure these in the frontend via `VITE_STRK20_ESCROW_ADDRESS` and `VITE_STRK20_POOL_ADDRESS`.

## Reference implementations

- [STRK20 escrow helper (Cairo)](https://github.com/Akashneelesh/awesome-strk20/tree/main/pocs/escrow-helper)
- [Private Escrow PoC](https://github.com/Akashneelesh/awesome-strk20/tree/main/pocs/private-escrow)
- [STRK20 starter kit](https://github.com/Akashneelesh/strk20-starter-kit)
- [STRK20 by Example](https://strk20.starknet.io/docs)

## Flow

1. **Merchant** creates an invoice off-chain; generates `claimSecret` and `commitment_hash = poseidon(ESCROW_COMMITMENT_TAG, secret)`.
2. **Payer** submits a STRK20 transaction: withdraw to escrow + `privacy_invoke` deposit with commitment hash.
3. **Merchant** claims with `claimSecret` via STRK20: open note + `privacy_invoke` claim.

See the [awesome-strk20](https://github.com/Akashneelesh/awesome-strk20) repo for Cairo source and integration guides.
