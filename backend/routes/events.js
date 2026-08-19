const express = require('express');
const { addConnection } = require('../services/sse');

const router = express.Router();

router.get('/:merchantAddress', (req, res) => {
    const { merchantAddress } = req.params;

    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

    res.write(': connected\n\n');
    addConnection(merchantAddress, res);
});

module.exports = router;
