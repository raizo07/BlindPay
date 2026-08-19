# BlindPay Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the BlindPay smart contract (Solidity + Zama FHE) and wire the React frontend to call it.

**Architecture:** Single `BlindPay.sol` contract stores FHE-encrypted invoice amounts and merchant running totals. Frontend encrypts amounts client-side via `@zama-fhe/relayer-sdk`, sends encrypted calldata. Backend DB remains as-is for indexing. Contract deployed to Zama's Sepolia fhEVM.

**Tech Stack:** Solidity ^0.8.24, Hardhat, @fhevm/solidity, OpenZeppelin, React 18, wagmi, viem, @zama-fhe/relayer-sdk

---

### Task 1: Scaffold Hardhat project with fhEVM

**Files:**
- Create: `contracts/package.json`
- Create: `contracts/hardhat.config.ts`
- Create: `contracts/tsconfig.json`
- Create: `contracts/.env.example`

**Step 1: Create contracts directory and initialize**

```bash
cd /Users/ram/Desktop/BlindPay
mkdir -p contracts
cd contracts
npm init -y
```

**Step 2: Install dependencies**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox typescript ts-node
npm install @fhevm/solidity @openzeppelin/contracts dotenv
npm install --save-dev fhevm-hardhat-plugin
```

**Step 3: Create hardhat.config.ts**

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "fhevm-hardhat-plugin";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    sepolia: {
      url: process.env.RPC_URL || "https://eth-sepolia.public.blastapi.io",
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      // fhevm-hardhat-plugin configures the local fhEVM mock
    },
  },
};

export default config;
```

**Step 4: Create .env.example**

```
PRIVATE_KEY=your-deployer-private-key
RPC_URL=https://eth-sepolia.public.blastapi.io
```

**Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

**Step 6: Verify setup compiles**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat compile
```

Expected: No errors (no contracts yet, just verifying toolchain).

**Step 7: Commit**

```bash
git add contracts/
git commit -m "feat: scaffold Hardhat project with fhEVM plugin"
```

---

### Task 2: Write MockUSDC.sol

**Files:**
- Create: `contracts/contracts/MockUSDC.sol`

**Step 1: Write MockUSDC contract**

A simple ERC20 with public mint for hackathon testing.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

**Step 2: Compile**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat compile
```

Expected: Compilation successful.

**Step 3: Commit**

```bash
git add contracts/contracts/MockUSDC.sol
git commit -m "feat: add MockUSDC for hackathon testing"
```

---

### Task 3: Write BlindPay.sol

**Files:**
- Create: `contracts/contracts/BlindPay.sol`

