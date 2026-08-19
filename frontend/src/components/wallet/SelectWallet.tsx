import React, { useEffect, useState } from "react";
import { createStore, type Store } from "@starknet-io/get-starknet-discovery";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { connectStarknetWallet } from "../../hooks/useWallet";
import { useWalletStore } from "../../stores/walletStore";

function normalizeId(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Global wallet picker modal — mount once; open via useWalletStore.setSelectWalletUI(true). */
export const WalletPickerModal: React.FC = () => {
    const displaySelectWalletUI = useWalletStore((s) => s.displaySelectWalletUI);
    const setSelectWalletUI = useWalletStore((s) => s.setSelectWalletUI);

    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState("");
    const [wallets, setWallets] = useState<WalletWithStarknetFeatures[]>([]);

    useEffect(() => {
        const store: Store = createStore({ eip1193Adapters: [] });
        setWallets(store.getWallets().slice());
        const unsub = store.subscribe((next) => setWallets(next.slice()));
        return () => unsub();
    }, []);

    const pickable = wallets.filter((w) => {
        const id = normalizeId(w.name);
        return !id.includes("metamask") && !id.includes("braavos");
    });

    const selectWallet = async (wallet: WalletWithStarknetFeatures) => {
        setError("");
        setConnecting(true);
        try {
            await connectStarknetWallet(wallet);
            setSelectWalletUI(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Wallet connection failed.");
        } finally {
            setConnecting(false);
        }
    };

    if (!displaySelectWalletUI) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => !connecting && setSelectWalletUI(false)}
        >
            <div
                className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">Connect a Starknet wallet</h3>
                    <button
                        onClick={() => setSelectWalletUI(false)}
                        disabled={connecting}
                        className="text-gray-400 hover:text-white text-xl leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                    STRK20 requires a privacy-enabled wallet such as{" "}
                    <a href="https://www.argent.xyz/ready" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        Ready
                    </a>.
                </p>

                {pickable.length ? (
                    <div className="flex flex-col gap-2">
                        {pickable.map((w) => (
                            <button
                                key={w.name}
                                onClick={() => selectWallet(w)}
                                disabled={connecting}
                                className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl py-3 px-4 text-white text-sm transition-all disabled:opacity-50"
                            >
                                <span className="flex items-center gap-3">
                                    {w.icon && (
                                        <img src={w.icon} alt="" className="w-6 h-6 rounded" />
                                    )}
                                    {w.name}
                                </span>
                                <span>{connecting ? "…" : "→"}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400 text-sm">
                        No Starknet wallet detected. Install{" "}
                        <a href="https://www.argent.xyz/ready" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                            Ready
                        </a>{" "}
                        to use private payments.
                    </p>
                )}

                {error && (
                    <div className="mt-4 bg-red-900/40 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WalletPickerModal;
