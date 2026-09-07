import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    saveWalletSession,
    clearWalletSession,
    readWalletSession,
} from "./wallet-session";

describe("wallet-session", () => {
    beforeEach(() => {
        const store = new Map<string, string>();
        vi.stubGlobal("localStorage", {
            getItem: (key: string) => store.get(key) ?? null,
            setItem: (key: string, value: string) => {
                store.set(key, value);
            },
            removeItem: (key: string) => {
                store.delete(key);
            },
        });
        clearWalletSession();
    });

    it("persists and reads wallet name", () => {
        saveWalletSession({ name: "Ready X" } as { name: string });
        expect(readWalletSession()).toEqual({ walletName: "Ready X" });
    });

    it("clears saved session", () => {
        saveWalletSession({ name: "Ready X" } as { name: string });
        clearWalletSession();
        expect(readWalletSession()).toBeNull();
    });
});
