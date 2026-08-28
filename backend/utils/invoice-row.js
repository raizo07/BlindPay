const { decrypt } = require('../encryption');
const { safeParseJsonArray } = require('./validation');

function decryptRow(row) {
    if (!row) return null;

    const merchant = decrypt(row.merchant_address);
    const payer = row.payer_address ? decrypt(row.payer_address) : null;

    return {
        ...row,
        merchant_address: merchant,
        payer_address: payer,
        payment_tx_ids: safeParseJsonArray(row.payment_tx_ids),
        amount: row.amount != null ? Number(row.amount) : null,
        // Never expose encrypted claim secret in generic responses
        claim_secret_encrypted: undefined,
    };
}

function decryptRowWithSecret(row) {
    if (!row) return null;
    const base = decryptRow(row);
    if (row.claim_secret_encrypted) {
        base.claim_secret = decrypt(row.claim_secret_encrypted);
    }
    return base;
}

module.exports = { decryptRow, decryptRowWithSecret };
