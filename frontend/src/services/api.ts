const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Invoice {
    invoice_hash: string;
    merchant_address: string;
    payer_address?: string;
    amount: number;
    memo?: string;
    status: 'PENDING' | 'SETTLED';
    block_height?: number;
    block_settled?: number;
    invoice_transaction_id?: string;
    payment_tx_ids?: string[];
    payment_tx_id?: string;
    created_at?: string;
    updated_at?: string;
    salt?: string;
    invoice_type?: number;
    token_type?: number;
}

/**
 * All API functions gracefully handle backend being unavailable.
 * The backend (Supabase) is optional — core flows work on-chain only.
 */

export const fetchInvoices = async (status?: string): Promise<Invoice[]> => {
    try {
        const url = new URL(`${API_URL}/invoices`);
        if (status) url.searchParams.append('status', status);
        const response = await fetch(url.toString());
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
};

export const fetchInvoiceByHash = async (hash: string): Promise<Invoice | null> => {
    try {
        const response = await fetch(`${API_URL}/invoice/${hash}`);
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
};

export const createInvoice = async (data: Partial<Invoice>): Promise<Invoice | null> => {
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
};

export const updateInvoiceStatus = async (hash: string, data: Partial<Invoice>): Promise<Invoice | null> => {
    try {
        const response = await fetch(`${API_URL}/invoices/${hash}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
};

export const fetchInvoicesByMerchant = async (merchant: string): Promise<Invoice[]> => {
    try {
        const response = await fetch(`${API_URL}/invoices/merchant/${merchant}`);
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
};

export const fetchRecentTransactions = async (limit: number = 10): Promise<Invoice[]> => {
    try {
        const response = await fetch(`${API_URL}/invoices/recent?limit=${limit}`);
        if (!response.ok) return [];
        return response.json();
    } catch {
        return [];
    }
};
