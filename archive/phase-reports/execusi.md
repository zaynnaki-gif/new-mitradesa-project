# ============================================================

# MITRADESA — DATABASE INFRASTRUCTURE UNBLOCK

# FINAL EXECUTION CONTRACT

# ============================================================

PHASE:
Infrastructure Stabilization

OBJECTIVE:
Menyelesaikan seluruh blocker database sehingga seluruh
database-dependent test dapat berjalan dan Phase 4 dapat
divalidasi secara nyata.

============================================================
CURRENT VERIFIED STATE
============================================================

Character Normalization : PASS
Prisma Generate : PASS
Prisma Validate : PASS
TypeScript : 0 ERRORS
Build : PASS
Jest Infrastructure : PASS
Jest Discovery : PASS
Health Test : PASS

CURRENT STATUS:

Jest Infrastructure = PASS

Database-dependent tests = BLOCKED

Previous result:

Suites:

- 6 total
- 1 passed
- 5 blocked/failed karena database

Tests:

- 126 total
- 14 passed
- 112 blocked/failed karena database

IMPORTANT:

Jangan menganggap 112 test tersebut sebagai implementation
failure sebelum koneksi database berhasil.

============================================================
PRIMARY OBJECTIVE
============================================================

Ubah kondisi:

Jest Infrastructure = PASS
Database Tests = BLOCKED

menjadi:

Jest Infrastructure = PASS
Database = PASS
Database Tests = PASS
Regression = PASS

============================================================
STRICT SCOPE
============================================================

Fokus hanya pada:

1. Database connectivity
2. Prisma connectivity
3. Migration status
4. Migration deployment
5. Database schema verification
6. Reference data seed
7. Database-dependent tests
8. Regression validation

DILARANG:

- Masuk Phase 5
- Membuat domain baru
- Membuat fitur baru
- Mengubah business logic
- Mengubah API contract
- Mengubah RBAC
- Mengubah PII policy
- Mengubah audit logic
- Mengubah ERD kecuali terbukti tidak sinkron
- Menghapus test
- Men-disable test
- Mengubah assertion agar PASS
- Membuat mock database untuk menyembunyikan masalah
- Menggunakan --passWithNoTests
- Menggunakan --forceExit sebagai solusi
- Menggunakan Prisma migrate reset
- Menghapus database
- Menghapus migration
- Membuat migration duplikat

============================================================
STEP 1 — AUDIT DATABASE CONFIGURATION
============================================================

Periksa:

- apps/api/.env
- DATABASE_URL
- DIRECT_URL jika tersedia
- prisma/schema.prisma
- package.json
- Prisma datasource
- migration directory

Jangan menampilkan credential atau secret dalam output.

Jalankan:

npx prisma validate

npx prisma migrate status

Kemudian lakukan database connectivity check.

Jika koneksi gagal, identifikasi root cause secara spesifik:

- DNS
- hostname
- port
- SSL
- credential
- firewall
- Supabase connectivity
- connection pooling
- DATABASE_URL
- DIRECT_URL

Jangan mengganti credential secara spekulatif.

============================================================
STEP 2 — MIGRATION AUDIT
============================================================

Periksa migration yang sudah ada.

Pastikan tidak ada migration duplicate.

Pastikan migration Phase 4 mencakup seluruh reference tables
yang telah disetujui.

Reference tables:

1. RefAgama
2. RefGolDarah
3. RefStatusPerkawinan
4. RefHubunganKeluarga
5. RefStatusKependudukan
6. RefPendidikan
7. RefPekerjaan
8. RefJabatanPerangkat
9. RefStatusPerangkat

Jangan redesign schema.

Jangan mengubah struktur yang sudah disetujui hanya agar
migration menjadi mudah.

Jika migration sudah tersedia:
GUNAKAN migration tersebut.

Jika migration belum tersedia:
buat migration berdasarkan schema.prisma yang sekarang.

============================================================
STEP 3 — DATABASE CONNECTION
============================================================

Pastikan database benar-benar dapat diakses.

Jangan berhenti pada:

"Environment variable loaded"

Itu BUKAN bukti database terkoneksi.

Harus ada bukti koneksi/query berhasil.

Jika database unavailable:

STATUS = BLOCKED

Jangan lanjutkan dengan fake/mock success.

============================================================
STEP 4 — APPLY MIGRATION
============================================================

Jika database sudah accessible:

Jalankan:

npx prisma migrate status

Jika migration belum diterapkan:

npx prisma migrate deploy

DILARANG:

npx prisma migrate reset

karena berpotensi DATA LOSS.

Setelah deploy:

npx prisma migrate status

Pastikan tidak ada migration pending.

============================================================
STEP 5 — VERIFY DATABASE SCHEMA
============================================================

Verifikasi bahwa database benar-benar memiliki:

- seluruh 9 reference tables
- BIGINT primary keys
- UNIQUE business key
- indexes
- createdAt
- updatedAt
- isAktif
- struktur yang sesuai schema.prisma

Jangan hanya membaca schema.prisma.

Verifikasi terhadap DATABASE aktual.

============================================================
STEP 6 — REFERENCE SEED
============================================================

Jika migration PASS:

Jalankan seed reference yang sudah tersedia.

Contoh:

npx tsx prisma/seed-reference.ts

Pastikan:

- seed berhasil
- tidak duplicate
- idempotent
- tidak menghapus data existing
- tidak mengubah schema
- tidak menggunakan hardcoded master data di service

