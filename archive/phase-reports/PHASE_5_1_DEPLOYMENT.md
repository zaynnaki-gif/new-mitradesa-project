# PHASE 5.1 DEPLOYMENT

**Date:** 2026-08-14
**Phase:** 5.1
**Status:** BLOCKED - INFRASTRUCTURE REQUIRED

---

## DEPLOYMENT SUMMARY

```
========================================
DEPLOYMENT STATUS
========================================

GitHub CI:                [PASS]
Build Artifact:           [PASS]
Staging Server:           [NOT PROVISIONED]
Staging Database:         [NOT PROVISIONED]
Staging Storage:         [NOT CONFIGURED]
Staging Secrets:         [NOT SET]
Deployment Script:        [NOT CREATED]

FINAL STATUS: BLOCKED
========================================
```

---

## CURRENT CI/CD PIPELINE

### CI Workflow (GitHub Actions)

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma generate
      - run: |
          npx tsc --noEmit -p apps/api/tsconfig.json
          npx tsc --noEmit -p apps/web/tsconfig.json

  test-unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
    env:
      TEST_DATABASE_URL: postgres://test:test@localhost:5432/mitradesa_test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx prisma generate
      - run: npm run test:api

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build:api
      - run: npm run build:web
```

### E2E Workflow

```yaml
# .github/workflows/e2e.yml
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```

---

## STAGING DEPLOYMENT REQUIRED

### Infrastructure

| Component | Status | Required |
|-----------|--------|----------|
| Database Server | ❌ | PostgreSQL 15 |
| Storage | ❌ | S3/R2/Local |
| API Server | ❌ | Node.js 18+ |
| Web Server | ❌ | Nginx/Node |
| Domain | ❌ | staging.mitras.id |
| SSL Certificate | ❌ | Let's Encrypt |

### GitHub Secrets Required

| Secret | Status |
|--------|--------|
| STAGING_DATABASE_URL | ❌ NOT SET |
| STAGING_JWT_SECRET | ❌ NOT SET |
| STAGING_API_URL | ❌ NOT SET |
| STAGING_WEB_URL | ❌ NOT SET |

---

## DEPLOYMENT WORKFLOW

### Target Pipeline

```
GitHub Push (main)
       ↓
GitHub Actions CI
   - lint ✅
   - typecheck ✅
   - test ✅
   - build ✅
       ↓
GitHub Actions Deploy
   - Pull artifacts
   - Run migrations
   - Deploy to staging
       ↓
Health Check
   - GET /api/health/live
   - GET /api/health/ready
       ↓
Smoke Test
   - Login
   - Public endpoints
       ↓
Staging Ready
```

---

## MANUAL DEPLOYMENT STEPS

### 1. Provision Infrastructure

```bash
# Create staging database
psql -h host -U postgres -c "CREATE DATABASE mitradesa_staging;"

# Create staging storage bucket (S3/R2)
aws s3 mb s3://mitradesa-staging
```

### 2. Configure Environment

```bash
# Create .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://user:pass@host:5432/mitradesa_staging
JWT_SECRET=your-64-char-secret
API_PORT=3001
WEB_PORT=3000
API_URL=https://api.staging.mitras.id
WEB_URL=https://staging.mitras.id
ALLOWED_ORIGINS=https://staging.mitras.id
STORAGE_BACKEND=local  # or s3
UPLOAD_DIR=./uploads
```

### 3. Run Migrations

```bash
export DATABASE_URL="postgresql://user:pass@host:5432/mitradesa_staging"
cd apps/api
npx prisma migrate deploy
npx prisma migrate status
npx prisma validate
```

### 4. Seed Pilot Data

```bash
export NODE_ENV=staging
export DATABASE_URL="postgresql://user:pass@host:5432/mitradesa_staging"
npx tsx prisma/seed-pilot.ts
```

### 5. Deploy Application

```bash
npm ci
npm run build:api
npm run build:web

# Using PM2
pm2 start dist/index.js --name mitradesa-api --update-env
pm2 restart mitradesa-api
```

### 6. Verify Deployment

```bash
# Health check
curl https://api.staging.mitras.id/api/health/live
curl https://api.staging.mitras.id/api/health/ready

# Smoke test
curl -X POST https://api.staging.mitras.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_desa","password":"AdminDesa123!"}'
```

---

## PILOT ACCOUNTS

After seeding, these accounts will be available:

| Username | Password | Role |
|----------|----------|------|
| superadmin | SuperAdmin123! | Super Admin |
| admin_desa | AdminDesa123! | Admin Desa |
| operator | Operator123! | Operator |
| editor_cms | EditorCMS123! | Editor CMS |
| petugas | Petugas123! | Petugas Pelayanan |
| penandatangan | Penandatangan123! | Penandatangan |

---

## SMOKE TEST SCRIPT

```bash
#!/bin/bash
# smoke-test-staging.sh

STAGING_API="https://api.staging.mitras.id"
STAGING_WEB="https://staging.mitras.id"

echo "Running Staging Smoke Tests..."
echo "=============================="

# 1. Health check
echo -n "1. Health check (live): "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/api/health/live)
[ "$response" = "200" ] && echo "PASS" || echo "FAIL (HTTP $response)"

# 2. Ready check
echo -n "2. Health check (ready): "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/api/health/ready)
[ "$response" = "200" ] && echo "PASS" || echo "FAIL (HTTP $response)"

# 3. Public berita
echo -n "3. Public berita: "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/api/public/layanan)
[ "$response" = "200" ] && echo "PASS" || echo "FAIL (HTTP $response)"

echo "=============================="
echo "Smoke tests completed"
```

---

## HUMAN ACTIONS REQUIRED

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Provision staging database | DevOps | CRITICAL |
| 2 | Configure staging storage | DevOps | HIGH |
| 3 | Set up staging domain | DevOps | HIGH |
| 4 | Add GitHub secrets | DevOps | HIGH |
| 5 | Create deployment workflow | DevOps | HIGH |
| 6 | Deploy to staging | DevOps | HIGH |
| 7 | Run smoke tests | QA | HIGH |

---

*End of Deployment Documentation*
