import axios from 'axios';

// Types for Bitwarden vault items (shared with domainUtils)
export type BitwardenUri = { uri: string };
export type BitwardenLogin = { uris?: BitwardenUri[] };
export type BitwardenItem = { login?: BitwardenLogin };

let globalApiUrl: string = 'https://api.bitwarden.com';
let globalSessionKey: string = '';

export async function config(apiUrl: string, password: string) {
  globalApiUrl = apiUrl;
  globalSessionKey = await unlock(globalApiUrl, password);
}

/**
 * Unlock the Bitwarden vault and retrieve a session key.
 *
 * @param {string} apiUrl   Bitwarden API base URL
 * @param {string} password User's password
 *
 * @returns {Promise<string>} The session key
 */
export async function unlock(apiUrl: string, password: string): Promise<string> {
  if (globalSessionKey) {
    return globalSessionKey;
  }

  const response = await axios.post(`${apiUrl}/unlock`, {
    password,
  });

  if (!response.data.success) {
    return Promise.reject(new Error('Failed to unlock vault'));
  }

  globalSessionKey = response.data.data.raw;

  return globalSessionKey;
}

/**
 * Lock the Bitwarden vault.
 *
 * @param {string} apiUrl Bitwarden API base URL
 * @param {string} accessToken Access token for authentication
 *
 * @returns {Promise<boolean>} True if the vault was locked successfully, false otherwise
 */
export async function lock(apiUrl: string): Promise<boolean> {
  const response = await axios.post(`${apiUrl}/lock`);

  if (!response.data.success) {
    return Promise.reject(new Error('Failed to lock vault'));
  }

  globalSessionKey = '';

  return response.data.success;
}

/**
 * Retrieve the user's Bitwarden vault items
 *
 * @param {string} apiUrl Bitwarden API base URL
 * @param {string} sessionKey Session key for authentication
 *
 * @returns {Promise<any>} List of vault items
 */
export async function getVaultItems(): Promise<any> {
  const response = await axios.get(`${globalApiUrl}/list/object/items`, {
    headers: {
      Authorization: `Bearer ${globalSessionKey}`,
    },
  });

  return response.data.data.data;
}
