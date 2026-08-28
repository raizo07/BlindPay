import { num } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import {
    getEscrowAddress,
    getTokenAddresses,
    TOKEN_DECIMALS,
} from "./starknet-config";
import { EscrowOperation } from "./starknet-utils";

/**
 * Build STRK20 actions to deposit an invoice payment into the privacy escrow.
 * Uses the public commitment hash from the invoice record (not the claim secret).
 */
export function buildEscrowDepositActions(
    tokenType: number,
    amount: bigint,
    commitmentHash: string,
    providerIndex = 1
): WALLET_API.STRK20_ACTION[] {
    const tokens = getTokenAddresses(providerIndex);
    const token = num.toHex(tokens[tokenType]);
    const escrow = num.toHex(getEscrowAddress(providerIndex));

    return [
        {
            type: "withdraw",
            token,
            amount: num.toHex(amount),
            recipient: escrow,
        },
        {
            type: "invoke",
            contract: escrow,
            calldata: [
                EscrowOperation.Deposit,
                num.toHex(commitmentHash),
                token,
                num.toHex(amount),
                "0x0",
                "0x0",
            ],
        },
    ];
}

/**
 * Build STRK20 actions for a merchant to claim escrowed funds into a private note.
 */
export function buildEscrowClaimActions(
    tokenType: number,
    claimSecret: string,
    recipientAddress: string,
    providerIndex = 1
): WALLET_API.STRK20_ACTION[] {
    const tokens = getTokenAddresses(providerIndex);
    const token = num.toHex(tokens[tokenType]);
    const escrow = num.toHex(getEscrowAddress(providerIndex));

    return [
        {
            type: "transfer",
            token,
            amount: "OPEN",
            recipient: recipientAddress,
        },
        {
            type: "invoke",
            contract: escrow,
            calldata: [
                EscrowOperation.Claim,
                "0x0",
                "0x0",
                "0x0",
                num.toHex(claimSecret),
                "${openNoteIds[0]}",
            ],
        },
    ];
}

export function amountToBaseUnits(amount: string | number, tokenType: number): bigint {
    const decimals = TOKEN_DECIMALS[tokenType] ?? 18;
    const [whole = "0", frac = ""] = amount.toString().split(".");
    const paddedFrac = frac.padEnd(decimals, "0").slice(0, decimals);
    return BigInt(whole + paddedFrac);
}
