const express = require('express');
const relayer = require('../services/relayer');
const { relayLimiter } = require('../middleware/rate-limit');

const router = express.Router();

router.get('/status', async (_req, res) => {
    try {
        const configured = relayer.isConfigured();
        const balance = configured ? await relayer.getBalance() : '0';
        res.json({ configured, balance });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/pay', relayLimiter, async (req, res) => {
    const { contractAddress, data, value } = req.body;

    if (!contractAddress || !data) {
        return res.status(400).json({ error: 'Missing contractAddress or data' });
    }

    if (!relayer.isConfigured()) {
        return res.status(503).json({ error: 'Relayer not configured' });
    }

    try {
        const result = await relayer.relayTransaction(contractAddress, data, value || '0');
        res.json(result);
    } catch (err) {
        console.error('Relay error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
