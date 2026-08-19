const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const { pool } = require('../db');
const { generateApiKey, getPrefix, hashApiKey } = require('../utils/api-keys');
const { authenticateMerchant } = require('../middleware/auth');

const router = express.Router();

// POST /api/merchants/register - Register merchant with wallet signature
router.post('/register', async (req, res) => {
    const { wallet_address, business_name, signature, message } = req.body;

    if (!wallet_address || !signature || !message) {
        return res.status(400).json({ error: 'Missing required fields: wallet_address, signature, message' });
    }

    try {
        // Verify the signature matches the wallet address
        const recoveredAddress = ethers.verifyMessage(message, signature);
        if (recoveredAddress.toLowerCase() !== wallet_address.toLowerCase()) {
            return res.status(401).json({ error: 'Signature verification failed' });
        }

        // Check if merchant already exists
        const existing = await pool.query(
            'SELECT id FROM merchants WHERE wallet_address = $1',
            [wallet_address.toLowerCase()]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Merchant already registered' });
        }

        // Generate API key
        const apiKey = generateApiKey();
        const apiKeyHash = await hashApiKey(apiKey);
        const apiKeyPrefix = getPrefix(apiKey);
        const webhookSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

        await pool.query(
            `INSERT INTO merchants (wallet_address, business_name, webhook_secret, api_key_hash, api_key_prefix)
             VALUES ($1, $2, $3, $4, $5)`,
            [wallet_address.toLowerCase(), business_name || null, webhookSecret, apiKeyHash, apiKeyPrefix]
        );

        const merchant = await pool.query(
            'SELECT id, wallet_address, business_name, webhook_url, created_at FROM merchants WHERE wallet_address = $1',
            [wallet_address.toLowerCase()]
        );

        res.status(201).json({
            merchant: merchant.rows[0],
            api_key: apiKey, // Only returned once at registration
            webhook_secret: webhookSecret,
        });
    } catch (err) {
        console.error('Error registering merchant:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/merchants/api-keys/rotate - Rotate API key (auth required)
router.post('/api-keys/rotate', authenticateMerchant, async (req, res) => {
    try {
        const apiKey = generateApiKey();
        const apiKeyHash = await hashApiKey(apiKey);
        const apiKeyPrefix = getPrefix(apiKey);

        await pool.query(
            `UPDATE merchants SET api_key_hash = $1, api_key_prefix = $2, updated_at = NOW() WHERE id = $3`,
            [apiKeyHash, apiKeyPrefix, req.merchant.id]
        );

        res.json({ api_key: apiKey });
    } catch (err) {
        console.error('Error rotating API key:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/merchants/me - Get current merchant info (auth required)
router.get('/me', authenticateMerchant, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, wallet_address, business_name, webhook_url, api_key_prefix, created_at, updated_at FROM merchants WHERE id = $1',
            [req.merchant.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching merchant:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/v1/merchants/me - Update merchant info (auth required)
router.patch('/me', authenticateMerchant, async (req, res) => {
    const { business_name, webhook_url } = req.body;

    try {
        await pool.query(
            `UPDATE merchants SET
                business_name = COALESCE($1, business_name),
                webhook_url = COALESCE($2, webhook_url),
                updated_at = NOW()
             WHERE id = $3`,
            [business_name || null, webhook_url || null, req.merchant.id]
        );

        const result = await pool.query(
            'SELECT id, wallet_address, business_name, webhook_url, api_key_prefix, created_at, updated_at FROM merchants WHERE id = $1',
            [req.merchant.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating merchant:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
