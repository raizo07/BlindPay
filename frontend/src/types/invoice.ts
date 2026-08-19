export interface InvoiceData {
    merchant: string;
    amount: number;
    salt: string;
    claimSecret: string;
    commitmentHash: string;
    paymentUrl: string;
    tokenType: number;
    invoiceType: number;
    memo: string;
    /** @deprecated use paymentUrl */
    link?: string;
}

export interface CreateInvoiceState {
    amount: number | '';
    loading: boolean;
    invoiceData: InvoiceData | null;
    expiry: string;
    memo: string;
    status: string;
}
