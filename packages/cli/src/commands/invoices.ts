import { Command } from 'commander';
import chalk from 'chalk';
import { BlindPay } from '@blindpay/node';
import { getApiKey, getBaseUrl } from '../config';

function getClient(): BlindPay {
    return new BlindPay({ apiKey: getApiKey(), baseUrl: getBaseUrl() });
}

const list = new Command('list')
    .description('List invoices')
    .option('--status <status>', 'Filter by status (PENDING, SETTLED)')
    .option('--limit <n>', 'Max results', '20')
    .action(async (options) => {
        try {
            const bp = getClient();
            const invoices = await bp.invoices.list({
                status: options.status,
                limit: parseInt(options.limit),
            });

            if (invoices.length === 0) {
                console.log(chalk.gray('No invoices found.'));
                return;
            }

            console.log(chalk.bold(`\nInvoices (${invoices.length}):\n`));
            for (const inv of invoices) {
                const status = inv.status === 'SETTLED'
                    ? chalk.green(inv.status)
                    : chalk.yellow(inv.status);
                const hash = inv.invoice_hash.substring(0, 16) + '...';
                const date = inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '';
                console.log(`  ${status}  ${hash}  ${chalk.gray(date)}`);
            }
            console.log();
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

const get = new Command('get')
    .description('Get invoice details')
    .argument('<hash>', 'Invoice hash')
    .action(async (hash: string) => {
        try {
            const bp = getClient();
            const inv = await bp.invoices.get(hash);

            console.log(chalk.bold('\nInvoice Details:\n'));
            console.log(`  Hash:      ${inv.invoice_hash}`);
            console.log(`  Status:    ${inv.status === 'SETTLED' ? chalk.green(inv.status) : chalk.yellow(inv.status)}`);
            console.log(`  Merchant:  ${inv.merchant_address}`);
            console.log(`  Token:     ${inv.token_type === 1 ? 'USDC' : inv.token_type === 2 ? 'DAI' : inv.token_type === 3 ? 'USDT' : 'ETH'}`);
            console.log(`  Type:      ${inv.invoice_type === 1 ? 'Multipay' : inv.invoice_type === 2 ? 'Donation' : 'Standard'}`);
            if (inv.salt) console.log(`  Salt:      ${inv.salt}`);
            if (inv.payment_tx_ids?.length) {
                console.log(`  Payments:  ${inv.payment_tx_ids.join(', ')}`);
            }
            console.log(`  Created:   ${inv.created_at}`);
            console.log();
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });

export const invoicesCommand = new Command('invoices')
    .description('Manage invoices')
    .addCommand(list)
    .addCommand(get);
