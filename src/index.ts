// Main application to check Bitwarden domains via the API
import inquirer from 'inquirer';
import minimist from 'minimist';

import { config, unlock, getVaultItems } from './bitwardenApi';
import { extractDomainsFromVault, isDomainReachable } from './domainUtils';

// Parse command line arguments using minimist
const args = minimist(process.argv.slice(2));
// Use --api-url argument or default
const BITWARDEN_API_URL = args['api-url'] || 'https://api.bitwarden.com';
// Global access token for authentication
let sessionToken: string | null = null;

/**
 * Main function: prompts for credentials, authenticates, and displays vault items
 */
async function main() {
  try {
    // Prompt the user for email and password via CLI
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: async (input) => {
          if (input.length === 0) {
            return 'Password cannot be empty';
          }

          try {
            await unlock(BITWARDEN_API_URL, input);
          } catch (error) {
            return 'Invalid password';
          }

          return true;
        },
      },
    ]);

    await config(BITWARDEN_API_URL, answers.password);

    const vaultItems = await getVaultItems();
    const domains = extractDomainsFromVault(vaultItems.data || vaultItems);
    console.log(`Found ${domains.length} unique domains. Checking availability...`);

    for (const domain of domains) {
      const ok = await isDomainReachable(domain);
      console.log(`${domain}: ${ok ? 'OK' : 'NOT REACHABLE'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Start the application
main();
