"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = config;
exports.unlock = unlock;
exports.lock = lock;
exports.getVaultItems = getVaultItems;
const axios_1 = __importDefault(require("axios"));
let globalApiUrl = 'https://api.bitwarden.com';
let globalSessionKey = '';
function config(apiUrl, password) {
    return __awaiter(this, void 0, void 0, function* () {
        globalApiUrl = apiUrl;
        globalSessionKey = yield unlock(globalApiUrl, password);
    });
}
/**
 * Unlock the Bitwarden vault and retrieve a session key.
 *
 * @param {string} apiUrl   Bitwarden API base URL
 * @param {string} password User's password
 *
 * @returns {Promise<string>} The session key
 */
function unlock(apiUrl, password) {
    return __awaiter(this, void 0, void 0, function* () {
        if (globalSessionKey) {
            return globalSessionKey;
        }
        const response = yield axios_1.default.post(`${apiUrl}/unlock`, {
            password,
        });
        if (!response.data.success) {
            return Promise.reject(new Error('Failed to unlock vault'));
        }
        globalSessionKey = response.data.data.raw;
        return globalSessionKey;
    });
}
/**
 * Lock the Bitwarden vault.
 *
 * @param {string} apiUrl Bitwarden API base URL
 * @param {string} accessToken Access token for authentication
 *
 * @returns {Promise<boolean>} True if the vault was locked successfully, false otherwise
 */
function lock(apiUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.post(`${apiUrl}/lock`);
        if (!response.data.success) {
            return Promise.reject(new Error('Failed to lock vault'));
        }
        globalSessionKey = '';
        return response.data.success;
    });
}
/**
 * Retrieve the user's Bitwarden vault items
 *
 * @param {string} apiUrl Bitwarden API base URL
 * @param {string} sessionKey Session key for authentication
 *
 * @returns {Promise<any>} List of vault items
 */
function getVaultItems() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(`${globalApiUrl}/list/object/items`, {
            headers: {
                Authorization: `Bearer ${globalSessionKey}`,
            },
        });
        return response.data.data.data;
    });
}
