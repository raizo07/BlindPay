import { Command } from 'commander';
import chalk from 'chalk';
import { BlindPay } from '@blindpay/node';
import { getApiKey, getBaseUrl } from '../config';

export const statusCommand = new Command('status')
    .description('Show merchant info and stats')
    .action(async () => {
        try {
            const bp = new BlindPay({ apiKey: getApiKey(), baseUrl: getBaseUrl() });

            // Fetch merchant info via direct HTTP since SDK doesn't expose /merchants/me
            const baseUrl = getBaseUrl().replace(/\/$/, '');
            const res = await fetch(`${baseUrl}/api/v1/merchants/me`, {
                headers: { Authorization: `Bearer ${getApiKey()}` },
            });

            if (!res.ok) {
                throw new Error('Failed to fetch merchant info');
            }

            const merchant = await res.json();

            console.log(chalk.bold('\nMerchant Status:\n'));
            console.log(`  Wallet:    ${merchant.wallet_address}`);
            if (merchant.business_name) console.log(`  Business:  ${merchant.business_name}`);
            console.log(`  Key:       ${merchant.api_key_prefix}...`);
            console.log(`  Webhook:   ${merchant.webhook_url || chalk.gray('Not configured')}`);
            console.log(`  Since:     ${new Date(merchant.created_at).toLocaleDateString()}`);

            // Get invoice count
            const invoices = await bp.invoices.list({ limit: 1000 });
            const settled = invoices.filter(i => i.status === 'SETTLED').length;
            const pending = invoices.filter(i => i.status === 'PENDING').length;

            console.log(`\n  Invoices:  ${invoices.length} total (${chalk.green(settled + ' settled')}, ${chalk.yellow(pending + ' pending')})`);
            console.log();
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });
