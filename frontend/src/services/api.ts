const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Invoice {
    invoice_hash: string;
    merchant_address: string;
    payer_address?: string;
    amount?: number | null;
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
    commitment_hash?: string;
    claimed_at?: string;
}

export interface ClaimSecretResponse {
    invoice_hash: string;
    claim_secret: string;
    commitment_hash?: string;
    token_type?: number;
}

async function parseError(response: Response): Promise<string> {
    try {
        const body = await response.json();
        return body.error || `Request failed (${response.status})`;
    } catch {
        return `Request failed (${response.status})`;
    }
}

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

export const fetchClaimSecret = async (
    invoiceHash: string,
    merchantAddress: string
): Promise<ClaimSecretResponse | null> => {
    try {
        const url = new URL(`${API_URL}/invoices/${invoiceHash}/claim-secret`);
        url.searchParams.set('merchant', merchantAddress);
        const response = await fetch(url.toString());
        if (!response.ok) return null;
        return response.json();
    } catch {
        return null;
    }
};

export const createInvoice = async (data: Record<string, unknown>): Promise<Invoice> => {
    const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error(await parseError(response));
    }
    return response.json();
};

export const updateInvoiceStatus = async (
    hash: string,
    data: Record<string, unknown>
): Promise<Invoice | null> => {
    try {
        const response = await fetch(`${API_URL}/invoices/${hash}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
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

export { API_URL };
