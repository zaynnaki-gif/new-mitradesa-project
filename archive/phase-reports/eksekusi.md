============================================================
MITRADESA — INFRASTRUCTURE STABILIZATION EXECUTION CONTRACT
============================================================

STATUS:
PRE-PHASE STABILIZATION

OBJECTIVE:
Memperbaiki seluruh masalah infrastructure/codebase yang saat ini
menghambat BUILD, TEST, dan VALIDATION tanpa mengubah arsitektur,
ERD, database business model, API contract, RBAC, business logic,
atau menambahkan fitur/domain baru.

============================================================

1. # MANDATORY CONTEXT

Project MITRADESA adalah GREENFIELD PROJECT yang telah memiliki
Architecture Baseline dan beberapa phase implementasi.

WAJIB membaca terlebih dahulu:

docs/architecture/00-MITRADESA-CONSTITUTION.md
docs/architecture/ARCHITECTURE-BASELINE.md
docs/architecture/04-MASTER-ERD.md
docs/architecture/05-API-BLUEPRINT.md
docs/architecture/06-RBAC-BLUEPRINT.md
docs/architecture/12-NO-HARDCODE-POLICY.md

Kemudian baca dokumentasi phase yang sudah tersedia:

docs/development/PHASE-1-VALIDATION.md
docs/development/PHASE-2-VALIDATION.md
docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md
docs/development/PHASE-3B-STEP-4-KELUARGA.md
docs/development/PHASE-3B-STEP-5-PERANGKAT-DESA.md
docs/development/PHASE-4-VALIDATION.md

Jika nama/path dokumen berbeda, lakukan discovery terlebih dahulu.
JANGAN mengarang isi dokumen.

============================================================ 2. CURRENT BASELINE
============================================================

CODEBASE CHARACTER NORMALIZATION:

STATUS: PASS

Verified:

- Technical identifiers ASCII-only
- Filenames ASCII-only
- Directories ASCII-only
- Imports ASCII-safe
- Exports ASCII-safe
- Prisma identifiers ASCII-safe
- API routes ASCII-safe
- RBAC keys ASCII-safe
- Audit identifiers ASCII-safe
- No stale Unicode references
- No duplicate modules
- Prisma Validate PASS

Dokumentasi:

docs/development/CODEBASE-CHARACTER-NORMALIZATION-GLOBAL.md

PERTAHANKAN KONDISI INI.

JANGAN mengembalikan karakter Unicode non-ASCII ke:

- filename
- directory
- class
- function
- variable
- constant
- interface
- type
- Prisma model
- Prisma field
- enum
- API route
- RBAC permission key
- audit identifier
- service name
- repository name

Komentar, UI text, dokumentasi, dan string user-facing boleh menggunakan
Unicode jika memang diperlukan.

TECHNICAL IDENTIFIERS HARUS ASCII-ONLY.

============================================================ 3. CURRENT PROBLEM
============================================================

Character normalization sudah PASS.

Namun codebase masih memiliki:

1. BUILD PARTIAL / FAIL
2. PRE-EXISTING TYPESCRIPT ERRORS
3. TEST BLOCKED
4. MODULE RESOLUTION ISSUES
5. POSSIBLE STALE PRISMA CLIENT
6. POSSIBLE PRISMA TYPE MISMATCH
7. DATABASE/MIGRATION INFRASTRUCTURE BLOCKER

MASALAH TERSEBUT HARUS DIAUDIT TERLEBIH DAHULU.

JANGAN langsung mengubah banyak file.

============================================================ 4. ABSOLUTE SCOPE
============================================================

TASK INI HANYA UNTUK:

A. Codebase audit
B. TypeScript error analysis
C. Module resolution repair
D. Prisma Client consistency repair
E. TypeScript compilation repair
F. Jest/module resolution repair
G. Test execution repair
H. Regression validation
I. Infrastructure documentation

TASK INI BUKAN UNTUK:

- feature development
- business domain development
- database redesign
- architecture redesign

============================================================ 5. STRICT NO-SCOPE RULE
============================================================

DILARANG membuat atau mengembangkan:

- Surat Online
- Template Surat
- QR TTE
- WhatsApp
- RPJMDes
- RKPDes
- APBDes
- Usulan Online
- Voting Program
- PBB
- UMKM
- Marketplace
- Pariwisata
- Berita
- Statistik
- Dashboard baru
- Domain baru
- Phase 5
- Domain lain yang belum diperintahkan

DILARANG membuat:

