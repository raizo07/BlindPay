import { BlindPay } from '@blindpay/node';

export const listInvoicesTool = {
    name: 'list_invoices',
    description: 'List BlindPay invoices with optional filters',
    inputSchema: {
        type: 'object' as const,
        properties: {
            status: { type: 'string', description: 'Filter by status: PENDING or SETTLED' },
            limit: { type: 'number', description: 'Max results (default 20)' },
        },
    },
    async execute(args: any, client: BlindPay) {
        const invoices = await client.invoices.list({
            status: args.status,
            limit: args.limit || 20,
        });
        return JSON.stringify(invoices, null, 2);
    },
};
