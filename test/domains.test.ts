import { beforeEach, describe, expect, it, vi } from 'vitest';

const headMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    head: headMock,
  },
}));

describe('domains', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('extracts unique valid domains from vault items', async () => {
    const { extractDomainsFromVault } = await import('../src/domains');

    const vaultItems = [
      {
        login: {
          uris: [
            { uri: 'https://example.com/login', match: null },
            { uri: 'https://example.com/profile', match: null },
            { uri: 'http://intranet.local', match: null },
            { uri: 'not-a-url', match: null },
          ],
        },
      },
      {
        login: {
          uris: [{ uri: 'https://example.com/settings', match: null }],
        },
      },
    ] as any;

    expect(extractDomainsFromVault(vaultItems)).toEqual([
      { protocol: 'https:', hostname: 'example.com' },
      { protocol: 'http:', hostname: 'intranet.local' },
    ]);
  });

  it('returns false when a domain is not reachable', async () => {
    const { isDomainReachable } = await import('../src/domains');

    headMock.mockResolvedValueOnce({});
    await expect(isDomainReachable({ protocol: 'https:', hostname: 'example.com' })).resolves.toBe(true);
    expect(headMock).toHaveBeenCalledWith('https://example.com', { timeout: 5000 });

    headMock.mockRejectedValueOnce(new Error('network error'));
    await expect(isDomainReachable({ protocol: 'http:', hostname: 'intranet.local' })).resolves.toBe(false);
    expect(headMock).toHaveBeenCalledWith('http://intranet.local', { timeout: 5000 });
  });
});
