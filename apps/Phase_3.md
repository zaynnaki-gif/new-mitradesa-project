============================================================
MITRADESA — PROMPT MASTER
PHASE 3.4
AUDIT, IMPLEMENTATION, INTEGRATION & PRODUCTION HARDENING
============================================================

PROJECT:
Mitradesa — Manajemen Informasi dan Administrasi Desa

PROJECT ROOT:
D:\mitradesa

API:
D:\mitradesa\apps\api

WEB:
D:\mitradesa\apps\web

PHASE DOCUMENT:
D:\mitradesa\apps\Phase_3.4.md

============================================================
ROLE
============================================================

Anda bertindak sebagai:

- Senior Full-Stack Engineer
- Software Architect
- Prisma/PostgreSQL Engineer
- API Engineer
- Frontend Engineer
- Security Engineer
- QA Engineer
- E2E Engineer
- DevOps/Release Engineer

Anda bertanggung jawab terhadap seluruh lifecycle Phase 3.4:

AUDIT
→ GAP ANALYSIS
→ ARCHITECTURE REVIEW
→ IMPLEMENTATION PLAN
→ SAFE IMPLEMENTATION
→ TEST
→ E2E
→ SECURITY AUDIT
→ REGRESSION
→ BUILD
→ FINAL VERIFICATION

============================================================
PRIMARY OBJECTIVE
============================================================

Implementasikan Phase 3.4 berdasarkan:

D:\mitradesa\apps\Phase_3.4.md

Tetapi JANGAN langsung mengimplementasikan semua isi dokumen.

Langkah pertama WAJIB:

1. Baca Phase_3.4.md secara lengkap.
2. Audit codebase aktual.
3. Audit database/schema.
4. Audit API.
5. Audit frontend.
6. Audit test suite.
7. Bandingkan dokumen Phase 3.4 dengan kondisi aktual.
8. Identifikasi:
   - ALREADY COMPLETE
   - PARTIALLY COMPLETE
   - MISSING
   - BROKEN
   - OBSOLETE
   - BLOCKED
9. Baru susun implementation plan.
10. Setelah plan tervalidasi secara internal, lakukan implementasi.

JANGAN membuat ulang fitur yang sudah tersedia.

============================================================
IMPORTANT PRINCIPLE
============================================================

SOURCE OF TRUTH:

1. Codebase aktual
2. Prisma schema + migration history
3. Existing tests
4. Phase_3.4.md
5. Architecture/contracts yang sudah berjalan

Jangan menganggap dokumentasi selalu sama dengan kondisi code.

Jika dokumentasi mengatakan:

"MISSING"

tetapi fitur ternyata sudah ada dan bekerja:

→ tandai ALREADY COMPLETE.

Jika dokumentasi mengatakan:

"COMPLETE"

tetapi implementasi rusak:

→ tandai BROKEN.

============================================================
DATABASE SAFETY — ABSOLUTE RULE
============================================================

Database saat ini dianggap sebagai baseline valid.

SEBELUM perubahan:

Jalankan:

git status

git branch --show-current

npx prisma validate

npx prisma migrate status

Baca:

prisma/schema.prisma

dan:

prisma/migrations/\*

============================================================
DILARANG
============================================================

JANGAN menjalankan:

npx prisma db push

JANGAN menjalankan:

npx prisma migrate reset

JANGAN:

- DROP DATABASE
- DROP TABLE
- TRUNCATE
- DELETE massal
- menghapus migration
- rename migration lama yang sudah tracked
- mengubah migration lama
- menghapus migration history
- force schema synchronization
- membuat migration hanya untuk menghilangkan error status

JANGAN melakukan perubahan database hanya karena
development menjadi lebih mudah.

============================================================
SCHEMA CHANGE POLICY
============================================================

Jika Phase 3.4 ternyata membutuhkan perubahan schema:

1. Pastikan perubahan memang diperlukan.
2. Pastikan tidak dapat diselesaikan di application layer.
3. Dokumentasikan alasan.
4. Buat migration BARU.
5. Jangan mengubah migration lama.
6. Jangan menghapus data.
7. Jalankan validation.
8. Test migration secara aman.

Jika perubahan schema tidak diperlukan:

JANGAN membuat migration.

============================================================
PHASE 0 — BASELINE SNAPSHOT
============================================================

Sebelum coding:

Jalankan:

git status

git branch --show-current

git log -5 --oneline

npx prisma validate

npx prisma migrate status

API TypeScript check

WEB TypeScript check

API build

WEB build

Existing tests

Catat semua hasil.

Buat:

PHASE_3_4_BASELINE.md

Isi:

- tanggal
- branch
- git status
- Prisma status
- migration status
- build status
- test status
- known errors
- known warnings

============================================================
PHASE 1 — STUDY PHASE_3.4.md
============================================================

