import { HttpClient } from '../client';
import { CheckoutSession, CreateCheckoutSessionParams } from '../types';

export class CheckoutSessions {
    constructor(private client: HttpClient) {}

    async create(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
        return this.client.post<CheckoutSession>('/api/v1/checkout/sessions', params);
    }

    async get(id: string): Promise<CheckoutSession> {
        return this.client.get<CheckoutSession>(`/api/v1/checkout/sessions/${id}`);
    }
}

export class Checkout {
    public sessions: CheckoutSessions;

    constructor(client: HttpClient) {
        this.sessions = new CheckoutSessions(client);
    }
}
