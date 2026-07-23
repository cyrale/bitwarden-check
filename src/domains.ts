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
  const domains = new Map<string, Domain>();

  for (const item of vaultItems) {
    if (Array.isArray(item.login.uris)) {
      for (const uriObj of item.login.uris) {
        try {
          const url = new URL(uriObj.uri);
          const key = `${url.protocol}//${url.hostname}`;
          domains.set(key, { protocol: url.protocol, hostname: url.hostname });
        } catch {
          // Ignore invalid URLs
        }
      }
    }
  }

  return Array.from(domains.values());
}

/**
 * Check if a domain is reachable (HTTP HEAD request)
 */
export async function isDomainReachable(domain: Domain): Promise<boolean> {
  try {
    const protocol = domain.protocol.endsWith(':') ? domain.protocol : `${domain.protocol}:`;

    await axios.head(`${protocol}//${domain.hostname}`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
