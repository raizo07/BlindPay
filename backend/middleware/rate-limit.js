const rateLimit = require('express-rate-limit');

const relayLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many relay requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
});

const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { error: 'Too many write requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { relayLimiter, apiLimiter, writeLimiter };
