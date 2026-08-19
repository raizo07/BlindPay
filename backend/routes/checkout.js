const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db');
const { authenticateMerchant } = require('../middleware/auth');

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// POST /api/v1/checkout/sessions - Create checkout session
router.post('/', authenticateMerchant, async (req, res) => {
    const { amount, token = 'eth', memo } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
    }

    const tokenType = token === 'usdc' ? 1 : token === 'dai' ? 2 : token === 'usdt' ? 3 : 0;

    try {
        const salt = '0x' + crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        const paymentUrl = `${FRONTEND_URL}/pay?merchant=${req.merchant.wallet_address}&amount=${amount}&salt=${salt}&token=${tokenType}&memo=${encodeURIComponent(memo || '')}&type=0`;

        const result = await pool.query(
            `INSERT INTO checkout_sessions (merchant_id, amount, token, memo, payment_url, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.merchant.id, amount, token, memo || null, paymentUrl, expiresAt]
        );

        res.status(201).json({
            ...result.rows[0],
            url: paymentUrl,
        });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/checkout/sessions/:id - Get checkout session
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM checkout_sessions WHERE id = $1',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching checkout session:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