- model duplicate
- service duplicate
- router duplicate
- middleware duplicate
- Prisma model duplicate
- configuration engine duplicate
- auth engine duplicate
- RBAC engine duplicate

============================================================ 6. STEP 1 — SYSTEM AUDIT
============================================================

Sebelum mengubah kode:

1. Jalankan build.
2. Jalankan Prisma validate.
3. Jalankan Prisma generate jika aman.
4. Jalankan test suite.
5. Catat SEMUA error.
6. Kelompokkan error berdasarkan root cause.

Kategori minimal:

- Module Resolution
- TypeScript Type Error
- Prisma Client
- Prisma Schema
- Import/Export
- Jest Configuration
- Path Alias
- Runtime
- Environment
- Database Connection
- Migration
- Test Infrastructure

JANGAN langsung memperbaiki error satu per satu tanpa memahami
root cause.

Buat:

docs/development/INFRASTRUCTURE-STABILIZATION-AUDIT.md

Isi minimal:

- baseline
- command yang dijalankan
- error count
- error inventory
- root cause
- affected files
- proposed repair
- risk assessment

STOP sementara setelah audit jika ditemukan perubahan arsitektur
yang diperlukan.

============================================================ 7. STEP 2 — MODULE RESOLUTION
============================================================

Periksa seluruh import internal.

Pastikan:

- relative import valid
- extension konsisten dengan konfigurasi TypeScript
- tsconfig sesuai struktur project
- Jest menggunakan resolver yang sesuai
- build resolver dan test resolver tidak bertentangan
- tidak ada import ke file yang sudah dipindahkan
- tidak ada stale import
- tidak ada duplicate path
- case-sensitive path konsisten

Contoh masalah yang harus dicari:

../utils/response.js
../app
../services/prisma

Namun JANGAN mengganti import hanya berdasarkan contoh di atas.

Verifikasi setiap path terhadap filesystem dan konfigurasi project.

PRINSIP:

FIX ROOT CAUSE.

Bukan sekadar membuat compiler diam.

============================================================ 8. STEP 3 — PRISMA CLIENT CONSISTENCY
============================================================

Audit:

- prisma/schema.prisma
- Prisma Client generated output
- package version
- @prisma/client version
- prisma CLI version
- tsconfig
- generated types
- Prisma imports

Pastikan Prisma Client merepresentasikan schema terbaru.

Jika Prisma Client stale:

1. pastikan tidak ada proses Node yang mengunci binary
2. hentikan proses development yang relevan
3. regenerate Prisma Client
4. jalankan prisma validate
5. jalankan build kembali

JANGAN:

- mengubah schema hanya untuk menghilangkan TypeScript error
- menghapus model
- mengubah FK
- mengubah PK
- mengganti nama model
- membuat workaround `any`
- membuat fake Prisma type

Khususnya DILARANG:

(as any)

untuk menyembunyikan mismatch Prisma yang sebenarnya.

Jika error berasal dari schema/type mismatch,
perbaiki akar masalahnya.

============================================================ 9. STEP 4 — TYPESCRIPT REPAIR
============================================================

Perbaiki TypeScript error yang memang berasal dari infrastructure,
module resolution, atau type mismatch.

Prioritas:

1. missing module
2. wrong import/export
3. stale generated type
4. incorrect Prisma relation type
5. incorrect service return type
6. incorrect DTO type
7. incorrect route typing
8. incorrect Jest typing

JANGAN melakukan:

- disable strict mode
- menambahkan @ts-ignore secara massal
- menambahkan @ts-nocheck
- mengganti banyak type menjadi any
- mematikan compiler error
- menurunkan TypeScript safety

DILARANG:

// @ts-ignore

sebagai solusi default.

Jika benar-benar diperlukan untuk compatibility,
harus dijelaskan dalam audit dan hanya boleh digunakan secara lokal
dengan alasan teknis yang jelas.

TARGET:

TypeScript BUILD = 0 errors.

============================================================ 10. STEP 5 — PRESERVE EXISTING BUSINESS LOGIC
============================================================

Selama repair:

JANGAN mengubah:

- Penduduk business rules
- Keluarga business rules
- AnggotaKeluarga business rules
- PerangkatDesa business rules
- Citizen authentication
- Internal authentication
- RBAC
- Permission
- Audit behavior
- Soft delete
- IDOR protection
- PII masking
- Transaction semantics
- API endpoint semantics

Jika sebuah error mengharuskan perubahan business logic,
JANGAN langsung mengubahnya.

Laporkan sebagai:

ARCHITECTURAL/BUSINESS DECISION REQUIRED.

