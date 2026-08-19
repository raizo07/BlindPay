import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const Verification = () => {
    const [salt, setSalt] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'CHECKING' | 'VALID' | 'INVALID'>('IDLE');

    const handleVerify = async () => {
        if (!salt) return;
        setStatus('CHECKING');

        try {
            const res = await fetch(`${API_URL}/invoice/${salt}`);
            if (!res.ok) {
                setStatus('INVALID');
                return;
            }
            const data = await res.json();
            setStatus(data.status === 'SETTLED' ? 'VALID' : 'INVALID');
        } catch {
            setStatus('INVALID');
        }
    };

    return (
        <div className="page-container relative min-h-screen flex items-center justify-center p-6">
            <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-float" />
                <div className="absolute bottom-[-10%] right-[20%] w-[35%] h-[35%] bg-blue-600/20 rounded-full blur-[120px] animate-float-delayed" />
            </div>

            <GlassCard className="w-full max-w-md p-8 relative z-10 flex flex-col gap-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Payment</h1>
                    <p className="text-gray-400 text-sm">
                        Check invoice settlement status via the BlindPay indexer.
                    </p>
                </div>

                <div>
                    <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">Invoice Salt</label>
                    <Input
                        value={salt}
                        onChange={(e) => { setSalt(e.target.value); setStatus('IDLE'); }}
                        placeholder="0x..."
                        className="bg-black/40 border-white/10 focus:border-violet-500 font-mono text-sm"
                    />
                </div>

                <Button
                    variant="primary"
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold"
                    onClick={handleVerify}
                    disabled={status === 'CHECKING' || !salt}
                >
                    {status === 'CHECKING' ? 'Checking...' : 'Verify Invoice'}
                </Button>

                {status === 'VALID' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-4 text-center">
                        <span className="text-emerald-400 font-bold">Payment Verified</span>
                        <p className="text-xs text-gray-300 mt-1">This invoice has been settled via STRK20 escrow.</p>
                    </motion.div>
                )}

                {status === 'INVALID' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
                        <span className="text-red-400 font-bold">Not Settled</span>
                        <p className="text-xs text-gray-300 mt-1">No settled payment found for this invoice salt.</p>
                    </motion.div>
                )}
            </GlassCard>
        </div>
    );
};

export default Verification;
