═══════════════════════════════════════════════════════════════════════════════
MITRADESA — PHASE 4 UNBLOCK & COMPLETION EXECUTION CONTRACT
═══════════════════════════════════════════════════════════════════════════════

STATUS SAAT INI:
PHASE 4 = BLOCKED

JANGAN MEMULAI PHASE 5.

Tugas Anda sekarang HANYA menyelesaikan seluruh blocker Phase 4 sampai
VALIDATION FINAL berstatus PASS.

=====================================================================

1. # MANDATORY ARCHITECTURE BASELINE

SEBELUM MELAKUKAN PERUBAHAN APAPUN:

1. Baca:
   docs/architecture/ARCHITECTURE-BASELINE.md

2. Baca:
   docs/architecture/03-DATABASE-BLUEPRINT.md

3. Baca:
   docs/architecture/04-MASTER-ERD.md

4. Baca:
   docs/architecture/05-API-BLUEPRINT.md

5. Baca:
   docs/architecture/06-RBAC-BLUEPRINT.md

6. Baca:
   docs/architecture/12-NO-HARDCODE-POLICY.md

7. Baca seluruh dokumentasi Phase 4 yang sudah tersedia.

8. Audit implementation aktual di repository.

JANGAN mengandalkan laporan sebelumnya sebagai bukti bahwa implementasi
sudah benar.

Verifikasi repository, Prisma schema, migration, database, source code,
test dan build secara aktual.

===================================================================== 2. CURRENT PHASE 4 FINDINGS
=====================================================================

Temuan yang WAJIB diselesaikan:

CRITICAL:

1. Migration Phase 4 belum ada.
2. Database belum diverifikasi memiliki seluruh reference table.
3. Build TypeScript gagal.
4. Test tidak dapat berjalan.
5. Hanya RefAgama yang memiliki implementasi API lengkap.
6. 7 reference table lainnya belum memiliki implementation lengkap.

HIGH: 7. Seed data belum lengkap. 8. ERD belum diperbarui. 9. Phase 4 validation document belum tersedia. 10. Jest/module resolution masih bermasalah.

JANGAN menghapus temuan tersebut dari dokumentasi hanya agar status menjadi
PASS.

Semua harus benar-benar diperbaiki.

===================================================================== 3. SCOPE PHASE 4
=====================================================================

Phase 4 hanya mencakup REFERENCE DATA FOUNDATION.

Reference tables yang WAJIB tersedia:

1. RefAgama
2. RefGolDarah
3. RefStatusPerkawinan
4. RefHubunganKeluarga
5. RefStatusKependudukan
6. RefPendidikan
7. RefPekerjaan
8. RefJabatanPerangkat
9. RefStatusPerangkat

PERHATIAN:

Laporan sebelumnya menyebut "8 reference tables" tetapi inventory aktual
berisi 9 model.

JANGAN mengabaikan ketidaksesuaian ini.

Tetapkan inventory FINAL berdasarkan Prisma schema + architecture
documentation + kebutuhan domain.

Jika terdapat konflik dokumentasi, lakukan audit dan dokumentasikan
keputusan yang diambil.

JANGAN membuat model duplikat.

===================================================================== 4. STEP 1 — AUDIT AKTUAL
=====================================================================

Audit:

- Prisma schema
- migration directory
- migration history
- database connection
- seluruh model reference
- seluruh service
- seluruh route
- DTO
- validation
- RBAC
- AuditService
- seed
- Jest
- TypeScript
- API registration
- ERD documentation

Buat:

docs/development/PHASE-4-UNBLOCK-STEP-1-AUDIT.md

Isi minimal:

- current state
- expected state
- mismatch
- root cause
- affected files
- affected database objects
- repair plan

STOP sementara setelah audit.

JANGAN membuat fitur baru di luar scope.

===================================================================== 5. STEP 2 — DATABASE MIGRATION
=====================================================================

WAJIB membuat migration Prisma yang benar.

Migration harus:

- menggunakan PostgreSQL
- kompatibel dengan existing schema
- tidak menghapus data existing
- tidak melakukan destructive migration tanpa alasan
- menggunakan BIGINT AUTO_INCREMENT/identity sesuai architecture
- memiliki primary key yang benar
- memiliki unique business key
- memiliki createdAt
- memiliki updatedAt
- memiliki soft-delete/activation mechanism sesuai architecture
- memiliki index yang diperlukan

Gunakan Prisma migration.

JANGAN hanya mengubah schema.prisma tanpa migration.

Setelah migration dibuat:

