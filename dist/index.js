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
// Main application to check Bitwarden domains via the API
const inquirer_1 = __importDefault(require("inquirer"));
const minimist_1 = __importDefault(require("minimist"));
const bitwardenApi_1 = require("./bitwardenApi");
const domainUtils_1 = require("./domainUtils");
// Parse command line arguments using minimist
const args = (0, minimist_1.default)(process.argv.slice(2));
// Use --api-url argument or default
const BITWARDEN_API_URL = args['api-url'] || 'https://api.bitwarden.com';
// Global access token for authentication
let sessionToken = null;
/**
 * Main function: prompts for credentials, authenticates, and displays vault items
 */
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Prompt the user for email and password via CLI
            const answers = yield inquirer_1.default.prompt([
                {
                    type: 'password',
                    name: 'password',
                    message: 'Password:',
                    mask: '*',
                    validate: (input) => __awaiter(this, void 0, void 0, function* () {
                        if (input.length === 0) {
                            return 'Password cannot be empty';
                        }
                        try {
                            yield (0, bitwardenApi_1.unlock)(BITWARDEN_API_URL, input);
                        }
                        catch (error) {
                            return 'Invalid password';
                        }
                        return true;
                    }),
                },
            ]);
            yield (0, bitwardenApi_1.config)(BITWARDEN_API_URL, answers.password);
            const vaultItems = yield (0, bitwardenApi_1.getVaultItems)();
            const domains = (0, domainUtils_1.extractDomainsFromVault)(vaultItems.data || vaultItems);
            console.log(`Found ${domains.length} unique domains. Checking availability...`);
            for (const domain of domains) {
                const ok = yield (0, domainUtils_1.isDomainReachable)(domain);
                console.log(`${domain}: ${ok ? 'OK' : 'NOT REACHABLE'}`);
            }
        }
        catch (error) {
            console.error('Error:', error);
        }
    });
}
// Start the application
main();
