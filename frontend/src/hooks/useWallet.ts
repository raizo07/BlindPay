import { useCallback, useEffect } from "react";
import {
    walletV6,
    validateAndParseAddress,
    constants as SNconstants,
    WalletAccountV6,
} from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { useWalletStore } from "../stores/walletStore";
import { useProviderStore } from "../stores/providerStore";
import {
    frontendProviders,
    getNetworkConfigByChain,
    isSupportedChain,
} from "../utils/starknet-config";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

export const useWallet = () => {
    const address = useWalletStore((s) => s.address);
    const isConnected = useWalletStore((s) => s.isConnected);
    const chain = useWalletStore((s) => s.chain);
    const walletAccount = useWalletStore((s) => s.walletAccount);
    const starknetWallet = useWalletStore((s) => s.starknetWallet);
    const walletApiList = useWalletStore((s) => s.walletApiList);
    const displaySelectWalletUI = useWalletStore((s) => s.displaySelectWalletUI);
    const setSelectWalletUI = useWalletStore((s) => s.setSelectWalletUI);
    const reset = useWalletStore((s) => s.reset);
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);
    const setProviderIndex = useProviderStore((s) => s.setCurrentProviderIndex);

    const netConfig = chain ? getNetworkConfigByChain(chain) : null;
    const isWrongChain =
        isConnected &&
        (!chain ||
            !isSupportedChain(chain) ||
            (netConfig != null && netConfig.providerIndex !== providerIndex));

    const hasStrk20Support =
        walletApiList?.some((spec) => spec.toUpperCase().includes("STRK20")) ?? false;

    useEffect(() => {
        if (!isConnected || !starknetWallet) return;

        const syncChain = async () => {
            try {
                const chainId = (await walletV6.requestChainId(starknetWallet)) as string;
                useWalletStore.getState().setChain(chainId);
                const net = getNetworkConfigByChain(chainId);
                setProviderIndex(net.providerIndex);
            } catch {
                /* wallet may not support chain query */
            }
        };

        syncChain();
    }, [isConnected, starknetWallet, setProviderIndex]);

    const openWalletPicker = useCallback(() => {
        setSelectWalletUI(true);
    }, [setSelectWalletUI]);

    const disconnect = useCallback(() => {
        reset();
    }, [reset]);

    const switchNetwork = useCallback(
        async (target: "mainnet" | "sepolia" = "sepolia") => {
            if (!starknetWallet) {
                openWalletPicker();
                return;
            }
            const chainId =
                target === "mainnet"
                    ? SNconstants.StarknetChainId.SN_MAIN
                    : SNconstants.StarknetChainId.SN_SEPOLIA;

            const wallet = starknetWallet as WalletWithStarknetFeatures & {
                request?: (args: { type: string; params?: { chainId: string } }) => Promise<unknown>;
            };

            if (wallet.request) {
                await wallet.request({
                    type: "wallet_switchStarknetChain",
                    params: { chainId },
                });
            }

            useWalletStore.getState().setChain(chainId);
            const net = getNetworkConfigByChain(chainId);
            setProviderIndex(net.providerIndex);

            const provider = frontendProviders[net.providerIndex] ?? frontendProviders[1];
            useWalletStore.getState().setProvider(provider);
            const walletAccount = await WalletAccountV6.connect(provider, starknetWallet);
            useWalletStore.getState().setWalletAccount(walletAccount);
        },
        [starknetWallet, openWalletPicker, setProviderIndex]
    );

    const signMessage = useCallback(
        async (message: string): Promise<string> => {
            if (!walletAccount) {
                throw new Error("Wallet not connected");
            }
            if (!chain) {
                throw new Error("Wallet chain not resolved");
            }
            const result = await walletAccount.signMessage({
                domain: { name: "BlindPay", version: "1", chainId: chain },
                message: { content: message },
                primaryType: "BlindPayMessage",
                types: {
                    StarkNetDomain: [
                        { name: "name", type: "felt" },
                        { name: "version", type: "felt" },
                        { name: "chainId", type: "felt" },
                    ],
                    BlindPayMessage: [{ name: "content", type: "felt" }],
                },
            });
            return Array.isArray(result) ? result.join(",") : String(result);
        },
        [walletAccount, chain]
    );

    return {
        address,
        isConnected,
        chain,
        walletAccount,
        starknetWallet,
        isWrongChain,
        hasStrk20Support,
        providerIndex,
        displaySelectWalletUI,
        setSelectWalletUI,
        openWalletPicker,
        disconnect,
        switchNetwork,
        signMessage,
    };
};

export async function connectStarknetWallet(
    selectedWallet: Parameters<typeof WalletAccountV6.connect>[1]
): Promise<void> {
    const providerIndex = useProviderStore.getState().currentProviderIndex;
    const provider = frontendProviders[providerIndex] ?? frontendProviders[1];

    useWalletStore.getState().setStarknetWallet(selectedWallet);

    const walletAccount = await WalletAccountV6.connect(provider, selectedWallet);
    useWalletStore.getState().setWalletAccount(walletAccount);
    useWalletStore.getState().setProvider(provider);

    const accounts = await walletV6.requestAccounts(selectedWallet);
    if (typeof accounts === "string") {
        throw new Error("This wallet is not compatible with STRK20.");
    }

    const addr = validateAndParseAddress(accounts[0]);
    useWalletStore.getState().setAddress(addr);

    const permissions = await walletV6.getPermissions(selectedWallet);
    const connected = (permissions as WALLET_API.Permission[]).includes(
        WALLET_API.Permission.ACCOUNTS
    );
    useWalletStore.getState().setConnected(connected);

    if (connected) {
        const chainId = (await walletV6.requestChainId(selectedWallet)) as string;
        if (!isSupportedChain(chainId)) {
            throw new Error("Switch your wallet to Starknet Sepolia or Mainnet.");
        }
        useWalletStore.getState().setChain(chainId);
        const net = getNetworkConfigByChain(chainId);
        useProviderStore.getState().setCurrentProviderIndex(net.providerIndex);
    }

    const apis = await walletV6.supportedSpecs(selectedWallet);
    useWalletStore.getState().setWalletApiList(apis);

    const hasStrk20 = apis.some((spec) => spec.toUpperCase().includes("STRK20"));
    if (!hasStrk20) {
        throw new Error(
            "This wallet does not support STRK20. Install Ready (https://www.argent.xyz/ready)."
        );
    }
}
