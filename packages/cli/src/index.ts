#!/usr/bin/env node
import { Command } from 'commander';
import { initCommand } from './commands/init';
import { invoicesCommand } from './commands/invoices';
import { checkoutCommand } from './commands/checkout';
import { statusCommand } from './commands/status';

const program = new Command();

program
    .name('blindpay')
    .description('BlindPay CLI — Privacy-first STRK20 payments on Starknet')
    .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(invoicesCommand);
program.addCommand(checkoutCommand);
program.addCommand(statusCommand);

program.parse();
