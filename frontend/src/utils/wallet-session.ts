import { createStore } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { normalizeWalletId } from "./wallet-strk20";

const WALLET_SESSION_KEY = "blindpay_wallet_session";

export interface WalletSession {
    walletName: string;
}

export function saveWalletSession(wallet: Pick<WalletWithStarknetFeatures, "name">): void {
    try {
        localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify({ walletName: wallet.name }));
    } catch {
        /* ignore quota / private mode */
    }
}

export function clearWalletSession(): void {
    try {
        localStorage.removeItem(WALLET_SESSION_KEY);
    } catch {
        /* ignore */
    }
}

export function readWalletSession(): WalletSession | null {
    try {
        const raw = localStorage.getItem(WALLET_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as WalletSession;
        if (!parsed?.walletName) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function findWalletByName(name: string): WalletWithStarknetFeatures | undefined {
    const store = createStore({ eip1193Adapters: [] });
    const target = normalizeWalletId(name);
    return store.getWallets().find((w) => normalizeWalletId(w.name) === target);
}