Baca:

D:\mitradesa\apps\Phase_3.4.md

secara keseluruhan.

Jangan hanya membaca heading.

Ekstrak:

- objective
- scope
- modules
- priorities
- dependencies
- acceptance criteria
- technical requirements
- security requirements
- testing requirements

Buat daftar:

PHASE_3_4_REQUIREMENTS

dengan format:

ID
Requirement
Priority
Current Status
Evidence
Required Action

============================================================
PHASE 2 — CODEBASE DISCOVERY
============================================================

Audit struktur project.

Cari:

API:

src/routes
src/services
src/controllers
src/middleware
src/utils
src/validators
src/fixtures
src/tests

WEB:

src/pages
src/components
src/hooks
src/services
src/api
src/lib
src/routes

DATABASE:

prisma/schema.prisma
prisma/migrations
seed files

TEST:

unit
integration
E2E
fixtures

============================================================
PHASE 3 — GAP ANALYSIS
============================================================

Untuk setiap requirement Phase 3.4:

STATUS harus salah satu:

✅ COMPLETE

⚠️ PARTIAL

❌ MISSING

🔴 BROKEN

⛔ BLOCKED

🚫 OBSOLETE

Jangan langsung coding.

Buat:

PHASE_3_4_GAP_ANALYSIS.md

Format:

| ID  | Requirement | Priority | Current State | Evidence | Gap | Action |
| --- | ----------- | -------- | ------------- | -------- | --- | ------ |

============================================================
PHASE 4 — ARCHITECTURE REVIEW
============================================================

Pastikan implementasi Phase 3.4 konsisten dengan architecture
yang sudah ada.

Audit:

- routing
- service layer
- repository/data access
- validation
- authentication
- authorization
- response format
- error handling
- frontend API abstraction
- hooks
- component architecture
- state management
- database relationships

Jangan membuat architecture baru jika architecture existing
sudah memenuhi kebutuhan.

Hindari:

- duplicate service
- duplicate API client
- duplicate hooks
- duplicate permission logic
- duplicate validation
- duplicate response formatter

============================================================
PHASE 5 — IMPLEMENTATION PLAN
============================================================

Setelah GAP ANALYSIS selesai:

Buat:

PHASE_3_4_IMPLEMENTATION_PLAN.md

Urutkan:

P0 — BLOCKER / CRITICAL
P1 — HIGH
P2 — MEDIUM
P3 — LOW

Setiap task harus mempunyai:

- objective
- affected files
- dependency
- expected behavior
- test requirement
- security impact
- database impact
- rollback consideration

Jangan mengimplementasikan task yang:

- obsolete
- duplicate
- tidak diperlukan
- tidak memiliki acceptance criteria yang jelas

============================================================
PHASE 6 — SAFE IMPLEMENTATION
============================================================

Implementasikan task berdasarkan priority.

Aturan:

- perubahan minimal
- backward compatible
- gunakan architecture existing
- gunakan reusable component
- gunakan existing validation
- gunakan existing permission system
- gunakan existing response format

Jangan melakukan refactor besar yang tidak terkait.

============================================================
PHASE 7 — API IMPLEMENTATION AUDIT
============================================================

Untuk setiap API yang terkait Phase 3.4:

Validasi:

- route registration
- HTTP method
- authentication
- authorization
- validation
- business logic
- database query
- error handling
- response structure
- BigInt serialization
- pagination
- filtering
- sorting jika diperlukan

Pastikan:

401 = unauthenticated

403 = authenticated but forbidden

404 = resource not found

400 = invalid input

409 = conflict

500 = unexpected server error

Jangan membocorkan internal stack trace ke client.

============================================================
PHASE 8 — FRONTEND IMPLEMENTATION
============================================================

Audit dan implementasikan UI Phase 3.4.

Pastikan setiap halaman memiliki:

- loading state
- empty state
- error state
- success feedback
- validation feedback
- permission handling
- responsive layout
- keyboard accessibility
- usable mobile layout

Jangan menggunakan mock data jika API production sudah tersedia.

Jangan hardcode data yang seharusnya berasal dari API.

============================================================
PHASE 9 — AUTHORIZATION AUDIT
============================================================

Untuk seluruh feature Phase 3.4:

Pastikan permission diperiksa SERVER-SIDE.

Frontend guard hanya untuk UX.

Test:

1. anonymous
2. authenticated without permission
3. authenticated with view permission
4. authenticated with create permission
5. authenticated with update permission
6. authenticated with delete permission
7. full admin

Pastikan tidak ada privilege escalation.

============================================================
PHASE 10 — SECURITY AUDIT
============================================================

Audit seluruh input baru.

Test:

- XSS
- SQL injection
- IDOR
- mass assignment
- path traversal
- malformed IDs
- invalid enum
- oversized payload
- duplicate records
- unauthorized access
- privilege escalation

