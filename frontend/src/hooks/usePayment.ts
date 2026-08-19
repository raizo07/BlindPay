import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "./useWallet";
import { useStrk20 } from "./useStrk20";
import { generateSalt } from "../utils/starknet-utils";
import { tokenNames, TOKEN_DECIMALS } from "../utils/starknet-config";
import { buildEscrowDepositActions, amountToBaseUnits } from "../utils/strk20";
import { getExplorerTxUrl } from "../utils/starknet-config";
import { useProviderStore } from "../stores/providerStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export type PaymentStep = "CONNECT" | "VERIFY" | "PAY" | "SUCCESS" | "ALREADY_PAID";

export const usePayment = () => {
    const [searchParams] = useSearchParams();
    const { address, isConnected, isWrongChain, openWalletPicker } = useWallet();
    const { submitActions } = useStrk20();
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const [invoice, setInvoice] = useState<{
        merchant: string;
        amount: number;
        salt: string;
        memo: string;
        tokenType: number;
        invoiceType: number;
        claimSecret?: string;
        items?: { description: string; quantity: number; unitPrice: number }[];
    } | null>(null);

    const [donationAmount, setDonationAmount] = useState<string>("");
    const [status, setStatus] = useState<string>("Initializing...");
    const [step, setStep] = useState<PaymentStep>("CONNECT");
    const [loading, setLoading] = useState(false);
    const [txId, setTxId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const merchant = searchParams.get("merchant");
            const amount = searchParams.get("amount");
            const salt = searchParams.get("salt");
            const memo = searchParams.get("memo") || "";
            const tokenParam = searchParams.get("token");
            const tokenType = tokenParam === "0" ? 0 : 1;
            const typeParam = searchParams.get("type");
            const initialType =
                typeParam === "donation" ? 2 : typeParam === "multipay" ? 1 : 0;
            const secret = searchParams.get("secret") || undefined;

            let items: { description: string; quantity: number; unitPrice: number }[] | undefined;
            const itemsParam = searchParams.get("items");
            if (itemsParam) {
                try {
                    items = JSON.parse(atob(itemsParam));
                } catch {
                    /* ignore */
                }
            }

            if (!merchant || !salt) {
                setError("Invalid invoice link: missing parameters.");
                return;
            }
            if (!amount && initialType !== 2) {
                setError("Invalid invoice link: missing amount.");
                return;
            }

            setError(null);

            try {
                setLoading(true);
                setStatus("Verifying invoice...");

                const res = await fetch(`${API_URL}/invoice/${salt}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === "SETTLED" && initialType !== 1) {
                        setInvoice({
                            merchant,
                            amount: Number(amount) || 0,
                            salt,
                            memo,
                            tokenType,
                            invoiceType: initialType,
                            claimSecret: secret,
                            items,
                        });
                        setStep("ALREADY_PAID");
                        setStatus("This invoice has already been paid.");
                        return;
                    }
                }

                setInvoice({
                    merchant,
                    amount: Number(amount) || 0,
                    salt,
                    memo,
                    tokenType,
                    invoiceType: initialType,
                    claimSecret: secret,
                    items,
                });
                setStep(isConnected ? "PAY" : "CONNECT");
                setStatus(isConnected ? "Ready to pay privately." : "Connect your wallet to pay.");
            } catch {
                setInvoice({
                    merchant,
                    amount: Number(amount) || 0,
                    salt,
                    memo,
                    tokenType,
                    invoiceType: initialType,
                    claimSecret: secret,
                    items,
                });
                setStep(isConnected ? "PAY" : "CONNECT");
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [searchParams, isConnected]);

    useEffect(() => {
        if (isConnected && step === "CONNECT") {
            setStep("PAY");
            setStatus("Ready to pay privately via STRK20.");
        }
    }, [isConnected, step]);

    const handlePay = async () => {
        if (!invoice) return;

        if (!isConnected) {
            openWalletPicker();
            return;
        }

        if (isWrongChain) {
            setError("Switch your wallet to Starknet Sepolia or Mainnet to use STRK20.");
            return;
        }

        const payAmount =
            invoice.invoiceType === 2
                ? donationAmount
                : String(invoice.amount);

        if (!payAmount || Number(payAmount) <= 0) {
            setError("Please enter a valid payment amount.");
            return;
        }

        const claimSecret = invoice.claimSecret;
        if (!claimSecret) {
            setError("Missing claim secret in payment link. Ask the merchant for a valid invoice link.");
            return;
        }

        setLoading(true);
        setError(null);
        setStatus("Submitting private payment to STRK20 escrow...");

        try {
            const amountBase = amountToBaseUnits(payAmount, invoice.tokenType);
            const actions = buildEscrowDepositActions(
                invoice.tokenType,
                amountBase,
                claimSecret
            );

            const result = await submitActions(actions);

            if (result.status === "error") {
                throw new Error(result.error || "Payment failed");
            }

            setTxId(result.txHash);
            setStatus("Payment confirmed!");

            await fetch(`${API_URL}/invoices/${invoice.salt}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: "SETTLED",
                    payer_address: address,
                    tx_hash: result.txHash,
                }),
            }).catch(() => {});

            setStep("SUCCESS");
        } catch (e) {
            console.error(e);
            setError(e instanceof Error ? e.message : "Payment failed.");
        } finally {
            setLoading(false);
        }
    };

    const getTxExplorerUrl = (hash: string) => getExplorerTxUrl(hash, providerIndex);

    return {
        invoice,
        donationAmount,
        setDonationAmount,
        status,
        step,
        loading,
        txId,
        error,
        isConnected,
        isWrongChain,
        handlePay,
        openWalletPicker,
        getTxExplorerUrl,
        tokenName: invoice ? tokenNames[invoice.tokenType] : "USDC",
        tokenDecimals: invoice ? TOKEN_DECIMALS[invoice.tokenType] : 6,
    };
};

// Re-export for any legacy import
export { generateSalt };
