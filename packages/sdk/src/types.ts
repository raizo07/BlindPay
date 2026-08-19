export interface Invoice {
    invoice_hash: string;
    merchant_address: string;
    status: 'PENDING' | 'SETTLED';
    block_height?: number;
    block_settled?: number;
    invoice_transaction_id?: string;
    payment_tx_ids?: string[];
    salt?: string;
    invoice_type?: number;
    token_type?: number;
    created_at?: string;
    updated_at?: string;
}

export interface CreateInvoiceParams {
    invoice_hash: string;
    merchant_address: string;
    status?: string;
    invoice_transaction_id?: string;
    salt?: string;
    invoice_type?: number;
}

export interface CheckoutSession {
    id: string;
    merchant_id: string;
    amount: number;
    token: string;
    memo?: string;
    status: 'open' | 'complete' | 'expired';
    invoice_hash?: string;
    payment_url: string;
    created_at: string;
    expires_at?: string;
}

export interface CreateCheckoutSessionParams {
    amount: number;
    token?: string;
    memo?: string;
}

export interface Merchant {
    id: string;
    wallet_address: string;
    business_name?: string;
    webhook_url?: string;
    api_key_prefix: string;
    created_at: string;
    updated_at: string;
}

export interface WebhookEvent {
    id: string;
    merchant_id: string;
    event_type: string;
    invoice_hash?: string;
    payload: Record<string, any>;
    status: string;
    attempts: number;
    created_at: string;
}

export interface ListParams {
    limit?: number;
    status?: string;
}

export interface AnalyticsSummary {
    total_invoices: number;
    by_status: Record<string, number>;
    by_token_type: Record<string, number>;
}

export interface BlindPayConfig {
    apiKey: string;
    baseUrl?: string;
}
