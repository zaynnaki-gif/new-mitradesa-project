LANJUTKAN.

Mulai implementasi STEP 4 — KELUARGA & ANGGOTA KELUARGA.

Namun sebelum melakukan perubahan source code, lakukan PRE-IMPLEMENTATION VERIFICATION terhadap kondisi aktual project.

WAJIB:

1. Baca Architecture Baseline.
2. Baca Phase 3B Step 1 System Audit.
3. Baca dokumentasi Step 2.
4. Baca dokumentasi Step 3 Penduduk API.
5. Periksa schema.prisma aktual.
6. Periksa model Keluarga aktual.
7. Periksa model AnggotaKeluarga aktual.
8. Periksa model Penduduk aktual.
9. Periksa relation Desa → Penduduk → Keluarga.
10. Periksa middleware Authentication.
11. Periksa middleware RBAC.
12. Periksa PII utility.
13. Periksa AuditLog implementation.
14. Periksa pola transaction yang sudah digunakan.
15. Periksa pola DTO, service, router, error handler dan testing.

JANGAN mengubah schema hanya berdasarkan dokumentasi.

Gunakan SOURCE CODE + DATABASE SCHEMA AKTUAL sebagai sumber kebenaran implementasi.

==================================================
IMPLEMENTATION SCOPE
==================================================

Implementasikan hanya:

Keluarga
AnggotaKeluarga

beserta:

- Service
- DTO
- Validation
- API Router
- Authentication integration
- RBAC
- PII protection
- Soft delete
- Transaction
- Audit logging
- Integrity tests
- Rollback tests
- Regression tests
- Documentation

==================================================
DATABASE RULE
==================================================

Pastikan:

Keluarga.id
→ BIGINT PRIMARY KEY

Keluarga.nomorKK
→ UNIQUE BUSINESS IDENTIFIER

Keluarga.kepalaId
→ BIGINT FK → Penduduk.id

Keluarga.desaId
→ FK → Desa.id

AnggotaKeluarga.id
→ BIGINT PRIMARY KEY

AnggotaKeluarga.keluargaId
→ FK → Keluarga.id

AnggotaKeluarga.pendudukId
→ FK → Penduduk.id

DILARANG:

- NIK sebagai FK
- nomorKK sebagai PK
- fixed-column family member
- duplicate Penduduk model
- duplicate Desa model

==================================================
TRANSACTION
==================================================

Semua operasi yang mengubah beberapa entity
dalam satu business operation WAJIB atomic.

Minimal test:

Create Keluarga

- Create Kepala Keluarga
- Create AnggotaKeluarga

Jika salah satu gagal:

ROLLBACK SEMUA.

Juga uji:

Change Kepala Keluarga

- update membership

Jika salah satu gagal:

ROLLBACK.

==================================================
API
==================================================

Implementasikan API berdasarkan API Blueprint
dan pola router yang SUDAH ADA.

Minimal endpoint:

GET /api/keluarga
GET /api/keluarga/:id
GET /api/keluarga/:id/anggota
POST /api/keluarga
PATCH /api/keluarga/:id
DELETE /api/keluarga/:id

POST /api/keluarga/:id/anggota
PATCH /api/keluarga/:id/anggota/:anggotaId
DELETE /api/keluarga/:id/anggota/:anggotaId

Jika blueprint aktual menggunakan endpoint berbeda,
IKUTI BLUEPRINT dan jangan membuat duplicate endpoint.

==================================================
SECURITY
==================================================

Semua endpoint administrative:

Authentication REQUIRED.

Authorization:

gunakan RBAC existing.

Gunakan permission:

keluarga.view
keluarga.create
keluarga.update
keluarga.delete

dan permission anggota keluarga sesuai
RBAC architecture yang sudah ada.

JANGAN mengganti RBAC dengan:

if role === ADMIN

atau mekanisme hardcoded lainnya.

==================================================
PII
==================================================

NIK dan Nomor KK merupakan data sensitif.

Gunakan PII utility existing.

Jangan membuat utility masking kedua.

Pastikan:

