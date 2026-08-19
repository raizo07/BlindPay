import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { InvoiceType, LineItem } from '../../hooks/useCreateInvoice';
import { tokenNames } from '../../utils/starknet-config';
import { Plus, Trash2 } from 'lucide-react';

interface InvoiceFormProps {
    amount: number | '';
    setAmount: (val: number | '') => void;
    memo: string;
    setMemo: (val: string) => void;
    handleCreate: () => void;
    loading: boolean;
    publicKey: string | null;
    status: string;
    invoiceType: InvoiceType;
    setInvoiceType: (val: InvoiceType) => void;
    tokenType: number;
    setTokenType: (val: number) => void;
    lineItems: LineItem[];
    addLineItem: () => void;
    updateLineItem: (index: number, field: keyof LineItem, value: string | number) => void;
    removeLineItem: (index: number) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
    amount,
    setAmount,
    memo,
    setMemo,
    handleCreate,
    loading,
    publicKey,
    status,
    invoiceType,
    setInvoiceType,
    tokenType,
    setTokenType,
    lineItems,
    addLineItem,
    updateLineItem,
    removeLineItem,
}) => {
    const hasLineItems = lineItems.length > 0;

    return (
        <GlassCard variant="heavy" className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Invoice Details</h2>

            <div className="space-y-6">

                {/* CURRENCY TOGGLE */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Currency</label>
                    <div className="p-1 bg-black/20 rounded-xl flex gap-1 border border-white/5">
                        {[0, 1].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTokenType(t)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${tokenType === t
                                    ? 'bg-white text-black shadow-lg'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tokenNames[t]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* INVOICE TYPE TOGGLE */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice Type</label>
                    <div className="p-1 bg-black/20 rounded-xl flex gap-1 border border-white/5">
                        <button
                            onClick={() => setInvoiceType('standard')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${invoiceType === 'standard'
                                ? 'bg-neon-primary text-black shadow-lg shadow-neon-primary/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Standard
                        </button>
                        <button
                            onClick={() => setInvoiceType('multipay')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${invoiceType === 'multipay'
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Multi Pay
                        </button>
                        <button
                            onClick={() => setInvoiceType('donation')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${invoiceType === 'donation'
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            Donation
                        </button>
                    </div>
                </div>

                <div className="text-xs text-gray-400 text-center -mt-2 mb-4 bg-white/5 p-3 rounded-lg border border-white/5">
                    {invoiceType === 'standard' && 'Single payment only. Invoice closes after payment.'}
                    {invoiceType === 'multipay' && 'Allows multiple payments. Ideal for campaigns.'}
                    {invoiceType === 'donation' && (
                        <span>
                            <strong className="text-white block mb-1">Donation Mode</strong>
                            Used by NGOs, fundraising platforms, developers, and for crowd funding where payer and receiver info stays private via STRK20 shielded notes and escrow commitments.
                        </span>
                    )}
                </div>

                {/* LINE ITEMS */}
                {invoiceType !== 'donation' && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Items
                            </label>
                            <button
                                onClick={addLineItem}
                                className="flex items-center gap-1.5 text-xs font-medium text-neon-primary hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                            >
                                <Plus size={14} />
                                Add Item
                            </button>
                        </div>

                        {lineItems.length > 0 && (
                            <div className="space-y-3 mb-4">
                                {/* Header */}
                                <div className="grid grid-cols-[1fr_60px_90px_32px] gap-2 px-1">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Description</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Qty</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Price</span>
                                    <span></span>
                                </div>

                                {lineItems.map((item, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_60px_90px_32px] gap-2 items-center bg-white/[0.02] border border-white/5 rounded-xl p-2">
                                        <input
                                            type="text"
                                            placeholder="Item name"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                                            className="bg-transparent border-0 text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-0 w-full"
                                        />
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                                            className="bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center py-1 w-full focus:outline-none focus:border-white/30"
                                        />
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={item.unitPrice || ''}
                                            onChange={(e) => updateLineItem(i, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            className="bg-white/5 border border-white/10 rounded-lg text-white text-sm text-right py-1 px-2 w-full focus:outline-none focus:border-white/30"
                                        />
                                        <button
                                            onClick={() => removeLineItem(i)}
                                            className="flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                {/* Subtotal */}
                                <div className="flex justify-between items-center pt-3 border-t border-white/5 px-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                                    <span className="text-lg font-bold text-white">
                                        {lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                                        <span className="text-xs text-gray-500 ml-1 font-normal">{tokenNames[tokenType]}</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Amount field — editable manually if no line items, read-only if items exist */}
                        <Input
                            label={`${hasLineItems ? 'Total ' : ''}Amount (${tokenNames[tokenType] || 'ETH'})`}
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => {
                                if (!hasLineItems) {
                                    setAmount(e.target.value === '' ? '' : Number(e.target.value));
                                }
                            }}
                            disabled={hasLineItems}
                        />
                        {hasLineItems && (
                            <p className="text-[10px] text-gray-500 -mt-4">Auto-calculated from line items above</p>
                        )}
                    </div>
                )}

                <Input
                    label="Memo (Optional)"
                    type="text"
                    placeholder={invoiceType === 'donation' ? "e.g., Save the Whales Campaign" : "e.g., Dinner Bill"}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                />

                <Button
                    variant="primary"
                    className="w-full mt-4"
                    onClick={handleCreate}
                    disabled={loading || !publicKey}
                    glow={!loading && !!publicKey}
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Creating...
                        </span>
                    ) : !publicKey ? (
                        'Connect Wallet to Continue'
                    ) : (
                        invoiceType === 'standard' ? 'Generate Invoice Link' :
                            invoiceType === 'multipay' ? 'Create Multi Pay Link' :
                                'Create Donation Link'
                    )}
                </Button>

                {status && (
                    <div className={`p-4 rounded-xl text-center text-sm font-medium border ${status.includes('Error')
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-neon-primary/10 border-neon-primary/20 text-neon-primary'
                        }`}>
                        {status}
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
