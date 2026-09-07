import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletPickerModal } from "../components/wallet/SelectWallet";
import { restoreWalletSession } from "./useWallet";
import { useWalletStore } from "../stores/walletStore";

const queryClient = new QueryClient();

interface WalletProviderProps {
    children: React.ReactNode;
}

const RESTORE_TIMEOUT_MS = 8000;

export const BlindPayWalletProvider = ({ children }: WalletProviderProps) => {
    useEffect(() => {
        let cancelled = false;
        const { setRestoring } = useWalletStore.getState();
        setRestoring(true);

        const timeout = window.setTimeout(() => {
            if (!cancelled) setRestoring(false);
        }, RESTORE_TIMEOUT_MS);

        restoreWalletSession().finally(() => {
            window.clearTimeout(timeout);
            if (!cancelled) setRestoring(false);
        });

        return () => {
            cancelled = true;
            window.clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        const handler = (event: PromiseRejectionEvent) => {
            const err = event.reason;
            const msg = err?.message ?? String(err);
            if (
                msg.includes("rejected") ||
                msg.includes("User rejected") ||
                msg.includes("wallet")
            ) {
                event.preventDefault();
            }
        };
        window.addEventListener("unhandledrejection", handler);
        return () => window.removeEventListener("unhandledrejection", handler);
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <WalletPickerModal />
        </QueryClientProvider>
    );
};

export { queryClient };
