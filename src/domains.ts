import axios from 'axios';

import type { BitwardenItemLogin } from './bitwarden-api';

type Domain = {
  protocol: string;
  hostname: string;
};

/**
 * Extract all unique domains from Bitwarden vault items
 */
export function extractDomainsFromVault(vaultItems: BitwardenItemLogin[]): Domain[] {
  const domains = new Set<Domain>();

  for (const item of vaultItems) {
    if (Array.isArray(item.login.uris)) {
      for (const uriObj of item.login.uris) {
        try {
          const url = new URL(uriObj.uri);
          domains.add({ protocol: url.protocol, hostname: url.hostname });
        } catch {
          // Ignore invalid URLs
        }
      }
    }
  }

  return Array.from(domains);
}

/**
 * Check if a domain is reachable (HTTP HEAD request)
 */
export async function isDomainReachable(domain: Domain): Promise<boolean> {
  try {
    await axios.head(`${domain.protocol}://${domain.hostname}`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