Verifikasi bahwa seluruh reference table memiliki data yang
diharapkan.

============================================================
STEP 7 — PRISMA VALIDATION
============================================================

Jalankan:

npx prisma generate

npx prisma validate

Pastikan keduanya PASS.

Jangan regenerate client dengan schema alternatif.

Gunakan schema project yang sebenarnya.

============================================================
STEP 8 — DATABASE-DEPENDENT TESTS
============================================================

Setelah database accessible dan migration/seed PASS:

Jalankan:

npm test

Jangan mengubah test untuk membuat hasil PASS.

Jika terdapat failure:

klasifikasikan:

A. DATABASE CONNECTION FAILURE
B. TEST SETUP FAILURE
C. IMPLEMENTATION FAILURE
D. DATA/SEED FAILURE
E. ASSERTION FAILURE
F. PRE-EXISTING ISSUE

Setiap failure harus memiliki root cause.

============================================================
STEP 9 — REGRESSION TEST
============================================================

Wajib memastikan regression untuk:

Phase 2
Phase 3A
Phase 3B Step 3 — Penduduk
Phase 3B Step 4 — Keluarga
Phase 3B Step 5 — Perangkat Desa
Phase 4 — Reference Data

Verifikasi minimal:

AUTHENTICATION
RBAC
PENDUDUK
KELUARGA
ANGGOTA KELUARGA
PERANGKAT DESA
ACCOUNT INTEGRATION
REFERENCE DATA
AUDIT LOGGING
PII PROTECTION
IDOR PROTECTION
SOFT DELETE
TRANSACTION / ROLLBACK

============================================================
STEP 10 — FINAL TECHNICAL VALIDATION
============================================================

Setelah test selesai:

npx prisma validate

npx tsc --noEmit

npm run build

npm test

Semua hasil wajib dicatat.

============================================================
STEP 11 — SECURITY CHECK
============================================================

Pastikan tidak ada:

- database password dalam source
- API key dalam source
- JWT secret dalam source
- credential dalam documentation
- credential dalam test output

Jangan memasukkan secret ke final report.

============================================================
STEP 12 — DOCUMENTATION
============================================================

Buat/update:

docs/development/DATABASE-INFRASTRUCTURE-AUDIT.md

docs/development/DATABASE-INFRASTRUCTURE-UNBLOCK.md

Dokumentasikan:

1. Root cause
2. Database connectivity result
3. Migration status
4. Migration applied
5. Tables verified
6. Seed result
7. Jest result
8. Regression result
9. TypeScript result
10. Build result
11. Prisma result
12. Remaining blockers

============================================================
DEFINITION OF DONE
============================================================

[ ] Database reachable
[ ] Database query successful
[ ] Prisma Generate PASS
[ ] Prisma Validate PASS
[ ] Migration directory verified
[ ] Migration applied
[ ] No pending migrations
[ ] 9 reference tables verified
[ ] Reference seed PASS
[ ] Jest starts successfully
[ ] Jest discovers tests
[ ] Database-dependent tests execute
[ ] Database-dependent tests PASS
[ ] Regression PASS
[ ] TypeScript = 0 errors
[ ] Build = PASS
[ ] Character normalization remains PASS
[ ] No business logic changed
[ ] No API breaking changes
[ ] No data loss
[ ] No duplicate migration
[ ] No test disabled
[ ] No fake/mock database workaround

============================================================
FINAL STATUS RULE
============================================================

STATUS = PASS

HANYA JIKA:

Database = PASS
Migration = PASS
Seed = PASS
Jest = PASS
Database Tests = PASS
Regression = PASS
TypeScript = 0 errors
Build = PASS
Prisma Validate = PASS

Jika database masih tidak dapat diakses:

STATUS = BLOCKED

Jika database accessible tetapi test gagal:

STATUS = FAIL

Jika hanya sebagian test PASS:

STATUS = PARTIAL

Jangan menggunakan STATUS = PASS jika masih ada blocker.

============================================================
FINAL REPORT FORMAT
============================================================

Gunakan format:

# MITRADESA DATABASE INFRASTRUCTURE UNBLOCK

# FINAL VALIDATION REPORT

STATUS: PASS / PARTIAL / BLOCKED / FAIL

DATABASE:
PASS / FAIL

MIGRATION:
PASS / FAIL

SEED:
PASS / FAIL

PRISMA:
PASS / FAIL

TYPESCRIPT:
PASS / FAIL

BUILD:
PASS / FAIL

JEST:
PASS / FAIL

DATABASE TESTS:
PASS / FAIL / BLOCKED

REGRESSION:
PASS / FAIL / BLOCKED

SECURITY:
PASS / FAIL

DATA LOSS:
NONE / FOUND

ARCHITECTURE CHANGES:
NONE / LIST

BUSINESS LOGIC CHANGES:
NONE / LIST

FILES MODIFIED:
[list only actual files]

FILES CREATED:
[list only actual files]

REMAINING BLOCKERS:
[list actual blockers]

============================================================
CRITICAL MANDATORY STOP
============================================================

SETELAH DATABASE INFRASTRUCTURE VALIDATION SELESAI:

STOP.

JANGAN:

- masuk Phase 5
- membuat domain baru
- membuat fitur baru
- mengubah schema tanpa instruksi
- membuat migration baru di luar kebutuhan
- melakukan refactor besar

Tunggu instruksi berikutnya.

# ============================================================

END OF EXECUTION CONTRACT

# ============================================================