**Step 1: Write the full contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BlindPay is ZamaEthereumConfig, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --- Constants ---
    uint8 public constant TOKEN_ETH = 0;
    uint8 public constant TOKEN_USDC = 1;

    uint8 public constant TYPE_STANDARD = 0;
    uint8 public constant TYPE_MULTIPAY = 1;
    uint8 public constant TYPE_DONATION = 2;

    uint8 public constant STATUS_PENDING = 0;
    uint8 public constant STATUS_SETTLED = 1;

    // --- Structs ---
    struct Invoice {
        address merchant;
        euint64 encAmount;      // FHE-encrypted amount (6-decimal)
        bytes32 commitHash;     // keccak256(merchant, amount, salt)
        uint8 tokenType;
        uint8 invoiceType;
        uint8 status;
        uint256 paymentCount;
    }

    // --- State ---
    IERC20 public usdcToken;
    mapping(bytes32 => Invoice) private invoices;
    mapping(bytes32 => bool) public receiptExists;
    mapping(address => euint64) private merchantTotals;
    mapping(address => uint256) public invoiceCount;

    // --- Events ---
    event InvoiceCreated(
        bytes32 indexed salt,
        address indexed merchant,
        bytes32 commitHash,
        uint8 tokenType,
        uint8 invoiceType
    );

    event PaymentMade(
        bytes32 indexed salt,
        address indexed payer,
        bytes32 receiptHash,
        uint8 tokenType
    );

    event PaymentReceived(
        bytes32 indexed salt,
        address indexed merchant,
        bytes32 receiptHash,
        uint8 tokenType
    );

    // --- Constructor ---
    constructor(address _usdcToken) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
    }

    // --- Invoice Creation ---
    function createInvoice(
        externalEuint64 encAmount,
        bytes calldata inputProof,
        bytes32 salt,
        bytes32 commitHash,
        uint8 invoiceType,
        uint8 tokenType
    ) external {
        require(invoices[salt].merchant == address(0), "Salt already used");
        require(tokenType <= TOKEN_USDC, "Invalid token type");
        require(invoiceType <= TYPE_DONATION, "Invalid invoice type");

        euint64 amount = FHE.fromExternal(encAmount, inputProof);
        FHE.allowThis(amount);
        FHE.allow(amount, msg.sender);

        invoices[salt] = Invoice({
            merchant: msg.sender,
            encAmount: amount,
            commitHash: commitHash,
            tokenType: tokenType,
            invoiceType: invoiceType,
            status: STATUS_PENDING,
            paymentCount: 0
        });

        invoiceCount[msg.sender]++;

        emit InvoiceCreated(salt, msg.sender, commitHash, tokenType, invoiceType);
    }

    // --- Payment ---
    function payInvoice(
        bytes32 salt,
        uint256 amount
    ) external payable nonReentrant {
        Invoice storage inv = invoices[salt];
        require(inv.merchant != address(0), "Invoice not found");
        require(
            inv.invoiceType == TYPE_MULTIPAY || inv.status == STATUS_PENDING,
            "Invoice already settled"
        );

        // --- CHECKS ---
        // For standard invoices, verify amount matches commitment hash
        if (inv.invoiceType == TYPE_STANDARD) {
            bytes32 expectedHash = keccak256(
                abi.encodePacked(inv.merchant, amount, salt)
            );
            require(expectedHash == inv.commitHash, "Amount mismatch");
        }
        // Donation and multipay accept any amount > 0
        if (inv.invoiceType != TYPE_STANDARD) {
            require(amount > 0, "Amount must be > 0");
        }

        // --- EFFECTS ---
        inv.paymentCount++;
        if (inv.invoiceType != TYPE_MULTIPAY) {
            inv.status = STATUS_SETTLED;
        }

        bytes32 receiptHash = keccak256(
            abi.encodePacked(msg.sender, salt, block.timestamp, inv.paymentCount)
        );
        receiptExists[receiptHash] = true;

        // Update encrypted merchant running total
        euint64 encPayment = FHE.asEuint64(uint64(amount));
        FHE.allowThis(encPayment);

        if (FHE.isInitialized(merchantTotals[inv.merchant])) {
            merchantTotals[inv.merchant] = FHE.add(
                merchantTotals[inv.merchant],
                encPayment
            );
        } else {
            merchantTotals[inv.merchant] = encPayment;
        }
        FHE.allowThis(merchantTotals[inv.merchant]);
        FHE.allow(merchantTotals[inv.merchant], inv.merchant);

        // --- INTERACTIONS ---
        if (inv.tokenType == TOKEN_ETH) {
            uint256 expectedWei = amount * 1e12;
            require(msg.value >= expectedWei, "Insufficient ETH");

            (bool sent, ) = payable(inv.merchant).call{value: expectedWei}("");
            require(sent, "ETH transfer failed");

            // Refund excess
            if (msg.value > expectedWei) {
                (bool refunded, ) = payable(msg.sender).call{
                    value: msg.value - expectedWei
                }("");
                require(refunded, "ETH refund failed");
            }
        } else {
            require(msg.value == 0, "Do not send ETH for token payment");
            usdcToken.safeTransferFrom(msg.sender, inv.merchant, amount);
        }

        emit PaymentMade(salt, msg.sender, receiptHash, inv.tokenType);
        emit PaymentReceived(salt, inv.merchant, receiptHash, inv.tokenType);
    }

    // --- View Functions ---
    function getInvoice(bytes32 salt)
        external
        view
        returns (
            address merchant,
            uint8 tokenType,
            uint8 invoiceType,
            uint8 status,
            uint256 paymentCount,
            bytes32 commitHash
        )
    {
        Invoice storage inv = invoices[salt];
        return (
            inv.merchant,
            inv.tokenType,
            inv.invoiceType,
            inv.status,
            inv.paymentCount,
            inv.commitHash
        );
    }

    function verifyReceipt(bytes32 receiptHash) external view returns (bool) {
        return receiptExists[receiptHash];
    }

    // --- Admin ---
    function updateUsdcToken(address _newUsdc) external onlyOwner {
        require(_newUsdc != address(0), "Invalid address");
        usdcToken = IERC20(_newUsdc);
    }
}
```

**Step 2: Compile**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat compile
```

