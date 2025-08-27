import axios from 'axios';
import { BitwardenItem } from './bitwardenApi';

/**
 * Extract all unique domains from Bitwarden vault items
 */
export function extractDomainsFromVault(vaultItems: BitwardenItem[]): string[] {
  const domains = new Set<string>();

  for (const item of vaultItems) {
    if (item.login && Array.isArray(item.login.uris)) {
      for (const uriObj of item.login.uris) {
        if (uriObj && uriObj.uri) {
          try {
            const url = new URL(uriObj.uri);
            domains.add(url.hostname);
          } catch {
            // If not a valid URL, skip
          }
        }
      }
    }
  }

  return Array.from(domains);
}

/**
 * Check if a domain is reachable (HTTP HEAD request)
 */
export async function isDomainReachable(domain: string): Promise<boolean> {
  try {
    // Try HTTPS first, fallback to HTTP if needed
    await axios.head(`https://${domain}`, { timeout: 5000 });
    return true;
  } catch {
    try {
      await axios.head(`http://${domain}`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}
