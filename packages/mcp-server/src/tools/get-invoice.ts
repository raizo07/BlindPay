import { BlindPay } from '@blindpay/node';

export const getInvoiceTool = {
    name: 'get_invoice',
    description: 'Get details for a specific BlindPay invoice by hash',
    inputSchema: {
        type: 'object' as const,
        properties: {
            hash: { type: 'string', description: 'The invoice hash' },
        },
        required: ['hash'],
    },
    async execute(args: any, client: BlindPay) {
        const invoice = await client.invoices.get(args.hash);
        return JSON.stringify(invoice, null, 2);
    },
};
