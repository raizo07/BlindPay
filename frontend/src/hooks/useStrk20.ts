import { useCallback } from "react";
import type { WALLET_API } from "@starknet-io/types-js";
import { useWallet } from "./useWallet";
import { getStarknetRpcProvider, resolveProviderIndex } from "../utils/starknet-config";
import { useProviderStore } from "../stores/providerStore";
import { useWalletStore } from "../stores/walletStore";
import { confirmStarknetTransaction, shortHex } from "../utils/starknet-utils";
import { formatStrk20Error } from "../utils/wallet-strk20";

export interface Strk20TxResult {
    txHash: string;
    status: "pending" | "success" | "error";
    blockNumber?: number;
    error?: string;
}

export interface SubmitStrk20Options {
    /** When true, blocks until the RPC returns a receipt (slower). Default: false. */
    waitForReceipt?: boolean;
}

export const useStrk20 = () => {
    const { walletAccount, chain } = useWallet();
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const getProvider = useCallback(() => {
        const activeChain = chain || useWalletStore.getState().chain;
        return getStarknetRpcProvider(activeChain, providerIndex);
    }, [chain, providerIndex]);

    const preflightActions = useCallback(
        async (actions: WALLET_API.STRK20_ACTION[]): Promise<string | null> => {
            if (!walletAccount) {
                return "Connect a privacy-enabled Starknet wallet (Ready).";
            }
            try {
                await walletAccount.strk20PrepareInvoke(actions, true);
                return null;
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                if (
                    /NOT_REGISTERED|INSUFFICIENT_PRIVATE|PRIVACY_LEAK|not registered|viewing key/i.test(
                        message
                    )
                ) {
                    return formatStrk20Error(message);
                }
                return null;
            }
        },
        [walletAccount]
    );

    const submitActions = useCallback(
        async (
            actions: WALLET_API.STRK20_ACTION[],
            options?: SubmitStrk20Options
        ): Promise<Strk20TxResult> => {
            if (!walletAccount) {
                return {
                    txHash: "",
                    status: "error",
                    error: "Connect a privacy-enabled Starknet wallet (Ready).",
                };
            }

            try {
                const result = await walletAccount.strk20InvokeTransaction(actions);
                const txHash = result.transaction_hash;

                if (!options?.waitForReceipt) {
                    return { txHash, status: "success" };
                }

                const provider = getProvider();
                const receipt = await confirmStarknetTransaction(provider, txHash);

                if (receipt.execution_status === "REVERTED") {
                    return { txHash, status: "error", error: "Transaction reverted on-chain." };
                }

                return {
                    txHash,
                    status: "success",
                    blockNumber: receipt.block_number,
                };
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return { txHash: "", status: "error", error: formatStrk20Error(message) };
            }
        },
        [walletAccount, getProvider]
    );

    const confirmSubmittedTx = useCallback(
        async (txHash: string) => {
            const provider = getProvider();
            return confirmStarknetTransaction(provider, txHash);
        },
        [getProvider]
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

    const activeProviderIndex = resolveProviderIndex(chain, providerIndex);

    return {
        submitActions,
        preflightActions,
        confirmSubmittedTx,
        getShieldedBalances,
        shortTx: shortHex,
        activeProviderIndex,
    };
};
