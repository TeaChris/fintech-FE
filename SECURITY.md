# Security Policy — BpaY

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Yes             |
| < latest | ❌ No             |

Only the latest version deployed to production receives security updates.

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

If you discover a security vulnerability in this project, please report it responsibly:

1. **Email:** Send a detailed report to the project maintainer via GitHub's private vulnerability reporting feature.
2. **GitHub Security Advisories:** Use [GitHub's private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) to submit a report directly through this repository.

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact assessment
- Suggested fix (if any)

### Response Timeline

| Action | Timeline |
|---|---|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix development | Based on severity |
| Public disclosure | After fix is deployed |

### Severity Classification

| Severity | Description | Response |
|---|---|---|
| **Critical** | Authentication bypass, data exposure, RCE | Immediate (< 24h) |
| **High** | XSS, CSRF bypass, privilege escalation | < 3 days |
| **Medium** | Information disclosure, misconfiguration | < 7 days |
| **Low** | Minor issues, defense-in-depth improvements | Next release |

## Security Practices

This project implements the following security controls:

- **Authentication:** Cookie-based with CSRF double-submit protection
- **Authorization:** Role-based access control (RBAC) with 4-layer defense-in-depth
- **Transport:** HSTS enforced (2-year max-age, includeSubDomains, preload)
- **Headers:** CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff
- **Dependencies:** Automated vulnerability scanning via Dependabot and CI audit
- **Secrets:** No hardcoded secrets; environment variables managed via deployment platform
- **Code Quality:** TypeScript strict mode, Zod boundary validation, ESLint enforcement
- **Financial Safety:** Money-safe serialization (string-only amounts), idempotency keys

## Scope

The following are **in scope** for security reports:

- Authentication and authorization bypasses
- Cross-site scripting (XSS)
- Cross-site request forgery (CSRF)
- Server-side request forgery (SSRF)
- Sensitive data exposure
- Security header misconfiguration
- Dependency vulnerabilities with proven exploitability

The following are **out of scope**:

- Vulnerabilities in the PAY backend API (report to the backend repository)
- Social engineering attacks
- Denial of service (DoS) attacks
- Issues requiring physical access to a user's device
- Vulnerabilities in third-party services (report to the respective vendor)
