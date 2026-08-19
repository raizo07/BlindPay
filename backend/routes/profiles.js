const express = require('express');
const { pool } = require('../db');
const { authenticateMerchant } = require('../middleware/auth');

const router = express.Router();

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

function isValidSlug(slug) {
    if (!slug || slug.length < 3 || slug.length > 60) return false;
    if (slug.length === 1) return /^[a-z0-9]$/.test(slug);
    return SLUG_REGEX.test(slug);
}

// POST /api/v1/profiles - Create profile (auth required)
router.post('/', authenticateMerchant, async (req, res) => {
    const { slug, display_name, description, default_token_type } = req.body;

    if (!slug) {
        return res.status(400).json({ error: 'slug is required' });
    }

    if (!isValidSlug(slug)) {
        return res.status(400).json({ error: 'Invalid slug. Use lowercase alphanumeric characters and hyphens only (3-60 chars).' });
    }

    try {
        const existing = await pool.query('SELECT id FROM merchant_profiles WHERE slug = $1', [slug]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Slug already taken' });
        }

        const result = await pool.query(
            `INSERT INTO merchant_profiles (merchant_id, slug, display_name, description, default_token_type)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [req.merchant.id, slug, display_name || null, description || null, default_token_type ?? 0]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/profiles/:slug - Get profile by slug (public)
router.get('/:slug', async (req, res) => {
    const { slug } = req.params;

    try {
        const result = await pool.query(
            `SELECT mp.slug, mp.display_name, mp.description, mp.default_token_type, mp.is_active, mp.created_at,
                    m.wallet_address, m.business_name
             FROM merchant_profiles mp
             JOIN merchants m ON m.id = mp.merchant_id
             WHERE mp.slug = $1 AND mp.is_active = true`,
            [slug]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/v1/profiles/:slug - Update own profile (auth required)
router.put('/:slug', authenticateMerchant, async (req, res) => {
    const { slug } = req.params;
    const { display_name, description, default_token_type, is_active } = req.body;

    try {
        const existing = await pool.query(
            'SELECT * FROM merchant_profiles WHERE slug = $1 AND merchant_id = $2',
            [slug, req.merchant.id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found or not owned by you' });
        }

        const result = await pool.query(
            `UPDATE merchant_profiles SET
                display_name = COALESCE($1, display_name),
                description = COALESCE($2, description),
                default_token_type = COALESCE($3, default_token_type),
                is_active = COALESCE($4, is_active)
             WHERE slug = $5 AND merchant_id = $6 RETURNING *`,
            [
                display_name ?? null,
                description ?? null,
                default_token_type ?? null,
                is_active ?? null,
                slug,
                req.merchant.id,
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
