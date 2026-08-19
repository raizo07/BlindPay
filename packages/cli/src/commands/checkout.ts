import { Command } from 'commander';
import chalk from 'chalk';
import { BlindPay } from '@blindpay/node';
import { getApiKey, getBaseUrl } from '../config';

export const checkoutCommand = new Command('checkout')
    .description('Create a checkout session')
    .requiredOption('--amount <amount>', 'Payment amount')
    .option('--token <token>', 'Token type (eth, usdc, dai, usdt)', 'eth')
    .option('--memo <memo>', 'Payment memo')
    .action(async (options) => {
        try {
            const bp = new BlindPay({ apiKey: getApiKey(), baseUrl: getBaseUrl() });
            const session = await bp.checkout.sessions.create({
                amount: parseFloat(options.amount),
                token: options.token,
                memo: options.memo,
            });

            console.log(chalk.bold('\nCheckout Session Created:\n'));
            console.log(`  ID:     ${session.id}`);
            console.log(`  Amount: ${session.amount} ${session.token.toUpperCase()}`);
            console.log(`  URL:    ${chalk.cyan(session.url || session.payment_url)}`);
            console.log(`  Status: ${session.status}`);
            console.log();
        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            process.exit(1);
        }
    });
