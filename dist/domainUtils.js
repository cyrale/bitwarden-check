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
exports.extractDomainsFromVault = extractDomainsFromVault;
exports.isDomainReachable = isDomainReachable;
const axios_1 = __importDefault(require("axios"));
/**
 * Extract all unique domains from Bitwarden vault items
 */
function extractDomainsFromVault(vaultItems) {
    const domains = new Set();
    for (const item of vaultItems) {
        if (item.login && Array.isArray(item.login.uris)) {
            for (const uriObj of item.login.uris) {
                if (uriObj && uriObj.uri) {
                    try {
                        const url = new URL(uriObj.uri);
                        domains.add(url.hostname);
                    }
                    catch (_a) {
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
function isDomainReachable(domain) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try HTTPS first, fallback to HTTP if needed
            yield axios_1.default.head(`https://${domain}`, { timeout: 5000 });
            return true;
        }
        catch (_a) {
            try {
                yield axios_1.default.head(`http://${domain}`, { timeout: 5000 });
                return true;
            }
            catch (_b) {
                return false;
            }
        }
    });
}
