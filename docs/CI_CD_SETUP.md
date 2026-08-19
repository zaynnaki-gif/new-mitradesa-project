# CI/CD Setup - MITRADESA

## GitHub Actions Workflows

### CI Pipeline (ci.yml)

Triggers on push to main/develop branches and pull requests.

**Jobs:**
1. **Lint** - ESLint validation
2. **Type Check** - TypeScript validation
3. **Unit Tests** - Jest tests with PostgreSQL service
4. **Build** - Production builds

### E2E Pipeline (e2e.yml)

Runs after CI passes on main branch.

**Jobs:**
1. **E2E Tests** - Playwright tests

## Environment Variables

### CI/CD Secrets

Set these in GitHub repository settings:

```bash
# Required
TEST_DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional (for deployment)
SENTRY_DSN=https://example@....
DEPLOY_TOKEN=ghp_...
```

## Test Database

Uses Docker PostgreSQL service container:

```yaml
postgres:15-alpine
- User: test
- Password: test
- Database: mitradesa_test
- Port: 5432
```

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local test database)
- PostgreSQL 15+ (or Docker)

### Setup

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run tests
npm run test:api

# Run with specific database
TEST_DATABASE_URL=postgres://... npm test
```

## Workflow Status

Check repository Actions tab for pipeline status.

## Manual Run

To trigger workflows manually:

```bash
# Via GitHub CLI
gh workflow run ci.yml

# Via API
gh api /repos/OWNER/REPO/actions/workflows/ci.yml/dispatches -f ref=main
```
