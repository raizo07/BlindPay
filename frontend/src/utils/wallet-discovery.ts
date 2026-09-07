import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import { StarknetInjectedWallet } from "@starknet-io/get-starknet-wallet-standard";
import { isStarknetWallet } from "@starknet-io/get-starknet-wallet-standard/features";
import type { StarknetWindowObject } from "@starknet-io/types-js";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { normalizeWalletId } from "./wallet-strk20";

const STARKNET_WALLET_KEYS = ["id", "name", "version", "icon", "request", "on", "off"] as const;

function isStarknetWindowObject(value: unknown): value is StarknetWindowObject {
    if (typeof value !== "object" || value === null) return false;
    return STARKNET_WALLET_KEYS.every((key) => key in value);
}

function scanInjectedWallets(): WalletWithStarknetFeatures[] {
    if (typeof window === "undefined") return [];

    const found: WalletWithStarknetFeatures[] = [];
    const seen = new Set<string>();

    for (const key of Object.getOwnPropertyNames(window)) {
        if (!key.startsWith("starknet")) continue;
        const candidate = (window as unknown as Record<string, unknown>)[key];
        if (!isStarknetWindowObject(candidate)) continue;

        const wallet = new StarknetInjectedWallet(candidate);
        if (!isStarknetWallet(wallet)) continue;

        const id = normalizeWalletId(wallet.name);
        if (seen.has(id)) continue;
        seen.add(id);
        found.push(wallet);
    }

    return found;
}

let store: Store | null = null;

/** Single discovery store — must init early so Wallet Standard wallets (Ready) can register. */
export function getWalletDiscoveryStore(): Store {
    if (!store) {
        store = createStore({ eip1193Adapters: [] });
    }
    return store;
}

export function refreshDiscoveredWallets(): void {
    getWalletDiscoveryStore()._refreshInjectedWallets();
}

function mergeWallets(
    ...lists: readonly WalletWithStarknetFeatures[][]
): WalletWithStarknetFeatures[] {
    const merged: WalletWithStarknetFeatures[] = [];
    const seen = new Set<string>();

    for (const list of lists) {
        for (const wallet of list) {
            const id = normalizeWalletId(wallet.name);
            if (seen.has(id)) continue;
            seen.add(id);
            merged.push(wallet);
        }
    }

    return merged;
}

export function isPickableWallet(wallet: WalletWithStarknetFeatures): boolean {
    const id = normalizeWalletId(wallet.name);
    return !id.includes("metamask") && !id.includes("braavos") && !id.includes("xverse");
}

export function getPickableWallets(): WalletWithStarknetFeatures[] {
    refreshDiscoveredWallets();
    const fromStore = getWalletDiscoveryStore().getWallets();
    const injected = scanInjectedWallets();
    return mergeWallets(fromStore, injected).filter(isPickableWallet);
}

/** Call once at app startup (before React render). */
export function initWalletDiscovery(): void {
    getWalletDiscoveryStore();
}
