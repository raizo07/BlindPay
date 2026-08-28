const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

function requireEnv(name) {
    const value = process.env[name];
    if (!value || !String(value).trim()) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function validateEncryptionKey() {
    const keyHex = process.env.ENCRYPTION_KEY;
    if (!keyHex) {
        throw new Error('ENCRYPTION_KEY is required (64 hex chars = 32 bytes)');
    }
    const buf = Buffer.from(keyHex, 'hex');
    if (buf.length < 32) {
        throw new Error(`ENCRYPTION_KEY too short: need 32 bytes, got ${buf.length}`);
    }
}

function validateEnv() {
    requireEnv('DATABASE_URL');
    validateEncryptionKey();
}

module.exports = {
    validateEnv,
    port: Number(process.env.PORT) || 3000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    isProduction: process.env.NODE_ENV === 'production',
};
