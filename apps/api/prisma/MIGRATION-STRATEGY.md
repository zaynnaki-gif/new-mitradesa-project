# MITRADESA - Migration Strategy Guide
## Updated: 2026-08-13

---

## Overview

This document explains the migration strategy for Mitradesa project, handling both:
1. **Existing database** (with tables already created)
2. **Fresh database** (for new deployments)

---

## Current Migration Structure

```
prisma/migrations/
├── 20260813000000_baseline_initial_schema/  ← NEW: Complete baseline
├── 20260811000000_add_phase4_reference_tables/ ← TO BE ARCHIVED
├── 20260812010000_add_perangkat_desa/       ← TO BE ARCHIVED
├── 20260812000000_add_cms_models/           ← TO BE ARCHIVED
└── migration_lock.toml
```

---

## Scenario 1: EXISTING DATABASE (Current Production)

If your database already has all tables created, follow these steps:

### Step 1: Run Reconciliation Script

Connect to your Supabase database and run:

```sql
-- Run this file: prisma/reconcile-existing-database.sql
-- This marks the baseline as "applied" without creating objects
```

### Step 2: Archive Old Migrations

```powershell
# PowerShell
cd prisma/migrations
Rename-Item 20260811000000_add_phase4_reference_tables _ARCHIVED_20260811000000_add_phase4_reference_tables
Rename-Item 20260812010000_add_perangkat_desa _ARCHIVED_20260812010000_add_perangkat_desa
Rename-Item 20260812000000_add_cms_models _ARCHIVED_20260812000000_add_cms_models
```

### Step 3: Verify Prisma Status

```bash
npx prisma migrate status
```

Expected output:
```
Database migrations marked:
- 20260813000000_baseline_initial_schema: APPLIED
```

---

## Scenario 2: FRESH DATABASE (New Deployment)

For a completely empty database, follow these steps:

### Step 1: Create Empty Database

In Supabase:
1. Create a new database/branch
2. Or use `createdb` locally

### Step 2: Run Baseline Migration

```bash
# Option A: Using Prisma (recommended)
npx prisma migrate deploy

# Option B: Direct SQL
# Run: prisma/baseline-migration-fresh-db.sql
```

### Step 3: Run Seed Data

```bash
npm run db:seed
```

### Step 4: Verify

```bash
npx prisma migrate status
npx prisma validate
```

---

## Files Created

| File | Purpose |
|------|---------|
| `prisma/migrations/20260813000000_baseline_initial_schema/migration.sql` | Complete schema for Prisma |
| `prisma/reconcile-existing-database.sql` | Reconciliation script for existing DB |
| `prisma/baseline-migration-fresh-db.sql` | Standalone SQL for fresh DB |
| `prisma/archive-old-migrations.sql` | Instructions for archiving old migrations |
| `prisma/MIGRATION-STRATEGY.md` | This file |

---

## What the Baseline Migration Creates

### Enums (8)
- AccountStatus
- VerificationStatus
- OtpStatus
- AuditAction (with CMS values)
- ActorType
- ConfigType
- BeritaStatus
- HalamanStatus

### Tables (26)
- Province hierarchy: provinsi, kabupaten, kecamatan, desa, identitas_desa
- Auth/RBAC: account, role, permission, account_role, role_permission
- Sessions: internal_session, citizen_session
- Population: penduduk, keluarga, anggota_keluarga
- Verification: citizen_verification, otp_challenge
- Reference: ref_agama, ref_gol_darah, ref_status_perkawinan, ref_hubungan_keluarga, ref_status_kependudukan, ref_pendidikan, ref_pekerjaan, ref_jabatan_perangkat, ref_status_perangkat
- Village Officials: perangkat_desa
- CMS: kategori, berita, halaman, media
- Audit: audit_log, configuration

---

## Verification Queries

Run these after migration to verify:

```sql
-- Count tables
SELECT COUNT(*) as table_count FROM pg_tables WHERE schemaname = 'public';

-- Count enums
SELECT COUNT(*) as enum_count FROM pg_type WHERE typtype = 'e';

-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- List all enums
SELECT typname as enum_name FROM pg_type WHERE typtype = 'e' ORDER BY typname;
```

---

## Common Issues

### Issue: "relation already exists"
**Cause:** Migration ran on database with existing tables
**Solution:** Run reconciliation script (Scenario 1)

### Issue: "relation does not exist"
**Cause:** Trying to create FK on table that doesn't exist
**Solution:** Check migration order - baseline should create all tables first

### Issue: Prisma still shows pending migrations
**Cause:** Old migration records in `_prisma_migrations` table
**Solution:** Run reconciliation script

---

## Backup Recommendations

Before running any migration:
1. Create Supabase Point-in-Time Recovery backup
2. Export current schema: `pg_dump --schema-only`
3. Export data: `pg_dump --data-only`

---

## Contact

For issues, check:
- Incident Report: `MITRADESA_Migration_CMS_Incident_Report.md`
- Prisma Migration docs: https://pris.ly/m/migrate
