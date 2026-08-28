import { getNetworkConfig } from "../utils/starknet-config";

export interface EnvValidationResult {
    ok: boolean;
    warnings: string[];
    errors: string[];
}

export function validateEnv(): EnvValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!import.meta.env.VITE_API_URL) {
        warnings.push("VITE_API_URL not set — using http://localhost:3000/api");
    }

    if (!import.meta.env.VITE_ALCHEMY_API_KEY) {
        if (import.meta.env.PROD) {
            errors.push("VITE_ALCHEMY_API_KEY is required for production builds.");
        } else {
            warnings.push("VITE_ALCHEMY_API_KEY not set — RPC calls may fail.");
        }
    }

    for (const [net, index] of [
        ["sepolia", 1],
        ["mainnet", 0],
    ] as const) {
        const cfg = getNetworkConfig(index);
        if (!cfg.escrow || !cfg.pool) {
            if (net === "sepolia") {
                errors.push(`Missing STRK20 escrow/pool addresses for ${net}.`);
            } else {
                warnings.push(`Mainnet STRK20 addresses not configured — set VITE_STRK20_*_MAINNET env vars.`);
            }
        }
    }

    return { ok: errors.length === 0, warnings, errors };
}
