import { ProviderInterface, RpcProvider, constants as SNconstants } from "starknet";

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";

export type NetworkId = "mainnet" | "sepolia";

export interface NetworkConfig {
    id: NetworkId;
    label: string;
    chainId: string;
    providerIndex: number;
    escrow: string;
    pool: string;
    usdc: string;
    strk: string;
    explorerTxBase: string;
}

const SEPOLIA_DEFAULTS = {
    escrow: "0x01ad75c06ad9086bec4c24c967397c3fdbb32f8c11525bca82e425dc17d270cc",
    pool: "0xd894af9ed2bdede33675049ae5285df000c44258a2250b84a9c3bed0d7c233",
    usdc: "0x053c91253bc9682c04929ca02edcedb1745d5993a6bcf580220e929934995209",
    strk: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
};

const MAINNET_DEFAULTS = {
    escrow: import.meta.env.VITE_STRK20_ESCROW_ADDRESS_MAINNET || "",
    pool: import.meta.env.VITE_STRK20_POOL_ADDRESS_MAINNET || "",
    usdc: import.meta.env.VITE_USDC_ADDRESS_MAINNET || "",
    strk: import.meta.env.VITE_STRK_ADDRESS_MAINNET || "",
};

export const NETWORKS: Record<NetworkId, NetworkConfig> = {
    sepolia: {
        id: "sepolia",
        label: "Starknet Sepolia",
        chainId: SNconstants.StarknetChainId.SN_SEPOLIA,
        providerIndex: 1,
        escrow: import.meta.env.VITE_STRK20_ESCROW_ADDRESS || SEPOLIA_DEFAULTS.escrow,
        pool: import.meta.env.VITE_STRK20_POOL_ADDRESS || SEPOLIA_DEFAULTS.pool,
        usdc: import.meta.env.VITE_USDC_ADDRESS || SEPOLIA_DEFAULTS.usdc,
        strk: import.meta.env.VITE_STRK_ADDRESS || SEPOLIA_DEFAULTS.strk,
        explorerTxBase: "https://sepolia.voyager.online/tx",
    },
    mainnet: {
        id: "mainnet",
        label: "Starknet Mainnet",
        chainId: SNconstants.StarknetChainId.SN_MAIN,
        providerIndex: 0,
        escrow: MAINNET_DEFAULTS.escrow || import.meta.env.VITE_STRK20_ESCROW_ADDRESS || "",
        pool: MAINNET_DEFAULTS.pool || import.meta.env.VITE_STRK20_POOL_ADDRESS || "",
        usdc: MAINNET_DEFAULTS.usdc || import.meta.env.VITE_USDC_ADDRESS || "",
        strk: MAINNET_DEFAULTS.strk || import.meta.env.VITE_STRK_ADDRESS || "",
        explorerTxBase: "https://voyager.online/tx",
    },
};

export const TOKEN_USDC = 1;
export const TOKEN_STRK = 0;

export const tokenNames: Record<number, string> = {
    [TOKEN_STRK]: "STRK",
    [TOKEN_USDC]: "USDC",
};

export const TOKEN_DECIMALS: Record<number, number> = {
    [TOKEN_STRK]: 18,
    [TOKEN_USDC]: 6,
};

export const frontendProviders: ProviderInterface[] = [
    new RpcProvider({
        nodeUrl: `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/${alchemyKey}`,
    }),
    new RpcProvider({
        nodeUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/${alchemyKey}`,
    }),
];

export function networkFromProviderIndex(index: number): NetworkId {
    return index === 0 ? "mainnet" : "sepolia";
}

export function getNetworkConfig(providerIndex = 1): NetworkConfig {
    const id = networkFromProviderIndex(providerIndex);
    return NETWORKS[id];
}

export function getNetworkConfigByChain(chainId: string | null | undefined): NetworkConfig {
    if (chainId === SNconstants.StarknetChainId.SN_MAIN) return NETWORKS.mainnet;
    return NETWORKS.sepolia;
}

export function getEscrowAddress(providerIndex = 1): string {
    return getNetworkConfig(providerIndex).escrow;
}

export function getPoolAddress(providerIndex = 1): string {
    return getNetworkConfig(providerIndex).pool;
}

export function getTokenAddresses(providerIndex = 1): Record<number, string> {
    const net = getNetworkConfig(providerIndex);
    return {
        [TOKEN_STRK]: net.strk,
        [TOKEN_USDC]: net.usdc,
    };
}

/** @deprecated use getEscrowAddress(providerIndex) */
export const ESCROW_ADDRESS = SEPOLIA_DEFAULTS.escrow;
/** @deprecated use getPoolAddress(providerIndex) */
export const POOL_ADDRESS = SEPOLIA_DEFAULTS.pool;
/** @deprecated use getTokenAddresses */
export const USDC_ADDRESS = SEPOLIA_DEFAULTS.usdc;
/** @deprecated use getTokenAddresses */
export const STRK_ADDRESS = SEPOLIA_DEFAULTS.strk;
/** @deprecated use getTokenAddresses */
export const tokenAddresses: Record<number, string> = {
    [TOKEN_STRK]: SEPOLIA_DEFAULTS.strk,
    [TOKEN_USDC]: SEPOLIA_DEFAULTS.usdc,
};

export function isStrk20Network(providerIndex: number): boolean {
    return providerIndex === 0 || providerIndex === 1;
}

export function isSupportedChain(chainId: string | null | undefined): boolean {
    return (
        chainId === SNconstants.StarknetChainId.SN_MAIN ||
        chainId === SNconstants.StarknetChainId.SN_SEPOLIA
    );
}

export function getExplorerTxUrl(txHash: string, providerIndex = 1): string {
    const base = getNetworkConfig(providerIndex).explorerTxBase;
    return `${base}/${txHash}`;
}

export function getExplorerAddressUrl(address: string, providerIndex = 1): string {
    const base =
        providerIndex === 0
            ? "https://voyager.online/contract"
            : "https://sepolia.voyager.online/contract";
    return `${base}/${address}`;
}
