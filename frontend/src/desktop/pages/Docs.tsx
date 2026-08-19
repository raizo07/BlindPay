import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { pageVariants, staggerContainer, fadeInUp } from '../../utils/animations';

const Docs = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const containerVariants = staggerContainer;
    const itemVariants = fadeInUp;

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'architecture', label: 'Architecture' },
        { id: 'flows', label: 'Flows' },
        { id: 'setup', label: 'Setup' },
    ];

    return (
        <motion.div
            className="page-container relative min-h-screen"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <div className="fixed inset-0 pointer-events-none z-0 opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[120px] animate-float" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-zinc-800/20 rounded-full blur-[100px] animate-float-delayed" />
                <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-white/5 rounded-full blur-[120px] animate-pulse-slow" />
            </div>
            <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-screen h-[800px] z-0 pointer-events-none flex justify-center overflow-hidden">
                <div className="w-full h-full bg-gradient-radial from-neon-primary/8 via-transparent to-transparent opacity-60" />
            </div>
            <motion.div
                initial="hidden"
                animate="show"
                variants={containerVariants}
                className="w-full max-w-7xl mx-auto pt-12 pb-20 px-6 relative z-10"
            >
                <motion.div variants={itemVariants} className="text-center mb-12 border-b border-white/10 pb-10 flex flex-col items-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tighter leading-tight text-white">
                        Technical <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">Documentation</span>
                    </h1>
                    <p className="text-gray-300 text-lg md:text-xl max-w-3xl leading-relaxed">
                        BlindPay on Starknet — private invoices and payments via STRK20 shielded notes, escrow commitments, and STARK proofs.
                    </p>
                </motion.div>

                <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4 mb-12 sticky top-24 z-50 bg-black/50 backdrop-blur-xl p-4 rounded-full border border-white/5 max-w-4xl mx-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white text-black shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </motion.div>

                <div className="min-h-[600px]">

                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-6">What is BlindPay?</h2>
                                <p className="text-gray-400 mb-8 leading-relaxed">
                                    BlindPay is a confidential payment protocol on <strong className="text-white">Starknet</strong> built on{' '}
                                    <a href="https://strk20.starknet.io/docs" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">STRK20</a>.
                                    Merchants create invoices; payers deposit into an escrow helper via the privacy pool. Amounts and counterparties stay shielded until the merchant claims with their secret commitment.
                                </p>

                                <h3 className="text-xl font-bold text-neon-primary mb-4">Key Concepts</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Shielded Notes</h4>
                                        <p className="text-sm text-gray-400">
                                            STRK20 transfers produce shielded notes in the privacy pool. On-chain observers see pool activity, not payer, payee, or amount.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Escrow Commitments</h4>
                                        <p className="text-sm text-gray-400">
                                            The escrow helper holds funds against a Poseidon commitment derived from a client-generated secret. Only the holder can claim.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">STARK Proofs</h4>
                                        <p className="text-sm text-gray-400">
                                            Claims and transfers are validated by STARK proofs via the Privacy Wallet API — no plaintext amounts on-chain.
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                        <h4 className="text-white font-bold mb-2">Blind Indexer</h4>
                                        <p className="text-sm text-gray-400">
                                            The backend indexes invoice metadata only. Amounts and memos are never stored; merchant addresses are AES-256 encrypted at rest.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-white/10">
                                    <h4 className="text-white font-bold mb-3">Further Reading</h4>
                                    <ul className="space-y-2 text-sm">
                                        <li>
                                            <a href="https://strk20.starknet.io/docs" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">
                                                STRK20 Official Documentation
                                            </a>
                                        </li>
                                        <li>
                                            <a href="https://github.com/Akashneelesh/awesome-strk20" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">
                                                Awesome STRK20 — ecosystem resources
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {activeTab === 'architecture' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-6">System Architecture</h2>

                                <div className="space-y-10">
                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">Frontend (React + starknet.js)</h3>
                                        <p className="text-gray-400 text-sm mb-3">
                                            The client connects via a <strong className="text-white">Ready</strong> wallet, generates salts and claim secrets, computes escrow commitments, and calls the STRK20 Privacy Wallet API for shielded transfers and proofs.
                                        </p>
                                        <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                                            <li>Invoice creation and payment link generation</li>
                                            <li>Escrow deposit via privacy pool</li>
                                            <li>Merchant claim with secret + STARK proof</li>
                                        </ul>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">STRK20 Escrow Contract</h3>
                                        <p className="text-gray-400 text-sm mb-3">
                                            On-chain escrow helper on Starknet Sepolia. Accepts shielded deposits bound to commitment hashes and releases funds to merchants who present valid proofs.
                                        </p>
                                        <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                                            <li>Commitment: <code className="text-neon-primary">poseidon(ESCROW_COMMITMENT_TAG, secret)</code></li>
                                            <li>Supports STRK and USDC via the privacy pool</li>
                                            <li>Emits receipt hashes for off-chain verification</li>
                                        </ul>
                                    </div>

                                    <div className="relative pl-8 border-l-2 border-neon-primary/30">
                                        <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-neon-primary border-4 border-black" />
                                        <h3 className="text-xl font-bold text-white mb-2">Backend Indexer (Node.js + Supabase)</h3>
                                        <p className="text-gray-400 text-sm mb-3">
                                            Indexes invoice records for fast lookup. Does not store amounts or memos. Merchant addresses encrypted with AES-256.
                                        </p>
                                        <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                                            <li><code className="text-neon-primary">POST /api/invoices</code> — register invoice metadata</li>
                                            <li><code className="text-neon-primary">GET /api/invoices/merchant/:address</code> — merchant dashboard</li>
                                            <li><code className="text-neon-primary">PATCH /api/invoices/:hash</code> — update status after payment</li>
                                        </ul>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {activeTab === 'flows' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-8">Protocol Flows</h2>

                                <div className="space-y-10">
                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-3">1. Invoice Creation</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Merchant sets amount, token (STRK or USDC), and invoice type (Standard, Multi Pay, Donation).</li>
                                            <li>Client generates a random <code className="text-pink-400">salt</code> and a <code className="text-pink-400">claimSecret</code>.</li>
                                            <li>Escrow commitment is computed: <code>poseidon(ESCROW_COMMITMENT_TAG, claimSecret)</code>.</li>
                                            <li>Invoice metadata is stored in the backend indexer (no amount or memo persisted).</li>
                                            <li>Payment link is shared containing salt, amount, token, and merchant address.</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-3">2. Payment (Escrow Deposit)</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Payer opens the payment link and connects a Ready wallet on Starknet Sepolia.</li>
                                            <li>Client verifies invoice parameters against on-chain / indexed state.</li>
                                            <li>Payer shields tokens into the STRK20 privacy pool and deposits to escrow via the Privacy Wallet API.</li>
                                            <li>A <code className="text-pink-400">receipt_hash</code> is derived from the payment secret and salt for off-chain proof.</li>
                                            <li>Backend status updated to SETTLED (Standard) or remains open (Multi Pay / Donation).</li>
                                        </ol>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-neon-primary mb-3">3. Claim (Merchant)</h3>
                                        <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-2">
                                            <li>Merchant uses their stored <code className="text-pink-400">claimSecret</code> to generate a STARK proof.</li>
                                            <li>Escrow contract validates the commitment and releases shielded funds to the merchant.</li>
                                            <li>Merchant decrypts the received note via the Privacy Wallet API.</li>
                                            <li>Receipt hash can be shared with payers for mutual verification.</li>
                                        </ol>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )}

                    {activeTab === 'setup' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                            <GlassCard className="p-10">
                                <h2 className="text-3xl font-bold text-white mb-6">Setup & Requirements</h2>

                                <h3 className="text-xl font-bold text-neon-primary mb-4">Wallet</h3>
                                <p className="text-gray-400 text-sm mb-6">
                                    BlindPay requires a <strong className="text-white">Ready</strong> wallet connected to <strong className="text-white">Starknet Sepolia</strong>.
                                    Ready provides STRK20 Privacy Wallet API access for shielded transfers, proof generation, and note decryption.
                                </p>

                                <h3 className="text-xl font-bold text-neon-primary mb-4">Environment Variables</h3>
                                <div className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-gray-300 space-y-1 mb-8">
                                    <div><span className="text-gray-500"># Backend</span></div>
                                    <div>VITE_API_URL=http://localhost:3000/api</div>
                                    <div className="mt-3"><span className="text-gray-500"># Starknet RPC</span></div>
                                    <div>VITE_ALCHEMY_API_KEY=your-alchemy-api-key</div>
                                    <div className="mt-3"><span className="text-gray-500"># STRK20 contracts (Starknet Sepolia)</span></div>
                                    <div>VITE_STRK20_ESCROW_ADDRESS=0x...</div>
                                    <div>VITE_STRK20_POOL_ADDRESS=0x...</div>
                                    <div className="mt-3"><span className="text-gray-500"># Token addresses</span></div>
                                    <div>VITE_USDC_ADDRESS=0x...</div>
                                    <div>VITE_STRK_ADDRESS=0x...</div>
                                </div>

                                <h3 className="text-xl font-bold text-neon-primary mb-4">Resources</h3>
                                <ul className="space-y-3 text-sm text-gray-400">
                                    <li>
                                        <a href="https://strk20.starknet.io/docs" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">
                                            strk20.starknet.io/docs
                                        </a>
                                        {' '}— protocol specification and Privacy Wallet API
                                    </li>
                                    <li>
                                        <a href="https://github.com/Akashneelesh/awesome-strk20" target="_blank" rel="noopener noreferrer" className="text-neon-primary hover:underline">
                                            github.com/Akashneelesh/awesome-strk20
                                        </a>
                                        {' '}— curated STRK20 ecosystem links
                                    </li>
                                </ul>
                            </GlassCard>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default Docs;
