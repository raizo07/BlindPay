import { useCallback } from "react";
import {
    walletV6,
    validateAndParseAddress,
    constants as SNconstants,
    WalletAccountV6,
} from "starknet";
import { WALLET_API } from "@starknet-io/types-js";
import { useWalletStore } from "../stores/walletStore";
import { useProviderStore } from "../stores/providerStore";
import { frontendProviders, isStrk20Network } from "../utils/starknet-config";

export const useWallet = () => {
    const address = useWalletStore((s) => s.address);
    const isConnected = useWalletStore((s) => s.isConnected);
    const chain = useWalletStore((s) => s.chain);
    const walletAccount = useWalletStore((s) => s.walletAccount);
    const displaySelectWalletUI = useWalletStore((s) => s.displaySelectWalletUI);
    const setSelectWalletUI = useWalletStore((s) => s.setSelectWalletUI);
    const reset = useWalletStore((s) => s.reset);
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const isWrongChain = isConnected && !isStrk20Network(providerIndex);

    const openWalletPicker = useCallback(() => {
        setSelectWalletUI(true);
    }, [setSelectWalletUI]);

    const disconnect = useCallback(() => {
        reset();
    }, [reset]);

    const signMessage = useCallback(
        async (message: string): Promise<string> => {
            if (!walletAccount) {
                throw new Error("Wallet not connected");
            }
            const result = await walletAccount.signMessage({
                domain: { name: "BlindPay", version: "1", chainId: chain || SNconstants.StarknetChainId.SN_SEPOLIA },
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
        isWrongChain,
        providerIndex,
        displaySelectWalletUI,
        setSelectWalletUI,
        openWalletPicker,
        disconnect,
        signMessage,
    };
};

export async function connectStarknetWallet(
    selectedWallet: Parameters<typeof WalletAccountV6.connect>[1]
): Promise<void> {
    const providerIndex = useProviderStore.getState().currentProviderIndex;
    const provider = frontendProviders[providerIndex] ?? frontendProviders[2];

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
        useWalletStore.getState().setChain(chainId);
        useProviderStore
            .getState()
            .setCurrentProviderIndex(
                chainId === SNconstants.StarknetChainId.SN_MAIN ? 0 : 2
            );
    }

    const apis = await walletV6.supportedSpecs(selectedWallet);
    useWalletStore.getState().setWalletApiList(apis);
}
