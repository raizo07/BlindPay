import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { ToastContainer } from '../components/ui/Toast';
import { useWallet } from '../hooks/useWallet';
import { useTransactions } from '../hooks/useTransactions';
import { useRealtimeNotifications } from '../hooks/useRealtimeNotifications';
import { getExplorerTxUrl } from '../utils/starknet-config';
import type { InvoiceRecord, MerchantReceipt, PayerReceipt } from '../utils/starknet-utils';

import { StatsCards } from '../components/profile/StatsCards';
import { InvoiceTable } from '../components/profile/InvoiceTable';
import { PaidInvoicesTable } from '../components/profile/PaidInvoicesTable';
import { VerifyModal } from '../components/profile/modals/VerifyModal';
import { PaymentHistoryModal } from '../components/profile/modals/PaymentHistoryModal';
import { ReceiptHashesModal } from '../components/profile/modals/ReceiptHashesModal';
import { ShieldedBalances } from '../components/profile/ShieldedBalances';

const Profile: React.FC = () => {
    const { address: publicKey } = useWallet();
    const { transactions, loading: loadingTransactions, fetchTransactions } = useTransactions(publicKey || undefined);
    const { notifications, clearNotification } = useRealtimeNotifications(publicKey || undefined);
    const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'error' }>>([]);
    const [settling, setSettling] = useState<string | null>(null);
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyInput, setVerifyInput] = useState('');
    const [verifyStatus, setVerifyStatus] = useState<'IDLE' | 'CHECKING' | 'FOUND' | 'NOT_FOUND' | 'ERROR' | 'MISMATCH'>('IDLE');
    const [verifiedRecord, setVerifiedRecord] = useState<any>(null);
    const [verifyingInvoice, setVerifyingInvoice] = useState<any>(null);
    const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[] | null>(null);
    const [selectedReceiptHashes, setSelectedReceiptHashes] = useState<string[] | null>(null);
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'created' | 'paid'>('created');
    const [merchantReceipts, setMerchantReceipts] = useState<MerchantReceipt[]>([]);
    const [createdInvoices, setCreatedInvoices] = useState<InvoiceRecord[]>([]);
    const [payerReceipts, setPayerReceipts] = useState<PayerReceipt[]>([]);
    const [loadingReceipts, setLoadingReceipts] = useState(false);
    const [loadingCreated, setLoadingCreated] = useState(false);
    const [loadingPayerReceipts, setLoadingPayerReceipts] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (publicKey) {
            fetchTransactions();
            fetchCreatedInvoices();
            fetchMerchantReceipts();
            fetchPayerReceipts();
        }
    }, [publicKey]);

    // React to real-time payment notifications
    useEffect(() => {
        if (notifications.length === 0) return;
        const latest = notifications[0];
        // Avoid duplicate toasts
        setToasts((prev) => {
            if (prev.some((t) => t.id === latest.id)) return prev;
            return [...prev, { id: latest.id, message: latest.message, type: 'success' as const }];
        });
        // Refetch data when a payment arrives
        fetchTransactions();
        fetchCreatedInvoices();
    }, [notifications]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        clearNotification(id);
    }, [clearNotification]);

    const fetchCreatedInvoices = async () => {
        if (!publicKey) return;
        setLoadingCreated(true);
        try {
            // TODO: Query fhEVM contract for invoices created by this merchant
            // const events = await getContractEvents({
            //     address: CONTRACT_ADDRESS,
            //     eventName: 'InvoiceCreated',
            //     args: { merchant: publicKey },
            // });
            // setCreatedInvoices(events.map(parseInvoiceEvent));

            // For now, invoices come from DB via transactions
            setCreatedInvoices([]);
        } catch (e) {
            console.error("Error fetching created invoices:", e);
        } finally {
            setLoadingCreated(false);
        }
    };

    const fetchMerchantReceipts = async () => {
        if (!publicKey) return;
        setLoadingReceipts(true);
        try {
            // TODO: Query fhEVM contract for payment receipts
            // const events = await getContractEvents({
            //     address: CONTRACT_ADDRESS,
            //     eventName: 'PaymentReceived',
            //     args: { merchant: publicKey },
            // });
            setMerchantReceipts([]);
        } catch (e) {
            console.error("Error fetching merchant receipts:", e);
        } finally {
            setLoadingReceipts(false);
        }
    };

    const fetchPayerReceipts = async () => {
        if (!publicKey) return;
        setLoadingPayerReceipts(true);
        try {
            // TODO: Query fhEVM contract for payer receipts
            // const events = await getContractEvents({
            //     address: CONTRACT_ADDRESS,
            //     eventName: 'PaymentMade',
            //     args: { payer: publicKey },
            // });
            setPayerReceipts([]);
        } catch (e) {
            console.error("Error fetching payer receipts:", e);
        } finally {
            setLoadingPayerReceipts(false);
        }
    };

    // Merge DB transactions with on-chain records
    const combinedInvoices = useMemo(() => {
        // For now, use DB transactions directly until contract is deployed
        return transactions.map(tx => ({
            invoiceHash: tx.invoice_hash,
            amount: tx.amount / 1_000_000,
            tokenType: tx.token_type || 0,
            invoiceType: tx.invoice_type || 0,
            owner: tx.merchant_address,
            salt: tx.salt || '',
            status: tx.status,
            creationTx: tx.invoice_transaction_id || null,
            paymentTxIds: tx.payment_tx_ids || (tx.payment_tx_id ? [tx.payment_tx_id] : []),
            memo: tx.memo || '',
            isPending: false,
            source: 'db',
            isValidOnChain: false,
        }));
    }, [transactions, createdInvoices, merchantReceipts]);

    const handleVerifyReceipt = async () => {
        if (!verifyInput) return;
        try {
            setVerifyStatus('CHECKING');
            setVerifiedRecord(null);

            // TODO: Verify receipt on-chain via contract call
            // const receipt = await readContract({
            //     address: CONTRACT_ADDRESS,
            //     abi: BLINDPAY_ABI,
            //     functionName: 'verifyReceipt',
            //     args: [verifyInput],
            // });

            setVerifyStatus('NOT_FOUND');
        } catch (e) {
            console.error("Verification failed", e);
            setVerifyStatus('ERROR');
        }
    };

    const merchantStats = {
        balance: 'Encrypted',
        creditsSales: 'Encrypted',
        usdcxSales: 'Encrypted',
        invoices: combinedInvoices.length,
        settled: combinedInvoices.filter(inv => inv.status === 'SETTLED' || String(inv.status) === '1').length,
        pending: combinedInvoices.filter(inv => inv.status === 'PENDING' || String(inv.status) === '0').length
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const openExplorer = (txId?: string) => {
        if (txId) {
            window.open(getExplorerTxUrl(txId), '_blank');
        }
    };

    const handleSettle = async (invoice: any) => {
        if (!invoice || !invoice.salt) return;
        setSettling(invoice.invoiceHash);
        try {
            // TODO: Call fhEVM contract to settle invoice
            // const hash = await writeContract({
            //     address: CONTRACT_ADDRESS,
            //     abi: BLINDPAY_ABI,
            //     functionName: 'settleInvoice',
            //     args: [invoice.salt],
            // });
            // await waitForTransactionReceipt({ hash });

            // Optimistically update DB
            try {
                const { updateInvoiceStatus } = await import('../services/api');
                await updateInvoiceStatus(invoice.invoiceHash, { status: 'SETTLED' });
            } catch (e) {
                console.warn("DB update failed", e);
            }

            setTimeout(() => {
                fetchCreatedInvoices();
                fetchTransactions();
            }, 2000);
        } catch (e: any) {
            console.error("Settlement failed", e);
            alert("Failed to settle invoice: " + (e.message || "Unknown error"));
        } finally {
            setSettling(null);
        }
    };

    return (
        <div className="page-container relative min-h-screen">
            {/* TOAST NOTIFICATIONS */}
            <ToastContainer toasts={toasts} onClose={removeToast} />

            {/* BACKGROUND */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-zinc-800/20 rounded-full blur-[100px] animate-float-delayed" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-white/5 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            {/* VERIFY MODAL */}
            <VerifyModal
                isOpen={showVerifyModal}
                onClose={() => setShowVerifyModal(false)}
                verifyingInvoice={verifyingInvoice}
                verifyInput={verifyInput}
                setVerifyInput={setVerifyInput}
                verifyStatus={verifyStatus}
                verifiedRecord={verifiedRecord}
                merchantReceipts={merchantReceipts}
                onVerify={handleVerifyReceipt}
            />

            <PaymentHistoryModal
                paymentIds={selectedPaymentIds}
                onClose={() => setSelectedPaymentIds(null)}
                onViewTx={openExplorer}
            />

            <ReceiptHashesModal
                receiptHashes={selectedReceiptHashes}
                onClose={() => setSelectedReceiptHashes(null)}
            />

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-7xl mx-auto pt-10 relative z-10 pb-20"
            >
                {/* HEADER */}
                <motion.div variants={itemVariants} className="flex flex-col items-center justify-center text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter leading-tight text-white">
                        Merchant <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-primary to-neon-accent">Dashboard</span>
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-6">
                        Manage your invoices and settlements.
                    </p>
                </motion.div>

                {/* SHIELDED BALANCES (STRK20) */}
                <ShieldedBalances itemVariants={itemVariants} />

                {/* STATS */}
                <StatsCards
                    merchantStats={merchantStats}
                    loadingReceipts={loadingReceipts}
                    loadingCreated={loadingCreated}
                    itemVariants={itemVariants}
                />

                {/* INVOICE HISTORY */}
                <GlassCard variants={itemVariants} className="p-0 overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center gap-4">
                        <div className="flex p-1 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 relative">
                            {['created', 'paid'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`relative z-10 px-6 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                                >
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white rounded-full -z-10"
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}
                                    {tab === 'created' ? 'My Invoices' : 'Paid Invoices'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SEARCH */}
                    <div className="px-6 pb-4">
                        <div className="relative max-w-md mx-auto">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by invoice hash..."
                                value={invoiceSearch}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-primary/50 focus:ring-1 focus:ring-neon-primary/30 transition-colors"
                            />
                            {invoiceSearch && (
                                <button
                                    onClick={() => setInvoiceSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                                >
                                    x
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[300px]">
                        <div style={{ display: activeTab === 'created' ? 'block' : 'none' }}>
                            <InvoiceTable
                                invoices={combinedInvoices}
                                loading={loadingCreated || loadingTransactions}
                                search={invoiceSearch}
                                currentPage={currentPage}
                                itemsPerPage={itemsPerPage}
                                setCurrentPage={setCurrentPage}
                                onVerify={(inv) => {
                                    setVerifyingInvoice(inv);
                                    setVerifyInput('');
                                    setShowVerifyModal(true);
                                }}
                                onSettle={handleSettle}
                                settlingId={settling}
                                onViewPayments={(ids) => setSelectedPaymentIds(ids)}
                            />
                        </div>

                        <div style={{ display: activeTab === 'paid' ? 'block' : 'none' }}>
                            <PaidInvoicesTable
                                receipts={payerReceipts}
                                loading={loadingPayerReceipts}
                                search={invoiceSearch}
                                onViewReceipts={(hashes) => setSelectedReceiptHashes(hashes)}
                            />
                        </div>
                    </div>
                    <div className="p-4 bg-white/5 border-t border-white/5 text-center text-xs text-gray-500 italic">
                        All data is settled privately through the STRK20 privacy pool on Starknet.
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Profile;
