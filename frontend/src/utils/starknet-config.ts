import { ProviderInterface, RpcProvider } from "starknet";

const alchemyKey = import.meta.env.VITE_ALCHEMY_API_KEY || "";

export const ESCROW_ADDRESS =
    import.meta.env.VITE_STRK20_ESCROW_ADDRESS ||
    "0x01ad75c06ad9086bec4c24c967397c3fdbb32f8c11525bca82e425dc17d270cc";

export const POOL_ADDRESS =
    import.meta.env.VITE_STRK20_POOL_ADDRESS ||
    "0xd894af9ed2bdede33675049ae5285df000c44258a2250b84a9c3bed0d7c233";

// USDC on Starknet Sepolia (override via env for your deployment)
export const USDC_ADDRESS =
    import.meta.env.VITE_USDC_ADDRESS ||
    "0x053c91253bc9682c04929ca02edcedb1745d5993a6bcf580220e929934995209";

export const STRK_ADDRESS =
    import.meta.env.VITE_STRK_ADDRESS ||
    "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export const TOKEN_USDC = 1;
export const TOKEN_STRK = 0;

export const tokenNames: Record<number, string> = {
    [TOKEN_STRK]: "STRK",
    [TOKEN_USDC]: "USDC",
};

export const tokenAddresses: Record<number, string> = {
    [TOKEN_STRK]: STRK_ADDRESS,
    [TOKEN_USDC]: USDC_ADDRESS,
};

export const TOKEN_DECIMALS: Record<number, number> = {
    [TOKEN_STRK]: 18,
    [TOKEN_USDC]: 6,
};

export const Strk20Networks: Record<number, string> = {
    0: "MAINNET",
    2: "SEPOLIA",
};

export const frontendProviders: ProviderInterface[] = [
    new RpcProvider({
        nodeUrl: `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/${alchemyKey}`,
    }),
    new RpcProvider({
        nodeUrl: "https://starknet-testnet.public.blastapi.io/rpc/v0_7",
    }),
    new RpcProvider({
        nodeUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/${alchemyKey}`,
    }),
];

export function isStrk20Network(providerIndex: number): boolean {
    return Strk20Networks[providerIndex] !== undefined;
}

export function getExplorerTxUrl(txHash: string, providerIndex = 2): string {
    const base =
        providerIndex === 0
            ? "https://voyager.online/tx"
            : "https://sepolia.voyager.online/tx";
    return `${base}/${txHash}`;
}

export function getExplorerAddressUrl(address: string, providerIndex = 2): string {
    const base =
        providerIndex === 0
            ? "https://voyager.online/contract"
            : "https://sepolia.voyager.online/contract";
    return `${base}/${address}`;
}
