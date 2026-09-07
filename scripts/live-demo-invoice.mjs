#!/usr/bin/env node
/**
 * Create a live mainnet demo invoice on the production API and print a payment URL.
 * Usage: node scripts/live-demo-invoice.mjs [merchantAddress] [amountStrk]
 */
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(new URL("../frontend/package.json", import.meta.url));
const { hash, shortString, num } = require("starknet");

const API_URL =
    process.env.VITE_API_URL ||
    process.env.API_URL ||
    "https://blindpay-api-production.up.railway.app/api";
const FRONTEND_URL =
    process.env.FRONTEND_URL || "https://frontend-gules-chi-29.vercel.app";

const merchant =
    process.argv[2] ||
    "0x0410e5d8f908b5315731F51Fcdf116D0dd349bfDBF8Fdc896074D2bd81542b82";
const amount = Number(process.argv[3] || "0.1");
const tokenType = 1; // STRK

const ESCROW_COMMITMENT_TAG = shortString.encodeShortString("ESCROW_COMMITMENT_TAG:V1");

function randomFeltHex() {
    const bytes = crypto.randomBytes(31);
    return "0x" + bytes.toString("hex");
}

function computeCommitmentHash(secret) {
    return hash.computePoseidonHashOnElements([
        ESCROW_COMMITMENT_TAG,
        num.toHex(secret),
    ]);
}

const salt = randomFeltHex();
const claimSecret = randomFeltHex();
const commitmentHash = computeCommitmentHash(claimSecret);

const body = {
    invoice_hash: salt,
    merchant_address: merchant,
    amount,
    token_type: tokenType,
    invoice_type: 0,
    memo: "Live mainnet demo",
    commitment_hash: commitmentHash,
    claim_secret: claimSecret,
    status: "PENDING",
    salt,
};

const res = await fetch(`${API_URL}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

if (!res.ok) {
    console.error("API error:", res.status, await res.text());
    process.exit(1);
}

const saved = await res.json();
const params = new URLSearchParams({
    merchant,
    salt,
    token: String(tokenType),
    amount: String(amount),
    memo: body.memo,
    commitment: commitmentHash,
});
const paymentUrl = `${FRONTEND_URL}/pay?${params.toString()}`;

console.log(JSON.stringify({
    invoice_hash: saved.invoice_hash || salt,
    merchant,
    amount,
    token: "STRK",
    commitment_hash: commitmentHash,
    claim_secret: claimSecret,
    payment_url: paymentUrl,
    api: API_URL,
}, null, 2));
