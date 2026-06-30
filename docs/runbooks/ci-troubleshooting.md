# CI Troubleshooting Guide — BpaY Frontend

Common CI pipeline failures and their resolutions.

---

## Table of Contents

- [Quick Diagnostics](#quick-diagnostics)
- [Lint Failures](#lint-failures)
- [TypeScript Errors](#typescript-errors)
- [Test Failures](#test-failures)
- [Build Failures](#build-failures)
- [Security Audit Failures](#security-audit-failures)
- [Dependency Issues](#dependency-issues)
- [Deployment Failures](#deployment-failures)
- [GitHub Actions Issues](#github-actions-issues)

---

## Quick Diagnostics

Before diving into specific failures, run these locally:

```bash
# Reproduce CI environment locally
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If all pass locally but fail in CI, the issue is likely:
1. **Environment difference** — different Node.js version (CI uses v22)
2. **Stale lockfile** — `pnpm-lock.yaml` doesn't match `package.json`
3. **Missing environment variable** — CI doesn't have `.env.local`
4. **Platform difference** — Windows vs. Linux (line endings, paths)

---

## Lint Failures

### Symptom
`pnpm lint` fails in CI.

### Common Causes

| Cause | Fix |
|---|---|
| New code has lint errors | Run `pnpm lint` locally, fix reported issues |
| ESLint config changed | Ensure `eslint.config.mjs` changes are intentional |
| New dependency has issues | Check if the dependency requires ESLint plugin |

### Resolution
```bash
# Run lint with auto-fix
pnpm lint --fix

# If a rule is intentionally violated, add an inline disable:
# eslint-disable-next-line rule-name
```

---

## TypeScript Errors

### Symptom
`pnpm typecheck` fails with type errors.

### Common Causes

| Cause | Fix |
|---|---|
| Missing type annotations | Add explicit types |
| Incompatible dependency types | Check `@types/*` versions |
| `noUncheckedIndexedAccess` violation | Add optional chaining or null checks |
| Server/client import boundary | Don't import `src/api/server/` in client components |

### Resolution
```bash
# Run typecheck locally
pnpm typecheck

# For detailed output:
npx tsc --noEmit --pretty
```

---

## Test Failures

### Symptom
`pnpm test` fails with test errors.

### Common Causes

| Cause | Fix |
|---|---|
| Changed API contract | Update MSW handlers in `src/__tests__/mocks/handlers.ts` |
| Changed component structure | Update test assertions |
| Flaky async tests | Add proper `waitFor` / `act` wrappers |
| Missing test setup | Ensure `src/__tests__/setup.ts` imports are correct |

### Resolution
```bash
# Run tests in watch mode for debugging
pnpm test:watch

# Run a specific test file
pnpm test -- src/api/client/__tests__/retry.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose
```

### Money Safety Test Failures

If tests involving monetary values fail:
- Verify all amounts are **strings** (never `number`)
- Use `MoneySchema` from `src/api/schemas/common.schema.ts`
- Check that `parseFloat()` or `Number()` are not used on money values

---

## Build Failures

### Symptom
`pnpm build` (or `next build`) fails.

### Common Causes

| Cause | Fix |
|---|---|
| Server component using client API | Add `'use client'` directive or move to server module |
| Missing environment variable | Ensure `NEXT_PUBLIC_*` vars are set (build-time) |
| Dynamic import error | Check import paths and barrel exports |
| CSS/Tailwind error | Verify Tailwind v4 syntax in `globals.css` |
| Large bundle size | Check for accidental imports (tree-shaking) |

### Resolution
```bash
# Build locally with verbose output
pnpm build

# Check for specific page errors
# The Next.js build output will show which pages failed

# Verify environment variables
echo $NEXT_PUBLIC_API_BASE_URL
```

### Build-Time vs. Runtime Environment Variables

| Prefix | Available At | Example |
|---|---|---|
| `NEXT_PUBLIC_*` | Build time + runtime (browser) | `NEXT_PUBLIC_API_BASE_URL` |
| No prefix | Runtime only (server) | `API_BASE_URL` |

In CI, `NEXT_PUBLIC_*` variables must be set as environment variables in the build step, **not** in `.env.local` (which doesn't exist in CI).

---

## Security Audit Failures

### Symptom
`pnpm audit` reports high/critical vulnerabilities.

### Resolution

```bash
# See full audit report
pnpm audit

# Try to auto-fix
pnpm audit --fix

# If auto-fix doesn't work, check if the vulnerability is:
# 1. In a production dependency → must fix
# 2. In a dev dependency → lower priority but still fix
# 3. Not exploitable in this context → document exception
```

### Handling False Positives

If `pnpm audit` reports a vulnerability that is not exploitable in this project:

1. Document why it's not exploitable
2. Create a GitHub issue tracking the upstream fix
3. **Do NOT** ignore security audit failures without documentation

### License Compliance Failures

If the license check fails:
1. Identify which dependency has the copyleft license
2. Check if it's a production or dev dependency
3. If production: find an alternative with a permissive license
4. If dev-only: it may be acceptable (but still review)

---

## Dependency Issues

### Lockfile Mismatch

**Symptom:** `pnpm install --frozen-lockfile` fails.

**Cause:** `package.json` was modified without running `pnpm install` to update the lockfile.

**Fix:**
```bash
# Regenerate the lockfile
pnpm install

# Commit the updated lockfile
git add pnpm-lock.yaml
git commit -m "build: update lockfile"
```

### Peer Dependency Conflicts

**Symptom:** Install fails with peer dependency warnings/errors.

**Fix:**
```bash
# Check what's conflicting
pnpm install --frozen-lockfile 2>&1 | grep "WARN"

# If the conflict is in a dev dependency, it's usually safe to ignore
# For production deps, resolve by updating to compatible versions
```

---

## Deployment Failures

### Vercel Build Fails

**Symptom:** `deploy-production.yml` fails at the deploy step.

**Common Causes:**

| Cause | Fix |
|---|---|
| Missing `VERCEL_TOKEN` secret | Add to GitHub Secrets |
| Missing `VERCEL_ORG_ID` secret | Add to GitHub Secrets |
| Missing `VERCEL_PROJECT_ID` secret | Add to GitHub Secrets |
| Token expired | Generate new token at vercel.com/account/tokens |
| Vercel project not linked | Run `vercel link` locally |

### Smoke Tests Fail

**Symptom:** Deployment succeeds but smoke tests fail.

**Cause:** The deployed application is returning unexpected responses.

**Resolution:**
1. Check the deployment URL manually
2. Verify the backend API is reachable from Vercel's network
3. Check Vercel function logs for server-side errors
4. If the issue is transient: re-run the workflow
5. If the issue persists: rollback (see deployment runbook)

---

## GitHub Actions Issues

### Workflow Not Triggering

**Possible Causes:**
1. Workflow file has YAML syntax errors → validate with `actionlint`
2. Workflow path filter doesn't match changed files
3. GitHub Actions is disabled for the repository
4. Concurrency group is blocking the run

### Workflow Timeout

All jobs have explicit timeouts. If a job consistently times out:
1. Check if `pnpm install` is slow (cache miss)
2. Check if tests are hanging (infinite loop, unresolved promise)
3. Check if `next build` is very slow (large page count)

### Cache Issues

If CI is slow despite caching:
```bash
# pnpm cache is keyed by pnpm-lock.yaml hash
# If the lockfile changed, cache is invalidated (expected)
# If the lockfile hasn't changed and cache is still miss,
# the cache may have been evicted (GitHub's 10GB limit per repo)
```

### Permission Errors

If a workflow fails with permission errors:
1. Check the `permissions` block in the workflow file
2. Ensure the required permissions are explicitly granted
3. For fork PRs: `pull_request` events have limited permissions (by design)
