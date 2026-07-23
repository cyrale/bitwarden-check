# bitwarden-check

A Node.js/TypeScript CLI tool that audits a Bitwarden vault. Currently supports the `domains` sub-command, which checks the accessibility of the domains associated with vault items via the Bitwarden API.

## Commands

- `bitwarden-check domains` — Extracts hostnames from vault item URIs and checks whether each one is currently reachable. Useful to spot logins pointing to dead/decommissioned domains.
  - `--api-url <url>` — Bitwarden API base URL (default: `BITWARDEN_API_URL` env var, or `https://api.bitwarden.com`)

<!-- - `bitwarden-check ips` — (planned) ... -->

## Prerequisites

- **Node.js** (managed via [`mise`](https://mise.jdx.dev/))
- **npm**

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd bitwarden-check

# Install Node.js version via mise (reads mise.toml)
mise install

# Install dependencies
npm install
```

## Configuration

Copy the `.env.example` file to `.env` and adjust the values as needed:

```bash
cp .env.example .env
```

**`.env.example`**

```env
BITWARDEN_API_URL=https://api.bitwarden.com
```

> ⚠️ **Never commit your `.env` file.** It contains secrets and must stay local. Only `.env.example` (with no real values) is committed.

## Usage

```bash
# Run the domains audit sub-command
npm start -- domains

# Or directly via tsx
npx tsx src/index.ts domains

# With a custom API URL
npm start -- domains --api-url https://api.bitwarden.com
```

During execution you will be prompted interactively for your Bitwarden master password. The input is **masked** and never displayed in plain text — it is never logged or persisted anywhere.

## Available npm Scripts

| Script               | What it does                                                          |
| -------------------- | --------------------------------------------------------------------- |
| `npm start`          | Build and run the CLI (production-like)                               |
| `npm run dev`        | Run the CLI directly from TypeScript (for local development, via tsx) |
| `npm run build`      | Compile TypeScript to JavaScript                                      |
| `npm run typecheck`  | Check types without emitting files                                    |
| `npm run lint`       | Lint (check only, no auto-fix)                                        |
| `npm run lint:fix`   | Lint + automatically fix issues where possible                        |
| `npm run format`     | Check formatting without modifying files                              |
| `npm run format:fix` | Format code with Prettier                                             |
| `npm run test`       | Run tests with Vitest                                                 |
| `npm run test:ui`    | Run tests with Vitest's UI                                            |
| `npm run coverage`   | Run tests and generate a coverage report                              |

> **Convention:** a script without a suffix (e.g. `lint`, `format`) only checks and never auto-fixes. A script with the `:fix` suffix (e.g. `lint:fix`, `format:fix`) applies automatic corrections. This applies to any future script as well.

## Contributing

Before committing, always run the check scripts:

```bash
npm run typecheck
npm run lint
npm run format
npm run test:run
```

If lint or format:check report issues, you can often fix them automatically:

```bash
npm run lint:fix
npm run format:fix
```

Fix any remaining issues before opening a pull request.

## Security

- **Never commit a `.env` file.** Only `.env.example` (with placeholder values) should be tracked.
- Your vault master password is requested interactively and is **never logged or stored in plain text**.