- unauthorized user tidak memperoleh full NIK
- public API tidak membocorkan PII
- Citizen A tidak dapat mengakses Citizen B
- IDOR test tersedia

==================================================
SOFT DELETE
==================================================

Ikuti strategi soft delete yang sudah ditetapkan
pada Step 2.

Jangan melakukan hard delete terhadap data historis
tanpa dasar architecture.

==================================================
AUDIT
==================================================

Gunakan AuditLog existing.

Catat:

CREATE
UPDATE
DELETE

untuk:

Keluarga
AnggotaKeluarga

Jangan membuat sistem audit baru.

Jangan mencatat password, OTP, JWT,
database credentials atau secret.

==================================================
VALIDATION
==================================================

Minimal:

- nomorKK valid
- nomorKK duplicate → HTTP 409
- kepalaId valid
- desaId valid
- pendudukId valid
- keluargaId valid
- duplicate active membership → HTTP 409
- resource tidak ditemukan → 404
- validation error → mengikuti convention existing
- unauthorized → 401
- forbidden → 403

Jangan return raw Prisma error.

==================================================
TESTING
==================================================

WAJIB menjalankan:

1. Keluarga CRUD
2. AnggotaKeluarga CRUD
3. Duplicate nomorKK
4. Invalid Penduduk
5. Invalid Desa
6. Invalid Keluarga
7. Duplicate membership
8. Soft delete
9. Authentication
10. RBAC
11. IDOR
12. PII masking
13. Audit
14. Transaction rollback
15. Kepala keluarga transaction
16. Phase 2 regression
17. Phase 3A regression
18. Phase 3B Step 3 regression
19. TypeScript
20. Build

Jika ada test gagal:

JANGAN menyatakan PASS.

Perbaiki jika masih dalam scope STEP 4.

Jika membutuhkan perubahan arsitektur:

STOP dan laporkan.

==================================================
NO HARDCODE
==================================================

Jangan hardcode master data.

Jangan membuat daftar:

agama
pendidikan
pekerjaan
hubungan keluarga
status
desa
kecamatan
kabupaten
provinsi

di source code.

Gunakan database/master/configuration
sesuai Architecture Baseline.

==================================================
DOCUMENTATION
==================================================

Setelah implementasi selesai buat:

docs/development/PHASE-3B-STEP-4-KELUARGA.md

Dokumen harus memuat:

- implementation summary
- database schema
- relations
- API
- DTO
- validation
- RBAC
- authentication
- PII
- soft delete
- transaction
- rollback
- audit
- tests
- regression
- security
- architecture consistency
- known issues
- Definition of Done

==================================================
FINAL VALIDATION
==================================================

Tampilkan:

PHASE:
3B — STEP 4

STATUS:
PASS / BLOCKED

DATABASE:
PASS / FAIL

KELUARGA:
PASS / FAIL

ANGGOTA KELUARGA:
PASS / FAIL

PENDUDUK RELATION:
PASS / FAIL

DESA RELATION:
PASS / FAIL

TRANSACTION:
PASS / FAIL

ROLLBACK:
PASS / FAIL

RBAC:
PASS / FAIL

PII:
PASS / FAIL

IDOR:
PASS / FAIL

AUDIT:
PASS / FAIL

SOFT DELETE:
PASS / FAIL

API:
PASS / FAIL

TESTING:
PASS / FAIL

REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL

ERD CONSISTENCY:
PASS / FAIL

NO HARDCODE:
PASS / FAIL

ARCHITECTURE CONFLICT:
NONE / LIST

BUSINESS RULE CONFLICT:
NONE / LIST

SECURITY FINDINGS:
NONE / LIST

FILES CREATED:
LIST

FILES MODIFIED:
LIST

MIGRATIONS:
LIST

==================================================
MANDATORY STOP
==================================================

SETELAH STEP 4 SELESAI:

STOP.

JANGAN menjalankan STEP 5.

JANGAN membuat PerangkatDesa.

JANGAN membuat domain lain.

JANGAN membuat fitur tambahan.

Tunggu instruksi berikutnya.

START IMPLEMENTATION NOW.