============================================================ 11. STEP 6 — DATABASE CONNECTION
============================================================

Audit environment configuration.

Periksa:

- DATABASE_URL
- DIRECT_URL jika digunakan
- Prisma datasource
- Supabase connection configuration
- environment loading

JANGAN menampilkan:

- password
- service_role key
- JWT secret
- private credentials

dalam report.

Gunakan masking:

DATABASE_URL=postgresql://**_:_**@host/db

Jika database tidak dapat diakses:

JANGAN:

- membuat database dummy
- mengganti database secara diam-diam
- menggunakan SQLite sebagai pengganti
- menghapus migration
- mengubah datasource tanpa instruksi

Catat:

DATABASE_CONNECTIVITY = BLOCKED

dan lanjutkan pekerjaan yang dapat dilakukan tanpa database.

============================================================ 12. STEP 7 — MIGRATION SAFETY
============================================================

JANGAN membuat migration baru kecuali memang diperlukan oleh
perubahan schema yang sudah disepakati.

Karena task ini adalah infrastructure stabilization,
migration bukan target utama.

Jika ditemukan migration yang belum diaplikasikan:

- audit
- identifikasi
- jangan mengubah isi migration existing
- jangan membuat migration pengganti
- jangan reset database

Database reset sangat dilarang:

prisma migrate reset
DROP DATABASE
DROP SCHEMA
TRUNCATE

kecuali ada instruksi eksplisit.

============================================================ 13. STEP 8 — JEST REPAIR
============================================================

Setelah TypeScript build bersih:

Audit:

- jest.config
- tsconfig
- moduleNameMapper
- roots
- testMatch
- testEnvironment
- setup files
- path aliases

Pastikan Jest dapat menemukan:

- app
- services
- middleware
- Prisma
- DTO
- routes
- utilities

JANGAN menghapus test hanya agar suite PASS.

JANGAN mengubah assertion hanya agar PASS.

Jika test memang salah karena implementation bug,
perbaiki implementation.

Jika test salah karena obsolete contract,
catat dan jangan diam-diam mengubah business contract.

============================================================ 14. STEP 9 — TEST EXECUTION
============================================================

Setelah Jest dapat berjalan:

Jalankan:

1. Unit tests
2. API tests
3. Authentication tests
4. RBAC tests
5. Penduduk tests
6. Keluarga tests
7. AnggotaKeluarga tests
8. PerangkatDesa tests
9. Reference tests
10. Regression tests

Kemudian Playwright jika environment memungkinkan.

Catat:

- total tests
- passed
- failed
- skipped
- blocked

JANGAN menyatakan PASS jika test tidak benar-benar dijalankan.

============================================================ 15. STEP 10 — REGRESSION
============================================================

Wajib memastikan repair tidak merusak:

PHASE 2:

- Citizen authentication
- OTP
- CitizenSession
- InternalSession
- RBAC

PHASE 3A:

- Provinsi
- Kabupaten
- Kecamatan
- Desa
- IdentitasDesa

PHASE 3B:

- Penduduk
- Keluarga
- AnggotaKeluarga
- PerangkatDesa
- Account integration

PHASE 4:

- Reference data
- Reference API
- Reference RBAC
- Reference audit

Jika database belum tersedia,
pisahkan:

STATIC VALIDATION
dan
DATABASE VALIDATION.

Jangan menyamakan keduanya.

============================================================ 16. STEP 11 — ASCII CHARACTER FINAL AUDIT
============================================================

Setelah semua repair:

Scan ulang:

apps/api/src
apps/web/src
apps/api/prisma
tests
scripts
docs

Verifikasi:

- identifiers
- filenames
- directories
- Prisma identifiers
- API routes
- RBAC keys
- audit identifiers
- imports
- exports

HARUS:

Technical Unicode identifiers = 0

Unicode filenames = 0

Unicode directories = 0

Jangan hanya memeriksa source code.
Periksa juga generated files yang relevan.

============================================================ 17. STEP 12 — FINAL VALIDATION
============================================================

Target akhir:

PRISMA VALIDATE:
PASS

TYPESCRIPT BUILD:
PASS — 0 errors

JEST:
PASS / atau BLOCKED dengan root cause yang jelas

REGRESSION:
PASS / atau BLOCKED dengan root cause yang jelas

CHARACTER NORMALIZATION:
PASS

DUPLICATE MODULE:
0

STALE REFERENCE:
0

ARCHITECTURE CHANGE:
NONE

BUSINESS LOGIC CHANGE:
NONE

DATABASE DESTRUCTIVE ACTION:
NONE

