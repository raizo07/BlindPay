import { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface Notification {
    id: string;
    type: string;
    message: string;
    data: any;
    timestamp: number;
}

export function useRealtimeNotifications(merchantAddress: string | undefined) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!merchantAddress) return;

        // Close existing connection
        eventSourceRef.current?.close();

        const url = `${API_URL}/events/${merchantAddress}`;
        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.addEventListener('invoice.paid', (event) => {
            try {
                const data = JSON.parse(event.data);
                const notification: Notification = {
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    type: 'invoice.paid',
                    message: `Invoice ${data.invoice_hash?.slice(0, 10)}... has been paid`,
                    data,
                    timestamp: Date.now(),
                };
                setNotifications((prev) => [notification, ...prev]);
            } catch (e) {
                console.error('Failed to parse SSE event:', e);
            }
        });

        es.onerror = () => {
            es.close();
            // Auto-reconnect after 5 seconds
            reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
    }, [merchantAddress]);

    useEffect(() => {
        connect();
        return () => {
            eventSourceRef.current?.close();
            if (reconnectTimeoutRef.current !== null) clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    const clearNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return { notifications, clearNotification };
}
