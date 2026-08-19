import { BlindPay } from '@blindpay/node';
import { createInvoiceTool } from './tools/create-invoice';
import { listInvoicesTool } from './tools/list-invoices';
import { getInvoiceTool } from './tools/get-invoice';
import { createCheckoutTool } from './tools/create-checkout';
import { getStatsTool } from './tools/get-stats';

const tools = [
    createInvoiceTool,
    listInvoicesTool,
    getInvoiceTool,
    createCheckoutTool,
    getStatsTool,
];

export function createToolHandlers(client: BlindPay) {
    return {
        tools: tools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema,
        })),
        async handleToolCall(name: string, args: any): Promise<string> {
            const tool = tools.find(t => t.name === name);
            if (!tool) {
                throw new Error(`Unknown tool: ${name}`);
            }
            return tool.execute(args, client);
        },
    };
}
