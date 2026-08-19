import { useState } from "react";
import { useWallet } from "./useWallet";
import { useStrk20 } from "./useStrk20";
import { buildEscrowClaimActions } from "../utils/strk20";

export const useClaimFunds = () => {
    const { address, isConnected, isWrongChain, openWalletPicker } = useWallet();
    const { submitActions } = useStrk20();

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("");
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const claimFunds = async (claimSecret: string, tokenType = 1) => {
        if (!address || !isConnected) {
            openWalletPicker();
            setError("Please connect your Starknet privacy wallet first.");
            return;
        }

        if (isWrongChain) {
            setError("Switch your wallet to Starknet Sepolia or Mainnet to use STRK20.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setStatus("Claiming funds from STRK20 escrow into your private balance...");

            const actions = buildEscrowClaimActions(tokenType, claimSecret, address);
            const result = await submitActions(actions);

            if (result.status === "error") {
                throw new Error(result.error || "Claim failed");
            }

            setTxId(result.txHash);
            setStatus("Funds claimed into your shielded balance!");
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Claim failed");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setLoading(false);
        setStatus("");
        setTxId(null);
        setError(null);
    };

    return {
        claimFunds,
        loading,
        status,
        txId,
        error,
        reset,
    };
};
