# PHASE 5.0 STAGING INFRASTRUCTURE AUDIT

**Date:** 2026-08-14
**Phase:** 5.0
**Status:** IN PROGRESS

---

## STAGING STATUS SUMMARY

```
========================================
STAGING INFRASTRUCTURE STATUS
========================================

Application Server:  [NOT PROVISIONED]
Database:             [NOT PROVISIONED]
Storage:              [NOT PROVISIONED]
Domain:               [NOT PROVISIONED]
HTTPS:                [NOT PROVISIONED]
Environment Secrets:  [NOT CONFIGURED]
CI/CD Deployment:     [NOT CONFIGURED]
Monitoring:           [NOT CONFIGURED]
Backup:               [NOT CONFIGURED]

FINAL STATUS: [HUMAN ACTION REQUIRED]
========================================
```

---

## CURRENT INFRASTRUCTURE

### Development (Local)

| Component | Current State | Risk |
|-----------|---------------|------|
| API | Running on localhost:3001 | - |
| Web | Running on localhost:3000 | - |
| Database | Supabase (production) | **HIGH RISK** |
| Storage | Local ./uploads | Limited |

### Test

| Component | Current State |
|-----------|---------------|
| Database | PostgreSQL test container |
| CI | GitHub Actions |

### Production

| Component | Current State |
|-----------|---------------|
| API/Web | Not deployed |
| Database | Supabase |
| Storage | Supabase Storage |

### Staging

| Component | Current State |
|-----------|---------------|
| All | **NOT PROVISIONED** |

---

## REQUIRED STAGING PROVISIONING

### 1. Database

**Option A: Supabase Staging Project**
```bash
# Create new Supabase project for staging
# Or use separate database in same project with RLS
```

**Option B: Self-hosted PostgreSQL**
```bash
# Provision PostgreSQL 15+ instance
# Create database: mitradesa_staging
# Configure connection pooling
```

**Connection Details Required:**
```
STAGING_DATABASE_URL=postgresql://user:password@host:5432/mitradesa_staging
```

### 2. Storage

**Option A: Supabase Storage**
```bash
# Create new bucket for staging
# Configure RLS policies
```

**Option B: S3/R2 Compatible**
```bash
# Create staging bucket
# Configure CORS
```

**Connection Details Required:**
```
STAGING_S3_BUCKET=mitradesa-staging
STAGING_S3_ENDPOINT=
STAGING_S3_ACCESS_KEY_ID=
STAGING_S3_SECRET_ACCESS_KEY=
```

### 3. Application Server

**Option A: Railway**
```bash
# Connect GitHub repo
# Configure environment variables
# Deploy staging branch
```

**Option B: Render**
```bash
# Connect GitHub repo
# Configure environment variables
# Deploy staging branch
```

**Option C: VPS/Docker**
```bash
# Provision Ubuntu/Debian VPS
# Install Docker
# Configure docker-compose.staging.yml
```

### 4. Domain & HTTPS

**Required Domains:**
```
staging.mitras.id (or custom)
api.staging.mitras.id
```

**Certificate:**
```
Let's Encrypt (auto-renew)
or
Cloudflare Origin Certificate
```

### 5. Environment Variables

**Staging Secrets Template:**
```bash
# Database
STAGING_DATABASE_URL=postgresql://xxx

# Authentication
STAGING_JWT_SECRET=64-char-random-string
STAGING_JWT_EXPIRES_IN=24h

# Application
STAGING_NODE_ENV=staging
STAGING_API_PORT=3001
STAGING_API_URL=https://api.staging.mitras.id
STAGING_WEB_URL=https://staging.mitras.id

# CORS
STAGING_ALLOWED_ORIGINS=https://staging.mitras.id

# Storage
STAGING_STORAGE_BACKEND=local  # or s3
STAGING_UPLOAD_DIR=/app/uploads
STAGING_MAX_FILE_SIZE=10485760

# S3 (if using)
STAGING_S3_BUCKET=mitradesa-staging
STAGING_S3_REGION=ap-southeast-1
STAGING_S3_ENDPOINT=
STAGING_S3_ACCESS_KEY_ID=
STAGING_S3_SECRET_ACCESS_KEY=
STAGING_S3_PUBLIC_URL=
```

---

## DEPLOYMENT PIPELINE

### Target CI/CD Flow

```
GitHub Push (main branch)
       ↓
GitHub Actions CI
   - lint
   - typecheck
   - test
   - build
       ↓
GitHub Actions Deploy
   - Pull artifacts
   - Run migrations
   - Deploy to staging
       ↓
Health Check
   - GET /health/live
   - GET /health/ready
       ↓
Smoke Test
   - Login
   - Create test data
   - Verify API response
       ↓
Staging Ready
```

### Required GitHub Secrets

```bash
STAGING_DATABASE_URL
STAGING_JWT_SECRET
STAGING_S3_*
STAGING_API_URL
STAGING_WEB_URL
DEPLOY_SSH_KEY (if VPS)
```

### Deployment Script

```bash
#!/bin/bash
# deploy-staging.sh

set -e

# Pull latest
git pull origin main

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Restart service
pm2 restart mitradesa-api --update-env
pm2 restart mitradesa-web --update-env

# Health check
curl -f https://api.staging.mitras.id/health/live
curl -f https://api.staging.mitras.id/health/ready
```

