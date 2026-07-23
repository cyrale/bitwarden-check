# Contributing to bitwarden-check

Thank you for considering contributing to this project! This document outlines the process and conventions to follow.

## Getting started

This project uses [mise](https://mise.jdx.dev/) to manage Node.js and npm versions. Make sure you have `mise` installed, then run:

```bash
mise install
npm install
```

## Development workflow

- Run the CLI directly from source: `npm run dev`
- Run the test suite in watch mode: `npm test`
- Run the test suite once (CI-friendly): `npm run test:run`
- Type-check the project: `npm run typecheck`
- Lint the code: `npm run lint` (use `npm run lint:fix` to auto-fix issues)
- Check formatting: `npm run format` (use `npm run format:fix` to auto-fix issues)

Please make sure npm run typecheck, npm run lint, and npm run test:run all pass before submitting a pull request.

## Code style

- All code, comments, commit messages, and technical documentation must be written in English.
- Code is formatted with Prettier and linted with ESLint — please run the relevant scripts before committing.
- Tests live in the test/ directory and use Vitest.

## Commit messages

Please write clear, concise commit messages in English, describing the intent of the change rather than just listing what changed.

## Submitting changes

1. Fork the repository and create a new branch for your change.
2. Make your changes, following the code style guidelines above.
3. Ensure all checks pass (typecheck, lint, test:run).
4. Open a pull request against the main branch with a clear description of the change and its motivation.

## Code of conduct

Be respectful and constructive in your interactions.

## Reporting issues

If you find a bug or have a feature request, please open an issue with as much detail as possible (steps to reproduce, expected behavior, environment details, etc.).
