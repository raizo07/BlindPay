const { pool } = require('../db');
const { verifyApiKey } = require('../utils/api-keys');

async function authenticateMerchant(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const apiKey = authHeader.slice(7);
    if (!apiKey.startsWith('bp_live_')) {
        return res.status(401).json({ error: 'Invalid API key format' });
    }

    const prefix = apiKey.substring(0, 16); // bp_live_ + 8 hex chars

    try {
        const result = await pool.query(
            'SELECT * FROM merchants WHERE api_key_prefix = $1',
            [prefix]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const merchant = result.rows[0];
        const valid = await verifyApiKey(apiKey, merchant.api_key_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        req.merchant = merchant;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

module.exports = { authenticateMerchant };
