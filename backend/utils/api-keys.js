const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const PREFIX = 'bp_live_';
const KEY_BYTES = 32;
const BCRYPT_ROUNDS = 10;

function generateApiKey() {
    const random = crypto.randomBytes(KEY_BYTES).toString('hex');
    return `${PREFIX}${random}`;
}

function getPrefix(apiKey) {
    return apiKey.substring(0, PREFIX.length + 8);
}

async function hashApiKey(apiKey) {
    return bcrypt.hash(apiKey, BCRYPT_ROUNDS);
}

async function verifyApiKey(apiKey, hash) {
    return bcrypt.compare(apiKey, hash);
}

module.exports = { generateApiKey, getPrefix, hashApiKey, verifyApiKey };
