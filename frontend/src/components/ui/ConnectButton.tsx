import React from "react";
import { useWallet } from "../../hooks/useWallet";
import { useWalletStore } from "../../stores/walletStore";
import { shortenAddress } from "../../utils/starknet-utils";

interface ConnectButtonProps {
    className?: string;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ className = "" }) => {
    const { address, isConnected } = useWallet();
    const reset = useWalletStore((s) => s.reset);
    const setSelectWalletUI = useWalletStore((s) => s.setSelectWalletUI);

    if (isConnected && address) {
        return (
            <button
                onClick={() => reset()}
                className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
                title="Click to disconnect"
            >
                {shortenAddress(address)}
            </button>
        );
    }

    return (
        <button
            onClick={() => setSelectWalletUI(true)}
            className={`bg-black/50 backdrop-blur-lg border border-white/10 rounded-full py-3 px-6 font-sans font-semibold text-sm text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-[0_0_15px_rgba(0,243,255,0.1)] hover:shadow-[0_0_25px_rgba(0,243,255,0.3)] ${className}`}
        >
            Connect Wallet
        </button>
    );
};
