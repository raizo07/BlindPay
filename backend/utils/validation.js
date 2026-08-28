const MAX_LIMIT = 100;

function clampLimit(raw, fallback = 50) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1) return fallback;
    return Math.min(Math.floor(n), MAX_LIMIT);
}

function safeParseJsonArray(value, fallback = []) {
    if (!value) return fallback;
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function normalizeTxId(body) {
    return body.payment_tx_ids || body.tx_hash || body.payment_tx_id || null;
}

module.exports = { clampLimit, safeParseJsonArray, normalizeTxId, MAX_LIMIT };
