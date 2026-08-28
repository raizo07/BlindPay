import { useState } from "react";
import { useWallet } from "./useWallet";
import {
    generateSalt,
    generateClaimSecret,
    computeCommitmentHash,
} from "../utils/starknet-utils";
import { InvoiceData } from "../types/invoice";
import { createInvoice } from "../services/api";

export type InvoiceType = "standard" | "multipay" | "donation";

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

export const useCreateInvoice = () => {
    const { address, isConnected, isWrongChain, openWalletPicker } = useWallet();

    const [amount, setAmount] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [memo, setMemo] = useState<string>("");
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [invoiceType, setInvoiceType] = useState<InvoiceType>("standard");
    const [tokenType, setTokenType] = useState<number>(1);
    const [lineItems, setLineItems] = useState<LineItem[]>([]);

    const addLineItem = () => {
        setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
    };

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
        const total = updated.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        if (total > 0) setAmount(Math.round(total * 1e6) / 1e6);
    };

    const removeLineItem = (index: number) => {
        const updated = lineItems.filter((_, i) => i !== index);
        setLineItems(updated);
        const total = updated.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
        setAmount(total > 0 ? Math.round(total * 1e6) / 1e6 : "");
    };

    const handleCreate = async () => {
        if (!address || !isConnected) {
            openWalletPicker();
            setError("Please connect your Starknet privacy wallet first.");
            return;
        }

        if (isWrongChain) {
            setError("Switch your wallet to Starknet Sepolia or Mainnet.");
            return;
        }

        if (invoiceType !== "donation" && (!amount || amount <= 0)) {
            setError("Please enter a valid amount.");
            return;
        }

        setLoading(true);
        setError(null);
        setStatus("Creating invoice...");

        try {
            const salt = generateSalt();
            const claimSecret = generateClaimSecret();
            const commitmentHash = computeCommitmentHash(claimSecret);
            const isDonation = invoiceType === "donation";

            let invoiceTypeNum = 0;
            if (invoiceType === "multipay") invoiceTypeNum = 1;
            if (invoiceType === "donation") invoiceTypeNum = 2;

            setStatus("Saving invoice...");
            const saved = await createInvoice({
                invoice_hash: salt,
                merchant_address: address,
                amount: isDonation ? undefined : Number(amount),
                token_type: tokenType,
                invoice_type: invoiceTypeNum,
                memo,
                commitment_hash: commitmentHash,
                claim_secret: claimSecret,
                status: "PENDING",
                salt,
            });

            if (!saved) {
                throw new Error("Failed to save invoice");
            }

            const params = new URLSearchParams({
                merchant: address,
                salt,
                token: String(tokenType),
            });
            if (!isDonation && amount) params.set("amount", String(amount));
            if (memo) params.set("memo", memo);
            if (invoiceType !== "standard") params.set("type", invoiceType);
            if (lineItems.length > 0) {
                params.set("items", btoa(JSON.stringify(lineItems)));
            }

            const paymentUrl = `${window.location.origin}/pay?${params.toString()}`;

            const data: InvoiceData = {
                salt,
                claimSecret,
                commitmentHash,
                paymentUrl,
                merchant: address,
                amount: isDonation ? 0 : Number(amount),
                tokenType,
                invoiceType: invoiceTypeNum,
                memo,
            };

            setInvoiceData(data);
            setStatus(
                "Invoice created! Share the payment link with your customer. Save your claim secret — you need it to claim funds."
            );
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Failed to create invoice.");
            setStatus("");
        } finally {
            setLoading(false);
        }
    };

    const resetInvoice = () => {
        setInvoiceData(null);
        setStatus("");
        setError(null);
        setAmount("");
        setMemo("");
    };

    return {
        amount,
        setAmount,
        loading,
        invoiceData,
        memo,
        setMemo,
        status,
        error,
        invoiceType,
        setInvoiceType,
        tokenType,
        setTokenType,
        lineItems,
        addLineItem,
        updateLineItem,
        removeLineItem,
        handleCreate,
        resetInvoice,
        isConnected,
        publicKey: address,
        openWalletPicker,
    };
};
