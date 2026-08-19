# ============================================================

# MITRADESA — DATABASE INFRASTRUCTURE UNBLOCK

# EXECUTION CONTRACT

# ============================================================

OBJECTIVE:
Membuka blocker database sehingga seluruh test database-dependent
dapat dijalankan dan Phase 4 dapat divalidasi secara nyata.

============================================================
CURRENT VERIFIED STATE
============================================================

Character Normalization : PASS
Prisma Generate : PASS
Prisma Validate : PASS
TypeScript : 0 errors
Build : PASS
Jest Infrastructure : PASS
Jest Discovery : PASS
Health Tests : PASS

CURRENT BLOCKER:

Database unavailable.

Current Jest result:

- 6 suites total
- 1 passed
- 5 blocked/failed karena database
- 126 tests total
- 14 passed
- 112 blocked/failed karena database

IMPORTANT:

112 database-dependent test failures JANGAN dianggap sebagai
implementation failures sebelum koneksi database tersedia.

============================================================
STRICT SCOPE
============================================================

Fokus HANYA pada:

1. Database connectivity
2. Prisma connection
3. Migration availability
4. Migration status
5. Database schema synchronization
6. Reference seed
7. Database-dependent Jest tests

DILARANG:

- Membuat fitur baru
- Masuk Phase 5
- Mengubah business logic
- Mengubah API contract
- Mengubah RBAC
- Mengubah PII policy
- Mengubah ERD tanpa kebutuhan nyata
- Menghapus test
- Men-disable test
- Mock database untuk menyembunyikan masalah koneksi
- Mengubah assertion agar test PASS
- Menghapus test yang gagal
- Menggunakan --passWithNoTests
- Menganggap test PASS tanpa benar-benar menjalankannya

============================================================
STEP 1 — DATABASE AUDIT
============================================================

Periksa:

- DATABASE_URL
- DIRECT_URL jika tersedia
- Prisma datasource
- schema.prisma
- migration directory
- migration status
- database connectivity

Jalankan:

npx prisma validate
npx prisma migrate status

Kemudian lakukan connectivity check yang aman.

Jangan mengubah database sebelum mengetahui status sebenarnya.

Dokumentasikan:

docs/development/DATABASE-INFRASTRUCTURE-AUDIT.md

============================================================
STEP 2 — MIGRATION AUDIT
============================================================

Pastikan migration Phase 4 benar-benar tersedia.

Verifikasi:

- migration directory
- migration SQL
- seluruh 9 reference tables
- indexes
- unique constraints
- timestamps
- soft delete fields
- audit-related schema

JANGAN membuat migration duplikat.

Jika migration sudah tersedia:
gunakan migration tersebut.

Jika migration belum tersedia:
buat migration hanya berdasarkan schema yang sudah disetujui.

DILARANG redesign schema.

============================================================
STEP 3 — DATABASE CONNECTIVITY
============================================================

Jika database tidak dapat diakses:

Identifikasi root cause:

- DNS
- host
- port
- credentials
- Supabase availability
- firewall
- connection pooling
- SSL
- DATABASE_URL
- DIRECT_URL

Jangan mengubah credential secara spekulatif.

Jangan menampilkan secret/API key dalam final report.

============================================================
STEP 4 — APPLY MIGRATION
============================================================

HANYA setelah database dapat diakses:

npx prisma migrate status

Kemudian:

npx prisma migrate deploy

Jangan menggunakan reset.

DILARANG:

npx prisma migrate reset

karena dapat menyebabkan DATA LOSS.

Setelah migration:

npx prisma migrate status

harus menunjukkan database synchronized.

============================================================
STEP 5 — VERIFY DATABASE
============================================================

Verifikasi keberadaan seluruh reference tables:

RefAgama
RefGolDarah
RefStatusPerkawinan
RefHubunganKeluarga
RefStatusKependudukan
RefPendidikan
RefPekerjaan
RefJabatanPerangkat
RefStatusPerangkat

Verifikasi juga:

- PK
- UNIQUE business key
- indexes
- timestamps
- isAktif
- audit compatibility

============================================================
STEP 6 — SEED
============================================================

Jika migration PASS:

jalankan reference seed.

Contoh:

npx tsx prisma/seed-reference.ts

Pastikan seed:

- idempotent
- tidak membuat duplicate records
- tidak menghapus existing data
- tidak hardcode data di service
- menggunakan business key dengan benar

Verifikasi jumlah data setiap reference table.

============================================================
STEP 7 — DATABASE TEST
============================================================

Jalankan test database-dependent.

Minimal:

npm test

Kemudian kelompokkan hasil:

PASS
FAIL — implementation
FAIL — data/setup
FAIL — database
FAIL — test defect

Jangan menyebut BLOCKED jika sebenarnya test sudah dapat
terhubung ke database tetapi assertion gagal.

============================================================
STEP 8 — REGRESSION
============================================================

Wajib verifikasi:

Phase 2
Phase 3A
Phase 3B Step 3 — Penduduk
Phase 3B Step 4 — Keluarga
Phase 3B Step 5 — Perangkat Desa
Phase 4 — Reference Data

Pastikan tidak ada regression pada:

- Authentication
- RBAC
- Penduduk
- Keluarga
- AnggotaKeluarga
- PerangkatDesa
- Account Integration
- Reference Data
- Audit Logging
- PII Protection
- IDOR Protection
- Soft Delete
- Transaction/Rollback

============================================================
STEP 9 — FINAL TECHNICAL VALIDATION
============================================================

Jalankan:

npx prisma validate
npx tsc --noEmit
npm run build
npm test

Semua hasil harus dicatat.

============================================================
DEFINITION OF DONE
============================================================

[ ] Database reachable
[ ] Prisma connection PASS
[ ] Migration status PASS
[ ] Migration applied
[ ] All 9 reference tables exist
[ ] Reference seed PASS
[ ] Jest database tests execute
[ ] Database-dependent tests PASS
[ ] Regression PASS
[ ] Prisma Validate PASS
[ ] TypeScript 0 errors
[ ] Build PASS
[ ] No data loss
[ ] No business logic changes
[ ] No API breaking changes
[ ] No new architecture changes

============================================================
FINAL STATUS RULE
============================================================

Jika database masih tidak dapat diakses:

STATUS = BLOCKED

Jika database dapat diakses tetapi ada test failure:

STATUS = FAIL / PARTIAL

Jangan menyebut PASS.

STATUS = PASS hanya jika:

Database = PASS
Migration = PASS
Seed = PASS
Jest = PASS
Regression = PASS
TypeScript = 0 errors
Build = PASS

============================================================
SECURITY RULE
============================================================

Jangan pernah menampilkan:

- DATABASE_URL lengkap
- password
- JWT secret
- API key
- Supabase service key
- credential lainnya

di final report.

============================================================
MANDATORY STOP
============================================================

SETELAH database infrastructure dan regression validation selesai:

STOP.

JANGAN masuk Phase 5.

JANGAN membuat domain baru.

Tunggu instruksi berikutnya.

# ============================================================

END OF EXECUTION CONTRACT

# ============================================================
