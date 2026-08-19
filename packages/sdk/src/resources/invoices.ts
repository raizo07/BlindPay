import { HttpClient } from '../client';
import { Invoice, CreateInvoiceParams, ListParams } from '../types';

export class Invoices {
    constructor(private client: HttpClient) {}

    async create(params: CreateInvoiceParams): Promise<Invoice> {
        return this.client.post<Invoice>('/api/invoices', params);
    }

    async get(hash: string): Promise<Invoice> {
        return this.client.get<Invoice>(`/api/invoice/${hash}`);
    }

    async list(params?: ListParams): Promise<Invoice[]> {
        const query = new URLSearchParams();
        if (params?.limit) query.set('limit', String(params.limit));
        if (params?.status) query.set('status', params.status);
        const qs = query.toString();
        return this.client.get<Invoice[]>(`/api/invoices${qs ? `?${qs}` : ''}`);
    }

    async update(hash: string, data: Partial<Invoice>): Promise<Invoice> {
        return this.client.patch<Invoice>(`/api/invoices/${hash}`, data);
    }
}
