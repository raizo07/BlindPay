const crypto = require('crypto');
const { pool } = require('../db');

function signPayload(secret, payload) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function deliverWebhook(event) {
    const merchant = await pool.query('SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1', [event.merchant_id]);
    if (!merchant.rows[0]?.webhook_url) return;

    const { webhook_url, webhook_secret } = merchant.rows[0];
    const body = JSON.stringify(event.payload);
    const signature = signPayload(webhook_secret, body);
    const delays = [0, 1000, 10000, 60000];

    for (let attempt = 0; attempt < delays.length; attempt++) {
        if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));

        try {
            await pool.query(
                'UPDATE webhook_events SET attempts = $1, last_attempt_at = NOW() WHERE id = $2',
                [attempt + 1, event.id]
            );

            const res = await fetch(webhook_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-BlindPay-Signature': signature,
                    'X-BlindPay-Event': event.payload.type,
                    'X-BlindPay-Delivery': event.id,
                },
                body,
                signal: AbortSignal.timeout(10000),
            });

            if (res.ok) {
                await pool.query('UPDATE webhook_events SET status = $1 WHERE id = $2', ['delivered', event.id]);
                return;
            }
        } catch (err) {
            console.error(`Webhook delivery attempt ${attempt + 1} failed:`, err.message);
        }
    }

    await pool.query('UPDATE webhook_events SET status = $1 WHERE id = $2', ['failed', event.id]);
}

async function queueWebhook(merchantId, eventType, invoiceHash, data) {
    const payload = {
        id: `evt_${crypto.randomBytes(12).toString('hex')}`,
        type: eventType,
        data,
        created_at: new Date().toISOString(),
    };

    const result = await pool.query(
        `INSERT INTO webhook_events (merchant_id, event_type, invoice_hash, payload) VALUES ($1, $2, $3, $4) RETURNING *`,
        [merchantId, eventType, invoiceHash, JSON.stringify(payload)]
    );

    // Fire and forget delivery
    deliverWebhook(result.rows[0]).catch(err => console.error('Webhook delivery error:', err));

    return result.rows[0];
}

module.exports = { signPayload, deliverWebhook, queueWebhook };