1. jalankan migration
2. verifikasi database
3. verifikasi seluruh tabel benar-benar ada
4. verifikasi column
5. verifikasi PK
6. verifikasi UNIQUE
7. verifikasi INDEX
8. verifikasi timestamps
9. verifikasi soft-delete field

Jika environment/database tidak dapat diakses:

JANGAN mengklaim PASS.

Status harus BLOCKED dan jelaskan penyebab sebenarnya.

===================================================================== 6. STEP 3 — IMPLEMENTASI REFERENCE DOMAIN
=====================================================================

Setiap reference model WAJIB memiliki implementasi yang konsisten.

Untuk setiap model:

- DTO
- Zod validation
- service
- route
- CRUD
- soft delete/deactivation
- activation/deactivation bila diperlukan
- RBAC
- audit logging
- tests
- seed

Minimal pola:

GET /api/reference/{resource}
GET /api/reference/{resource}/:kode
POST /api/reference/{resource}
PATCH /api/reference/{resource}/:kode
DELETE /api/reference/{resource}/:kode

Gunakan database sebagai source of truth.

JANGAN membuat array master data di TypeScript.

Contoh YANG DILARANG:

const agama = [
"Islam",
"Kristen",
"Katolik"
];

JANGAN melakukan hardcode business master data.

Data harus berasal dari database.

===================================================================== 7. STEP 4 — REFERENCE SERVICE ARCHITECTURE
=====================================================================

Gunakan pola service yang konsisten.

Jika generic ReferenceService memang sesuai architecture:

- boleh digunakan
- tetapi harus benar-benar production-ready
- harus type-safe
- tidak boleh menjadi abstraction yang menyulitkan domain

Jika domain membutuhkan service khusus:

buat service khusus.

JANGAN memaksakan generic abstraction hanya demi mengurangi jumlah file.

Tujuan:

CONSISTENCY + TYPE SAFETY + MAINTAINABILITY.

===================================================================== 8. STEP 5 — RBAC
=====================================================================

Gunakan permission database-driven yang sudah ada.

Permission minimal:

reference.view
reference.create
reference.update
reference.delete

JANGAN bypass authorization.

JANGAN membuat permission baru jika tidak diperlukan oleh architecture.

Pastikan:

- unauthenticated → 401
- authenticated tanpa permission → 403
- authorized → allowed

Verifikasi seluruh endpoint.

===================================================================== 9. STEP 6 — AUDIT LOGGING
=====================================================================

Semua mutation harus masuk AuditLog.

Minimal:

REFERENCE_CREATED
REFERENCE_UPDATED
REFERENCE_DELETED
REFERENCE_ACTIVATED
REFERENCE_DEACTIVATED

Audit harus mencatat actor/account yang melakukan perubahan.

JANGAN membuat audit system baru.

Gunakan Audit Engine yang sudah ada.

===================================================================== 10. STEP 7 — VALIDATION & ERROR HANDLING
=====================================================================

WAJIB:

- Zod validation
- consistent API response
- validation error → 400
- unauthorized → 401
- forbidden → 403
- not found → 404
- duplicate business key → 409
- unexpected server error → 500

JANGAN mengembalikan stack trace kepada client production.

JANGAN menggunakan status 500 untuk duplicate data.

===================================================================== 11. STEP 8 — SEED DATA
=====================================================================

Implementasikan seed database-driven untuk seluruh reference domain.

Seed harus:

- idempotent
- aman dijalankan berulang
- tidak membuat duplicate
- menggunakan business key sebagai basis upsert
- tidak menghapus existing data secara sembarangan

JANGAN membuat seed yang hanya bekerja satu kali.

JANGAN menghapus master data existing hanya untuk menjalankan seed.

Buat dokumentasi sumber data seed.

Jika nilai reference belum ditentukan oleh architecture/documentation:

JANGAN mengarang data.

Tandai sebagai DECISION REQUIRED atau gunakan dataset yang memang sudah
ditentukan repository.

===================================================================== 12. STEP 9 — BUILD REPAIR
=====================================================================

Perbaiki seluruh TypeScript compilation error yang ditemukan.

Error yang diketahui:

1. src/routes/auth/citizen.ts
   Cannot find module '../utils/response.js'

2. src/services/identitas-desa.service.ts
   Property 'kecamatan' does not exist

3. src/routes/reference.ts
   Argument type mismatch

PERHATIAN:

Walaupun disebut "pre-existing issue", Phase 4 FINAL VALIDATION tetap
harus PASS.

Jangan menghapus test atau menurunkan strictness TypeScript untuk membuat
build PASS.

Jangan menggunakan:

// @ts-ignore

