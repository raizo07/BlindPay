import { hash, shortString, num } from "starknet";
import type { ProviderInterface } from "starknet";

/** ~60s max wait, then one direct receipt fetch. */
const TX_RECEIPT_RETRIES = 30;
const TX_RECEIPT_INTERVAL_MS = 2000;

export interface TxReceiptSummary {
    execution_status?: string;
    block_number?: number;
}

export async function confirmStarknetTransaction(
    provider: ProviderInterface,
    txHash: string
): Promise<TxReceiptSummary> {
    try {
        const receipt = await provider.waitForTransaction(txHash, {
            retries: TX_RECEIPT_RETRIES,
            retryInterval: TX_RECEIPT_INTERVAL_MS,
        });
        return receipt as TxReceiptSummary;
    } catch {
        const receipt = await provider.getTransactionReceipt(txHash);
        return receipt as TxReceiptSummary;
    }
}

export const ESCROW_COMMITMENT_TAG = shortString.encodeShortString("ESCROW_COMMITMENT_TAG:V1");

export const EscrowOperation = {
    Deposit: "0x0",
    Claim: "0x1",
} as const;

/**
 * Generate a random felt-sized secret for escrow commitments.
 */
function randomFeltHex(): string {
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateClaimSecret(): string {
    return randomFeltHex();
}

export function generateSalt(): string {
    return randomFeltHex();
}

export function computeCommitmentHash(secret: string): string {
    const secretFelt = num.toHex(secret);
    return hash.computePoseidonHashOnElements([ESCROW_COMMITMENT_TAG, secretFelt]);
}

/**
 * Parse human-readable amount to token base units.
 */
export function parseAmount(amount: string | number, decimals: number): bigint {
    const [whole = "0", frac = ""] = amount.toString().split(".");
    const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(whole + paddedFrac);
}

/**
 * Format base units to human-readable amount.
 */
export function formatAmount(amount: bigint, decimals: number): string {
    const str = amount.toString().padStart(decimals + 1, "0");
    const whole = str.slice(0, -decimals) || "0";
    const frac = str.slice(-decimals).replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole;
}

export function shortenAddress(address: string, chars = 4): string {
    if (!address) return "";
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortHex(value: string): string {
    const hex = num.toHex(value);
    return hex.length <= 13 ? hex : `${hex.slice(0, 7)}...${hex.slice(-4)}`;
}

export interface InvoiceRecord {
    merchant: string;
    amount: bigint;
    tokenType: number;
    invoiceType: number;
    salt: string;
    claimSecret: string;
    memo: string;
    paymentCount: number;
}

export interface PayerReceipt {
    receiptHash: string;
    salt: string;
    timestamp: number;
}

export interface MerchantReceipt {
    receiptHash: string;
    salt: string;
}
