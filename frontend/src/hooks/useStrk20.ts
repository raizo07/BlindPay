import { useCallback } from "react";
import type { WALLET_API } from "@starknet-io/types-js";
import { useWallet } from "./useWallet";
import { frontendProviders } from "../utils/starknet-config";
import { useProviderStore } from "../stores/providerStore";
import { shortHex } from "../utils/starknet-utils";

export interface Strk20TxResult {
    txHash: string;
    status: "pending" | "success" | "error";
    error?: string;
}

export const useStrk20 = () => {
    const { walletAccount } = useWallet();
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const submitActions = useCallback(
        async (actions: WALLET_API.STRK20_ACTION[]): Promise<Strk20TxResult> => {
            if (!walletAccount) {
                return { txHash: "", status: "error", error: "Connect a privacy-enabled Starknet wallet (Ready)." };
            }

            try {
                const result = await walletAccount.strk20InvokeTransaction(actions);
                const txHash = result.transaction_hash;

                const provider = frontendProviders[providerIndex] ?? frontendProviders[2];
                const receipt = await provider.waitForTransaction(txHash, {
                    retries: 400,
                    retryInterval: 3000,
                });

                const exec = (receipt as { execution_status?: string })?.execution_status;
                if (exec === "REVERTED") {
                    return { txHash, status: "error", error: "Transaction reverted on-chain." };
                }

                return { txHash, status: "success" };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { txHash: "", status: "error", error: message };
            }
        },
        [walletAccount, providerIndex]
    );

    const getShieldedBalances = useCallback(async () => {
        if (!walletAccount) return [];
        try {
            const result = await walletAccount.strk20Balances([]);
            return Array.isArray(result) ? result : [];
        } catch {
            return [];
        }
    }, [walletAccount]);

    return { submitActions, getShieldedBalances, shortTx: shortHex };
};