============================================================ 18. DOCUMENTATION
============================================================

Buat:

docs/development/INFRASTRUCTURE-STABILIZATION-VALIDATION.md

Isi:

1. Objective
2. Initial baseline
3. Error inventory
4. Root cause analysis
5. Files changed
6. Module resolution repair
7. Prisma repair
8. TypeScript repair
9. Jest repair
10. Database connectivity status
11. Build result
12. Test result
13. Regression result
14. Character normalization result
15. Security verification
16. Architecture verification
17. Business logic verification
18. Remaining blockers
19. Final status

Gunakan status yang jujur:

PASS
PARTIAL
BLOCKED
FAIL

JANGAN mengklaim PASS jika belum diverifikasi.

============================================================ 19. CHANGE CONTROL
============================================================

Sebelum setiap perubahan:

Tentukan:

FILE:
ROOT CAUSE:
WHY CHANGE IS REQUIRED:
RISK:
EXPECTED RESULT:

Perubahan harus seminimal mungkin.

Prioritaskan:

FIX > REFACTOR

JANGAN melakukan refactor besar.

JANGAN mempercantik code yang tidak berkaitan.

JANGAN melakukan cleanup yang tidak diperlukan.

============================================================ 20. SECURITY RULES
============================================================

Jangan membaca, mencetak, atau menulis credential ke documentation.

Jangan commit:

- database password
- Supabase service role key
- JWT secret
- private API key
- OTP secret

Jika ditemukan credential hardcoded:

JANGAN menyalin credential ke report.

Laporkan:

SENSITIVE-CREDENTIAL-EXPOSURE = FOUND

dengan lokasi file saja.

============================================================ 21. MANDATORY STOP CONDITIONS
============================================================

STOP jika:

- membutuhkan perubahan ERD
- membutuhkan perubahan business logic
- membutuhkan perubahan API contract
- membutuhkan perubahan authentication design
- membutuhkan perubahan RBAC architecture
- membutuhkan perubahan database design
- membutuhkan destructive database operation
- membutuhkan penambahan domain baru

Dalam kondisi tersebut:

JANGAN mengambil keputusan sendiri.

Laporkan:

BLOCKED — DECISION REQUIRED

============================================================ 22. ABSOLUTE NO-HARDCODE RULE
============================================================

Jangan memperbaiki infrastructure dengan hardcode business data.

DILARANG membuat:

- hardcoded role
- hardcoded permission
- hardcoded reference data
- hardcoded village
- hardcoded NIK
- hardcoded account
- hardcoded database ID
- hardcoded API behavior

Repair infrastructure tidak boleh menciptakan technical debt baru.

============================================================ 23. FINAL REPORT FORMAT
============================================================

Setelah seluruh pekerjaan selesai, tampilkan:

============================================================
MITRADESA INFRASTRUCTURE STABILIZATION
FINAL VALIDATION REPORT
============================================================

STATUS:
PASS / PARTIAL / BLOCKED / FAIL

BUILD:
PASS / FAIL

TYPESCRIPT ERRORS:
<number>

PRISMA VALIDATE:
PASS / FAIL

PRISMA CLIENT:
PASS / FAIL

JEST:
PASS / BLOCKED / FAIL

REGRESSION:
PASS / BLOCKED / FAIL

DATABASE:
CONNECTED / BLOCKED

CHARACTER NORMALIZATION:
PASS / FAIL

UNICODE TECHNICAL IDENTIFIERS:
<number>

UNICODE FILENAMES:
<number>

UNICODE DIRECTORIES:
<number>

DUPLICATE MODULES:
<number>

STALE REFERENCES:
<number>

ARCHITECTURE CHANGES:
NONE / LIST

BUSINESS LOGIC CHANGES:
NONE / LIST

DATABASE CHANGES:
NONE / LIST

FILES CREATED:
<list>

FILES MODIFIED:
<list>

FILES DELETED:
<list>

REMAINING BLOCKERS:
<list>

ROOT CAUSES:
<list>

SECURITY FINDINGS:
NONE / LIST

============================================================
MANDATORY STOP
============================================================

SETELAH FINAL VALIDATION:

STOP.

JANGAN:

- lanjut Phase berikutnya
- membuat fitur baru
- membuat domain baru
- membuat migration baru tanpa instruksi
- melakukan refactor besar
- mengubah ERD
- mengubah API contract
- mengubah business logic

TUNGGU INSTRUKSI BERIKUTNYA.

============================================================
END OF EXECUTION CONTRACT
============================================================
