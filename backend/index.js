const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { validateEnv, port, frontendUrl } = require('./config/env');
const { encrypt } = require('./encryption');
const { pool, initDB } = require('./db');
const { decryptRow, decryptRowWithSecret } = require('./utils/invoice-row');
const { clampLimit, normalizeTxId, safeParseJsonArray } = require('./utils/validation');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');
const { apiLimiter, writeLimiter } = require('./middleware/rate-limit');

const merchantRoutes = require('./routes/merchants');
const webhookRoutes = require('./routes/webhooks');
const eventRoutes = require('./routes/events');
const sse = require('./services/sse');
const { queueWebhook } = require('./services/webhook');
const checkoutRoutes = require('./routes/checkout');
const analyticsRoutes = require('./routes/analytics');
const pdfRoutes = require('./routes/pdf');
const relayRoutes = require('./routes/relay');
const profileRoutes = require('./routes/profiles');

validateEnv();

const app = express();

app.use(
    cors({
        origin: frontendUrl.split(',').map((s) => s.trim()),
        credentials: true,
    })
);
app.use(express.json({ limit: '256kb' }));
app.use('/api', apiLimiter);

app.use('/api/merchants', merchantRoutes);
app.use('/api/v1/merchants', merchantRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/checkout/sessions', checkoutRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/relay', relayRoutes);

app.get('/', (_req, res) => {
    res.send('BlindPay Backend is running');
});

app.get('/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        console.error('Health check failed:', err);
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

app.get('/api/invoices', async (req, res, next) => {
    const { status, merchant } = req.query;
    const limit = clampLimit(req.query.limit, 50);

    try {
        let result;
        if (status) {
            result = await pool.query(
                'SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
                [status, limit]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
                [limit]
            );
        }

        let decrypted = result.rows.map(decryptRow);
        if (merchant) {
            const m = String(merchant).toLowerCase();
            decrypted = decrypted.filter(
                (inv) => inv.merchant_address?.toLowerCase() === m
            );
        }

        res.json(decrypted);
    } catch (err) {
        next(err);
    }
});

app.get('/api/invoices/merchant/:address', async (req, res, next) => {
    const { address } = req.params;
    const limit = clampLimit(req.query.limit, 100);

    try {
        const result = await pool.query(
            'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        const merchantInvoices = result.rows
            .map(decryptRow)
            .filter((inv) => inv.merchant_address?.toLowerCase() === address.toLowerCase());

        res.json(merchantInvoices);
    } catch (err) {
        next(err);
    }
});

app.get('/api/invoices/recent', async (req, res, next) => {
    const limit = clampLimit(req.query.limit, 10);

    try {
        const result = await pool.query(
            'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
            [limit]
        );
        res.json(result.rows.map(decryptRow));
    } catch (err) {
        next(err);
    }
});

app.get('/api/invoice/:hash', async (req, res, next) => {
    const { hash } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }
        res.json(decryptRow(result.rows[0]));
    } catch (err) {
        next(err);
    }
});

/** Merchant-only: retrieve claim secret for escrow claim (requires matching wallet). */
app.get('/api/invoices/:hash/claim-secret', async (req, res, next) => {
    const { hash } = req.params;
    const { merchant } = req.query;

    if (!merchant) {
        return res.status(400).json({ error: 'merchant query parameter required' });
    }

    try {
        const result = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const row = decryptRowWithSecret(result.rows[0]);
        if (row.merchant_address?.toLowerCase() !== String(merchant).toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized for this invoice' });
        }

        if (!row.claim_secret) {
            return res.status(404).json({ error: 'No claim secret stored for this invoice' });
        }

        res.json({
            invoice_hash: hash,
            claim_secret: row.claim_secret,
            commitment_hash: row.commitment_hash,
            token_type: row.token_type,
        });
    } catch (err) {
        next(err);
    }
});

