#!/usr/bin/env node
// Entry point: registers subcommands and delegates to commander
import 'dotenv/config';
import { Command } from 'commander';

import { registerDomainsCommand } from './cli/domains';

import pkg from '../package.json';

const program = new Command();

program.name('bitwarden-check').description('CLI to audit Bitwarden vault items').version(pkg.version);

registerDomainsCommand(program);
// registerIpsCommand(program);

program.parse();