atau:

any

sebagai jalan pintas kecuali benar-benar dibenarkan architecture dan
didokumentasikan.

Cari ROOT CAUSE dan perbaiki dengan benar.

===================================================================== 13. STEP 10 — JEST / TEST INFRASTRUCTURE
=====================================================================

Perbaiki:

Cannot find module '../app'
Cannot find module '../services/prisma'

Audit:

- jest.config.js
- tsconfig
- moduleNameMapper
- rootDir
- testEnvironment
- ESM/CJS compatibility
- TypeScript transformation
- import extension
- Prisma initialization

JANGAN menghapus test.

JANGAN mematikan test hanya agar CI PASS.

Jalankan:

- unit tests
- API tests
- reference tests
- regression tests

===================================================================== 14. STEP 11 — REFERENCE TEST MATRIX
=====================================================================

Setiap reference resource minimal memiliki test:

READ:

- list
- detail

CREATE:

- valid
- invalid
- duplicate kode

UPDATE:

- valid
- not found
- duplicate kode

DELETE:

- valid
- not found
- soft delete

RBAC:

- unauthorized
- forbidden
- authorized

AUDIT:

- create logged
- update logged
- delete logged

Database:

- unique constraint
- soft delete
- inactive record behavior

===================================================================== 15. STEP 12 — REGRESSION TEST
=====================================================================

WAJIB memastikan Phase sebelumnya tetap PASS.

Regression:

Phase 2:

- authentication
- citizen OTP
- internal authentication
- RBAC
- session
- audit

Phase 3A:

- Provinsi
- Kabupaten
- Kecamatan
- Desa
- IdentitasDesa

Phase 3B:

- Penduduk
- Keluarga
- AnggotaKeluarga
- PerangkatDesa
- Account integration

JANGAN mengubah business logic Phase sebelumnya hanya untuk menghindari
test failure.

Jika ditemukan regression:

STOP dan perbaiki root cause.

===================================================================== 16. STEP 13 — ERD SYNCHRONIZATION
=====================================================================

Update:

docs/architecture/04-MASTER-ERD.md

Reference tables harus tercermin dalam ERD.

Pastikan:

- nama model
- nama tabel
- PK
- business key
- FK
- index
- relation
- soft delete

sesuai Prisma schema aktual.

ERD tidak boleh menjadi dokumentasi fiktif.

Prisma schema + migration + ERD harus konsisten.

===================================================================== 17. STEP 14 — API DOCUMENTATION
=====================================================================

Update API documentation.

Untuk setiap resource dokumentasikan:

- endpoint
- HTTP method
- authentication
- permission
- request body
- validation
- response
- error response
- audit behavior
- soft-delete behavior

Jangan dokumentasikan endpoint yang tidak benar-benar terdaftar.

===================================================================== 18. STEP 15 — NO-HARDCODE AUDIT
=====================================================================

Search repository untuk:

- hardcoded agama
- hardcoded golongan darah
- hardcoded status perkawinan
- hardcoded hubungan keluarga
- hardcoded pendidikan
- hardcoded pekerjaan
- hardcoded jabatan
- hardcoded status perangkat

Reference values harus berasal dari database.

Konstanta teknis seperti route name, permission identifier,
database column name, dan enum internal yang memang diperlukan
BUKAN dianggap master-data hardcode.

===================================================================== 19. STEP 16 — SECURITY AUDIT
=====================================================================

Verifikasi:

- authentication
- authorization
- IDOR
- SQL injection protection via Prisma
- input validation
- mass assignment
- privilege escalation
- PII exposure
- audit integrity

Reference data memang bukan PII, tetapi endpoint tetap harus protected
sesuai RBAC.

===================================================================== 20. STEP 17 — FINAL VALIDATION
=====================================================================

Buat:

docs/development/PHASE-4-VALIDATION.md

Dokumen harus berisi:

DATABASE

- migration
- migration applied
- schema verified

REFERENCE DOMAIN

- seluruh reference model
- service
- route
- DTO
- seed
- tests

RBAC

- permissions
- authorization

AUDIT

- events
- actor

SECURITY

- validation
- IDOR
- privilege

BUILD

- TypeScript PASS

TEST

- unit PASS
- API PASS
- integration PASS
- regression PASS

ERD

- synchronized

NO-HARDCODE

- verified

DOCUMENTATION

- complete

===================================================================== 21. DEFINITION OF DONE
=====================================================================

Phase 4 hanya boleh dinyatakan:

STATUS: ✅ PASS

jika SEMUA kondisi berikut terpenuhi:

