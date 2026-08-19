import { useState } from "react";
import { useWallet } from "./useWallet";
import {
    generateSalt,
    generateClaimSecret,
    computeCommitmentHash,
} from "../utils/starknet-utils";
import { tokenNames } from "../utils/starknet-config";
import { InvoiceData } from "../types/invoice";

export type InvoiceType = "standard" | "multipay" | "donation";

export interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const useCreateInvoice = () => {
    const { address, isConnected, openWalletPicker } = useWallet();

    const [amount, setAmount] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
    const [memo, setMemo] = useState<string>("");
    const [status, setStatus] = useState<string>("");
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
            setStatus("Please connect your Starknet privacy wallet first.");
            return;
        }

        if (invoiceType !== "donation" && (!amount || amount <= 0)) {
            setStatus("Please enter a valid amount.");
            return;
        }

        setLoading(true);
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
            const res = await fetch(`${API_URL}/invoices`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    invoice_hash: salt,
                    merchant_address: address,
                    amount: isDonation ? null : Number(amount),
                    token: tokenNames[tokenType]?.toLowerCase() ?? "usdc",
                    token_type: tokenType,
                    invoice_type: invoiceTypeNum,
                    memo,
                    commitment_hash: commitmentHash,
                    status: "PENDING",
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to save invoice");
            }

            const paymentUrl = `${window.location.origin}/pay?merchant=${address}&amount=${amount || ""}&salt=${salt}&token=${tokenType}&memo=${encodeURIComponent(memo)}&type=${invoiceType}&secret=${claimSecret}`;

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
            setStatus("Invoice created! Share the payment link with your customer.");
        } catch (e) {
            console.error(e);
            setStatus(e instanceof Error ? e.message : "Failed to create invoice.");
        } finally {
            setLoading(false);
        }
    };

    const resetInvoice = () => {
        setInvoiceData(null);
        setStatus("");
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
