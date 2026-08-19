# PHASE 5.1 DATABASE REVIEW

**Date:** 2026-08-14
**Phase:** 5.1
**Status:** STAGING NOT READY

---

## DATABASE SUMMARY

```
========================================
DATABASE REVIEW
========================================

Schema:                    [PASS]
Migrations:               [PASS]
Development DB:          [RISK - Prod DB]
Test DB:                  [PASS]
Staging DB:               [NOT CONFIGURED]

FINAL STATUS: BLOCKED
========================================
```

---

## CURRENT STATE

### Database Connection

| Environment | DATABASE_URL | Status |
|-------------|--------------|--------|
| Development | Supabase production | ⚠️ RISK |
| Test | Docker 127.0.0.1:5432 | ✅ Isolated |
| CI | GitHub Actions service | ✅ Isolated |
| Staging | NOT CONFIGURED | ❌ MISSING |

---

## SCHEMA STATUS

### Prisma Schema

| Check | Status |
|-------|--------|
| Schema Valid | ✅ |
| Migration Status | ✅ Up to date |
| Migrations Count | 2 |

### Tables

| Table | Status |
|-------|--------|
| provinsi | ✅ |
| kabupaten | ✅ |
| kecamatan | ✅ |
| desa | ✅ |
| identitas_desa | ✅ |
| account | ✅ |
| role | ✅ |
| permission | ✅ |
| account_role | ✅ |
| role_permission | ✅ |
| citizen_verification | ✅ |
| otp_challenge | ✅ |
| kategori | ✅ |
| berita | ✅ |
| media | ✅ |
| halaman | ✅ |
| layanan | ✅ |
| template_surat | ✅ |
| permintaan_layanan | ✅ |
| dokumen | ✅ |
| tanda_tangan | ✅ |
| penanda_tangan | ✅ |
| nomor_dokumen | ✅ |
| audit_log | ✅ |
| internal_session | ✅ |
| configuration | ✅ |

---

## MIGRATION STATUS

### Applied Migrations

| Migration | Applied At | Status |
|-----------|-----------|--------|
| 20260813000000_baseline_initial_schema | 2026-08-13 | ✅ |
| 20260813000001_add_service_document_engine | 2026-08-13 | ✅ |

---

## PILOT SEED SAFETY

### Safety Guards Added

The `seed-pilot.ts` script now includes:

1. **NODE_ENV Check** - Must be "staging"
2. **DATABASE_URL Check** - Must contain "staging"
3. **Production Pattern Detection** - Blocks known production URLs

### Verification

```bash
# Safe to run with:
NODE_ENV=staging DATABASE_URL=postgresql://user:pass@host/staging npx tsx prisma/seed-pilot.ts

# Will be blocked on:
NODE_ENV=production DATABASE_URL=postgresql://prod@... # ❌ BLOCKED
DATABASE_URL=supabase...prod... # ❌ BLOCKED
```

---

## STAGING DATABASE REQUIREMENTS

### Database Name

```
mitradesa_staging
```

### Connection

```
postgresql://user:password@host:5432/mitradesa_staging
```

### Required Tables

All tables from production schema.

### Migration Command

```bash
# Set environment
export NODE_ENV=staging
export DATABASE_URL="postgresql://user:pass@host:5432/mitradesa_staging"

# Run migrations
cd apps/api
npx prisma migrate deploy

# Verify
npx prisma migrate status
npx prisma validate
```

---

## HUMAN ACTIONS REQUIRED

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Create staging database | DevOps | REQUIRED |
| 2 | Run migrations on staging | DevOps | REQUIRED |
| 3 | Verify schema | DevOps | REQUIRED |

---

*End of Database Review*
