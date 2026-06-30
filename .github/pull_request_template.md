## Description

<!-- Provide a clear and concise description of what this PR does. -->

## Type of Change

<!-- Mark the relevant option with an `x`. -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)
- [ ] 📝 Documentation update
- [ ] ♻️ Refactor (no functional changes)
- [ ] 🧪 Test update (adding or updating tests)
- [ ] 🔧 Build / CI changes
- [ ] 🔒 Security fix or hardening

## Related Issues

<!-- Link related issues. e.g., "Closes #123" or "Fixes #456". -->

## Changes Made

<!-- List the key changes made in this PR. -->

-
-
-

## Screenshots / Recordings

<!-- If applicable, add screenshots or recordings to demonstrate the change. -->

## Checklist

<!-- Mark completed items with an `x`. -->

### Code Quality
- [ ] My code compiles without errors (`pnpm typecheck`)
- [ ] All existing tests pass (`pnpm test`)
- [ ] I have added tests for new functionality
- [ ] No lint errors (`pnpm lint`)
- [ ] Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] I have updated documentation where applicable

### Financial Safety
- [ ] I have not introduced any `number` types for monetary values
- [ ] Financial mutations are marked with `isFinancialMutation: true`
- [ ] Idempotency keys are included for financial operations
- [ ] No server-only imports in client components

### Security
- [ ] No secrets or credentials in the code
- [ ] No new `unsafe-inline` or `unsafe-eval` CSP exceptions
- [ ] Auth/RBAC changes are tested
- [ ] New environment variables are documented in `.env.example`

## Deployment Notes

<!-- Any special considerations for deploying this change? Database migrations? Environment variable changes? Feature flags? -->

## Additional Context

<!-- Add any other context about the PR here. -->
