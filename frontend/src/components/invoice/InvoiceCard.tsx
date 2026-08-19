import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { InvoiceData } from '../../types/invoice';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';

interface InvoiceCardProps {
    invoiceData: InvoiceData;
    resetInvoice: () => void;
    memo: string;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({
    invoiceData,
    resetInvoice
}) => {

    const [copied, setCopied] = React.useState(false);
    const [copiedSecret, setCopiedSecret] = React.useState(false);
    const [copiedSalt, setCopiedSalt] = React.useState(false);

    const paymentLink = invoiceData.paymentUrl || invoiceData.link || '';

    const handleCopy = () => {
        navigator.clipboard.writeText(paymentLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <GlassCard className="text-center p-8 bg-gradient-to-b from-glass-surface to-black/40">
            <h3 className="mb-6 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-primary to-neon-accent animate-pulse-glow">
                Invoice Ready!
            </h3>

            <div className="flex justify-center mb-8">
                <div className="p-4 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                    <QRCodeSVG
                        value={paymentLink}
                        size={180}
                        level="H"
                        includeMargin={false}
                    />
                </div>
            </div>

            {/* CLAIM SECRET - Critical for merchant to claim funds */}
            <div className="mb-6 p-4 rounded-xl border-2 border-amber-500/50 bg-amber-500/10">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.072 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Save Your Claim Secret</span>
                </div>
                <p className="text-amber-200/70 text-xs mb-3">
                    You need this secret to withdraw funds after payment. Store it safely — it cannot be recovered!
                </p>
                <div
                    onClick={() => {
                        navigator.clipboard.writeText(invoiceData.claimSecret);
                        setCopiedSecret(true);
                        setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-amber-500/30 hover:border-amber-500/60 cursor-pointer transition-colors group"
                >
                    <span className="font-mono text-amber-300 text-xs truncate flex-1 mr-2">
                        {invoiceData.claimSecret}
                    </span>
                    {copiedSecret ? (
                        <span className="text-[10px] text-amber-400 font-bold whitespace-nowrap">Copied!</span>
                    ) : (
                        <svg className="w-4 h-4 text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="mb-8">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 text-left ml-1">Payment Link</label>
                <div className="flex gap-2">
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-gray-300 truncate">
                        {paymentLink}
                    </div>
                    <Button
                        variant={copied ? "primary" : "secondary"}
                        size="md"
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4 text-left">
                <div
                    onClick={() => {
                        navigator.clipboard.writeText(invoiceData.salt);
                        setCopiedSalt(true);
                        setTimeout(() => setCopiedSalt(false), 2000);
                    }}
                    className="p-4 rounded-xl border border-white/5 bg-black/30 hover:border-purple-500/30 transition-colors group cursor-pointer active:scale-95"
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Salt</span>
                        {copiedSalt ? (
                            <span className="text-[10px] text-purple-400 font-bold">Copied!</span>
                        ) : (
                            <svg className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>
                    <span className="font-mono text-purple-400 truncate block text-xs group-hover:text-purple-300 transition-colors" title={invoiceData.salt}>
                        {invoiceData.salt.slice(0, 8)}...{invoiceData.salt.slice(-4)}
                    </span>
                </div>
            </div>

            <p className="text-gray-500 text-xs text-center mb-8">
                You can verify this transaction in our <span className="text-neon-primary hover:underline cursor-pointer">Explorer</span> using these credentials.
            </p>

            <Button
                variant="outline"
                className="w-full"
                onClick={resetInvoice}
            >
                Create Another Invoice
            </Button>
        </GlassCard>
    );
};
