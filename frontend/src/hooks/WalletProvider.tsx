import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletPickerModal } from "../components/wallet/SelectWallet";
import { restoreWalletSession } from "./useWallet";
import { useWalletStore } from "../stores/walletStore";

const queryClient = new QueryClient();

interface WalletProviderProps {
    children: React.ReactNode;
}

export const BlindPayWalletProvider = ({ children }: WalletProviderProps) => {
    useEffect(() => {
        let cancelled = false;
        const { setRestoring } = useWalletStore.getState();
        setRestoring(true);
        restoreWalletSession().finally(() => {
            if (!cancelled) setRestoring(false);
        });
        return () => {
            cancelled = true;
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