---

## DOCKER-COMPOSE STAGING CONFIG

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  postgres-staging:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: mitradesa_staging
      POSTGRES_PASSWORD: ${STAGING_DB_PASSWORD}
      POSTGRES_DB: mitradesa_staging
    ports:
      - "5434:5432"
    volumes:
      - postgres-staging-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mitradesa_staging"]
      interval: 10s
      timeout: 5s
      retries: 5

  api-staging:
    build:
      context: ./apps/api
      dockerfile: Dockerfile.staging
    environment:
      DATABASE_URL: postgres://mitradesa_staging:${STAGING_DB_PASSWORD}@postgres-staging:5432/mitradesa_staging
      JWT_SECRET: ${STAGING_JWT_SECRET}
      NODE_ENV: staging
    ports:
      - "3002:3001"
    depends_on:
      postgres-staging:
        condition: service_healthy
    volumes:
      - staging-uploads:/app/uploads

  web-staging:
    build:
      context: ./apps/web
      dockerfile: Dockerfile.staging
    environment:
      VITE_API_URL: http://localhost:3002
    ports:
      - "3003:80"
    depends_on:
      - api-staging

volumes:
  postgres-staging-data:
  staging-uploads:
```

---

## STAGING DATABASE SETUP

### 1. Create Database

```sql
-- Connect as superuser
CREATE USER mitradesa_staging WITH PASSWORD 'secure_password';
CREATE DATABASE mitradesa_staging OWNER mitradesa_staging;
GRANT ALL PRIVILEGES ON DATABASE mitradesa_staging TO mitradesa_staging;
```

### 2. Run Migrations

```bash
# Set environment
export DATABASE_URL="postgresql://mitradesa_staging:password@host:5432/mitradesa_staging"

# Deploy migrations
npx prisma migrate deploy

# Verify
npx prisma migrate status
npx prisma validate
```

### 3. Verify Schema

```bash
# Check tables
psql $DATABASE_URL -c "\dt"

# Expected tables:
# - provinsi
# - kabupaten
# - kecamatan
# - desa
# - identitas_desa
# - account
# - role
# - permission
# - account_role
# - role_permission
# - citizen_verification
# - otp_challenge
# - kategori
# - berita
# - media
# - halaman
# - layanan
# - template_surat
# - permintaan_layanan
# - dokumen
# - tanda_tangan
# - penanda_tangan
# - nomor_dokumen
# - audit_log
# - internal_session
```

---

## SMOKE TEST SCRIPT

```bash
#!/bin/bash
# smoke-test-staging.sh

STAGING_API="https://api.staging.mitras.id"

echo "Running Staging Smoke Tests..."
echo "=============================="

# 1. Health check
echo -n "1. Health check (live): "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/health/live)
if [ "$response" = "200" ]; then
  echo "PASS"
else
  echo "FAIL (HTTP $response)"
  exit 1
fi

# 2. Ready check
echo -n "2. Health check (ready): "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/health/ready)
if [ "$response" = "200" ]; then
  echo "PASS"
else
  echo "FAIL (HTTP $response)"
  exit 1
fi

# 3. Login test
echo -n "3. Login endpoint: "
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST $STAGING_API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
if [ "$response" = "200" ] || [ "$response" = "401" ]; then
  echo "PASS (HTTP $response)"
else
  echo "FAIL (HTTP $response)"
fi

# 4. Public berita
echo -n "4. Public berita: "
response=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_API/public/berita)
if [ "$response" = "200" ]; then
  echo "PASS"
else
  echo "FAIL (HTTP $response)"
fi

echo "=============================="
echo "Smoke tests completed"
```

---

## HUMAN ACTIONS REQUIRED

### 1. Infrastructure Provisioning

| Action | Owner | Status |
|--------|-------|--------|
| Create staging database | DevOps | REQUIRED |
| Configure staging storage | DevOps | REQUIRED |
| Set up staging domain | DevOps | REQUIRED |
| Configure HTTPS | DevOps | REQUIRED |
| Set up monitoring | DevOps | OPTIONAL |

### 2. CI/CD Configuration

| Action | Owner | Status |
|--------|-------|--------|
| Add staging GitHub secrets | DevOps | REQUIRED |
| Create deploy workflow | DevOps | REQUIRED |
| Configure branch protection | DevOps | REQUIRED |

### 3. Application Configuration

| Action | Owner | Status |
|--------|-------|--------|
| Create staging .env file | Developer | REQUIRED |
| Update Prisma for staging | Developer | REQUIRED |
| Configure CORS for staging | Developer | REQUIRED |

---

## RECOMMENDATION

**Status:** STAGING NOT READY

The current staging infrastructure is not provisioned. The following human actions are required:

1. **Provision staging database** - Create PostgreSQL instance
2. **Configure staging storage** - Set up S3/R2 or local storage
3. **Set up staging domain** - Configure DNS and HTTPS
4. **Add CI/CD deployment** - Create deployment workflow
5. **Configure secrets** - Add staging secrets to GitHub

**Until these actions are completed, pilot testing cannot proceed.**

---

*End of Staging Infrastructure Audit*
