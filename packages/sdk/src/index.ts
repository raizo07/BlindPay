import { HttpClient } from './client';
import { Invoices } from './resources/invoices';
import { Checkout } from './resources/checkout';
import { Webhooks } from './resources/webhooks';
import { BlindPayConfig } from './types';
import { AuthenticationError } from './errors';

export class BlindPay {
    public invoices: Invoices;
    public checkout: Checkout;
    public webhooks: Webhooks;

    private client: HttpClient;

    constructor(apiKeyOrConfig: string | BlindPayConfig) {
        const config = typeof apiKeyOrConfig === 'string'
            ? { apiKey: apiKeyOrConfig }
            : apiKeyOrConfig;

        if (!config.apiKey) {
            throw new AuthenticationError('API key is required');
        }

        const baseUrl = config.baseUrl || 'https://api.blindpay.xyz';

        this.client = new HttpClient(config.apiKey, baseUrl);
        this.invoices = new Invoices(this.client);
        this.checkout = new Checkout(this.client);
        this.webhooks = new Webhooks(this.client);
    }
}

// Re-export types and errors
export * from './types';
export * from './errors';
