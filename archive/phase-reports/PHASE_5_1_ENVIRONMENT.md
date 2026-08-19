# PHASE 5.1 ENVIRONMENT MATRIX

**Date:** 2026-08-14
**Phase:** 5.1
**Status:** IN PROGRESS

---

## ENVIRONMENT MATRIX

| Environment | Database | Storage | Secrets | Purpose | Status |
|-------------|----------|---------|---------|---------|--------|
| Development | **Supabase (PROD)** ⚠️ | Local ./uploads | Local .env | Local dev | ⚠️ RISK |
| Test | Docker 127.0.0.1:5432 | Test storage | CI secrets | Automated tests | ✅ Isolated |
| Staging | **NOT CONFIGURED** ❌ | NOT CONFIGURED | NOT SET | Pilot testing | ❌ MISSING |
| Production | Supabase (separate) | Production bucket | Vault/Prod secrets | Live service | ✅ Protected |

---

## ISOLATION REQUIREMENT

```
Development ≠ Test ≠ Staging ≠ Production
```

**CRITICAL:** Development currently connects to Supabase production database.

### Required Isolation

| Environment | Database | Host | Risk Level |
|-------------|----------|------|------------|
| Development | Separate dev DB | New Supabase project or local | HIGH |
| Test | mitradesa_test | 127.0.0.1:5432 | LOW |
| Staging | mitradesa_staging | TBD | CRITICAL |
| Production | mitradesa | Supabase prod | LOW |

---

## CURRENT DATABASE CONFIGURATION

### apps/api/.env (Development)

```bash
DATABASE_URL="postgresql://postgres.psxppjmldyhwrqqyqegg:***@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

**⚠️ WARNING:** This points to Supabase PRODUCTION database.

### apps/api/.env.test (Test Local)

```bash
TEST_DATABASE_URL=postgresql://mitradesa_test:test_secure_password_2024@127.0.0.1:5432/mitradesa_test
```

### .github/workflows/ci.yml (Test CI)

```bash
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/mitradesa_test
```

---

## REQUIRED CHANGES

### 1. Development Database

**Current:** Points to production Supabase

**Required:** Create separate development database

**Options:**

#### Option A: New Supabase Project
```bash
# Create new Supabase project
# Get new DATABASE_URL
# Update .env
```

#### Option B: Local PostgreSQL
```bash
# Install PostgreSQL locally
# Create database: mitradesa_dev
# Update .env
```

**Action Required:** HUMAN ACTION

### 2. Staging Database

**Current:** NOT CONFIGURED

**Required:** Create dedicated staging database

**Action Required:** HUMAN ACTION

### 3. Staging Environment Variables

```bash
# Staging Database
STAGING_DATABASE_URL=postgresql://user:pass@host:5432/mitradesa_staging

# Staging JWT
STAGING_JWT_SECRET=your-64-char-secret
STAGING_JWT_EXPIRES_IN=24h

# Staging Application
STAGING_NODE_ENV=staging
STAGING_API_PORT=3001
STAGING_API_URL=https://api.staging.mitras.id
STAGING_WEB_URL=https://staging.mitras.id

# Staging CORS
STAGING_ALLOWED_ORIGINS=https://staging.mitras.id

# Staging Storage
STAGING_STORAGE_BACKEND=local  # or s3
STAGING_UPLOAD_DIR=/app/uploads
STAGING_MAX_FILE_SIZE=10485760
```

---

## STAGING INFRASTRUCTURE

### Required Components

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Database | ❌ NOT PROVISIONED | Provision PostgreSQL |
| Storage | ❌ NOT CONFIGURED | Configure S3/Local |
| Domain | ❌ NOT CONFIGURED | Configure DNS |
| HTTPS | ❌ NOT CONFIGURED | Configure SSL |
| Secrets | ❌ NOT SET | Add to GitHub |
| Deploy | ❌ NOT CONFIGURED | Create workflow |

---

## GITHUB SECRETS

### Required Secrets for Staging

```bash
# GitHub Settings → Secrets and Variables → Actions

STAGING_DATABASE_URL=postgresql://xxx
STAGING_JWT_SECRET=xxx
STAGING_API_URL=https://api.staging.mitras.id
STAGING_WEB_URL=https://staging.mitras.id
```

### Current CI Secrets

| Secret | Status |
|--------|--------|
| TEST_DATABASE_URL | ✅ Set in CI |
| DATABASE_URL | ❌ Should NOT be in CI |

---

## ENVIRONMENT FILES SUMMARY

| File | DATABASE_URL | In .gitignore | Status |
|------|-------------|---------------|--------|
| .env | Supabase (PROD) | YES | ⚠️ RISK |
| .env.example | (placeholder) | N/A | ✅ SAFE |
| .env.test | Docker test | YES | ✅ SAFE |
| .env.test.ci | CI test | YES | ✅ SAFE |
| .env.staging | NOT EXISTS | - | ❌ MISSING |

---

## RECOMMENDATION

### Immediate Actions

1. **DO NOT run pilot seed against current development .env**
   - Current .env points to production Supabase
   - Risk: Data corruption in production

2. **Create separate development database**
   - Either new Supabase project OR local PostgreSQL
   - Update .env with new DATABASE_URL

3. **Provision staging infrastructure**
   - Database
   - Storage
   - Domain
   - HTTPS
   - Secrets

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Dev DB = Prod DB | CONFIRMED | CRITICAL | Separate databases |
| Seed pilot to production | HIGH | CRITICAL | Safety guards in seed |
| Staging not isolated | CONFIRMED | HIGH | Provision staging |

---

## VERIFICATION CHECKLIST

### Before Proceeding

- [ ] Development database separated from production
- [ ] Staging database provisioned
- [ ] Staging secrets added to GitHub
- [ ] No credentials in source code

### Safety Guards for Pilot Seed

The seed-pilot.ts should include:

```typescript
// Safety guard - prevent running on wrong environment
if (process.env.NODE_ENV !== 'staging') {
  console.error('ERROR: seed-pilot.ts must only run on STAGING environment');
  console.error('Current NODE_ENV:', process.env.NODE_ENV);
  process.exit(1);
}

// Additional check for database name
const dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl.includes('staging')) {
  console.error('ERROR: seed-pilot.ts must only run on staging database');
  process.exit(1);
}
```

---

## HUMAN ACTIONS REQUIRED

| # | Action | Owner | Priority |
|---|--------|-------|----------|
| 1 | Create separate development database | DevOps | CRITICAL |
| 2 | Provision staging database | DevOps | CRITICAL |
| 3 | Configure staging storage | DevOps | HIGH |
| 4 | Set up staging domain | DevOps | HIGH |
| 5 | Add staging secrets to GitHub | DevOps | HIGH |
| 6 | Create deployment workflow | DevOps | HIGH |

---

*End of Environment Matrix*