Jika terdapat:

HTML content
rich text
file upload
URL input
user-generated content

lakukan security review khusus.

============================================================
PHASE 11 — DATABASE INTEGRITY
============================================================

Setelah implementation:

Jalankan:

npx prisma validate

npx prisma migrate status

Pastikan:

- migration valid
- schema valid
- foreign keys valid
- indexes valid
- unique constraints valid

Jika migration baru dibuat:

Jangan hanya memastikan migration berhasil.

Pastikan:

- migration reproducible
- migration tidak destructive
- migration sesuai schema
- migration tidak menghapus data existing

============================================================
PHASE 12 — TEST IMPLEMENTATION
============================================================

Untuk setiap fitur baru:

WAJIB ada test.

Minimal:

UNIT TEST

- INTEGRATION TEST
- E2E TEST

Jika feature tidak membutuhkan salah satunya,
jelaskan alasannya.

Jangan:

.skip

.only

disabled test

commented test

untuk menyembunyikan failure.

============================================================
PHASE 13 — AUTOMATED TEST
============================================================

Jalankan seluruh test suite.

Bukan hanya test Phase 3.4.

Cari:

- failed
- flaky
- timeout
- fixture error
- database state error
- permission error
- race condition

Jika error adalah CODE BUG:

AUTO-FIX.

Jika error adalah TEST BUG:

perbaiki test.

Jika error adalah FIXTURE BUG:

perbaiki fixture.

Jika error adalah ENVIRONMENT:

dokumentasikan.

Jangan menghapus test.

============================================================
PHASE 14 — E2E
============================================================

Buat E2E berdasarkan actual user journey.

Minimal:

LOGIN
→ ACCESS FEATURE
→ CREATE
→ READ
→ UPDATE
→ DELETE/ARCHIVE
→ VERIFY RESULT
→ PUBLIC/USER VIEW jika relevan

Test juga:

- unauthorized access
- validation failure
- empty state
- error state
- refresh persistence
- navigation
- browser reload

Jika Phase 3.4 mencakup workflow tertentu,
ikuti workflow tersebut secara lengkap.

============================================================
PHASE 15 — REGRESSION
============================================================

Pastikan Phase 3.4 tidak merusak Phase sebelumnya.

Minimal regression:

Authentication
Authorization
Penduduk
Keluarga
Identitas Desa
Perangkat Desa
CMS
Media
Kategori
Berita
Halaman
Public pages
Existing APIs

Jalankan test existing.

============================================================
PHASE 16 — PERFORMANCE SANITY
============================================================

Audit:

- unnecessary database queries
- N+1 query
- unbounded query
- missing pagination
- excessive payload
- duplicate API requests
- unnecessary frontend re-render
- memory leaks
- inefficient image/media loading

Jangan melakukan premature optimization.

Perbaiki hanya masalah yang terbukti.

============================================================
PHASE 17 — UI/UX VERIFICATION
============================================================

Jika Phase 3.4 menyentuh frontend:

Verifikasi:

Desktop
Laptop
Tablet
Mobile

Pastikan:

- no overflow
- no broken modal
- no clipped content
- no inaccessible button
- no missing loading state
- no broken empty state
- no inconsistent spacing
- no inconsistent permission behavior

Gunakan design system existing.

Jangan memperkenalkan design language baru tanpa kebutuhan.

============================================================
PHASE 18 — AUTO-FIX POLICY
============================================================

AUTO-FIX diperbolehkan untuk:

- TypeScript errors
- import errors
- API bugs
- validation bugs
- permission bugs
- frontend state bugs
- loading/error state
- broken tests
- incorrect fixtures
- obvious security bugs
- obvious performance bugs
- integration bugs

AUTO-FIX TIDAK diperbolehkan untuk:

- destructive DB changes
- migration history rewrite
- business-rule changes
- auth architecture replacement
- major schema redesign
- deleting production data

Untuk masalah tersebut:

STOP.

REPORT.

RECOMMEND.

============================================================
PHASE 19 — FINAL BUILD
============================================================

Wajib:

API:

TypeScript PASS
Lint PASS jika tersedia
Tests PASS
Build PASS

WEB:

TypeScript PASS
Lint PASS jika tersedia
Tests PASS
Build PASS

DATABASE:

Prisma validate PASS
Migration status UP TO DATE

============================================================
PHASE 20 — FINAL VERIFICATION
============================================================

Setelah semua fix:

JANGAN mengandalkan hasil test sebelum fix.

Ulangi:

git diff

git status

npx prisma validate

npx prisma migrate status

API TypeScript

WEB TypeScript

API tests

WEB tests

Integration tests

E2E tests

Security tests

API build

WEB build

Semua harus diverifikasi setelah perubahan terakhir.

