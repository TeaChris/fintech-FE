# Contributing to Frontend Architecture

Thank you for your interest in contributing! This document provides guidelines and standards to help ensure a smooth and consistent contribution process.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Architecture Rules](#architecture-rules)
- [Code Standards](#code-standards)

---

## Code of Conduct

This project follows a standard [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. Please be respectful and constructive in all interactions.

---

## Getting Started

1. **Fork** the repository and clone your fork locally.
2. **Install dependencies:**
      ```bash
      pnpm install
      ```
3. **Copy the environment template:**
      ```bash
      cp .env.example .env.local
      ```
4. **Verify your setup:**
      ```bash
      pnpm typecheck    # Must pass with zero errors
      pnpm test         # Must pass all 56+ tests
      pnpm lint         # Must have no lint errors
      ```

---

## Development Workflow

1. Create a feature branch from `main`:
      ```bash
      git checkout -b feat/your-feature-name
      ```
2. Make your changes following the [Architecture Rules](#architecture-rules).
3. Run all checks before committing:
      ```bash
      pnpm typecheck && pnpm lint && pnpm test
      ```
4. Commit using the [Conventional Commits](#commit-convention) format.
5. Push your branch and open a Pull Request.

---

## Commit Convention

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via **commitlint** and **Husky**. Every commit message must follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Allowed Types

| Type       | Description                                           |
| ---------- | ----------------------------------------------------- |
| `feat`     | A new feature                                         |
| `fix`      | A bug fix                                             |
| `docs`     | Documentation changes only                            |
| `style`    | Code style changes (formatting, semicolons, etc.)     |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `perf`     | Performance improvements                              |
| `test`     | Adding or updating tests                              |
| `build`    | Changes to the build system or dependencies           |
| `ci`       | CI/CD pipeline changes                                |
| `chore`    | Other changes that don't modify src or test files     |
| `revert`   | Reverts a previous commit                             |

### Examples

```bash
# ✅ Good
git commit -m "feat(accounts): add account summary endpoint"
git commit -m "fix(retry): prevent retry on financial POST mutations"
git commit -m "test(errors): add mapResponseToError coverage"

# ❌ Bad — will be rejected by commitlint
git commit -m "updated stuff"
git commit -m "fix bug"
```

### Pre-Commit Hooks

Husky enforces the following on every commit:

- **`pre-commit`** — Runs `pnpm typecheck` and `pnpm lint` to ensure only type-safe, lint-clean code is committed.
- **`commit-msg`** — Runs `commitlint` to validate the commit message format.

---

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Fill out the PR template completely (it will auto-populate when you open a PR).
3. Ensure all CI checks pass (typecheck, lint, tests).
4. Request a review from at least one maintainer.
5. Address all review comments before merge.
6. Squash-merge is preferred for a clean history.

### PR Checklist

- [ ] Code compiles without errors (`pnpm typecheck`)
- [ ] All tests pass (`pnpm test`)
- [ ] No lint errors (`pnpm lint`)
- [ ] Commit messages follow conventional commit format
- [ ] New features include tests
- [ ] Documentation is updated if applicable

---

## Architecture Rules

> **These are non-negotiable.** PRs violating these rules will not be merged.

### File Organization

- All feature code goes in `src/features/<feature>/`
- API client logic stays in `src/api/client/`
- Domain schemas stay in `src/api/schemas/`
- TanStack Query hooks stay in `src/api/hooks/`
- Server-only code stays in `src/api/server/`

### Money Safety

- **All monetary values MUST be `string` type** — never `number`.
- Use `MoneySchema` from `src/api/schemas/common.schema.ts` for all money fields.
- Never use `parseFloat()` or `Number()` on monetary values.

### Financial Mutation Safety

- All money-transfer mutations MUST set `isFinancialMutation: true`.
- These mutations are NEVER auto-retried by the retry engine.
- Always include an idempotency key for financial operations.

### Server/Client Separation

- Never import `src/api/server/` in client components.
- Server modules use the `server-only` package guard.
- Auth tokens are stored in `httpOnly` cookies — never in localStorage.

---

## Code Standards

- **TypeScript:** Strict mode enabled. No `any` types unless absolutely necessary.
- **Imports:** Use `@/` path alias. Use `pnpm` (not `npm` or `npx`).
- **Errors:** Use domain-specific error classes from `src/api/client/errors.ts`.
- **Testing:** Every new module must have corresponding tests.
- **Comments:** Preserve existing comments. Add JSDoc for public APIs.

---

## Questions?

If you have questions about contributing, feel free to open a [Discussion](../../discussions) or reach out to a maintainer.

Thank you for helping build a safer, more reliable fintech platform! 🚀
