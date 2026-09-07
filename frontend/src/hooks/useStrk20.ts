import { useCallback } from "react";
import type { WALLET_API } from "@starknet-io/types-js";
import { useWallet } from "./useWallet";
import {
    frontendProviders,
    getNetworkConfig,
    getNetworkConfigByChain,
} from "../utils/starknet-config";
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

                const chain = useWalletStore.getState().chain;
                const net = chain
                    ? getNetworkConfigByChain(chain)
                    : getNetworkConfig(providerIndex);
                const provider =
                    frontendProviders[net.providerIndex] ?? frontendProviders[0];

                const receipt = await confirmStarknetTransaction(provider, txHash);

                const exec = receipt.execution_status;
                if (exec === "REVERTED") {
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
