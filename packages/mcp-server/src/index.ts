#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { BlindPay } from '@blindpay/node';
import { createToolHandlers } from './server';

const apiKey = process.env.BLINDPAY_API_KEY;
if (!apiKey) {
    console.error('BLINDPAY_API_KEY environment variable is required');
    process.exit(1);
}

const baseUrl = process.env.BLINDPAY_BASE_URL || 'https://api.blindpay.xyz';
const client = new BlindPay({ apiKey, baseUrl });
const handlers = createToolHandlers(client);

const server = new Server(
    { name: 'blindpay', version: '0.1.0' },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: handlers.tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const result = await handlers.handleToolCall(
            request.params.name,
            request.params.arguments || {}
        );
        return {
            content: [{ type: 'text', text: result }],
        };
    } catch (error: any) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    console.error('MCP server error:', err);
    process.exit(1);
});
