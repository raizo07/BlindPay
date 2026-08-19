const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { encrypt, decrypt } = require('./encryption');
const { pool, initDB } = require('./db');
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

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function decryptRow(row) {
    if (!row) return null;
    return {
        ...row,
        merchant_address: decrypt(row.merchant_address),
        payment_tx_ids: row.payment_tx_ids ? JSON.parse(row.payment_tx_ids) : [],
    };
}

// Merchant registration & API key management
app.use('/api/merchants', merchantRoutes);
app.use('/api/v1/merchants', merchantRoutes);

// Webhook management
app.use('/api/v1/webhooks', webhookRoutes);

// Checkout sessions
app.use('/api/v1/checkout/sessions', checkoutRoutes);

// Analytics
app.use('/api/v1/analytics', analyticsRoutes);

// SSE event stream
app.use('/api/events', eventRoutes);

// Donation profiles
app.use('/api/v1/profiles', profileRoutes);
app.use('/api/profiles', profileRoutes);

// Relayer / gas abstraction
app.use('/api/relay', relayRoutes);

app.get('/', (req, res) => {
    res.send('BlindPay Backend is running');
});

app.get('/api/invoices', async (req, res) => {
    const { status, limit = 50, merchant } = req.query;

    try {
        let result;
        if (status) {
            result = await pool.query(
                'SELECT * FROM invoices WHERE status = $1 ORDER BY created_at DESC LIMIT $2',
                [status, Number(limit)]
            );
        } else {
            result = await pool.query(
                'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
                [Number(limit)]
            );
        }

        let decrypted = result.rows.map(decryptRow);

        if (merchant) {
            decrypted = decrypted.filter(inv => inv.merchant_address === merchant);
        }

        res.json(decrypted);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoices/merchant/:address', async (req, res) => {
    const { address } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM invoices ORDER BY created_at DESC LIMIT 100'
        );
        const merchantInvoices = result.rows
            .map(decryptRow)
            .filter(inv => inv.merchant_address === address);

        res.json(merchantInvoices);
    } catch (err) {
        console.error('Error fetching invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoices/recent', async (req, res) => {
    const { limit = 10 } = req.query;

    try {
        const result = await pool.query(
            'SELECT * FROM invoices ORDER BY created_at DESC LIMIT $1',
            [Number(limit)]
        );
        res.json(result.rows.map(decryptRow));
    } catch (err) {
        console.error('Error fetching recent invoices:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/invoice/:hash', async (req, res) => {
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
        console.error('Error fetching invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/invoices', async (req, res) => {
    const { invoice_hash, merchant_address, status, invoice_transaction_id, salt, invoice_type } = req.body;

    if (!invoice_hash || !merchant_address) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const now = new Date().toISOString();
        const encryptedMerchant = encrypt(merchant_address);

        await pool.query(
            `INSERT INTO invoices (invoice_hash, merchant_address, status, invoice_transaction_id, salt, invoice_type, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (invoice_hash) DO UPDATE SET
                merchant_address = $2,
                status = $3,
                invoice_transaction_id = $4,
                salt = $5,
                invoice_type = $6,
                updated_at = $8`,
            [
                invoice_hash,
                encryptedMerchant,
                status || 'PENDING',
                invoice_transaction_id || null,
                salt || null,
                invoice_type !== undefined ? invoice_type : 0,
                now,
                now,
            ]
        );

        const result = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [invoice_hash]
        );
        res.json(decryptRow(result.rows[0]));
    } catch (err) {
        console.error('Error creating invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/invoices/:hash', async (req, res) => {
    const { hash } = req.params;
    const { status, payment_tx_ids, block_settled } = req.body;

    try {
        const current = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );
        if (current.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const row = current.rows[0];
        let mergedTxIds = row.payment_tx_ids ? JSON.parse(row.payment_tx_ids) : [];
        if (payment_tx_ids && !mergedTxIds.includes(payment_tx_ids)) {
            mergedTxIds.push(payment_tx_ids);
        }

        await pool.query(
            `UPDATE invoices SET
                status = COALESCE($1, status),
                payment_tx_ids = COALESCE($2, payment_tx_ids),
                block_settled = COALESCE($3, block_settled),
                updated_at = $4
             WHERE invoice_hash = $5`,
            [
                status || null,
                mergedTxIds.length > 0 ? JSON.stringify(mergedTxIds) : null,
                block_settled || null,
                new Date().toISOString(),
                hash,
            ]
        );

        const updated = await pool.query(
            'SELECT * FROM invoices WHERE invoice_hash = $1',
            [hash]
        );

        // Trigger webhook if invoice was settled
        if (status === 'SETTLED') {
            const decrypted = decryptRow(updated.rows[0]);
            try {
                const allMerchants = await pool.query('SELECT * FROM merchants');
                const merchant = allMerchants.rows.find(m => m.wallet_address === decrypted.merchant_address?.toLowerCase());
                if (merchant) {
                    queueWebhook(merchant.id, 'invoice.paid', hash, {
                        invoice_hash: hash,
                        status: 'SETTLED',
                        payment_tx_ids: decrypted.payment_tx_ids,
                        token_type: decrypted.token_type,
                    }).catch(err => console.error('Webhook queue error:', err));
                }
            } catch (webhookErr) {
                console.error('Webhook lookup error:', webhookErr);
            }
        }

        // Send SSE notification
        if (status === 'SETTLED') {
            const dec = decryptRow(updated.rows[0]);
            if (dec.merchant_address) {
                sse.sendEvent(dec.merchant_address, {
                    type: 'invoice.paid',
                    invoice_hash: hash,
                    status: 'SETTLED',
                    payment_tx_ids: dec.payment_tx_ids,
                });
            }
        }

        res.json(decryptRow(updated.rows[0]));
    } catch (err) {
        console.error('Error updating invoice:', err);
        res.status(500).json({ error: err.message });
    }
});

// Invoice PDF export
app.use('/api/invoices', pdfRoutes);

// Initialize DB then start server
initDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });
