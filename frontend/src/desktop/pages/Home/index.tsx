import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Lock, Globe, Server, Eye, EyeOff, FileText, Layers, Coins, KeyRound } from 'lucide-react';
import { FlashlightEffect } from './components/FlashlightEffect';

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } }
};

const scaleIn = {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } }
};

const Home = () => {
    return (
        <FlashlightEffect>
            <div className="min-h-screen bg-black text-white relative font-sans w-full overflow-x-hidden">

                <main className="relative z-10 w-full overflow-hidden">

                    {/* ═══════════════════════════════════════════ */}
                    {/* HERO SECTION                                */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="relative min-h-[85vh] flex items-center overflow-hidden">

                        {/* Animated background orbs */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-[120px] animate-float" />
                            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[100px] animate-float-delayed" />
                            <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[80px] animate-pulse-slow" />
                        </div>

                        <div className="relative z-10 w-full px-6 md:px-12 lg:px-24 pt-20">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">
                                {/* Left column — Hero text */}
                                <motion.div
                                    variants={staggerContainer}
                                    initial="hidden"
                                    animate="show"
                                    className="flex flex-col space-y-6 text-center lg:text-left max-w-xl shrink-0"
                                >
                                    <div className="relative">
                                        <motion.h1
                                            variants={fadeInUp}
                                            className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05] relative z-10"
                                        >
                                            Pay Privately.<br />
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-600">
                                                Encrypt the{' '}
                                            </span>
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/60 to-white/10">
                                                Truth.
                                            </span>
                                        </motion.h1>

                                        <svg viewBox="0 0 500 50" fill="none" xmlns="http://www.w3.org/2000/svg"
                                            className="absolute bottom-[-20px] left-0 w-[90%] h-auto z-0 pointer-events-none"
                                        >
                                            <defs>
                                                <linearGradient id="curve-grad" x1="0" y1="0" x2="500" y2="0" gradientUnits="userSpaceOnUse">
                                                    <stop offset="0%" stopColor="white" stopOpacity="0.7" />
                                                    <stop offset="50%" stopColor="white" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            <path d="M 0 40 Q 250 0 500 40" stroke="url(#curve-grad)" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                    </div>

                                    <motion.p
                                        variants={fadeInUp}
                                        className="text-lg md:text-xl text-gray-400 max-w-lg font-light leading-relaxed"
                                    >
                                        BlindPay is a confidential payment protocol on Starknet powered by STRK20 shielded notes and an escrow helper.
                                        Create, send, and settle invoices without exposing amounts, addresses, or transaction details on-chain.
                                    </motion.p>

                                    <motion.div
                                        variants={fadeInUp}
                                        className="flex flex-col sm:flex-row gap-5 pt-4 w-full sm:w-auto justify-center lg:justify-start"
                                    >
                                        <Link to="/explorer" className="group flex items-center justify-center gap-3 px-8 py-5 rounded-full bg-white text-black hover:bg-gray-100 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] w-full sm:w-auto">
                                            <span className="font-bold text-lg">Get Started</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>

                                        <Link to="/docs" className="group flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 backdrop-blur-md">
                                            <span className="font-semibold text-lg text-gray-300 group-hover:text-white transition-colors">Documentation</span>
                                        </Link>
                                    </motion.div>
                                </motion.div>

                                {/* Right column — Dashboard Snapshot */}
                                <motion.div
                                    initial={{ opacity: 0, x: 60, scale: 0.97 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{ duration: 1.1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="hidden lg:block flex-1 min-w-0 pointer-events-none select-none"
                                    style={{
                                        maskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%), linear-gradient(to bottom, black 70%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to right, black 0%, black 50%, transparent 100%), linear-gradient(to bottom, black 70%, transparent 100%)',
                                        maskComposite: 'intersect',
                                        WebkitMaskComposite: 'source-in' as any,
                                    }}
                                >
                                    {/* Dashboard card */}
                                    <div className="relative rounded-2xl border border-white/[0.10] bg-white/[0.03] backdrop-blur-md p-6 space-y-5 shadow-[0_8px_60px_rgba(0,0,0,0.4)]">
                                        {/* Header */}
                                        <div className="text-center pb-1">
                                            <h3 className="text-xl font-bold text-white tracking-tight">
                                                Merchant Dashboard
                                            </h3>
                                            <p className="text-[10px] text-gray-500 mt-1">Manage your invoices and settlements</p>
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-4 gap-3">
                                            {[
                                                { label: 'Volume', value: 'Encrypted', color: 'text-white', size: 'text-base' },
                                                { label: 'Invoices', value: '12', color: 'text-white', size: 'text-2xl' },
                                                { label: 'Pending', value: '3', color: 'text-gray-300', size: 'text-2xl' },
                                                { label: 'Settled', value: '9', color: 'text-white', size: 'text-2xl' },
                                            ].map((stat, i) => (
                                                <div key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3.5">
                                                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block mb-1">{stat.label}</span>
                                                    <span className={`${stat.size} font-bold ${stat.color}`}>{stat.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tabs */}
                                        <div className="flex justify-center">
                                            <div className="flex p-0.5 bg-black/50 rounded-full border border-white/[0.08]">
                                                <span className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white text-black rounded-full">My Invoices</span>
                                                <span className="px-5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">Paid</span>
                                            </div>
                                        </div>

                                        {/* Invoice table */}
                                        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                                            <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
                                                {['Hash', 'Type', 'Token', 'Status', 'Action'].map(h => (
                                                    <span key={h} className="text-[10px] font-bold text-gray-500 uppercase">{h}</span>
                                                ))}
                                            </div>
                                            {[
                                                { hash: '0xa3f1...8d2c', type: 'Standard', token: 'STRK', status: 'SETTLED', sc: 'text-gray-300 bg-white/[0.06] border border-white/[0.08]' },
                                                { hash: '0x7b2e...1f4a', type: 'Multi Pay', token: 'USDC', status: 'PENDING', sc: 'text-gray-400 bg-white/[0.04] border border-white/[0.06]' },
                                                { hash: '0xd9c4...6e8b', type: 'Donation', token: 'STRK', status: 'SETTLED', sc: 'text-gray-300 bg-white/[0.06] border border-white/[0.08]' },
                                                { hash: '0x1e5f...3a7d', type: 'Standard', token: 'USDC', status: 'SETTLED', sc: 'text-gray-300 bg-white/[0.06] border border-white/[0.08]' },
                                                { hash: '0x8c2a...9b1e', type: 'Standard', token: 'STRK', status: 'PENDING', sc: 'text-gray-400 bg-white/[0.04] border border-white/[0.06]' },
                                            ].map((row, i) => (
                                                <div key={i} className="grid grid-cols-5 gap-2 px-4 py-3 border-b border-white/[0.04] items-center">
                                                    <span className="text-[11px] font-mono text-gray-400">{row.hash}</span>
                                                    <span className="text-[11px] text-gray-400">{row.type}</span>
                                                    <span className="text-[11px] text-gray-400">{row.token}</span>
                                                    <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full w-fit ${row.sc}`}>{row.status}</span>
                                                    <span className="text-[10px] text-gray-600">View</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Footer */}
                                        <div className="text-center text-[9px] text-gray-600 italic">
                                            All data shielded via STRK20 privacy pool
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* THE PROBLEM                                 */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="pt-24 pb-20 px-6 md:px-12 lg:px-24">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-5xl mx-auto"
                        >
                            <div className="text-center mb-10">
                                <span className="text-[11px] uppercase tracking-[0.25em] text-gray-500 font-semibold">The Problem</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">Public Ledgers Expose You</h2>
                                <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">Every transaction on a public blockchain reveals your wallet balance, transaction history, and financial habits to anyone you interact with.</p>
                            </div>

                            {/* Scrolling exposure examples */}
                            <div className="relative overflow-hidden py-6">
                                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
                                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
                                <motion.div
                                    animate={{ x: ["0%", "-50%"] }}
                                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                    className="flex gap-4 w-max"
                                >
                                    {[
                                        "\"I can see your entire wallet balance just from your ENS name\"",
                                        "\"My employer traced all my DeFi activity after one payroll tx\"",
                                        "\"Anyone I pay can see every transaction I've ever made\"",
                                        "\"Starkscan makes everyone's finances a public record\"",
                                        "\"I sent a payment and the recipient could see I held $200k\"",
                                        "\"Blockchain analytics firms sell your transaction patterns\"",
                                        "\"I can see your entire wallet balance just from your ENS name\"",
                                        "\"My employer traced all my DeFi activity after one payroll tx\"",
                                        "\"Anyone I pay can see every transaction I've ever made\"",
                                        "\"Starkscan makes everyone's finances a public record\"",
                                        "\"I sent a payment and the recipient could see I held $200k\"",
                                        "\"Blockchain analytics firms sell your transaction patterns\"",
                                    ].map((text, i) => (
                                        <div key={i} className="flex-shrink-0 px-6 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-gray-400 italic max-w-xs">
                                            {text}
                                        </div>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* WHAT IS BLINDPAY                            */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/[0.06]">
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-100px" }}
                            className="max-w-7xl mx-auto"
                        >
                            <motion.div variants={fadeInUp} className="text-center mb-16">
                                <span className="text-[11px] uppercase tracking-[0.25em] text-gray-500 font-semibold">The Solution</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">What is BlindPay?</h2>
                                <p className="text-gray-400 text-lg mt-4 max-w-3xl mx-auto leading-relaxed">
                                    BlindPay is a confidential invoice and payment protocol on Starknet using STRK20 shielded notes and escrow commitments.
                                    Create invoices, collect payments and settle transactions, all without revealing who paid whom, or how much.
                                </p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {[
                                    {
                                        icon: Shield,
                                        title: "Shielded Invoices",
                                        desc: "Invoice amounts and merchant commitments are bound to escrow hashes on-chain. Sensitive values stay in the STRK20 privacy pool, never visible as plaintext transfers.",
                                    },
                                    {
                                        icon: EyeOff,
                                        title: "Confidential Payments",
                                        desc: "Payers shield tokens into the privacy pool and deposit to escrow via STARK proofs. Amounts and counterparties are hidden from public chain analysis.",
                                    },
                                    {
                                        icon: Layers,
                                        title: "On-Chain Receipts",
                                        desc: "Every payment generates a unique receipt hash. Both parties get verifiable proof of payment without public exposure of addresses or amounts.",
                                    },
                                    {
                                        icon: Coins,
                                        title: "Multi-Token Support",
                                        desc: "Pay with STRK or USDC with full privacy guarantees. Merchants choose which assets to accept. Funds are held in escrow until claimed via commitment.",
                                    },
                                    {
                                        icon: FileText,
                                        title: "Flexible Invoice Types",
                                        desc: "Standard invoices for one-time payments, Multi-Pay invoices for crowdfunding campaigns, and Donation invoices with open-ended amounts.",
                                    },
                                    {
                                        icon: KeyRound,
                                        title: "Blind Database",
                                        desc: "Off-chain metadata encrypted with AES-256-GCM. We don't store amounts or memos. Even if the database were compromised, your financial data stays safe.",
                                    },
                                ].map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        variants={scaleIn}
                                        className="p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.05] hover:border-white/[0.12] transition-all duration-500 group"
                                    >
                                        <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center mb-5 border border-white/[0.08] group-hover:border-white/20 group-hover:bg-white/[0.1] transition-all duration-300">
                                            <feature.icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-2.5 text-white group-hover:text-white transition-colors">{feature.title}</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">{feature.desc}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* MOBILE EXPERIENCE                           */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/[0.06] bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="max-w-6xl mx-auto"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                                {/* Left: Phone Mockup */}
                                <div className="order-2 lg:order-1 flex justify-center lg:justify-start relative">
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                                    <motion.div
                                        animate={{ y: [0, -15, 0], rotate: [0, 1, 0] }}
                                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                        className="relative z-0"
                                    >
                                        {/* Stylized phone frame */}
                                        <div className="w-[280px] h-[560px] rounded-[40px] border-2 border-white/[0.12] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-3 shadow-[0_20px_50px_rgba(255,255,255,0.05)]">
                                            <div className="w-full h-full rounded-[32px] bg-black/80 border border-white/[0.06] overflow-hidden flex flex-col">
                                                {/* Status bar */}
                                                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                                                    <span className="text-[10px] text-gray-500 font-medium">9:41</span>
                                                    <div className="w-20 h-5 rounded-full bg-white/[0.06]" />
                                                    <div className="flex gap-1">
                                                        <div className="w-4 h-2 rounded-sm bg-white/20" />
                                                    </div>
                                                </div>
                                                {/* App content mockup */}
                                                <div className="flex-1 px-4 pt-4 space-y-3">
                                                    <div className="text-center">
                                                        <div className="text-xs font-bold text-white/80">BlindPay</div>
                                                        <div className="text-[9px] text-gray-600 mt-0.5">Shielded Finance</div>
                                                    </div>
                                                    <div className="h-8 rounded-lg bg-white/[0.04] border border-white/[0.06]" />
                                                    <div className="space-y-2 pt-2">
                                                        <div className="h-3 rounded bg-white/[0.06] w-3/4" />
                                                        <div className="h-3 rounded bg-white/[0.04] w-1/2" />
                                                    </div>
                                                    <div className="h-20 rounded-xl bg-white/[0.03] border border-white/[0.06] mt-4" />
                                                    <div className="h-10 rounded-xl bg-white/90 mt-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Right: Text Content */}
                                <div className="order-1 lg:order-2 space-y-8">
                                    <div>
                                        <span className="text-[11px] uppercase tracking-[0.25em] text-white font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20">Mobile Suite</span>
                                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 tracking-tight">Privacy in Your Pocket</h2>
                                    </div>

                                    <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
                                        Take confidential payments wherever you go. BlindPay Mobile brings STRK20 private payments to your smartphone — create invoices and accept shielded payments on the move.
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors group">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Shield className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <h4 className="font-bold text-white mb-2">Ready Wallet</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">Connect via Ready on Starknet Sepolia for STRK20 Privacy Wallet API access and secure shielded transactions.</p>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-colors group">
                                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Globe className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <h4 className="font-bold text-white mb-2">QR Invoice Scan</h4>
                                            <p className="text-xs text-gray-500 leading-relaxed">Instantly scan invoice QR codes and settle payments privately at point-of-sale or peer-to-peer.</p>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <div className="inline-flex items-center gap-2 text-sm text-gray-400 italic">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                            STRK20 proofs generated client-side via Privacy Wallet API
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* HOW IT WORKS                                */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/[0.06]">
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-100px" }}
                            className="max-w-6xl mx-auto"
                        >
                            <motion.div variants={fadeInUp} className="text-center mb-20">
                                <span className="text-[11px] uppercase tracking-[0.25em] text-gray-500 font-semibold">How It Works</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">Three Steps to Privacy</h2>
                                <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">From invoice creation to shielded settlement; the entire flow stays private via the STRK20 privacy pool.</p>
                            </motion.div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                                <div className="hidden md:block absolute top-[72px] left-[16.66%] right-[16.66%] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

                                {[
                                    {
                                        step: "01",
                                        title: "Create Invoice",
                                        desc: "Merchant enters amount and token type. A claim secret and escrow commitment are generated. Invoice metadata is indexed off-chain — amounts never touch the database.",
                                        icon: FileText,
                                    },
                                    {
                                        step: "02",
                                        title: "Share Payment Link",
                                        desc: "A payment link containing the invoice salt is shared. The payer's client verifies the invoice and prepares a shielded escrow deposit.",
                                        icon: Globe,
                                    },
                                    {
                                        step: "03",
                                        title: "Shielded Settlement",
                                        desc: "The payer shields tokens into the STRK20 pool and deposits to escrow. The merchant claims with their secret and STARK proof. There is no public address link on-chain.",
                                        icon: Lock,
                                    },
                                ].map((step, i) => (
                                    <motion.div key={i} variants={fadeInUp} className="relative">
                                        <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-500 group h-full">
                                            <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mb-6 group-hover:bg-white/[0.1] group-hover:border-white/20 transition-all duration-300 relative z-10">
                                                <span className="text-lg font-bold text-gray-400 group-hover:text-white transition-colors">{step.step}</span>
                                            </div>
                                            <step.icon className="w-6 h-6 text-gray-500 mb-4 group-hover:text-white transition-colors" />
                                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed group-hover:text-gray-400 transition-colors">{step.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* POWERED BY STRK20                           */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/[0.06]">
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="max-w-6xl mx-auto"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08]">
                                        <Server className="w-4 h-4 text-gray-400" />
                                        <span className="text-[11px] font-semibold tracking-[0.2em] text-gray-400 uppercase">Architecture</span>
                                    </div>
                                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                                        Powered by <span className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]">STRK20</span>
                                    </h2>
                                    <p className="text-lg text-gray-300 font-light leading-relaxed">
                                        STRK20 brings <strong className="text-white">shielded transfers</strong> to Starknet. Unlike public ERC-20 transfers that expose sender, receiver, and amount, STRK20 routes value through a privacy pool as shielded notes, validated by STARK proofs, never as plaintext on-chain.
                                    </p>
                                    <div className="space-y-4 pt-2">
                                        {[
                                            { label: "Privacy Pool", desc: "Tokens are shielded into the STRK20 pool before escrow deposit. Observers see pool activity, not individual payment details." },
                                            { label: "Escrow Helper", desc: "Deposits are bound to Poseidon commitments. Only the secret holder can generate a valid STARK proof to claim funds." },
                                            { label: "Starknet Native", desc: "Built on Cairo with starknet.js and the Ready wallet. Leverages Starknet's native STARK proving for private payments." },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                                                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 border border-white/[0.08]">
                                                    <Lock className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white mb-1">{item.label}</h4>
                                                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Orbital Diagram */}
                                <div className="flex justify-center">
                                    <div className="relative w-full aspect-square max-w-sm">
                                        <div className="absolute inset-0 border border-white/[0.08] rounded-full animate-[spin_25s_linear_infinite]">
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/20 border border-white/30" />
                                        </div>
                                        <div className="absolute inset-6 border border-white/[0.12] rounded-full animate-[spin_18s_linear_infinite_reverse] border-dashed">
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30 border border-white/40" />
                                        </div>
                                        <div className="absolute inset-14 border border-white/[0.06] rounded-full animate-[spin_12s_linear_infinite]">
                                            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/20" />
                                        </div>
                                        <div className="absolute inset-[72px] bg-gradient-to-tr from-white/[0.04] to-transparent rounded-full backdrop-blur-xl flex items-center justify-center border border-white/[0.08] shadow-[0_0_60px_rgba(255,255,255,0.05)]">
                                            <div className="text-center">
                                                <h3 className="text-2xl font-bold tracking-widest uppercase opacity-70">Shielded</h3>
                                                <h3 className="text-2xl font-bold tracking-widest uppercase opacity-70">Private</h3>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* WHY BLINDPAY — COMPARISON                   */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-24 px-6 md:px-12 lg:px-24 border-t border-white/[0.06]">
                        <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true, margin: "-100px" }}
                            className="max-w-6xl mx-auto"
                        >
                            <motion.div variants={fadeInUp} className="text-center mb-16">
                                <span className="text-[11px] uppercase tracking-[0.25em] text-gray-500 font-semibold">Why BlindPay</span>
                                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mt-4">Privacy is Not Optional</h2>
                                <p className="text-gray-400 text-lg mt-4 max-w-2xl mx-auto">See how BlindPay fundamentally differs from traditional blockchain payments.</p>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Traditional */}
                                <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/[0.06] relative overflow-hidden">
                                    <div className="absolute top-4 right-4">
                                        <Eye className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-xs font-mono text-gray-600">&times;</span>
                                        Traditional Payments
                                    </h3>
                                    <div className="space-y-4">
                                        {[
                                            "Wallet balance visible to everyone",
                                            "Full transaction history exposed",
                                            "Receiver knows sender's identity",
                                            "Payment amounts are public",
                                            "No privacy without mixers",
                                            "Invoice details stored in plaintext"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm text-gray-500">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* BlindPay */}
                                <div className="p-8 rounded-2xl bg-white/[0.04] border border-white/[0.12] relative overflow-hidden group hover:border-white/20 transition-all duration-500">
                                    <div className="absolute top-4 right-4">
                                        <EyeOff className="w-6 h-6 text-white/40 group-hover:text-white/60 transition-colors" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3 relative z-10">
                                        <span className="w-8 h-8 rounded-lg bg-white/[0.08] border border-white/[0.15] flex items-center justify-center text-xs font-mono text-white">&check;</span>
                                        BlindPay Protocol
                                    </h3>
                                    <div className="space-y-4 relative z-10">
                                        {[
                                            "Amounts hidden as shielded notes",
                                            "Escrow commitments — no public payee link",
                                            "Sender identity never revealed",
                                            "Events emit only salt — no amounts",
                                            "Native STRK20 — no mixers needed",
                                            "Proof-gated claims via STARK proofs"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-gray-200 transition-colors">
                                                <span className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </section>

                    {/* ═══════════════════════════════════════════ */}
                    {/* FINAL CTA                                   */}
                    {/* ═══════════════════════════════════════════ */}
                    <section className="py-32 px-6 md:px-12 lg:px-24 border-t border-white/[0.06]">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8 }}
                            className="max-w-4xl mx-auto text-center"
                        >
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                                Ready to Go Private?
                            </h2>
                            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                                Join the movement toward a future where financial privacy is the default. Start creating confidential invoices and accepting STRK20 shielded payments today.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 justify-center">
                                <Link to="/create" className="group flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-white text-black hover:bg-gray-100 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] w-full sm:w-auto">
                                    <span className="font-bold text-lg">Create Your First Invoice</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="mt-20">
                                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                                    <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">
                                        Building Private Payments on Starknet STRK20
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </section>

                </main>
            </div>
        </FlashlightEffect>
    );
};

export default Home;
