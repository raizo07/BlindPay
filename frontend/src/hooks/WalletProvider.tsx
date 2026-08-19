import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WalletPickerModal } from "../components/wallet/SelectWallet";

const queryClient = new QueryClient();

interface WalletProviderProps {
    children: React.ReactNode;
}

export const BlindPayWalletProvider = ({ children }: WalletProviderProps) => {
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
