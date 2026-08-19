const express = require('express');
const { pool } = require('../db');
const { decrypt } = require('../encryption');
const { generateInvoicePDF } = require('../services/pdf-generator');

const router = express.Router();

router.get('/:hash/pdf', async (req, res) => {
    const { hash } = req.params;
    try {
        const result = await pool.query('SELECT * FROM invoices WHERE invoice_hash = $1', [hash]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const row = result.rows[0];
        const invoice = {
            ...row,
            merchant_address: decrypt(row.merchant_address),
            payment_tx_ids: row.payment_tx_ids ? JSON.parse(row.payment_tx_ids) : [],
        };

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=blindpay-invoice-${hash.substring(0, 10)}.pdf`);

        const doc = await generateInvoicePDF(invoice);
        doc.pipe(res);
        doc.end();
    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
