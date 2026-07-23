# Repository Agent Guide

This file provides guidance to AI coding agents when working with code in this repository. It keeps the CLAUDE.md filename for compatibility with existing tooling, and AGENTS.md symlinks to it for other agents.

## Project overview

See [README.md](./README.md) for project description, installation and usage.

## Domain context

This project queries the [Bitwarden Vault Management API](https://bitwarden.com/help/vault-management-api/) (a local API exposed by the Bitwarden desktop client, typically on `http://localhost:8087`). Refer to this documentation for:

- the list of available endpoints (`/list/object/items`, etc.)
- the shape of the returned objects (see `src/api.ts` for the corresponding enums: `BitwardenItemType`, `BitwardenFieldType`, `BitwardenMatch`)

## Language conventions

- All code, comments, commit messages, variable/function names, and technical documentation (README, this file, etc.) must be written in **English**.
- Conversations with the AI assistant (chat, explanations) may happen in another language (French) — this does not apply to anything committed to the repository.

## Tech stack

- **Language**: TypeScript
- **CLI framework**: [commander](https://github.com/tj/commander.js) — each subcommand is registered via a `register<Name>Command(program)` function
- **Environment config**: `dotenv` — used to set defaults (e.g. `BITWARDEN_API_URL`) without repeating them on every command invocation. See `.env.example` for available variables.
- **Prompts**: `inquirer` for interactive input (e.g. password prompt)
- **Testing**: `vitest`, all test files live under `test/`, mirroring the `src/` structure (e.g. `src/cli/domains.ts` → `test/cli/domains.test.ts`)

## Project structure

```
src/
  index.ts          # Entry point: registers subcommands, calls program.parse()
  cli/
    domains.ts      # `domains` subcommand (registerDomainsCommand)
    ips.ts          # (future) `ips` subcommand
  bitwarden-api.ts  # Wrapper around Bitwarden CLI/API (config, test, getVaultItems)
  domains.ts        # Domain extraction & reachability logic
test/
  cli/
    domains.test.ts
```

- **`index.ts` stays thin**: only responsible for wiring subcommands together and calling `program.parse()`. No business logic here.
- **One file per subcommand** under `src/cli/`, each exporting a `register<Name>Command(program: Command): void` function.
- Business logic (Bitwarden API calls, domain checks, etc.) lives outside `src/cli/`, so it can be unit-tested independently of the CLI layer.

## Adding a new subcommand

1. Create `src/cli/<name>.ts` exporting `register<Name>Command(program)`.
2. Register it in `src/index.ts`:

```ts
import { register<Name>Command } from './cli/<name>';
register<Name>Command(program);
```

3. Add tests in `test/cli/<name>.test.ts`.
4. Document the new subcommand in the README.md.

## Testing conventions

- Framework: `vitest`
- Test files live under `test/`, mirroring `src/` (never colocated with source files)
- To test a subcommand in isolation, instantiate a fresh `Command`, register only the subcommand under test, and call `program.parseAsync([...], { from: 'user' })`
- Mock external dependencies (`inquirer`, `bitwarden-api`) with `vi.mock(...)` — tests must not prompt for real input or hit a real API

## npm scripts

- `build` — compile TypeScript to `dist/`
- `start` — build and run the compiled CLI (`dist/index.js`)
- `dev` — run the CLI directly from source (via `tsx`), without building
- `typecheck` — run the TypeScript compiler in check-only mode (no output)
- `lint` — check code with ESLint (no changes)
- `lint:fix` — check and auto-fix with ESLint
- `format` — check formatting with Prettier (no changes)
- `format:fix` — auto-fix formatting with Prettier
- `test` — run the test suite with `vitest` (watch mode)
- `test:run` — run the test suite once (no watch mode, suitable for CI)
- `test:ui` — run the test suite with vitest's interactive UI
- `coverage` — run the test suite once and generate a coverage report

> Naming convention: the bare script name (`lint`, `format`) always **checks**; a `:fix` variant applies corrections. Keep this consistent for any future script.

> ⚠️ Agents should always use `test:run`, not `test`, which starts an interactive watch mode and never terminates.

## CLI parsing

- Library: `commander`
- `--version` should stay in sync with `package.json` (consider importing it directly via `resolveJsonModule` instead of hardcoding it)
- `--help` is generated automatically for the root command and each subcommand — keep `.description()` and `.option()` descriptions accurate, they double as user-facing documentation

## Security

- Never log or persist the vault password in plaintext
- Never commit `.env` (only `.env.example`, without real values)
