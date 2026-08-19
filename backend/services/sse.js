// SSE connection manager
// connections: Map<string, Set<Response>> - maps merchant address to connected SSE clients

const connections = new Map();

function addConnection(address, res) {
    const addr = address.toLowerCase();
    if (!connections.has(addr)) connections.set(addr, new Set());
    connections.get(addr).add(res);

    res.on('close', () => {
        connections.get(addr)?.delete(res);
        if (connections.get(addr)?.size === 0) connections.delete(addr);
    });
}

function sendEvent(address, event) {
    const addr = address.toLowerCase();
    const clients = connections.get(addr);
    if (!clients) return;
    const data = JSON.stringify(event);
    for (const res of clients) {
        res.write(`event: ${event.type}\ndata: ${data}\n\n`);
    }
}

// Heartbeat every 30s to keep connections alive
setInterval(() => {
    for (const [, clients] of connections) {
        for (const res of clients) {
            res.write(': heartbeat\n\n');
        }
    }
}, 30000);

module.exports = { addConnection, sendEvent };
