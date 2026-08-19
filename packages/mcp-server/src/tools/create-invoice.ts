import { BlindPay } from '@blindpay/node';

export const createInvoiceTool = {
    name: 'create_invoice',
    description: 'Create a new BlindPay invoice',
    inputSchema: {
        type: 'object' as const,
        properties: {
            invoice_hash: { type: 'string', description: 'Unique invoice hash' },
            merchant_address: { type: 'string', description: 'Merchant wallet address' },
            salt: { type: 'string', description: 'Invoice salt (bytes32)' },
            invoice_type: { type: 'number', description: '0=Standard, 1=Multipay, 2=Donation' },
        },
        required: ['invoice_hash', 'merchant_address'],
    },
    async execute(args: any, client: BlindPay) {
        const invoice = await client.invoices.create(args);
        return JSON.stringify(invoice, null, 2);
    },
};
