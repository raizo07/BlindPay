const express = require('express');
const { pool } = require('../db');
const { authenticateMerchant } = require('../middleware/auth');
const { decrypt } = require('../encryption');

const router = express.Router();

// GET /api/v1/analytics/summary - Invoice summary stats
router.get('/summary', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');

        // Filter for this merchant's invoices
        const merchantInvoices = result.rows.filter(row => {
            const addr = decrypt(row.merchant_address);
            return addr && addr.toLowerCase() === req.merchant.wallet_address.toLowerCase();
        });

        const byStatus = {};
        const byTokenType = { eth: 0, usdc: 0, dai: 0, usdt: 0 };
        const byInvoiceType = { standard: 0, multipay: 0, donation: 0 };

        for (const inv of merchantInvoices) {
            // By status
            const status = inv.status || 'PENDING';
            byStatus[status] = (byStatus[status] || 0) + 1;

            // By token type
            const token = inv.token_type === 1 ? 'usdc' : inv.token_type === 2 ? 'dai' : inv.token_type === 3 ? 'usdt' : 'eth';
            byTokenType[token]++;

            // By invoice type
            const type = inv.invoice_type === 1 ? 'multipay' : inv.invoice_type === 2 ? 'donation' : 'standard';
            byInvoiceType[type]++;
        }

        res.json({
            total_invoices: merchantInvoices.length,
            by_status: byStatus,
            by_token_type: byTokenType,
            by_invoice_type: byInvoiceType,
        });
    } catch (err) {
        console.error('Error fetching analytics summary:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/analytics/volume?period=30d - Daily invoice counts
router.get('/volume', authenticateMerchant, async (req, res) => {
    const { period = '30d' } = req.query;
    const days = parseInt(period) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
        const result = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');

        const merchantInvoices = result.rows.filter(row => {
            const addr = decrypt(row.merchant_address);
            return addr && addr.toLowerCase() === req.merchant.wallet_address.toLowerCase();
        });

        // Group by day
        const dailyCounts = {};
        for (let d = 0; d < days; d++) {
            const date = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
            const key = date.toISOString().split('T')[0];
            dailyCounts[key] = { date: key, total: 0, settled: 0 };
        }

        for (const inv of merchantInvoices) {
            if (!inv.created_at) continue;
            const date = new Date(inv.created_at);
            if (date < since) continue;
            const key = date.toISOString().split('T')[0];
            if (dailyCounts[key]) {
                dailyCounts[key].total++;
                if (inv.status === 'SETTLED') dailyCounts[key].settled++;
            }
        }

        const volume = Object.values(dailyCounts).sort((a, b) => a.date.localeCompare(b.date));
        res.json(volume);
    } catch (err) {
        console.error('Error fetching analytics volume:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
