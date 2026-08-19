import { useState } from 'react';
import { motion } from 'framer-motion';
import { usePayment } from '../../hooks/usePayment';
import { useWallet } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/ui/ConnectButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shimmer } from '../../components/ui/Shimmer';
import { Scanner } from '@yudiel/react-qr-scanner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProviderStore } from '../../stores/providerStore';
import { getExplorerTxUrl } from '../../utils/starknet-config';

const MobilePaymentPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasParams = searchParams.get('merchant') && searchParams.get('salt');
    const [manualLink, setManualLink] = useState('');
    const providerIndex = useProviderStore((s) => s.currentProviderIndex);

    const {
        step, status, loading, error, invoice, txId,
        handlePay, donationAmount, setDonationAmount,
        isWrongChain, openWalletPicker, tokenName,
    } = usePayment();

    const { isConnected } = useWallet();
    const isProcess = loading;
    const isDonation = invoice?.invoiceType === 2;

    const processPaymentLink = (rawValue: string) => {
        if (!rawValue) return;
        try {
            const urlObj = new URL(rawValue);
            navigate(`${urlObj.pathname}${urlObj.search}`);
        } catch {
            navigate(rawValue.startsWith('/') ? rawValue : `/pay?${rawValue}`);
        }
    };

    if (!hasParams) {
        return (
            <div className="min-h-screen bg-black p-6 flex flex-col gap-6">
                <h1 className="text-2xl font-bold text-white text-center">Scan Invoice QR</h1>
                <GlassCard className="p-4 overflow-hidden">
                    <Scanner onScan={(result) => result[0]?.rawValue && processPaymentLink(result[0].rawValue)} />
                </GlassCard>
                <Input
                    label="Or paste payment link"
                    value={manualLink}
                    onChange={(e) => setManualLink(e.target.value)}
                    placeholder="https://..."
                />
                <Button variant="primary" onClick={() => processPaymentLink(manualLink)} className="w-full">
                    Open Invoice
                </Button>
            </div>
        );
    }

    return (
        <motion.div className="min-h-screen bg-black p-6 flex flex-col gap-6">
            <h1 className="text-2xl font-bold text-white text-center">Private Payment</h1>

            {error && (
                <GlassCard className="p-4 border-red-500/30 bg-red-900/20">
                    <p className="text-red-200 text-sm">{error}</p>
                </GlassCard>
            )}

            <GlassCard className="p-6 space-y-4">
                {step === 'CONNECT' && (
                    <>
                        <p className="text-gray-400 text-sm text-center">Connect Ready wallet for STRK20 payments.</p>
                        <ConnectButton className="w-full" />
                    </>
                )}

                {(step === 'PAY' || step === 'VERIFY') && invoice && (
                    <>
                        {isDonation ? (
                            <Input
                                label={`Amount (${tokenName})`}
                                type="number"
                                value={donationAmount}
                                onChange={(e) => setDonationAmount(e.target.value)}
                            />
                        ) : (
                            <div className="text-center">
                                <p className="text-gray-400 text-sm">Amount</p>
                                <p className="text-3xl font-bold text-white">{invoice.amount} {tokenName}</p>
                            </div>
                        )}

                        {isWrongChain && (
                            <p className="text-yellow-300 text-xs">Switch to Starknet Sepolia or Mainnet.</p>
                        )}

                        <div className="text-center text-sm text-gray-400 min-h-[1.5rem] flex items-center justify-center gap-2">
                            {isProcess ? (
                                <>
                                    <Shimmer className="w-4 h-4 rounded-full" />
                                    <span>{status}</span>
                                </>
                            ) : (
                                status
                            )}
                        </div>

                        <Button
                            variant="primary"
                            onClick={isConnected ? handlePay : openWalletPicker}
                            disabled={isProcess || isWrongChain}
                            className="w-full"
                        >
                            {isProcess ? 'Processing...' : `Pay ${tokenName}`}
                        </Button>
                    </>
                )}

                {step === 'SUCCESS' && (
                    <div className="text-center space-y-4">
                        <p className="text-green-400 font-bold">Payment successful!</p>
                        {txId && (
                            <a
                                href={getExplorerTxUrl(txId, providerIndex)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-400 text-sm"
                            >
                                View on Voyager ↗
                            </a>
                        )}
                    </div>
                )}

                {step === 'ALREADY_PAID' && (
                    <p className="text-gray-400 text-center">This invoice is already paid.</p>
                )}
            </GlassCard>
        </motion.div>
    );
};

export default MobilePaymentPage;
