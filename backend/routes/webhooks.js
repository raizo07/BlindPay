const express = require('express');
const { pool } = require('../db');
const { authenticateMerchant } = require('../middleware/auth');
const { queueWebhook } = require('../services/webhook');

const router = express.Router();

// GET /api/v1/webhooks/events - List webhook events for merchant
router.get('/events', authenticateMerchant, async (req, res) => {
    const { limit = 50, status } = req.query;
    try {
        let query = 'SELECT * FROM webhook_events WHERE merchant_id = $1';
        const params = [req.merchant.id];

        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }
        query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
        params.push(Number(limit));

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching webhook events:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/v1/webhooks/test - Send test webhook
router.post('/test', authenticateMerchant, async (req, res) => {
    if (!req.merchant.webhook_url) {
        return res.status(400).json({ error: 'No webhook URL configured. Update your merchant settings first.' });
    }

    try {
        const event = await queueWebhook(req.merchant.id, 'test', null, {
            message: 'This is a test webhook from BlindPay',
        });
        res.json({ message: 'Test webhook queued', event_id: event.id });
    } catch (err) {
        console.error('Error sending test webhook:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
