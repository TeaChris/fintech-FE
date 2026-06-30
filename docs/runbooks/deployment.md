# Deployment Runbook — BpaY Frontend

Operational procedures for deploying, monitoring, and recovering the BpaY frontend application.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Deployment Flow](#deployment-flow)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Standard Deployment](#standard-deployment)
- [Rollback Procedures](#rollback-procedures)
- [Incident Response](#incident-response)
- [Environment Configuration](#environment-configuration)
- [Secrets Management](#secrets-management)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Developer   │────▶│  GitHub PR   │────▶│  CI Pipeline     │
│  (feature    │     │  (review +   │     │  (lint, type,    │
│   branch)    │     │   approval)  │     │   test, build,   │
└─────────────┘     └──────────────┘     │   security)      │
                                          └────────┬─────────┘
                                                   │ merge to main
                                                   ▼
                                          ┌──────────────────┐
                                          │  Deploy Pipeline │
                                          │  (validate →     │
                                          │   deploy →       │
                                          │   smoke test)    │
                                          └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │  Vercel          │
                                          │  Production      │
                                          │  (CDN + Edge)    │
                                          └──────────────────┘
```

### Deployment Platform

| Component | Technology |
|---|---|
| Hosting | Vercel |
| CDN | Vercel Edge Network |
| CI/CD | GitHub Actions |
| Source Control | GitHub |
| Monitoring | Vercel Analytics + GitHub Actions logs |

---

## Deployment Flow

### Automated (Standard)

1. Developer opens PR against `main`
2. CI pipeline runs automatically (lint, typecheck, test, build, security)
3. Vercel creates a preview deployment (if GitHub integration is connected)
4. Code reviewer approves the PR
5. PR is merged (squash-merge preferred)
6. `deploy-production.yml` triggers automatically
7. Full CI re-runs on the merge commit (defense-in-depth)
8. Vercel CLI builds and deploys to production
9. Smoke tests validate the deployment
10. If smoke tests pass → deployment is live
11. If smoke tests fail → alert, investigate, rollback if needed

### Manual Override

If automated deployment is blocked or the pipeline is down:

```bash
# 1. Ensure you're on main with latest changes
git checkout main && git pull origin main

# 2. Install Vercel CLI
pnpm add -g vercel

# 3. Deploy directly (requires VERCEL_TOKEN)
vercel --prod
```

> ⚠️ **Manual deployments bypass CI gates.** Only use in genuine emergencies. Document the reason in a post-incident report.

---

## Pre-Deployment Checklist

Before every production deployment, verify:

- [ ] All CI checks pass (lint, typecheck, test, build)
- [ ] PR has been reviewed and approved
- [ ] No high/critical dependency vulnerabilities (`pnpm audit`)
- [ ] Environment variables are configured in Vercel for production
- [ ] No `.env` files contain production secrets
- [ ] The backend API is healthy and compatible with this frontend version

---

## Standard Deployment

### Step 1 — Merge PR

Squash-merge the approved PR into `main`. This triggers the `deploy-production.yml` workflow.

### Step 2 — Monitor Deployment

1. Go to **GitHub Actions** → **Deploy Production** workflow
2. Monitor the three stages:
   - **Validate** — re-runs lint, typecheck, tests, build
   - **Deploy** — pushes to Vercel production
   - **Smoke Test** — validates landing page, auth routes, security headers

### Step 3 — Verify

After smoke tests pass:
1. Visit the production URL
2. Verify the landing page loads correctly
3. Verify sign-in page loads
4. Check browser DevTools for console errors
5. Verify network requests to the API backend succeed

---

## Rollback Procedures

### Scenario 1 — Smoke Tests Fail

**Impact:** Deployment completed but may be broken.

**Action:**
1. Go to **Vercel Dashboard** → **Deployments**
2. Find the **previous successful deployment** (green checkmark)
3. Click the deployment → **Promote to Production**
4. Verify the rollback via smoke tests
5. Investigate the failing deployment

**Time to recovery:** < 5 minutes

### Scenario 2 — Visual Bug or UI Regression

**Impact:** Application works but looks broken.

**Action:**
1. If non-critical: fix in a new PR, deploy normally
2. If critical (affects financial operations):
   - Promote previous deployment in Vercel (same as Scenario 1)
   - Fix the issue in a new branch
   - Test in preview deployment
   - Deploy when ready

### Scenario 3 — Backend API Incompatibility

**Impact:** Frontend deployed but backend API has changed.

**Action:**
1. Determine which version is correct (frontend or backend)
2. If frontend needs to roll back: promote previous Vercel deployment
3. If backend needs to roll back: coordinate with backend team
4. **Future prevention:** implement API versioning and contract tests

### Scenario 4 — Security Incident

**Impact:** Vulnerability discovered in production.

**Action:**
1. Assess severity using SECURITY.md classification
2. If Critical/High:
   - Immediately promote the last known-safe deployment in Vercel
   - Disable the vulnerable feature if possible (feature flag)
   - Fix the vulnerability in a hotfix branch
   - Fast-track PR review (minimum 1 approval)
   - Deploy fix through normal pipeline
3. Document in post-incident report

---

## Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|---|---|---|---|
| **SEV-1** | Production down, data at risk | Immediate | Auth bypass, data leak, full outage |
| **SEV-2** | Major feature broken | < 1 hour | Dashboard broken, payments UI non-functional |
| **SEV-3** | Minor feature broken | < 4 hours | Styling issue, non-critical page error |
| **SEV-4** | Cosmetic or minor | Next business day | Typo, minor UI inconsistency |

### Response Procedure

1. **Detect** — Smoke tests, user reports, or monitoring alerts
2. **Assess** — Determine severity level
3. **Mitigate** — Rollback if SEV-1 or SEV-2
4. **Fix** — Develop and test the fix
5. **Deploy** — Push fix through normal CI/CD pipeline
6. **Review** — Post-incident review within 48 hours

---

## Environment Configuration

### Environment Variables by Environment

| Variable | Local | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/` | Preview backend URL | Production backend URL |
| `API_BASE_URL` | `http://localhost:8000/` | Preview backend URL | Production backend URL |
| `CSRF_COOKIE_NAME` | `XSRF-TOKEN` | `XSRF-TOKEN` | `XSRF-TOKEN` |
| `NEXT_PUBLIC_API_DEBUG` | `true` | `false` | `false` |

### Setting Environment Variables in Vercel

1. Go to **Vercel Dashboard** → **Project Settings** → **Environment Variables**
2. Add each variable with the appropriate scope:
   - **Production** — production values only
   - **Preview** — staging/test values
   - **Development** — local development values (optional)
3. After adding variables, redeploy to apply changes

---

## Secrets Management

### GitHub Secrets (Required for CI/CD)

| Secret | Purpose | How to Obtain |
|---|---|---|
| `VERCEL_TOKEN` | Authenticate Vercel CLI | Vercel Dashboard → Settings → Tokens |
| `VERCEL_ORG_ID` | Identify Vercel organization | `.vercel/project.json` or Vercel CLI |
| `VERCEL_PROJECT_ID` | Identify Vercel project | `.vercel/project.json` or Vercel CLI |

### Setting GitHub Secrets

1. Go to **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each secret with the exact name from the table above
4. Secrets are encrypted and only exposed to workflows at runtime

### Obtaining Vercel Credentials

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Login to Vercel
vercel login

# 3. Link the project (creates .vercel/project.json)
vercel link

# 4. Extract IDs from .vercel/project.json
cat .vercel/project.json
# Output: { "orgId": "...", "projectId": "..." }

# 5. Create a token
# Go to https://vercel.com/account/tokens
# Create a new token with appropriate scope
```

> ⚠️ **Never commit `.vercel/project.json` to version control.** It should be in `.gitignore` (it already is — `.vercel` is listed).
