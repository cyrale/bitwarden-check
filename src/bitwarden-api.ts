/**
 * Types and enums matching the Bitwarden Vault Management API.
 * @see https://bitwarden.com/help/vault-management-api/
 */

import axios from 'axios';

export enum BitwardenItemType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  // Identity = 4,
}

export enum BitwardenFieldType {
  Text = 0,
  Hidden = 1,
  Checkbox = 2,
  Linked = 3,
}

export enum BitwardenMatch {
  Domain = 0,
  Host = 1,
  BeginWith = 2,
  Regex = 3,
  Exact = 4,
  Never = 5,
}

type BitwardenResponse<T> = {
  success: boolean;
  data: T;
};

export type BitwardenUnlockResponse = BitwardenResponse<{
  noColor: boolean;
  object: string;
  title: string;
  message: string;
  raw: string;
}>;

export type BitwardenLockResponse = BitwardenResponse<{
  noColor: boolean;
  object: string;
  title: string;
  message: string;
}>;

type BitwardenItemTemplate = {
  organizationId: string;
  collectionIds: string[];
  folderId: string;
  type: BitwardenItemType;
  name: string;
  notes: string;
  favorite: boolean;
  fields: { name: string; value: string; type: BitwardenFieldType }[];
  reprompt: number;
};

export type BitwardenItemLogin = BitwardenItemTemplate & {
  login: { uris: { uri: string; match: BitwardenMatch | null }[]; username: string; password: string; totp: string };
};

export type BitwardenItemSecureNote = BitwardenItemTemplate & {
  secureNote: { type: number };
};

export type BitwardenItemCard = BitwardenItemTemplate & {
  card: {
    cardholderName: string;
    brand: string;
    number: string;
    expMonth: string;
    expYear: string;
    code: string;
  };
};

export type BitwardenItem = BitwardenItemLogin | BitwardenItemSecureNote | BitwardenItemCard;

export type BitwardenItemResponse = BitwardenResponse<{
  object: string;
  data: BitwardenItem[];
}>;

const axiosUnlockInstance = axios.create();
const axiosInstance = axios.create();

const session = {
  key: '',
  expiration: 0,
};

export async function config(apiUrl: string, password: string): Promise<boolean> {
  axiosUnlockInstance.defaults.baseURL = apiUrl;

  axiosInstance.defaults.baseURL = apiUrl;
  axiosInstance.interceptors.request.use(async (config) => {
    // If session is invalid, unlock the vault.
    if (session.key === '' || session.expiration < Date.now()) {
      const sessionKey = await unlock(password);

      session.key = sessionKey;
      session.expiration = Date.now() + 60_000; // 1 minute

      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${sessionKey}`;
    }

    return config;
  });

  return sync();
}

/**
 * Test the Bitwarden API password.
 *
 * @param {string} apiUrl   Bitwarden API base URL
 * @param {string} password User's password
 *
 * @returns {Promise<boolean>} True if the password is valid, false otherwise
 */
export async function test(apiUrl: string, password: string): Promise<boolean> {
  const response = await axios.post<BitwardenUnlockResponse>(`${apiUrl}/unlock`, {
    password,
  });

  if (response.data.success && response.data.data.raw) {
    await axios.post(`${apiUrl}/lock`);
  }

  return response.data.success;
}

/**
 * Unlock the Bitwarden vault and retrieve a session key.
 *
 * @param {string} password User's password
 *
 * @returns {Promise<string>} The session key
 */
export async function unlock(password: string): Promise<string> {
  const response = await axiosUnlockInstance.post<BitwardenUnlockResponse>('/unlock', {
    password,
  });

  if (!response.data.success) {
    return Promise.reject(new Error('Failed to unlock vault'));
  }

  return response.data.data.raw;
}

/**
 * Lock the Bitwarden vault.
 *
 * @returns {Promise<boolean>} True if the vault was locked successfully, false otherwise
 */
export async function lock(): Promise<boolean> {
  const response = await axiosInstance.post<BitwardenLockResponse>('/lock');

  if (!response.data.success) {
    return Promise.reject(new Error('Failed to lock vault'));
  }

  return response.data.success;
}

/**
 * Sync the Bitwarden vault.
 *
 * @returns {Promise<boolean>} True if the vault was synced successfully, false otherwise
 */
export async function sync(): Promise<boolean> {
  const response = await axiosInstance.post('/sync');

  if (!response.data.success) {
    return Promise.reject(new Error('Failed to sync vault'));
  }

  return response.data.success;
}

/**
 * Retrieve the user's Bitwarden vault items
 *
 * @param {string} apiUrl Bitwarden API base URL
 * @param {string} sessionKey Session key for authentication
 *
 * @returns {Promise<BitwardenItem[]>} List of vault items
 */
export async function getVaultItems(): Promise<BitwardenItem[]> {
  const response = await axiosInstance.get<BitwardenItemResponse>('/list/object/items');

  return response.data.data.data;
}
