const { isProduction } = require('../config/env');

function notFoundHandler(_req, res) {
    res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, _req, res, _next) {
    console.error('Unhandled error:', err);
    const status = err.status || 500;
    const message =
        status >= 500 && isProduction
            ? 'Internal server error'
            : err.message || 'Internal server error';
    res.status(status).json({ error: message });
}

module.exports = { notFoundHandler, errorHandler };
