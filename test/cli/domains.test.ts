import { Command } from 'commander';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const promptMock = vi.fn();
const configMock = vi.fn();
const getVaultItemsMock = vi.fn();
const lockMock = vi.fn();
const testMock = vi.fn();
const extractDomainsFromVaultMock = vi.fn();
const isDomainReachableMock = vi.fn();
const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

vi.mock('inquirer', () => ({
  default: {
    prompt: promptMock,
  },
}));

vi.mock('../../src/bitwarden-api', () => ({
  config: configMock,
  getVaultItems: getVaultItemsMock,
  lock: lockMock,
  test: testMock,
}));

vi.mock('../../src/domains', () => ({
  extractDomainsFromVault: extractDomainsFromVaultMock,
  isDomainReachable: isDomainReachableMock,
}));

describe('domains CLI command', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    promptMock.mockImplementation(async (questions) => {
      const [passwordQuestion] = questions as Array<{
        validate?: (input: string) => Promise<true | string> | true | string;
      }>;

      expect(await passwordQuestion.validate?.('secret')).toBe(true);

      return { password: 'secret' };
    });

    testMock.mockResolvedValue(true);
    configMock.mockResolvedValue(true);
    lockMock.mockResolvedValue(true);
    getVaultItemsMock.mockResolvedValue([
      { login: { uris: [{ uri: 'https://example.com', match: null }] } },
      { secureNote: { type: 0 } },
    ]);
    extractDomainsFromVaultMock.mockReturnValue([
      { protocol: 'https:', hostname: 'example.com' },
      { protocol: 'http:', hostname: 'intranet.local' },
    ]);
    isDomainReachableMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  });

  it('prompts for a password, configures Bitwarden, and reports domain reachability', async () => {
    const program = new Command();

    const { registerDomainsCommand } = await import('../../src/cli/domains');
    registerDomainsCommand(program);

    await program.parseAsync(['domains', '--api-url', 'http://localhost:8087'], { from: 'user' });

    expect(promptMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'password',
          name: 'password',
          message: 'Password:',
        }),
      ]),
    );
    expect(testMock).toHaveBeenCalledWith('http://localhost:8087', 'secret');
    expect(configMock).toHaveBeenCalledWith('http://localhost:8087', 'secret');
    expect(getVaultItemsMock).toHaveBeenCalledTimes(1);
    expect(extractDomainsFromVaultMock).toHaveBeenCalledWith([
      { login: { uris: [{ uri: 'https://example.com', match: null }] } },
    ]);
    expect(isDomainReachableMock).toHaveBeenNthCalledWith(1, { protocol: 'https:', hostname: 'example.com' });
    expect(isDomainReachableMock).toHaveBeenNthCalledWith(2, { protocol: 'http:', hostname: 'intranet.local' });
    expect(consoleLogMock).toHaveBeenNthCalledWith(1, 'https://example.com: OK');
    expect(consoleLogMock).toHaveBeenNthCalledWith(2, 'http://intranet.local: UNREACHABLE');
    expect(lockMock).toHaveBeenCalledTimes(1);
  });

  it('rejects empty passwords through the prompt validation', async () => {
    const program = new Command();

    const { registerDomainsCommand } = await import('../../src/cli/domains');
    registerDomainsCommand(program);

    await program.parseAsync(['domains'], { from: 'user' });

    const promptConfig = promptMock.mock.calls[0]?.[0] as Array<{
      validate?: (input: string) => Promise<true | string> | true | string;
    }>;
    await expect(promptConfig[0].validate?.('')).resolves.toBe('Password cannot be empty');
  });
});
