import { motion } from 'framer-motion';
import { pageVariants } from '../../utils/animations';
import { usePayment, PaymentStep } from '../../hooks/usePayment';
import { useWallet } from '../../hooks/useWallet';
import { ConnectButton } from '../../components/ui/ConnectButton';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Shimmer } from '../../components/ui/Shimmer';
import { Input } from '../../components/ui/Input';

const PaymentPage = () => {
    const {
        step,
        status,
        loading,
        error,
        invoice,
        txId,
        handlePay,
        donationAmount,
        setDonationAmount,
        isWrongChain,
        openWalletPicker,
        switchNetwork,
        getTxExplorerUrl,
        tokenName,
    } = usePayment();

    const { isConnected } = useWallet();
    const isProcess = loading;

    const steps: { key: PaymentStep; label: string }[] = [
        { key: 'CONNECT', label: '1. Connect' },
        { key: 'VERIFY', label: '2. Verify' },
        { key: 'PAY', label: '3. Pay' },
    ];

    const isMultiPay = invoice?.invoiceType === 1;
    const isDonation = invoice?.invoiceType === 2;

    return (
        <motion.div
            className="page-container flex flex-col items-center justify-center min-h-[85vh]"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter text-white">
                        {step === 'SUCCESS' ? 'Payment' : step === 'ALREADY_PAID' ? 'Invoice' : 'Private'}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                            {step === 'SUCCESS' ? 'Successful' : step === 'ALREADY_PAID' ? 'Paid' : 'Payment'}
                        </span>
                    </h1>

                    {invoice && !error && step !== 'SUCCESS' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 bg-neon-primary/10 px-4 py-2 rounded-full border border-neon-primary/20"
                        >
                            <span className="text-sm font-bold text-neon-primary tracking-wide uppercase">
                                STRK20 Escrow Invoice
                            </span>
                        </motion.div>
                    )}
                </div>

                {error && (
                    <GlassCard className="p-6 mb-6 border-red-500/30 bg-red-900/20">
                        <p className="text-red-200 text-sm">{error}</p>
                    </GlassCard>
                )}

                {step !== 'SUCCESS' && step !== 'ALREADY_PAID' && (
                    <div className="flex justify-center gap-2 mb-8">
                        {steps.map((s) => (
                            <div
                                key={s.key}
                                className={`text-xs px-3 py-1 rounded-full border ${
                                    step === s.key
                                        ? 'border-neon-primary text-neon-primary bg-neon-primary/10'
                                        : 'border-white/10 text-gray-500'
                                }`}
                            >
                                {s.label}
                            </div>
                        ))}
                    </div>
                )}

                <GlassCard variant="heavy" className="p-8">
                    {step === 'CONNECT' && (
                        <div className="text-center space-y-6">
                            <p className="text-gray-400">
                                Connect a privacy-enabled Starknet wallet (Ready) to pay via STRK20.
                            </p>
                            <ConnectButton className="w-full" />
                        </div>
                    )}

                    {(step === 'VERIFY' || step === 'PAY') && invoice && (
                        <div className="space-y-6">
                            {!isConnected && (
                                <ConnectButton className="w-full" />
                            )}

                            {isWrongChain && (
                                <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-4 text-yellow-200 text-sm space-y-3">
                                    <p>Switch your wallet to Starknet Sepolia or Mainnet to use STRK20.</p>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="text-xs"
                                            onClick={() => switchNetwork('sepolia')}
                                        >
                                            Switch to Sepolia
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="text-xs"
                                            onClick={() => switchNetwork('mainnet')}
                                        >
                                            Switch to Mainnet
                                        </Button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {isDonation ? (
                                    <Input
                                        label={`Donation Amount (${tokenName})`}
                                        type="number"
                                        value={donationAmount}
                                        onChange={(e) => setDonationAmount(e.target.value)}
                                        placeholder="Enter amount"
                                    />
                                ) : (
                                    <div className="flex justify-between items-center py-3 border-b border-white/10">
                                        <span className="text-gray-400">Amount</span>
                                        <span className="text-2xl font-bold text-white">
                                            {invoice.amount} {tokenName}
                                        </span>
                                    </div>
                                )}

                                {invoice.memo && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-gray-500 text-sm">Memo</span>
                                        <span className="text-gray-300 text-sm">{invoice.memo}</span>
                                    </div>
                                )}

                                {isMultiPay && (
                                    <p className="text-xs text-gray-500">Multi-pay invoice — multiple contributors allowed.</p>
                                )}
                            </div>

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
                                glow
                            >
                                {isProcess ? 'Processing...' : `Pay ${tokenName} Privately`}
                            </Button>
                        </div>
                    )}

                    {step === 'SUCCESS' && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-gray-300">{status}</p>
                            {txId && (
                                <a
                                    href={getTxExplorerUrl(txId)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline text-sm break-all"
                                >
                                    View on Voyager ↗
                                </a>
                            )}
                        </div>
                    )}

                    {step === 'ALREADY_PAID' && (
                        <div className="text-center space-y-4">
                            <p className="text-gray-400">This invoice has already been settled.</p>
                        </div>
                    )}
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default PaymentPage;
