import { num } from "starknet";
import type { WALLET_API } from "@starknet-io/types-js";
import {
    ESCROW_ADDRESS,
    tokenAddresses,
    TOKEN_DECIMALS,
} from "./starknet-config";
import { EscrowOperation, computeCommitmentHash } from "./starknet-utils";

/**
 * Build STRK20 actions to deposit an invoice payment into the privacy escrow.
 * Payer withdraws from pool to escrow, then invokes deposit with commitment hash.
 */
export function buildEscrowDepositActions(
    tokenType: number,
    amount: bigint,
    claimSecret: string
): WALLET_API.STRK20_ACTION[] {
    const token = num.toHex(tokenAddresses[tokenType]);
    const escrow = num.toHex(ESCROW_ADDRESS);
    const commitmentHash = computeCommitmentHash(claimSecret);

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
 * Creates an open note, then invokes claim with the shared secret.
 */
export function buildEscrowClaimActions(
    tokenType: number,
    claimSecret: string,
    recipientAddress: string
): WALLET_API.STRK20_ACTION[] {
    const token = num.toHex(tokenAddresses[tokenType]);
    const escrow = num.toHex(ESCROW_ADDRESS);

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
