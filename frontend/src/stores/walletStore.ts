import { create } from "zustand";
import type { ProviderInterface, AccountInterface, WalletAccountV6 } from "starknet";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";

export interface WalletState {
    starknetWallet: WalletWithStarknetFeatures | undefined;
    setStarknetWallet: (wallet: WalletWithStarknetFeatures) => void;
    address: string;
    setAddress: (address: string) => void;
    chain: string;
    setChain: (chain: string) => void;
    walletAccount: WalletAccountV6 | undefined;
    setWalletAccount: (account: WalletAccountV6) => void;
    account: AccountInterface | undefined;
    setAccount: (account: AccountInterface) => void;
    provider: ProviderInterface | undefined;
    setProvider: (provider: ProviderInterface) => void;
    isConnected: boolean;
    setConnected: (connected: boolean) => void;
    displaySelectWalletUI: boolean;
    setSelectWalletUI: (open: boolean) => void;
    walletApiList: string[];
    setWalletApiList: (apis: string[]) => void;
    reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
    starknetWallet: undefined,
    setStarknetWallet: (wallet) => set({ starknetWallet: wallet }),
    address: "",
    setAddress: (address) => set({ address }),
    chain: "",
    setChain: (chain) => set({ chain }),
    walletAccount: undefined,
    setWalletAccount: (walletAccount) => set({ walletAccount }),
    account: undefined,
    setAccount: (account) => set({ account }),
    provider: undefined,
    setProvider: (provider) => set({ provider }),
    isConnected: false,
    setConnected: (isConnected) => set({ isConnected }),
    displaySelectWalletUI: false,
    setSelectWalletUI: (displaySelectWalletUI) => set({ displaySelectWalletUI }),
    walletApiList: [],
    setWalletApiList: (walletApiList) => set({ walletApiList }),
    reset: () =>
        set({
            starknetWallet: undefined,
            address: "",
            chain: "",
            walletAccount: undefined,
            account: undefined,
            provider: undefined,
            isConnected: false,
            displaySelectWalletUI: false,
            walletApiList: [],
        }),
}));