Expected: Compilation successful.

**Step 3: Commit**

```bash
git add contracts/contracts/BlindPay.sol
git commit -m "feat: add BlindPay.sol with FHE-encrypted invoices"
```

---

### Task 4: Write deploy script

**Files:**
- Create: `contracts/scripts/deploy.ts`
- Create: `contracts/ignition/modules/BlindPay.ts` (if using Hardhat Ignition)

**Step 1: Write deploy script**

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  // Deploy BlindPay
  const BlindPay = await ethers.getContractFactory("BlindPay");
  const blindpay = await BlindPay.deploy(usdcAddress);
  await blindpay.waitForDeployment();
  const blindpayAddress = await blindpay.getAddress();
  console.log("BlindPay deployed to:", blindpayAddress);

  // Mint some test USDC to deployer
  const mintTx = await usdc.mint(deployer.address, 1_000_000_000_000n); // 1M USDC
  await mintTx.wait();
  console.log("Minted 1M USDC to deployer");

  console.log("\n--- Copy these to frontend/.env ---");
  console.log(`VITE_CONTRACT_ADDRESS=${blindpayAddress}`);
  console.log(`VITE_USDC_ADDRESS=${usdcAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

**Step 2: Test deploy on local hardhat**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat run scripts/deploy.ts
```

Expected: Both contracts deploy, addresses printed.

**Step 3: Commit**

```bash
git add contracts/scripts/deploy.ts
git commit -m "feat: add deployment script for BlindPay + MockUSDC"
```

---

### Task 5: Generate ABI and export to frontend

**Files:**
- Create: `frontend/src/abi/BlindPay.json`
- Create: `frontend/src/abi/MockUSDC.json`

**Step 1: Compile contracts and copy ABIs**

After `npx hardhat compile`, ABIs are in `contracts/artifacts/contracts/BlindPay.sol/BlindPay.json`.

```bash
cd /Users/ram/Desktop/BlindPay
mkdir -p frontend/src/abi
# Extract just the ABI array from the artifact
node -e "
const bp = require('./contracts/artifacts/contracts/BlindPay.sol/BlindPay.json');
const fs = require('fs');
fs.writeFileSync('frontend/src/abi/BlindPay.json', JSON.stringify(bp.abi, null, 2));
console.log('BlindPay ABI exported');
"
node -e "
const usdc = require('./contracts/artifacts/contracts/MockUSDC.sol/MockUSDC.json');
const fs = require('fs');
fs.writeFileSync('frontend/src/abi/MockUSDC.json', JSON.stringify(usdc.abi, null, 2));
console.log('MockUSDC ABI exported');
"
```

**Step 2: Commit**

```bash
git add frontend/src/abi/
git commit -m "feat: export contract ABIs to frontend"
```

---

### Task 6: Update evm-utils.ts to 6-decimal amounts + ABI exports

**Files:**
- Modify: `frontend/src/utils/evm-utils.ts`

**Step 1: Update the file**

Key changes:
- `TOKEN_DECIMALS` from 18 to 6
- `parseAmount` uses 6 decimals
- Add ABI imports
- Update `computeInvoiceHash` to use `uint256` amount (6-decimal integer)

```typescript
import { keccak256, encodePacked, toHex, parseUnits, formatUnits } from "viem";
import BlindPayABI from "../abi/BlindPay.json";
import MockUSDCABI from "../abi/MockUSDC.json";

export { BlindPayABI, MockUSDCABI };

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || "0x0000000000000000000000000000000000000000";

// All amounts use 6-decimal format (matches USDC native decimals)
// For ETH: 1 ETH = 1_000_000 in 6-decimal format
// Contract converts to wei internally (amount * 1e12)
export const TOKEN_DECIMALS = 6;
export const DISPLAY_DECIMALS = 6;

export const generateSalt = (): `0x${string}` => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return toHex(randomBytes) as `0x${string}`;
};

/**
 * Compute invoice hash: keccak256(merchant, amount, salt)
 * Amount is in 6-decimal format as uint256
 */
export const computeInvoiceHash = (
    merchant: `0x${string}`,
    amount: bigint,
    salt: `0x${string}`
): `0x${string}` => {
    return keccak256(
        encodePacked(
            ["address", "uint256", "bytes32"],
            [merchant, amount, salt]
        )
    );
};

/**
 * Parse human-readable amount to 6-decimal on-chain units
 * "100" → 100_000_000n (100 USDC)
 * "0.5" → 500_000n (0.5 ETH in 6-decimal)
 */
export const parseAmount = (amount: string | number): bigint => {
    return parseUnits(amount.toString(), TOKEN_DECIMALS);
};

/**
 * Format 6-decimal on-chain units to human-readable
 */
export const formatAmount = (amount: bigint): string => {
    return formatUnits(amount, TOKEN_DECIMALS);
};

export const shortenAddress = (address: string, chars = 4): string => {
    if (!address) return "";
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

export const getExplorerTxUrl = (txHash: string): string => {
    const baseUrl = import.meta.env.VITE_EXPLORER_URL || "https://sepolia.etherscan.io";
    return `${baseUrl}/tx/${txHash}`;
};

export const getExplorerAddressUrl = (address: string): string => {
    const baseUrl = import.meta.env.VITE_EXPLORER_URL || "https://sepolia.etherscan.io";
    return `${baseUrl}/address/${address}`;
};

// ---- Types matching the on-chain contract ----

export interface InvoiceRecord {
    invoiceHash: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number;
    invoiceType: number;
    salt: `0x${string}`;
    memo: string;
    status: number;
}

export interface PayerReceipt {
    receiptHash: `0x${string}`;
    invoiceHash: `0x${string}`;
    payer: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number;
    timestamp: number;
}

export interface MerchantReceipt {
    receiptHash: `0x${string}`;
    invoiceHash: `0x${string}`;
    merchant: `0x${string}`;
    amount: bigint;
    tokenType: number;
}
```

**Step 2: Commit**

```bash
git add frontend/src/utils/evm-utils.ts
git commit -m "feat: switch to 6-decimal amounts, export ABIs"
```

---

### Task 7: Install relayer-sdk and create FHE helper

**Files:**
- Create: `frontend/src/utils/fhe.ts`

**Step 1: Install dependency**

```bash
cd /Users/ram/Desktop/BlindPay/frontend
npm install @zama-fhe/relayer-sdk
```

**Step 2: Create FHE helper**

```typescript
import { createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk";

let instance: FhevmInstance | null = null;

export const getFheInstance = async (): Promise<FhevmInstance> => {
    if (instance) return instance;
    instance = await createInstance(SepoliaConfig);
    return instance;
};

/**
 * Encrypt a uint64 amount for sending to the contract
 * Returns { handle, inputProof } ready for contract call
 */
export const encryptAmount = async (
    contractAddress: string,
    signerAddress: string,
    amount: number | bigint
): Promise<{ handle: `0x${string}`; inputProof: `0x${string}` }> => {
    const fhe = await getFheInstance();
    const input = fhe.createEncryptedInput(contractAddress, signerAddress);
    input.add64(Number(amount));
    const encrypted = await input.encrypt();
    return {
        handle: encrypted.handles[0] as `0x${string}`,
        inputProof: encrypted.inputProof as `0x${string}`,
    };
};
```

**Step 3: Commit**

```bash
git add frontend/src/utils/fhe.ts frontend/package.json
git commit -m "feat: add FHE encryption helper using relayer-sdk"
```

---

### Task 8: Wire useCreateInvoice.ts to contract

**Files:**
- Modify: `frontend/src/hooks/useCreateInvoice.ts`

**Step 1: Update the hook to call the contract**

Replace the TODO section with actual contract calls. Key changes:
- Import `writeContract`, `waitForTransactionReceipt` from wagmi
- Import `encryptAmount` from fhe.ts
- Encrypt the amount client-side
- Compute commitHash
- Call `createInvoice` on the contract
- Store the invoice creation tx hash

The full updated hook:

```typescript
import { useState } from "react";
import { useWallet } from "./useWallet";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
    generateSalt,
    computeInvoiceHash,
    parseAmount,
    CONTRACT_ADDRESS,
    BlindPayABI,
} from "../utils/evm-utils";
import { encryptAmount } from "../utils/fhe";
import { InvoiceData } from "../types/invoice";

export type InvoiceType = "standard" | "multipay" | "donation";

export const useCreateInvoice = () => {
    const { address: publicKey, isConnected } = useWallet();

    const [amount, setAmount] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [memo, setMemo] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [invoiceType, setInvoiceType] = useState<InvoiceType>("standard");
    const [tokenType, setTokenType] = useState<number>(0);

    const handleCreate = async () => {
        if (!publicKey || !isConnected) {
            setStatus("Please connect your wallet first.");
            return;
        }

        if (invoiceType !== "donation" && (!amount || amount <= 0)) {
            setStatus("Please enter a valid amount.");
            return;
        }

        setLoading(true);
        setStatus("Creating invoice...");

        try {
            const merchant = publicKey;
            const salt = generateSalt();
            const isDonation = invoiceType === "donation";
            const amountRaw = isDonation ? 0n : parseAmount(Number(amount));

            // Compute commitment hash (matches on-chain verification)
            const commitHash = computeInvoiceHash(
                merchant as `0x${string}`,
                amountRaw,
                salt
            );

            // Encrypt amount for FHE
            setStatus("Encrypting amount...");
            const { handle: encHandle, inputProof } = await encryptAmount(
                CONTRACT_ADDRESS,
                merchant,
                amountRaw
            );

            // Determine invoice type number
            let dbInvoiceType = 0;
            if (invoiceType === "multipay") dbInvoiceType = 1;
            if (invoiceType === "donation") dbInvoiceType = 2;

            // Call contract
            setStatus("Submitting to blockchain...");
            const { writeContractAsync } = await import("wagmi/actions");
            const { wagmiConfig } = await import("./WalletProvider");

            const txHash = await writeContractAsync(wagmiConfig, {
                address: CONTRACT_ADDRESS as `0x${string}`,
                abi: BlindPayABI,
                functionName: "createInvoice",
                args: [encHandle, inputProof, salt, commitHash, dbInvoiceType, tokenType],
            });

            setStatus("Waiting for confirmation...");
            const { waitForTransactionReceipt } = await import("wagmi/actions");
            await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

            // Save to backend DB
            setStatus("Saving invoice to database...");
            try {
                const { createInvoice } = await import("../services/api");
                await createInvoice({
                    invoice_hash: commitHash,
                    merchant_address: merchant,
                    status: "PENDING",
                    salt: salt,
                    invoice_type: dbInvoiceType,
                    token_type: tokenType,
                    invoice_transaction_id: txHash,
                });
            } catch (dbErr) {
                console.error("Failed to save invoice to DB:", dbErr);
            }

            // Build payment link
            const params = new URLSearchParams({
                merchant,
                amount: amount?.toString() || "0",
                salt,
            });
            if (memo) params.append("memo", memo);
            if (invoiceType === "multipay") params.append("type", "multipay");
            if (invoiceType === "donation") params.append("type", "donation");
            if (tokenType === 1) params.append("token", "usdc");

            const link = `${window.location.origin}/pay?${params.toString()}`;

            setInvoiceData({
                merchant,
                amount: Number(amount),
                salt,
                hash: commitHash,
                link,
            });
            setStatus("Invoice created successfully!");
        } catch (error: any) {
            console.error(error);
            setStatus(`Error: ${error.message || "Failed to create invoice"}`);
        } finally {
            setLoading(false);
        }
    };

    const resetInvoice = () => {
        setInvoiceData(null);
        setAmount("");
        setMemo("");
        setStatus("");
        setInvoiceType("standard");
        setTokenType(0);
    };

    return {
        amount,
        setAmount,
        memo,
        setMemo,
        status,
        loading,
        invoiceData,
        handleCreate,
        resetInvoice,
        publicKey: publicKey || null,
        invoiceType,
        setInvoiceType,
        tokenType,
        setTokenType,
    };
};
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useCreateInvoice.ts
git commit -m "feat: wire useCreateInvoice to BlindPay contract with FHE"
```

---

### Task 9: Wire usePayment.ts to contract

**Files:**
- Modify: `frontend/src/hooks/usePayment.ts`

**Step 1: Update payInvoice function**

Replace the TODO placeholder with actual contract call. Key changes:
- On mount: call `getInvoice(salt)` via `readContract` to verify on-chain
- `payInvoice()`: call contract with amount + ETH value (for ETH payments)
- For USDC: approve contract first, then call payInvoice

The `payInvoice` function becomes:

```typescript
const payInvoice = async () => {
    if (!invoice || !publicKey) return;

    try {
        setLoading(true);
        const { writeContractAsync, readContract, waitForTransactionReceipt } =
            await import("wagmi/actions");
        const { wagmiConfig } = await import("./WalletProvider");

        // For USDC: approve contract to spend tokens first
        if (invoice.tokenType === 1) {
            setStatus("Approving USDC spend...");
            const { USDC_ADDRESS, MockUSDCABI } = await import("../utils/evm-utils");
            const approveHash = await writeContractAsync(wagmiConfig, {
                address: USDC_ADDRESS as `0x${string}`,
                abi: MockUSDCABI,
                functionName: "approve",
                args: [CONTRACT_ADDRESS, parseAmount(
                    invoice.invoiceType === 2
                        ? donationAmount || "0"
                        : invoice.amount
                )],
            });
            await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        }

        setStatus("Submitting payment...");

        const payAmount = invoice.invoiceType === 2
            ? parseAmount(donationAmount || "0")
            : parseAmount(invoice.amount);

        // For ETH: amount * 1e12 = wei value
        const ethValue = invoice.tokenType === 0
            ? payAmount * 1_000_000_000_000n
            : 0n;

        const txHash = await writeContractAsync(wagmiConfig, {
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: BlindPayABI,
            functionName: "payInvoice",
            args: [invoice.salt, payAmount],
            value: ethValue,
        });

        setStatus("Waiting for confirmation...");
        await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

        setTxId(txHash);

        // Update backend DB
        try {
            const { updateInvoiceStatus } = await import("../services/api");
            await updateInvoiceStatus(invoice.hash, {
                status: "SETTLED",
                payment_tx_ids: txHash,
            });
        } catch (dbErr) {
            console.warn("DB update failed:", dbErr);
        }

        setStep("SUCCESS");
        setStatus("");
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Payment failed");
    } finally {
        setLoading(false);
    }
};
```

And update the `init()` function to also check on-chain:

```typescript
// In init(), after computing hash, add contract read:
try {
    const { readContract } = await import("wagmi/actions");
    const { wagmiConfig } = await import("./WalletProvider");
    const onChainInvoice = await readContract(wagmiConfig, {
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: BlindPayABI,
        functionName: "getInvoice",
        args: [salt as `0x${string}`],
    }) as [string, number, number, number, bigint, string];

    if (onChainInvoice[0] !== "0x0000000000000000000000000000000000000000") {
        // Invoice exists on-chain
        if (onChainInvoice[3] === 1) { // status === SETTLED
            setStep("ALREADY_PAID");
            setLoading(false);
            return;
        }
    }
} catch {
    // Contract not deployed or invoice not found — fall through to DB check
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/usePayment.ts
git commit -m "feat: wire usePayment to BlindPay contract"
```

---

### Task 10: Update WalletProvider for Zama Sepolia

**Files:**
- Modify: `frontend/src/hooks/WalletProvider.tsx`

**Step 1: Configure proper chain**

The Zama fhEVM runs on Sepolia (chainId 11155111). Update to use the proper RPC:

```typescript
import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID";

export const wagmiConfig = createConfig({
    chains: [sepolia],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [sepolia.id]: http(
            import.meta.env.VITE_RPC_URL || "https://eth-sepolia.public.blastapi.io"
        ),
    },
});

const queryClient = new QueryClient();

interface WalletProviderProps {
    children: React.ReactNode;
}

export const BlindPayWalletProvider = ({ children }: WalletProviderProps) => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </WagmiProvider>
    );
};
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/WalletProvider.tsx
git commit -m "feat: configure WalletProvider for Zama Sepolia"
```

---

### Task 11: Update frontend .env.example

**Files:**
- Modify: `frontend/.env.example`

**Step 1: Add new env vars**

```
VITE_API_URL=http://localhost:3000
VITE_CONTRACT_ADDRESS=0x_DEPLOYED_BLINDPAY_ADDRESS
VITE_USDC_ADDRESS=0x_DEPLOYED_MOCKUSDC_ADDRESS
VITE_WALLETCONNECT_PROJECT_ID=your-project-id
VITE_EXPLORER_URL=https://sepolia.etherscan.io
VITE_RPC_URL=https://eth-sepolia.public.blastapi.io
```

**Step 2: Commit**

```bash
git add frontend/.env.example
git commit -m "chore: update env example with contract addresses"
```

---

### Task 12: Fix TFHE references in Docs.tsx

**Files:**
- Modify: `frontend/src/desktop/pages/Docs.tsx`

**Step 1: Replace all `TFHE.*` with `FHE.*` in code examples**

Search and replace:
- `TFHE.` → `FHE.`
- `tfhe` → `fhe` (in import paths shown in docs)

**Step 2: Commit**

```bash
git add frontend/src/desktop/pages/Docs.tsx
git commit -m "fix: correct TFHE namespace to FHE in docs page"
```

---

### Task 13: Test full flow locally

**Step 1: Start local Hardhat node**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat node
```

**Step 2: Deploy contracts to local node**

```bash
cd /Users/ram/Desktop/BlindPay/contracts
npx hardhat run scripts/deploy.ts --network localhost
```

**Step 3: Update frontend .env with deployed addresses**

**Step 4: Start frontend**

```bash
cd /Users/ram/Desktop/BlindPay/frontend
npm run dev
```

**Step 5: Test flow**
1. Connect wallet (MetaMask to localhost:8545)
2. Create an invoice
3. Open payment link in another browser/incognito
4. Pay the invoice
5. Verify receipt

**Step 6: Start backend** (if needed for DB)

```bash
cd /Users/ram/Desktop/BlindPay/backend
npm install && npm start
```
