import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AnalyticsSummary {
    total_invoices: number;
    by_status: Record<string, number>;
    by_token_type: Record<string, number>;
    by_invoice_type: Record<string, number>;
}

export interface VolumeDataPoint {
    date: string;
    total: number;
    settled: number;
}

function getApiKey(): string | null {
    const address = localStorage.getItem('bp_merchant_address');
    if (!address) return null;
    return localStorage.getItem(`bp_api_key_${address.toLowerCase()}`);
}

export function useAnalyticsSummary() {
    return useQuery<AnalyticsSummary>({
        queryKey: ['analytics', 'summary'],
        queryFn: async () => {
            const key = getApiKey();
            if (!key) throw new Error('No API key');
            const res = await fetch(`${API_URL}/v1/analytics/summary`, {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (!res.ok) throw new Error('Failed to fetch analytics');
            return res.json();
        },
        enabled: !!getApiKey(),
        retry: false,
    });
}

export function useAnalyticsVolume(period = '30d') {
    return useQuery<VolumeDataPoint[]>({
        queryKey: ['analytics', 'volume', period],
        queryFn: async () => {
            const key = getApiKey();
            if (!key) throw new Error('No API key');
            const res = await fetch(`${API_URL}/v1/analytics/volume?period=${period}`, {
                headers: { Authorization: `Bearer ${key}` },
            });
            if (!res.ok) throw new Error('Failed to fetch volume data');
            return res.json();
        },
        enabled: !!getApiKey(),
        retry: false,
    });
}
