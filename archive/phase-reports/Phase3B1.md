============================================================
MITRADESA — PHASE 3B
STEP 1 — SYSTEM AUDIT
============================================================

MULAI SEKARANG.

Tujuan STEP 1 hanya melakukan AUDIT terhadap project
yang sudah dibangun pada Phase 1, Phase 2, dan Phase 3A.

JANGAN membuat model Penduduk.
JANGAN membuat model Keluarga.
JANGAN membuat model AnggotaKeluarga.
JANGAN membuat migration baru.
JANGAN mengubah schema.
JANGAN mengubah API.
JANGAN mengubah frontend.

STEP 1 = READ + ANALYZE + REPORT.

============================================================

1. # ARCHITECTURE AUDIT

Baca:

docs/architecture/ARCHITECTURE-BASELINE.md

dan seluruh dokumen architecture yang relevan.

Pastikan Agent memahami:

- BIGINT AUTO_INCREMENT
- Express + TypeScript
- React + TypeScript + Vite
- Prisma
- PostgreSQL 15+
- JWT
- RBAC
- Citizen NIK + OTP
- Database-first
- No-hardcode
- Audit
- Security
- Single-village, multi-village ready

Jangan mengubah Architecture Baseline.

============================================================ 2. PHASE 2 AUDIT
============================================================

Audit implementasi:

Account
Role
Permission
AccountRole
RolePermission
CitizenVerification
CitizenSession
InternalSession
AuditLog

Audit:

- Prisma model
- FK
- indexes
- unique constraints
- API
- service
- middleware
- authentication
- authorization
- JWT
- session
- OTP
- rate limiting
- audit logging
- tests

============================================================ 3. PHASE 3A AUDIT
============================================================

Audit:

Provinsi
Kabupaten
Kecamatan
Desa / Village
IdentitasDesa

PERHATIAN:

Jika actual code menggunakan:

Village

dan bukan:

Desa

JANGAN membuat Desa baru.

Catat:

ACTUAL MODEL NAME
TABLE NAME
RELATIONSHIP

Audit hierarchy:

Provinsi
↓
Kabupaten
↓
Kecamatan
↓
Desa/Village
↓
IdentitasDesa

============================================================ 4. PRISMA AUDIT
============================================================

Baca:

apps/api/prisma/schema.prisma

Identifikasi seluruh model existing.

Untuk setiap model catat:

MODEL
TABLE
PRIMARY KEY
FOREIGN KEY
UNIQUE
INDEX
RELATIONS
ENUM
SOFT DELETE
CREATED_AT
UPDATED_AT

Periksa apakah naming convention konsisten.

============================================================ 5. MIGRATION AUDIT
============================================================

Audit seluruh:

apps/api/prisma/migrations/

Pastikan:

- migration order
- FK dependencies
- unique constraints
- indexes
- migration status

JANGAN membuat migration baru.

JANGAN melakukan reset database.

JANGAN menggunakan:

prisma migrate reset

JANGAN menghapus migration existing.

============================================================ 6. CITIZEN IDENTITY AUDIT
============================================================

Ini bagian PALING PENTING.

Cari seluruh penggunaan:

CitizenVerification
CitizenSession
NIK
Penduduk
Citizen
citizenId
nik

Tentukan:

Apakah CitizenVerification saat ini menunjuk
langsung ke Penduduk?

Jika BELUM ADA Penduduk karena Phase 3B belum dibuat,
catat current state.

JANGAN membuat Penduduk pada STEP 1.

Periksa apakah ada entity lain yang berfungsi sebagai
citizen identity.

Jika ditemukan:

CONFLICT.

============================================================ 7. VILLAGE / DESA AUDIT
============================================================

Cari semua:

Desa
Village
desaId
villageId

Pastikan hanya ada satu master wilayah desa.

Jika terdapat duplicate model:

STOP dan laporkan.

Jangan memperbaiki pada STEP 1.

============================================================ 8. API AUDIT
============================================================

Audit:

apps/api/src/routes/
apps/api/src/services/
apps/api/src/middleware/

Cari:

authentication middleware
authorization middleware
validation
DTO
error handling
pagination
audit

Identifikasi convention:

GET
POST
PATCH/PUT
DELETE

Catat pola router existing.

Phase 3B harus mengikuti convention ini.

============================================================ 9. RBAC AUDIT
============================================================

Pastikan:

ADMIN
PIMPINAN
DEVELOPER

tidak hardcoded sebagai satu-satunya security
mechanism.

Identifikasi permission yang tersedia.

Catat:

ROLE
PERMISSIONS
ROUTE PROTECTION

Jangan membuat permission baru pada STEP 1.

============================================================ 10. SECURITY AUDIT
============================================================

Audit:

