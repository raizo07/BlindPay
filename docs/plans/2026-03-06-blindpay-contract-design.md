# BlindPay Smart Contract Design

## Overview

BlindPay is a confidential payment protocol built on fhEVM (Zama). Invoice amounts are stored as FHE-encrypted `euint64` values on-chain. Merchant running totals are encrypted. Only authorized parties can decrypt.

## Contract: `BlindPay.sol`

**Inherits:** `ZamaEthereumConfig`, `Ownable`, `ReentrancyGuard`

### Storage

```solidity
struct Invoice {
    address merchant;        // plaintext (needed for payment routing)
    euint64 encAmount;       // FHE-encrypted amount (6-decimal format)
    bytes32 commitHash;      // keccak256(merchant, amount, salt)
    uint8 tokenType;         // 0=ETH, 1=USDC
    uint8 invoiceType;       // 0=standard, 1=multipay, 2=donation
    uint8 status;            // 0=pending, 1=settled
    uint256 paymentCount;    // for multipay: tracks number of payments
}

mapping(bytes32 => Invoice) invoices;          // salt => Invoice
mapping(bytes32 => bool) receiptExists;        // receiptHash => bool
mapping(address => euint64) merchantTotals;    // encrypted running totals
mapping(address => uint256) invoiceCount;      // per-merchant invoice count
IERC20 usdcToken;                              // configurable USDC address
```

### Amount Encoding

All amounts use **6-decimal format** (1 USDC = 1_000_000, 1 ETH = 1_000_000).

- `euint64` max: 18,446,744,073,709,551,615 → ~18.4 trillion tokens in 6-decimal
- For ETH payments: `msg.value` (18-decimal wei) is divided by 1e12 on-chain
- For USDC: 6 decimals native, passed directly
- Commitment hash uses the 6-decimal amount

### Functions

#### `createInvoice(externalEuint64 encAmount, bytes inputProof, bytes32 salt, bytes32 commitHash, uint8 invoiceType, uint8 tokenType)`

- Merchant calls with FHE-encrypted amount (calldata is encrypted)
- Contract validates and stores encrypted amount
- Sets ACL: `FHE.allowThis(amount)`, `FHE.allow(amount, merchant)`
- Emits `InvoiceCreated`

#### `payInvoice(bytes32 salt, uint256 amount) payable`

- Payer provides plaintext amount for hash verification + fund transfer
- For standard invoices: verifies `keccak256(merchant, amount, salt) == commitHash`
- For donation/multipay: any amount accepted
- Updates status (checks-effects-interactions pattern)
- Transfers ETH via `call` or USDC via `safeTransferFrom`
- Encrypts payment amount, adds to merchant's encrypted running total
- Generates receipt hash, emits dual events

#### `getInvoice(bytes32 salt) view`

Returns: merchant, tokenType, invoiceType, status, paymentCount, commitHash
(encrypted amount NOT returned — only accessible via FHE.allow to merchant)

#### `verifyReceipt(bytes32 receiptHash) view`

Returns: bool (receipt exists or not)

#### `updateUsdcToken(address) onlyOwner`

Allows changing USDC token address without redeployment.

### Events

```
InvoiceCreated(bytes32 indexed salt, address indexed merchant, bytes32 commitHash, uint8 tokenType, uint8 invoiceType)
PaymentMade(bytes32 indexed salt, address indexed payer, bytes32 receiptHash, uint8 tokenType)
PaymentReceived(bytes32 indexed salt, address indexed merchant, bytes32 receiptHash, uint8 tokenType)
```

### FHE Features Used

1. `externalEuint64` + `FHE.fromExternal()` — encrypted inputs
2. `euint64` state variables — encrypted storage
3. `FHE.add()` — encrypted arithmetic on merchant totals
4. `FHE.allow()` / `FHE.allowThis()` — ACL management
5. `FHE.isInitialized()` — safe encrypted state access
6. `FHE.asEuint64()` — plaintext to ciphertext conversion

### Security

- ReentrancyGuard on payInvoice
- Checks-effects-interactions: status updated before fund transfer
- Salt uniqueness enforced
- ETH refund for overpayment
- SafeERC20 for token transfers
- Ownable for admin functions

### Privacy Model

| Data | Visibility | Notes |
|------|-----------|-------|
| Invoice amount | Encrypted (euint64) | Only merchant can decrypt |
| Merchant total sales | Encrypted (euint64) | Only merchant can decrypt |
| Payment amount | In calldata (for ETH: msg.value visible) | Encrypted in state after payment |
| Merchant address | Plaintext on-chain | Needed for routing; encrypted in backend DB |
| Invoice status | Plaintext | Needed for UI (pending/settled) |
| Receipt hash | Plaintext | Proof of payment existence |

### Frontend Integration

1. `@zama-fhe/relayer-sdk` — `createInstance(SepoliaConfig)` + `createEncryptedInput`
2. `evm-utils.ts` — switch to 6-decimal amounts, export ABI
3. `useCreateInvoice.ts` — encrypt amount → call `createInvoice`
4. `usePayment.ts` — call `payInvoice` with plaintext amount + ETH value
5. Wallet provider — configure Zama Sepolia chain

### Deployment

1. Deploy MockUSDC (for hackathon testing)
2. Deploy BlindPay(mockUsdcAddress)
3. Update `VITE_CONTRACT_ADDRESS` in frontend .env
