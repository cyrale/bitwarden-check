import { beforeEach, describe, expect, it, vi } from 'vitest';

import pkg from '../package.json';

const registerDomainsCommandMock = vi.fn();
const parseMock = vi.fn();

const commandInstance = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  parse: parseMock,
};

class CommandMock {
  constructor() {
    return commandInstance;
  }
}

vi.mock('dotenv/config', () => ({}));

vi.mock('commander', () => ({
  Command: CommandMock,
}));

vi.mock('../src/cli/domains', () => ({
  registerDomainsCommand: registerDomainsCommandMock,
}));

describe('entry point', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('creates the commander program, registers commands, and parses argv', async () => {
    await import('../src/index');

    expect(commandInstance.name).toHaveBeenCalledTimes(1);
    expect(commandInstance.name).toHaveBeenCalledWith('bitwarden-check');
    expect(commandInstance.description).toHaveBeenCalledWith('CLI to audit Bitwarden vault items');
    expect(commandInstance.version).toHaveBeenCalledWith(pkg.version);
    expect(registerDomainsCommandMock).toHaveBeenCalledWith(commandInstance);
    expect(parseMock).toHaveBeenCalledTimes(1);
  });
});