app.post('/api/invoices', writeLimiter, async (req, res, next) => {
    const {
        invoice_hash,
        merchant_address,
        status,
        invoice_transaction_id,
        salt,
        invoice_type,
        token_type,
        amount,
        memo,
        commitment_hash,
        claim_secret,
    } = req.body;

    if (!invoice_hash || !merchant_address) {
        return res.status(400).json({ error: 'Missing required fields: invoice_hash, merchant_address' });
    }

    try {
        const now = new Date().toISOString();
        const encryptedMerchant = encrypt(merchant_address);
        const encryptedSecret = claim_secret ? encrypt(String(claim_secret)) : null;

        await pool.query(
            `INSERT INTO invoices (
                invoice_hash, merchant_address, status, invoice_transaction_id, salt,
                invoice_type, token_type, amount, memo, commitment_hash,
                claim_secret_encrypted, created_at, updated_at
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (invoice_hash) DO UPDATE SET
                merchant_address = $2,
                status = $3,
                invoice_transaction_id = $4,
                salt = $5,
                invoice_type = $6,
                token_type = $7,
                amount = $8,
                memo = $9,
                commitment_hash = $10,
                claim_secret_encrypted = COALESCE($11, invoices.claim_secret_encrypted),
                updated_at = $13`,
            [
                invoice_hash,
                encryptedMerchant,
                status || 'PENDING',
                invoice_transaction_id || null,
                salt || invoice_hash,
                invoice_type !== undefined ? invoice_type : 0,
                token_type !== undefined ? token_type : 0,
                amount != null ? amount : null,
                memo || null,
                commitment_hash || null,
                encryptedSecret,
                now,
                now,
            ]
        );

        const result = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [invoice_hash]
        );
        res.status(201).json(decryptRow(result.rows[0]));
    } catch (err) {
        next(err);
    }
});

app.patch('/api/invoices/:hash', writeLimiter, async (req, res, next) => {
    const { hash } = req.params;
    const { status, block_settled, payer_address, claimed_at } = req.body;
    const txId = normalizeTxId(req.body);

    try {
        const current = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const row = current.rows[0];
        let mergedTxIds = safeParseJsonArray(row.payment_tx_ids);
        if (txId && !mergedTxIds.includes(txId)) {
            mergedTxIds.push(txId);
        }

        const encryptedPayer = payer_address ? encrypt(payer_address) : null;

        await pool.query(
            `UPDATE invoices SET
                status = COALESCE($1, status),
                payment_tx_ids = COALESCE($2, payment_tx_ids),
                block_settled = COALESCE($3, block_settled),
                payer_address = COALESCE($4, payer_address),
                claimed_at = COALESCE($5, claimed_at),
                updated_at = $6
             WHERE invoice_hash = $7`,
            [
                status || null,
                mergedTxIds.length > 0 ? JSON.stringify(mergedTxIds) : null,
                block_settled || null,
                encryptedPayer,
                claimed_at || null,
                new Date().toISOString(),
                hash,
            ]
        );

        const updated = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );

        if (status === 'SETTLED') {
            const decrypted = decryptRow(updated.rows[0]);
            try {
                const allMerchants = await pool.query('SELECT * FROM merchants');
                const merchant = allMerchants.rows.find(
                    (m) => m.wallet_address === decrypted.merchant_address?.toLowerCase()
                );
                if (merchant) {
                    queueWebhook(merchant.id, 'invoice.paid', hash, {
                        invoice_hash: hash,
                        status: 'SETTLED',
                        payment_tx_ids: decrypted.payment_tx_ids,
                        token_type: decrypted.token_type,
                    }).catch((webhookErr) => console.error('Webhook queue error:', webhookErr));
                }
            } catch (webhookErr) {
                console.error('Webhook lookup error:', webhookErr);
            }

            if (decrypted.merchant_address) {
                sse.sendEvent(decrypted.merchant_address, {
                    type: 'invoice.paid',
                    invoice_hash: hash,
                    status: 'SETTLED',
                    payment_tx_ids: decrypted.payment_tx_ids,
                });
            }
        }

        res.json(decryptRow(updated.rows[0]));
    } catch (err) {
        next(err);
    }
});

app.use('/api/invoices', pdfRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    await initDB();

    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    const shutdown = async (signal) => {
        console.log(`${signal} received, shutting down...`);
        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
