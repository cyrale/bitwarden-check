// `bitwarden-check domains` subcommand: checks vault domains

import inquirer from 'inquirer';
import type { Command } from 'commander';

import { config, getVaultItems, lock, test } from '../bitwarden-api';
import { extractDomainsFromVault, isDomainReachable } from '../domains';

type DomainsOptions = {
  apiUrl: string;
};

export function registerDomainsCommand(program: Command): void {
  program
    .command('domains')
    .description('Check and audit vault domain access')
    .option('--api-url <url>', 'Bitwarden API base URL', process.env.BITWARDEN_API_URL || 'https://api.bitwarden.com')
    .action(async (options: DomainsOptions) => {
      const { password } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Password:',
          mask: '*',
          validate: async (input: string) => {
            if (input.length === 0) {
              return 'Password cannot be empty';
            }

            return (await test(options.apiUrl, input)) ? true : 'Invalid password';
          },
        },
      ]);

      await config(options.apiUrl, password);

      try {
        const vaultItems = await getVaultItems();
        const domains = extractDomainsFromVault(vaultItems.filter((item) => 'login' in item));

        for (const domain of domains) {
          const reachable = await isDomainReachable(domain);
          console.log(`${domain.protocol}//${domain.hostname}: ${reachable ? 'OK' : 'UNREACHABLE'}`);
        }
      } finally {
        await lock();
      }
    });
}
