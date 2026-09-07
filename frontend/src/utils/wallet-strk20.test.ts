import { describe, it, expect } from "vitest";
import {
    isKnownPrivacyWallet,
    specsIndicateStrk20,
    walletApisIndicateStrk20,
    formatStrk20Error,
} from "./wallet-strk20";

describe("isKnownPrivacyWallet", () => {
    it("recognizes Ready X", () => {
        expect(isKnownPrivacyWallet({ name: "Ready Wallet (formerly Argent)" })).toBe(true);
        expect(isKnownPrivacyWallet({ name: "Ready X" })).toBe(true);
    });

    it("rejects generic wallets", () => {
        expect(isKnownPrivacyWallet({ name: "Braavos" })).toBe(false);
    });
});

describe("specsIndicateStrk20", () => {
    it("matches STRK20 in supportedSpecs", () => {
        expect(specsIndicateStrk20(["wallet_api/STRK20/0.1.0"])).toBe(true);
    });
});

describe("walletApisIndicateStrk20", () => {
    it("matches wallet_strk20 methods", () => {
        expect(walletApisIndicateStrk20(["wallet_strk20InvokeTransaction"])).toBe(true);
    });
});

describe("formatStrk20Error", () => {
    it("maps NOT_REGISTERED to registration instructions", () => {
        const msg = formatStrk20Error("An error occurred (NOT_REGISTERED)");
        expect(msg).toMatch(/not registered/i);
        expect(msg).toContain("strk20.starknet.io");
    });

    it("maps insufficient balance", () => {
        expect(formatStrk20Error("INSUFFICIENT_PRIVATE_BALANCE")).toMatch(/shielded balance/i);
    });
});