- password hashing
- JWT
- OTP
- rate limit
- security headers
- input validation
- SQL injection protection
- PII protection
- authorization
- IDOR protection

Khusus NIK:

Cari apakah NIK saat ini:

- logged
- returned in API
- exposed in frontend
- searchable publicly

Catat.

============================================================ 11. FRONTEND AUDIT
============================================================

Audit:

apps/web/src/

Cari:

routing
authentication
protected routes
admin routes
API client
DTO
components
design system

Catat convention untuk:

- page
- form
- table
- modal
- notification
- error handling

Phase 3B harus mengikuti convention existing.

============================================================ 12. TEST AUDIT
============================================================

Audit:

Jest
API tests
Playwright

Pastikan Phase 2 dan Phase 3A tests tersedia.

Jangan membuat test Phase 3B pada STEP 1.

Catat command yang digunakan untuk:

typecheck
lint
test
build
e2e

============================================================ 13. NO-HARDCODE AUDIT
============================================================

Cari hardcoded:

agama
pendidikan
pekerjaan
jenis kelamin
status perkawinan
status penduduk
hubungan keluarga

Juga cari hardcoded:

nama desa
nama kecamatan
nama kabupaten
nama provinsi

Pisahkan hasil:

A. BUSINESS LOGIC
B. TEST FIXTURE
C. DOCUMENTATION
D. UI DEMO DATA

Jangan menghapus apa pun.

============================================================ 14. DATABASE HEALTH
============================================================

Jika environment database tersedia:

boleh melakukan read-only inspection.

DILARANG:

DROP
DELETE
TRUNCATE
RESET
MIGRATE

tanpa instruksi eksplisit.

Jangan merusak database development.

============================================================ 15. OUTPUT AUDIT REPORT
============================================================

Buat:

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

Format:

# PHASE 3B — STEP 1 SYSTEM AUDIT

## STATUS

PASS / BLOCKED

## ARCHITECTURE

PASS / FAIL

## PHASE 2

PASS / FAIL

## PHASE 3A

PASS / FAIL

## PRISMA

PASS / FAIL

## MIGRATIONS

PASS / FAIL

## CITIZEN IDENTITY

PASS / FAIL

## VILLAGE/DESA

PASS / FAIL

## API

PASS / FAIL

## RBAC

PASS / FAIL

## SECURITY

PASS / FAIL

## FRONTEND

PASS / FAIL

## TESTING

PASS / FAIL

## NO-HARDCODE

PASS / FAIL

## DATABASE HEALTH

PASS / FAIL

============================================================ 16. MODEL INVENTORY
============================================================

Tampilkan tabel:

| Model | Table | PK  | FK  | Unique | Relations |
| ----- | ----- | --- | --- | ------ | --------- |

Untuk SELURUH model existing yang relevan.

============================================================ 17. CRITICAL FINDINGS
============================================================

Pisahkan:

CRITICAL
HIGH
MEDIUM
LOW

Jangan memperbaiki.

============================================================ 18. PHASE 3B DEPENDENCIES
============================================================

Buat daftar:

Penduduk membutuhkan:

- ...

Keluarga membutuhkan:

- ...

AnggotaKeluarga membutuhkan:

- ...

CitizenVerification membutuhkan:

- ...

CitizenSession membutuhkan:

- ...

============================================================ 19. CONFLICT CHECK
============================================================

Cari konflik dengan:

Architecture Baseline
Phase 2
Phase 3A

Jika:

NONE

tulis:

ARCHITECTURE CONFLICT:
NONE

Jika ada:

ARCHITECTURE CONFLICT:
FOUND

dan jelaskan secara detail.

============================================================ 20. STOP CONDITION
============================================================

SETELAH:

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

selesai:

STOP.

JANGAN lanjut:

STEP 2
STEP 3
STEP 4
dst.

JANGAN membuat source code baru.

JANGAN membuat database migration.

JANGAN membuat schema Penduduk.

JANGAN membuat schema Keluarga.

JANGAN membuat schema AnggotaKeluarga.

Tunggu instruksi berikutnya.

============================================================
FINAL RESPONSE
============================================================

Berikan ringkasan:

STEP:
3B — STEP 1 SYSTEM AUDIT

STATUS:
PASS / BLOCKED

MODELS AUDITED:
...

CRITICAL FINDINGS:
...

ARCHITECTURE CONFLICT:
NONE / ...

DATABASE CONFLICT:
NONE / ...

CITIZEN IDENTITY:
...

VILLAGE MODEL:
...

API CONVENTION:
...

RBAC:
...

SECURITY:
...

NO-HARDCODE:
...

REPORT:
docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

NEXT:
STOP — WAIT FOR INSTRUCTION
============================================================
