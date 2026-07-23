import { beforeEach, describe, expect, it, vi } from 'vitest';

type RequestHandler = (config: unknown) => unknown | Promise<unknown>;

type MockAxiosInstance = {
  defaults: {
    baseURL: string;
    headers: {
      common: Record<string, string>;
    };
  };
  interceptors: {
    request: {
      use: ReturnType<typeof vi.fn>;
    };
  };
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

const axiosMock = vi.hoisted(() => {
  let instances: MockAxiosInstance[] = [];
  let requestHandler: RequestHandler | undefined;

  return {
    create: vi.fn(() => {
      const instance = instances.shift();

      if (!instance) {
        throw new Error('Unexpected axios.create call');
      }

      return instance;
    }),
    directPost: vi.fn(),
    setInstances(nextInstances: MockAxiosInstance[]) {
      instances = nextInstances;
    },
    setRequestHandler(nextHandler: RequestHandler | undefined) {
      requestHandler = nextHandler;
    },
    getRequestHandler() {
      return requestHandler;
    },
  };
});

vi.mock('axios', () => ({
  default: {
    create: axiosMock.create,
    post: axiosMock.directPost,
  },
}));

function createAxiosInstance() {
  return {
    defaults: {
      baseURL: '',
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: vi.fn((handler: RequestHandler) => {
          axiosMock.setRequestHandler(handler);
          return 0;
        }),
      },
    },
    post: vi.fn(),
    get: vi.fn(),
  } satisfies MockAxiosInstance;
}

describe('bitwarden-api', () => {
  let bitwardenApi: typeof import('../src/bitwarden-api');
  let unlockInstance: MockAxiosInstance;
  let apiInstance: MockAxiosInstance;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    unlockInstance = createAxiosInstance();
    apiInstance = createAxiosInstance();
    axiosMock.setInstances([unlockInstance, apiInstance]);
    axiosMock.setRequestHandler(undefined);

    bitwardenApi = await import('../src/bitwarden-api');
  });

  it('exposes the expected Bitwarden enum values', () => {
    expect(bitwardenApi.BitwardenItemType.Login).toBe(1);
    expect(bitwardenApi.BitwardenItemType.SecureNote).toBe(2);
    expect(bitwardenApi.BitwardenItemType.Card).toBe(3);

    expect(bitwardenApi.BitwardenFieldType.Text).toBe(0);
    expect(bitwardenApi.BitwardenFieldType.Hidden).toBe(1);
    expect(bitwardenApi.BitwardenFieldType.Checkbox).toBe(2);
    expect(bitwardenApi.BitwardenFieldType.Linked).toBe(3);

    expect(bitwardenApi.BitwardenMatch.Domain).toBe(0);
    expect(bitwardenApi.BitwardenMatch.Host).toBe(1);
    expect(bitwardenApi.BitwardenMatch.BeginWith).toBe(2);
    expect(bitwardenApi.BitwardenMatch.Regex).toBe(3);
    expect(bitwardenApi.BitwardenMatch.Exact).toBe(4);
    expect(bitwardenApi.BitwardenMatch.Never).toBe(5);
  });

  it('validates the password and locks the vault when unlock returns a session token', async () => {
    axiosMock.directPost
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            raw: 'session-token',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
        },
      });

    await expect(bitwardenApi.test('http://localhost:8087', 'secret')).resolves.toBe(true);

    expect(axiosMock.directPost).toHaveBeenNthCalledWith(1, 'http://localhost:8087/unlock', {
      password: 'secret',
    });
    expect(axiosMock.directPost).toHaveBeenNthCalledWith(2, 'http://localhost:8087/lock');
  });

  it('returns the unlock session key', async () => {
    unlockInstance.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          raw: 'session-token',
        },
      },
    });

    await expect(bitwardenApi.unlock('secret')).resolves.toBe('session-token');

    expect(unlockInstance.post).toHaveBeenCalledWith('/unlock', {
      password: 'secret',
    });
  });

  it('rejects when unlocking fails', async () => {
    unlockInstance.post.mockResolvedValueOnce({
      data: {
        success: false,
        data: {
          raw: '',
        },
      },
    });

    await expect(bitwardenApi.unlock('secret')).rejects.toThrow('Failed to unlock vault');
  });

  it('locks and syncs the vault and reports failures', async () => {
    apiInstance.post.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });
    await expect(bitwardenApi.lock()).resolves.toBe(true);
    expect(apiInstance.post).toHaveBeenCalledWith('/lock');

    apiInstance.post.mockResolvedValueOnce({
      data: {
        success: true,
      },
    });
    await expect(bitwardenApi.sync()).resolves.toBe(true);
    expect(apiInstance.post).toHaveBeenCalledWith('/sync');

    apiInstance.post.mockResolvedValueOnce({
      data: {
        success: false,
      },
    });
    await expect(bitwardenApi.lock()).rejects.toThrow('Failed to lock vault');

    apiInstance.post.mockResolvedValueOnce({
      data: {
        success: false,
      },
    });
    await expect(bitwardenApi.sync()).rejects.toThrow('Failed to sync vault');
  });

  it('retrieves vault items', async () => {
    const items = [{ name: 'Example', type: bitwardenApi.BitwardenItemType.Login }];

    apiInstance.get.mockResolvedValueOnce({
      data: {
        data: {
          data: items,
        },
      },
    });

    await expect(bitwardenApi.getVaultItems()).resolves.toEqual(items);
    expect(apiInstance.get).toHaveBeenCalledWith('/list/object/items');
  });

  it('configures the API URL, registers the auth interceptor, and refreshes the session when needed', async () => {
    apiInstance.post.mockResolvedValue({
      data: {
        success: true,
      },
    });
    unlockInstance.post.mockResolvedValue({
      data: {
        success: true,
        data: {
          raw: 'session-token',
        },
      },
    });

    await expect(bitwardenApi.config('http://localhost:8087', 'secret')).resolves.toBe(true);

    expect(unlockInstance.defaults.baseURL).toBe('http://localhost:8087');
    expect(apiInstance.defaults.baseURL).toBe('http://localhost:8087');
    expect(apiInstance.interceptors.request.use).toHaveBeenCalledTimes(1);
    expect(apiInstance.post).toHaveBeenCalledWith('/sync');

    const requestHandler = axiosMock.getRequestHandler();
    expect(requestHandler).toBeDefined();

    await expect(
      requestHandler?.({
        headers: {
          common: {},
        },
      }),
    ).resolves.toEqual({
      headers: {
        common: {},
      },
    });

    expect(unlockInstance.post).toHaveBeenCalledWith('/unlock', {
      password: 'secret',
    });
    expect(apiInstance.defaults.headers.common.Authorization).toBe('Bearer session-token');

    await expect(
      requestHandler?.({
        headers: {
          common: {},
        },
      }),
    ).resolves.toEqual({
      headers: {
        common: {},
      },
    });

    expect(unlockInstance.post).toHaveBeenCalledTimes(1);
  });
});