[ ] Migration exists
[ ] Migration applied
[ ] Database verified
[ ] All reference tables implemented
[ ] All services implemented
[ ] All routes implemented
[ ] DTO validation implemented
[ ] RBAC verified
[ ] Audit verified
[ ] Soft delete verified
[ ] Seed implemented
[ ] Seed idempotent
[ ] Build PASS
[ ] Jest PASS
[ ] API tests PASS
[ ] Integration tests PASS
[ ] Regression tests PASS
[ ] ERD synchronized
[ ] API documentation synchronized
[ ] No-hardcode audit PASS
[ ] Security audit PASS
[ ] Phase 4 validation document created

SATU SAJA CHECKBOX GAGAL:

STATUS = ❌ BLOCKED

JANGAN mengklaim PASS parsial.

===================================================================== 22. PROHIBITED ACTIONS
=====================================================================

DILARANG:

❌ Memulai Phase 5
❌ Membuat domain Surat
❌ Membuat Template Surat
❌ Membuat QR/TTE
❌ Membuat WhatsApp notification
❌ Membuat RPJMDes
❌ Membuat RKPDes
❌ Membuat APBDes
❌ Membuat Voting
❌ Membuat domain Ekonomi
❌ Membuat domain lain
❌ Mengubah architecture baseline tanpa alasan
❌ Membuat model duplikat
❌ Menghapus data existing
❌ Menghapus test
❌ Menonaktifkan TypeScript strictness
❌ Menggunakan hardcoded reference data
❌ Mengklaim database migration PASS tanpa benar-benar menjalankannya

===================================================================== 23. EXECUTION ORDER
=====================================================================

Kerjakan secara BERURUTAN:

STEP A
Audit aktual

↓
STEP B
Database migration

↓
STEP C
Implement seluruh reference domain

↓
STEP D
DTO + validation

↓
STEP E
API + service

↓
STEP F
RBAC + audit

↓
STEP G
Seed

↓
STEP H
Build repair

↓
STEP I
Test infrastructure repair

↓
STEP J
Reference tests

↓
STEP K
Regression tests

↓
STEP L
ERD synchronization

↓
STEP M
API documentation

↓
STEP N
Security + no-hardcode audit

↓
STEP O
Final validation

===================================================================== 24. EXECUTION DISCIPLINE
=====================================================================

SETELAH SETIAP STEP:

1. Jalankan validation yang relevan.
2. Catat hasil aktual.
3. Jangan menyatakan PASS jika belum diverifikasi.
4. Jika gagal, perbaiki sebelum lanjut.
5. Jangan melewati step.
6. Jangan memperluas scope.

JIKA menemukan masalah di luar Phase 4:

- dokumentasikan
- jangan memperluas scope
- hanya perbaiki jika masalah tersebut BLOCKING Phase 4 atau regression.

===================================================================== 25. FINAL RESPONSE FORMAT
=====================================================================

Setelah selesai, berikan laporan dengan format:

# MITRADESA PHASE 4 FINAL VALIDATION

STATUS: ✅ PASS
atau
STATUS: ❌ BLOCKED

## 1. DATABASE

## 2. REFERENCE MODELS

## 3. SERVICES

## 4. API

## 5. DTO / VALIDATION

## 6. RBAC

## 7. AUDIT

## 8. SOFT DELETE

## 9. SEED

## 10. BUILD

## 11. TEST

## 12. REGRESSION

## 13. ERD

## 14. SECURITY

## 15. NO-HARDCODE

## 16. DOCUMENTATION

## 17. REMAINING BLOCKERS

Jika PASS:

## FINAL DECISION

PHASE 4 COMPLETE.

MANDATORY STOP.

JANGAN memulai Phase 5.

Jika BLOCKED:

## FINAL DECISION

PHASE 4 BLOCKED.

Tuliskan blocker secara eksplisit dan langkah yang diperlukan untuk
unblock.

MANDATORY STOP.

===================================================================== 26. ABSOLUTE RULE
=====================================================================

ARCHITECTURE BASELINE > ASSUMPTION AI

DATABASE > HARDCODE

ACTUAL TEST RESULT > CLAIM

ACTUAL SCHEMA > DOCUMENTATION CLAIM

ACTUAL MIGRATION > schema.prisma CLAIM

NO-HALLUCINATION.

Jika tidak dapat diverifikasi, katakan:

"NOT VERIFIED"

bukan:

"PASS".

═══════════════════════════════════════════════════════════════════════════════
END OF PHASE 4 UNBLOCK & COMPLETION EXECUTION CONTRACT
═══════════════════════════════════════════════════════════════════════════════
