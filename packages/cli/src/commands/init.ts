import { Command } from 'commander';
import chalk from 'chalk';
import { writeConfig, readConfig } from '../config';

export const initCommand = new Command('init')
    .description('Configure BlindPay CLI with your API key')
    .argument('<api-key>', 'Your BlindPay API key (bp_live_...)')
    .option('--base-url <url>', 'Custom API base URL')
    .action((apiKey: string, options: { baseUrl?: string }) => {
        if (!apiKey.startsWith('bp_live_')) {
            console.error(chalk.red('Invalid API key format. Keys must start with bp_live_'));
            process.exit(1);
        }

        const existing = readConfig();
        writeConfig({
            ...existing,
            apiKey,
            ...(options.baseUrl && { baseUrl: options.baseUrl }),
        });

        console.log(chalk.green('API key saved to ~/.blindpay/config.json'));
        console.log(chalk.gray(`Key prefix: ${apiKey.substring(0, 16)}...`));
    });