============================================================
PHASE 21 — FINAL CODE REVIEW
============================================================

Review seluruh perubahan:

git diff

Cari:

- accidental changes
- debug code
- console.log
- temporary workaround
- commented code
- TODO yang tidak perlu
- secrets
- hardcoded credentials
- hardcoded URLs
- unsafe casts
- any
- duplicated logic
- security bypass
- test bypass

Hapus hanya debug/temporary code yang memang berasal dari
implementation Phase 3.4.

Jangan menghapus existing code tanpa alasan.

============================================================
PHASE 22 — DOCUMENTATION
============================================================

Buat:

PHASE_3_4_FINAL_REPORT.md

Isi:

# Phase 3.4 Final Report

## 1. Executive Summary

## 2. Baseline

## 3. Requirements

## 4. Gap Analysis

## 5. Implemented Features

## 6. Files Changed

## 7. Database Changes

## 8. API Changes

## 9. Frontend Changes

## 10. Security Audit

## 11. Unit Tests

## 12. Integration Tests

## 13. E2E Tests

## 14. Regression Tests

## 15. Build Verification

## 16. Remaining Issues

## 17. Technical Debt

## 18. Recommended Next Phase

============================================================
FINAL STATUS RULE
============================================================

Phase 3.4 hanya boleh dinyatakan:

COMPLETE

jika:

[ ] Requirements tervalidasi
[ ] Gap analysis selesai
[ ] Semua P0 selesai
[ ] Semua P1 selesai
[ ] P2/P3 sesuai scope
[ ] API PASS
[ ] Frontend PASS
[ ] Authentication PASS
[ ] Authorization PASS
[ ] Security PASS
[ ] Unit tests PASS
[ ] Integration tests PASS
[ ] E2E PASS
[ ] Regression PASS
[ ] Prisma VALID
[ ] Migration UP TO DATE
[ ] API build PASS
[ ] Web build PASS
[ ] No critical bug
[ ] No critical security issue
[ ] No unauthorized database modification
[ ] Final verification PASS

Jika ada critical blocker:

STATUS:

PHASE 3.4 — BLOCKED

Jika semua critical requirement PASS tetapi terdapat warning:

PHASE 3.4 — PASS WITH WARNINGS

Jangan menyatakan COMPLETE hanya karena:

- build berhasil
- TypeScript berhasil
- beberapa test berhasil
- fitur terlihat bekerja secara manual

============================================================
MANDATORY FINAL OUTPUT
============================================================

Tampilkan:

============================================================
MITRADESA PHASE 3.4 FINAL STATUS
============================================================

Requirements:
X/X

P0:
X/X

P1:
X/X

P2:
X/X

API:
PASS / FAIL

WEB:
PASS / FAIL

DATABASE:
PASS / FAIL

MIGRATION:
UP TO DATE / ISSUE

UNIT TEST:
X/X PASS

INTEGRATION TEST:
X/X PASS

E2E:
X/X PASS

SECURITY:
PASS / FAIL

REGRESSION:
PASS / FAIL

API BUILD:
PASS / FAIL

WEB BUILD:
PASS / FAIL

CRITICAL ISSUES:
X

HIGH ISSUES:
X

WARNINGS:
X

DATABASE CHANGES:
NONE / MIGRATION CREATED

OVERALL:
COMPLETE / PASS WITH WARNINGS / BLOCKED

============================================================
NEXT PHASE RECOMMENDATION
============================================================

Jangan menentukan Phase berikutnya berdasarkan tebakan.

Analisis:

- remaining gaps
- technical debt
- architecture readiness
- security readiness
- product roadmap

Kemudian rekomendasikan Phase berikutnya.

============================================================
MANDATORY BEHAVIOR
============================================================

1. AUDIT sebelum coding.
2. Baca Phase_3.4.md secara lengkap.
3. Jangan menganggap dokumentasi selalu benar.
4. Jangan mengimplementasikan fitur yang sudah COMPLETE.
5. Jangan menghapus test untuk mendapatkan PASS.
6. Jangan melakukan destructive database operation.
7. Jangan menggunakan prisma db push.
8. Jangan menggunakan prisma migrate reset.
9. Jangan mengubah migration lama.
10. Jangan mengubah business logic tanpa bukti kebutuhan.
11. Jangan menurunkan security demi E2E.
12. Jangan menyembunyikan error.
13. Jangan menganggap build PASS = production-ready.
14. Semua fix harus dites ulang.
15. Semua perubahan harus direview melalui git diff.
16. Gunakan evidence aktual.
17. Jika tidak yakin, audit lebih dahulu.
18. Jika database berisiko, STOP.
19. Jika requirement ambigu, dokumentasikan ambiguity.
20. Jangan menyatakan COMPLETE tanpa final verification.

============================================================
END OF MASTER PROMPT
============================================================
