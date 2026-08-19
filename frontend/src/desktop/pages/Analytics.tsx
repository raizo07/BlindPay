import { motion } from 'framer-motion';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAnalyticsSummary, useAnalyticsVolume } from '../../hooks/useAnalytics';
import VolumeChart from '../../components/analytics/VolumeChart';
import TokenPieChart from '../../components/analytics/TokenPieChart';
import { useWallet } from '../../hooks/useWallet';
import { BarChart3, TrendingUp, Clock, CheckCircle, Shield } from 'lucide-react';

const Analytics = () => {
    const { isConnected } = useWallet();
    const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary();
    const { data: volume, isLoading: volumeLoading } = useAnalyticsVolume('30d');

    if (!isConnected) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
            >
                <GlassCard className="p-8 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Connect Wallet</h2>
                    <p className="text-gray-400">Connect your wallet and register as a merchant to view analytics.</p>
                </GlassCard>
            </motion.div>
        );
    }

    const pending = summary?.by_status?.PENDING || 0;
    const settled = summary?.by_status?.SETTLED || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-6"
        >
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-gray-400">
                    Invoice counts and statuses. Amounts stay in the STRK20 privacy pool and are not exposed in analytics.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-5 h-5 text-white" />
                        <p className="text-sm text-gray-400">Total Invoices</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {summaryLoading ? '—' : summary?.total_invoices || 0}
                    </p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                        <p className="text-sm text-gray-400">Settled</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {summaryLoading ? '—' : settled}
                    </p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-white" />
                        <p className="text-sm text-gray-400">Pending</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {summaryLoading ? '—' : pending}
                    </p>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="w-5 h-5 text-white" />
                        <p className="text-sm text-gray-400">Settlement Rate</p>
                    </div>
                    <p className="text-3xl font-bold text-white">
                        {summaryLoading || !summary?.total_invoices
                            ? '—'
                            : `${Math.round((settled / summary.total_invoices) * 100)}%`}
                    </p>
                </GlassCard>
            </div>

            {/* Volume Chart */}
            <GlassCard className="p-8">
                <h2 className="text-xl font-bold text-white mb-6">Invoice Volume (30 days)</h2>
                {volumeLoading ? (
                    <div className="h-72 flex items-center justify-center text-gray-500">Loading...</div>
                ) : volume && volume.length > 0 ? (
                    <VolumeChart data={volume} />
                ) : (
                    <div className="h-72 flex items-center justify-center text-gray-500">
                        No volume data yet. Create invoices to see trends.
                    </div>
                )}
            </GlassCard>

            {/* Token Distribution & Invoice Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassCard className="p-8">
                    <h2 className="text-lg font-bold text-white mb-4">Token Distribution</h2>
                    {summary?.by_token_type ? (
                        <TokenPieChart data={summary.by_token_type} />
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">No data</div>
                    )}
                </GlassCard>

                <GlassCard className="p-8">
                    <h2 className="text-lg font-bold text-white mb-4">Invoice Types</h2>
                    {summary?.by_invoice_type ? (
                        <div className="space-y-4 mt-6">
                            {Object.entries(summary.by_invoice_type).map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-gray-300 capitalize">{type}</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-white/60 rounded-full"
                                                style={{
                                                    width: `${summary.total_invoices ? (count / summary.total_invoices) * 100 : 0}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-white font-medium w-8 text-right">{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">No data</div>
                    )}
                </GlassCard>
            </div>

            {/* Privacy Note */}
            <GlassCard className="p-6" variant="light">
                <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-400">
                        Analytics show invoice counts and statuses only — private payment amounts remain in the STRK20 pool.
                    </p>
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default Analytics;
