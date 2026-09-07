import { useEffect, useState } from "react";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import { STRK20_UNAVAILABLE_MESSAGE } from "../../utils/wallet-strk20";
import { connectStarknetWallet } from "../../hooks/useWallet";
import { useWalletStore } from "../../stores/walletStore";
import {
    getPickableWallets,
    getWalletDiscoveryStore,
    refreshDiscoveredWallets,
} from "../../utils/wallet-discovery";

/** Global wallet picker modal — mount once; open via useWalletStore.setSelectWalletUI(true). */
export function WalletPickerModal() {
    const displaySelectWalletUI = useWalletStore((s) => s.displaySelectWalletUI);
    const setSelectWalletUI = useWalletStore((s) => s.setSelectWalletUI);

    const [connecting, setConnecting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [wallets, setWallets] = useState<WalletWithStarknetFeatures[]>([]);

    const syncWallets = () => setWallets(getPickableWallets());

    useEffect(() => {
        const store = getWalletDiscoveryStore();
        syncWallets();
        return store.subscribe(() => syncWallets());
    }, []);

    useEffect(() => {
        if (!displaySelectWalletUI) return;
        refreshDiscoveredWallets();
        syncWallets();
    }, [displaySelectWalletUI]);

    const handleRefresh = () => {
        setRefreshing(true);
        setError("");
        refreshDiscoveredWallets();
        syncWallets();
        window.setTimeout(() => setRefreshing(false), 400);
    };

    const selectWallet = async (wallet: WalletWithStarknetFeatures) => {
        setError("");
        setConnecting(true);
        try {
            await connectStarknetWallet(wallet);
            setSelectWalletUI(false);
        } catch (err) {
            const raw = err instanceof Error ? err.message : "Wallet connection failed.";
            const message = /not implemented/i.test(raw)
                ? STRK20_UNAVAILABLE_MESSAGE
                : raw;
            setError(message);
        } finally {
            setConnecting(false);
        }
    };

    if (!displaySelectWalletUI) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => !connecting && setSelectWalletUI(false)}
        >
            <div
                className="bg-black/95 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold text-lg">Connect a Starknet wallet</h3>
                    <button
                        type="button"
                        onClick={() => setSelectWalletUI(false)}
                        disabled={connecting}
                        className="text-gray-400 hover:text-white text-xl leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <p className="text-gray-400 text-sm mb-4">
                    STRK20 requires the <strong className="text-white">Ready</strong> browser extension
                    (desktop Chrome or Brave). Enable privacy on Starknet Mainnet and register your viewing key.
                </p>

                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    <a
                        href="https://www.argent.xyz/ready"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                    >
                        Install Ready extension
                    </a>
                    <span className="text-gray-600">·</span>
                    <a
                        href="https://strk20.starknet.io/app"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                    >
                        Register viewing key
                    </a>
                    <span className="text-gray-600">·</span>
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={connecting || refreshing}
                        className="text-cyan-400 hover:underline disabled:opacity-50"
                    >
                        {refreshing ? "Scanning…" : "Refresh wallets"}
                    </button>
                </div>

                {wallets.length ? (
                    <div className="flex flex-col gap-2">
                        {wallets.map((w) => (
                            <button
                                key={w.name}
                                type="button"
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
                    <div className="text-gray-400 text-sm space-y-2">
                        <p>No Starknet wallet detected in this browser.</p>
                        <ul className="list-disc list-inside text-gray-500 space-y-1">
                            <li>Use desktop Chrome or Brave with the Ready extension installed</li>
                            <li>Mobile Safari/Chrome cannot use browser extensions — open this site on desktop</li>
                            <li>After installing Ready, click &quot;Refresh wallets&quot; above</li>
                        </ul>
                    </div>
                )}

                {error && (
                    <div className="mt-4 bg-red-900/40 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WalletPickerModal;
