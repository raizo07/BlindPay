import { BlindPay } from '@blindpay/node';

export const getStatsTool = {
    name: 'get_stats',
    description: 'Get merchant statistics including invoice counts by status',
    inputSchema: {
        type: 'object' as const,
        properties: {},
    },
    async execute(_args: any, client: BlindPay) {
        const invoices = await client.invoices.list({ limit: 1000 });
        const settled = invoices.filter(i => i.status === 'SETTLED');
        const pending = invoices.filter(i => i.status === 'PENDING');

        const stats = {
            total_invoices: invoices.length,
            settled: settled.length,
            pending: pending.length,
            by_token: {
                eth: invoices.filter(i => (i.token_type || 0) === 0).length,
                usdc: invoices.filter(i => i.token_type === 1).length,
                dai: invoices.filter(i => i.token_type === 2).length,
                usdt: invoices.filter(i => i.token_type === 3).length,
            },
        };

        return JSON.stringify(stats, null, 2);
    },
};
