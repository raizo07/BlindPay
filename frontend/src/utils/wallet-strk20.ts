import { walletV6 } from "starknet";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

export function normalizeWalletId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Ready / Argent family wallets that implement STRK20 but may omit it from supportedSpecs. */
export function isKnownPrivacyWallet(wallet: { name: string }): boolean {
    const id = normalizeWalletId(wallet.name);
    return id.includes("ready") || id.includes("argent");
}

export function specsIndicateStrk20(specs: string[]): boolean {
    return specs.some((spec) => {
        const s = spec.toUpperCase();
        return s.includes("STRK20") || s.includes("WALLET_STRK20");
    });
}

export function walletApisIndicateStrk20(apis: string[]): boolean {
    return apis.some((api) => {
        const s = api.toLowerCase();
        return s.includes("strk20") || s.includes("wallet_strk20");
    });
}

/** Probe the privacy wallet API; registration errors still mean STRK20 is present. */
export async function probeStrk20Support(
    wallet: WalletWithStarknetFeatures
): Promise<boolean> {
    try {
        await walletV6.strk20Balances(wallet, []);
        return true;
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (/not implemented|unsupported method|method not found/i.test(msg)) {
            return false;
        }
        // e.g. NOT_REGISTERED — API exists, user may need to enable privacy in wallet
        return true;
    }
}

export async function detectStrk20Support(
    wallet: WalletWithStarknetFeatures,
    specs: string[],
    walletApis: string[]
): Promise<boolean> {
    if (specsIndicateStrk20(specs) || walletApisIndicateStrk20(walletApis)) {
        return true;
    }
    // Ready/Argent implement STRK20 but often omit it from supportedSpecs.
    // Do not call strk20Balances here — Ready prompts "Share Balances" during connect.
    if (isKnownPrivacyWallet(wallet)) {
        return true;
    }
    return false;
}

export const STRK20_UNAVAILABLE_MESSAGE =
    "STRK20 is not available in this wallet. In Ready X: open Starknet, switch to Mainnet, enable privacy, and register your viewing key (https://strk20.starknet.io/app).";

export const STRK20_REGISTER_URL = "https://strk20.starknet.io/app";

/** Map raw wallet STRK20 errors to actionable copy for the UI. */
export function formatStrk20Error(message: string): string {
    const upper = message.toUpperCase();
    if (upper.includes("NOT_REGISTERED") || /not registered|viewing key/i.test(message)) {
        return `Your wallet is not registered with the STRK20 privacy pool. In Ready: switch to Starknet Mainnet, enable privacy, then register your viewing key at ${STRK20_REGISTER_URL}. You also need shielded ${"STRK"} (or USDC) before paying privately.`;
    }
    if (upper.includes("INSUFFICIENT_PRIVATE_BALANCE")) {
        return "Insufficient shielded balance. Shield STRK or USDC in Ready (Privacy tab) before paying.";
    }
    if (upper.includes("PRIVACY_LEAK")) {
        return "This payment would leak privacy metadata. Try a different amount or reconnect your wallet.";
    }
    return message;
}
