import { BlindPay } from '@blindpay/node';

export const createCheckoutTool = {
    name: 'create_checkout_session',
    description: 'Create a BlindPay checkout session that returns a payment URL',
    inputSchema: {
        type: 'object' as const,
        properties: {
            amount: { type: 'number', description: 'Payment amount' },
            token: { type: 'string', description: 'Token: eth, usdc, dai, or usdt (default: eth)' },
            memo: { type: 'string', description: 'Optional memo for the payment' },
        },
        required: ['amount'],
    },
    async execute(args: any, client: BlindPay) {
        const session = await client.checkout.sessions.create({
            amount: args.amount,
            token: args.token,
            memo: args.memo,
        });
        return JSON.stringify(session, null, 2);
    },
};
