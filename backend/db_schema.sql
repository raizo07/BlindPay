-- Create the invoices table
CREATE TABLE IF NOT EXISTS invoices (
    invoice_hash TEXT PRIMARY KEY,
    status TEXT NOT NULL,          -- 'PENDING', 'SETTLED'
    block_height INTEGER,          -- Nullable. Only set when mined.
    block_settled INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- New Fields
    merchant_address TEXT,         -- Encrypted
    payer_address TEXT,            -- Encrypted
    amount NUMERIC,
    memo TEXT,
    invoice_transaction_id TEXT,   -- Transaction that created the invoice
    payment_tx_id TEXT             -- Transaction that paid the invoice
);

-- Create indexes for faster querying
CREATE INDEX IF NOT EXISTS idx_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_merchant_address ON invoices(merchant_address);
CREATE INDEX IF NOT EXISTS idx_payer_address ON invoices(payer_address);
CREATE INDEX IF NOT EXISTS idx_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_transaction_id ON invoices(invoice_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_id ON invoices(payment_tx_id);
