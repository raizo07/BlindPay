const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    // SSL only for hosted Postgres (Neon, Supabase, etc.) — not local/Docker
    ssl:
        connectionString?.includes('sslmode=require') ||
        connectionString?.includes('neon.tech') ||
        connectionString?.includes('supabase.co')
            ? { rejectUnauthorized: false }
            : false,
});

async function initDB() {
    const client = await pool.connect();
    try {
        await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        await client.query(`
            CREATE TABLE IF NOT EXISTS invoices (
                invoice_hash TEXT PRIMARY KEY,
                merchant_address TEXT,
                status TEXT NOT NULL DEFAULT 'PENDING',
                block_height INTEGER,
                block_settled INTEGER,
                invoice_transaction_id TEXT,
                payment_tx_ids TEXT,
                salt TEXT,
                invoice_type INTEGER DEFAULT 0,
                token_type INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
        `);

        // Create indexes if they don't exist
        await client.query(`CREATE INDEX IF NOT EXISTS idx_status ON invoices (status)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_merchant_address ON invoices (merchant_address)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_created_at ON invoices (created_at DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_invoice_transaction_id ON invoices (invoice_transaction_id)`);

        // Merchants table for API key authentication
        await client.query(`
            CREATE TABLE IF NOT EXISTS merchants (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                wallet_address TEXT NOT NULL UNIQUE,
                business_name TEXT,
                webhook_url TEXT,
                webhook_secret TEXT,
                api_key_hash TEXT NOT NULL,
                api_key_prefix TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_merchants_wallet ON merchants (wallet_address)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_merchants_prefix ON merchants (api_key_prefix)`);

        // Webhook events table
        await client.query(`
            CREATE TABLE IF NOT EXISTS webhook_events (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                event_type TEXT NOT NULL,
                invoice_hash TEXT,
                payload JSONB NOT NULL,
                status TEXT DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                last_attempt_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_webhook_merchant ON webhook_events (merchant_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_events (status)`);

        // Merchant profiles for donation pages
        await client.query(`
            CREATE TABLE IF NOT EXISTS merchant_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                slug TEXT UNIQUE NOT NULL,
                display_name TEXT,
                description TEXT,
                default_token_type INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_profiles_slug ON merchant_profiles (slug)`);

        // Checkout sessions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS checkout_sessions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                merchant_id UUID REFERENCES merchants(id),
                amount NUMERIC NOT NULL,
                token TEXT NOT NULL DEFAULT 'eth',
                memo TEXT,
                status TEXT DEFAULT 'open',
                invoice_hash TEXT,
                payment_url TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                expires_at TIMESTAMPTZ
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_checkout_merchant ON checkout_sessions (merchant_id)`);

        console.log('Database initialized successfully');
    } finally {
        client.release();
    }
}

module.exports = { pool, initDB };
