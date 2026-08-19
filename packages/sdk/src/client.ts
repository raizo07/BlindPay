import { BlindPayError, AuthenticationError, NotFoundError } from './errors';

export class HttpClient {
    private baseUrl: string;
    private apiKey: string;

    constructor(apiKey: string, baseUrl: string) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    private async request<T>(method: string, path: string, body?: any): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': '@blindpay/node',
        };

        const res = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            let message = `HTTP ${res.status}`;
            try {
                const json = JSON.parse(text);
                message = json.error || message;
            } catch { /* ignore */ }

            if (res.status === 401) throw new AuthenticationError(message);
            if (res.status === 404) throw new NotFoundError(message);
            throw new BlindPayError(message, res.status);
        }

        return res.json();
    }

    get<T>(path: string): Promise<T> {
        return this.request<T>('GET', path);
    }

    post<T>(path: string, body?: any): Promise<T> {
        return this.request<T>('POST', path, body);
    }

    patch<T>(path: string, body?: any): Promise<T> {
        return this.request<T>('PATCH', path, body);
    }
}
