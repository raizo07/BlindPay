import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useWallet } from "./useWallet";
import { useStrk20 } from "./useStrk20";
import { TOKEN_DECIMALS } from "../utils/starknet-config";
import { buildEscrowDepositActions, amountToBaseUnits } from "../utils/strk20";
import { getExplorerTxUrl } from "../utils/starknet-config";
import { useProviderStore } from "../stores/providerStore";
import { fetchInvoiceByHash, updateInvoiceStatus } from "../services/api";

export type PaymentStep = "CONNECT" | "VERIFY" | "PAY" | "SUCCESS" | "ALREADY_PAID";

export const usePayment = () => {
    const [searchParams] = useSearchParams();
    const { address, isConnected, isWrongChain, openWalletPicker, switchNetwork } = useWallet();
    const { submitActions } = useStrk20();
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const [invoice, setInvoice] = useState<{
        merchant: string;
        amount: number;
        salt: string;
        memo: string;
        tokenType: number;
        invoiceType: number;
        commitmentHash: string;
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
            const amountParam = searchParams.get("amount");
            const salt = searchParams.get("salt");
            const memo = searchParams.get("memo") || "";
            const tokenParam = searchParams.get("token");
            const tokenType = tokenParam === "0" ? 0 : 1;
            const typeParam = searchParams.get("type");
            const initialType =
                typeParam === "donation" ? 2 : typeParam === "multipay" ? 1 : 0;

            let items: { description: string; quantity: number; unitPrice: number }[] | undefined;
            const itemsParam = searchParams.get("items");
            if (itemsParam) {
                try {
                    items = JSON.parse(atob(itemsParam));
                } catch {
                    setError("Invalid invoice link: malformed line items.");
                    return;
                }
            }

            if (!merchant || !salt) {
                setError("Invalid invoice link: missing parameters.");
                return;
            }
            if (!amountParam && initialType !== 2) {
                setError("Invalid invoice link: missing amount.");
                return;
            }

            const parsedAmount = amountParam ? Number(amountParam) : 0;
            if (amountParam && (!Number.isFinite(parsedAmount) || parsedAmount <= 0) && initialType !== 2) {
                setError("Invalid invoice link: bad amount.");
                return;
            }

            setError(null);
            setLoading(true);
            setStatus("Verifying invoice...");

            try {
                const data = await fetchInvoiceByHash(salt);
                if (!data) {
                    setError("Invoice not found. Check the link or ask the merchant to recreate it.");
                    return;
                }

                if (
                    data.merchant_address?.toLowerCase() !== merchant.toLowerCase()
                ) {
                    setError("Invoice verification failed: merchant mismatch.");
                    return;
                }

                if (!data.commitment_hash) {
                    setError("Invoice is missing escrow commitment. Ask the merchant for a new link.");
                    return;
                }

                const apiAmount = data.amount != null ? Number(data.amount) : parsedAmount;
                if (initialType !== 2 && amountParam && Math.abs(apiAmount - parsedAmount) > 0.000001) {
                    setError("Invoice verification failed: amount mismatch.");
                    return;
                }

                if (data.status === "SETTLED" && initialType !== 1) {
                    setInvoice({
                        merchant,
                        amount: apiAmount,
                        salt,
                        memo: data.memo || memo,
                        tokenType: data.token_type ?? tokenType,
                        invoiceType: initialType,
                        commitmentHash: data.commitment_hash,
                        items,
                    });
                    setStep("ALREADY_PAID");
                    setStatus("This invoice has already been paid.");
                    return;
                }

                setInvoice({
                    merchant,
                    amount: apiAmount,
                    salt,
                    memo: data.memo || memo,
                    tokenType: data.token_type ?? tokenType,
                    invoiceType: initialType,
                    commitmentHash: data.commitment_hash,
                    items,
                });
                setStep(isConnected ? "PAY" : "CONNECT");
                setStatus(isConnected ? "Ready to pay privately." : "Connect your wallet to pay.");
            } catch {
                setError("Could not verify invoice with the server. Try again later.");
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
            invoice.invoiceType === 2 ? donationAmount : String(invoice.amount);

        if (!payAmount || Number(payAmount) <= 0) {
            setError("Please enter a valid payment amount.");
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
                invoice.commitmentHash,
                providerIndex
            );

            const result = await submitActions(actions);

            if (result.status === "error") {
                throw new Error(result.error || "Payment failed");
            }

            setTxId(result.txHash);
            setStatus("Payment confirmed on-chain. Updating invoice...");

            const updated = await updateInvoiceStatus(invoice.salt, {
                status: "SETTLED",
                payment_tx_ids: result.txHash,
                payer_address: address,
            });

            if (!updated) {
                setStatus("Paid on-chain — server indexing pending. Keep your receipt.");
            } else {
                setStatus("Payment confirmed!");
            }

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
        switchNetwork,
        getTxExplorerUrl,
        tokenName: invoice ? (invoice.tokenType === 0 ? "STRK" : "USDC") : "USDC",
        tokenDecimals: invoice ? TOKEN_DECIMALS[invoice.tokenType] : 6,
    };
};
