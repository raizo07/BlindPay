import { createHmac } from 'crypto';
import { HttpClient } from '../client';
import { WebhookEvent } from '../types';

export class Webhooks {
    constructor(private client: HttpClient) {}

    async list(params?: { limit?: number; status?: string }): Promise<WebhookEvent[]> {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.status) query.set('status', params.status);
        const qs = query.toString();
        return this.client.get<WebhookEvent[]>(`/api/v1/webhooks/events${qs ? `?${qs}` : ''}`);
    }

    async sendTest(): Promise<{ message: string; event_id: string }> {
        return this.client.post('/api/v1/webhooks/test');
    }

    /**
     * Verify a webhook signature from an incoming request.
     * @param payload - Raw request body (string)
     * @param signature - X-BlindPay-Signature header value
     * @param secret - Your webhook secret (whsec_...)
     */
    verify(payload: string, signature: string, secret: string): boolean {
        const expected = 'sha256=' + createHmac('sha256', secret).update(payload).digest('hex');
        return expected === signature;
    }
}
