import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { Shimmer } from '../ui/Shimmer';
import { useStrk20 } from '../../hooks/useStrk20';
import { useWallet } from '../../hooks/useWallet';
import { tokenNames } from '../../utils/starknet-config';

type ShieldedBalance = {
    token?: string | number;
    token_address?: string;
    balance?: string | number;
    amount?: string | number;
};

function formatBalance(raw: string | number | undefined): string {
    if (raw === undefined || raw === null) return '—';
    const n = typeof raw === 'string' ? Number(raw) : raw;
    if (!Number.isFinite(n)) return String(raw);
    if (n === 0) return '0';
    const abs = Math.abs(n);
    if (abs >= 1e6) return (n / 1e6).toFixed(2);
    if (abs >= 1e3) return (n / 1e3).toFixed(2);
    return n.toString();
}

function balanceLabel(entry: ShieldedBalance): string {
    if (entry.token !== undefined && tokenNames[Number(entry.token)]) {
        return tokenNames[Number(entry.token)];
    }
    if (entry.token_address) {
        return `${entry.token_address.slice(0, 6)}…${entry.token_address.slice(-4)}`;
    }
    return 'Token';
}

interface ShieldedBalancesProps {
    itemVariants: any;
}

export const ShieldedBalances: React.FC<ShieldedBalancesProps> = ({ itemVariants }) => {
    const { address } = useWallet();
    const { getShieldedBalances } = useStrk20();
    const [balances, setBalances] = useState<ShieldedBalance[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!address) {
            setBalances([]);
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const result = await getShieldedBalances();
            if (!cancelled) {
                setBalances(result as ShieldedBalance[]);
                setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [address, getShieldedBalances]);

    return (
        <motion.div variants={itemVariants}>
            <GlassCard className="p-8 mb-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">
                            STRK20 Shielded Balances
                        </span>
                        <p className="text-sm text-gray-500 max-w-xl">
                            Private notes in your Ready wallet after claims and pool deposits. Amounts are decrypted locally via the Privacy Wallet API.
                        </p>
                    </div>
                    {!address && (
                        <span className="text-xs text-gray-500 italic">Connect wallet to view</span>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <Shimmer key={i} className="h-16 bg-white/5 rounded-lg" />
                        ))}
                    </div>
                ) : balances.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                        {address ? 'No shielded notes yet — claim an invoice payment to fund this balance.' : '—'}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {balances.map((entry, idx) => (
                            <div
                                key={`${balanceLabel(entry)}-${idx}`}
                                className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                            >
                                <span className="text-xs uppercase tracking-wider text-gray-400">{balanceLabel(entry)}</span>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {formatBalance(entry.balance ?? entry.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </GlassCard>
        </motion.div>
    );
};
