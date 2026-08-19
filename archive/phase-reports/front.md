# ============================================================

# MITRADESA — PHASE 3.3

# CMS / CONTENT MANAGEMENT SYSTEM

# MASTER IMPLEMENTATION PROMPT

# ============================================================

Anda adalah Senior Full-Stack Engineer + Software Architect yang bertanggung jawab melanjutkan pembangunan repository MITRADESA.

PROJECT:
Mitradesa — Manajemen Informasi dan Administrasi Desa

REPOSITORY:
D:\mitradesa

OBJECTIVE PHASE 3.3:
Membangun fondasi CMS (Content Management System) Mitradesa secara production-oriented, database-driven, scalable, secure, dan terintegrasi dengan frontend public serta Admin Dashboard.

============================================================

## 0. ABSOLUTE RULES — WAJIB DIPATUHI

============================================================

RULE 1 — AUDIT FIRST
JANGAN langsung membuat kode.

Sebelum melakukan perubahan apa pun:

1. Audit struktur repository.
2. Audit apps/api.
3. Audit apps/web.
4. Audit Prisma schema.
5. Audit migrations.
6. Audit services.
7. Audit routes.
8. Audit middleware authentication + RBAC.
9. Audit existing admin pages/layout.
10. Audit public pages.
11. Audit API client/frontend data layer.
12. Audit existing tests.
13. Audit package.json dan workspace configuration.
14. Cari fitur CMS yang mungkin SUDAH ada.
15. Cari model database yang bisa digunakan kembali.
16. Cari dead code / duplicate implementation.
17. Identifikasi dependency dan architectural constraint.

JANGAN mengasumsikan struktur repository.

Gunakan repository sebagai source of truth.

---

## RULE 2 — PROTECT 77/77 TESTS

CURRENT BASELINE:

API TEST:
77/77 PASS

WAJIB mempertahankan:

77/77 PASS

Tidak boleh menganggap test lama sebagai "obsolete"
hanya karena implementasi baru berbeda.

Jika perubahan menyebabkan test existing gagal:

STOP.

Diagnose root cause.

Perbaiki implementasi CMS agar kompatibel.

Jangan mengubah expectation test lama hanya untuk membuat test hijau,
kecuali perubahan kontrak API memang sudah disetujui secara eksplisit.

Regression test harus dijalankan setelah setiap milestone besar.

---

## RULE 3 — NO BLIND REWRITE

Jangan:

- rewrite architecture
- mengganti ORM
- mengganti database
- mengganti authentication
- mengganti state management
- mengganti routing framework
- mengganti UI framework
- menghapus module existing
- mengubah API contract existing

kecuali audit membuktikan benar-benar diperlukan.

Prefer:
EXTEND > REFACTOR > REWRITE

---

## RULE 4 — DATABASE DRIVEN

CMS tidak boleh menggunakan hardcoded content sebagai source of truth.

Content harus berasal dari database.

Frontend harus mengambil content melalui API.

Admin CMS melakukan CRUD melalui API.

Tidak boleh:

- hardcoded berita
- hardcoded kategori
- hardcoded author
- hardcoded slug
- hardcoded publish status
- hardcoded homepage content

Seed/demo data hanya boleh berada di:
seed script / fixture,
bukan di production component.

---

## RULE 5 — SECURITY FIRST

Semua CMS admin mutation wajib menggunakan:

Authentication

- RBAC authorization
- Input validation
- Audit logging

Gunakan middleware existing jika tersedia.

Jangan membuat sistem auth baru.

Jangan bypass:
authenticateInternal()
authorize()
atau middleware security existing.

Gunakan permission naming convention repository yang sudah ada.

Jangan membuat mismatch permission seperti:
perangkat.view
vs
perangkat_desa.view

Audit permission registry terlebih dahulu.

---

## RULE 6 — SMALL INCREMENTAL CHANGES

Implementasi harus bertahap.

Setiap milestone:

1. Modify
2. TypeScript check
3. Lint
4. Build
5. Relevant tests
6. Full API test regression
7. Baru lanjut

Jika gagal:
STOP → diagnosis → fix → retest.

============================================================

# 1. CURRENT BASELINE — PHASE 3.2

============================================================

DATABASE:

- Supabase PostgreSQL
- Pooler:
  aws-0-ap-southeast-1.pooler.supabase.com
- TCP 5432: PASS
- Database health: PASS

API:

- Port: 3001
- Runtime: PASS
- /api: PASS
- /api/health: PASS
- /api/health/database: PASS

PRISMA:

- Prisma Client: v5.22.0
- Prisma validate: PASS
- Migration status: UP TO DATE

TEST:
77/77 PASS

BREAKDOWN:
Health PASS
Auth PASS
Reference PASS
Penduduk 15/15
Keluarga 15/15
Perangkat 8/8

WEB:

- TypeScript: PASS
- Build: PASS

CURRENT ARCHITECTURAL PRINCIPLE:

DATABASE
↓
PRISMA
↓
SERVICE
↓
ROUTE/API
↓
FRONTEND API CLIENT
↓
ADMIN CMS
↓
PUBLIC WEBSITE

CMS harus mengikuti architecture ini.

============================================================

# 2. PHASE 3.3 — TARGET

============================================================

Bangun CMS foundation untuk mengelola:

A. Berita
B. Kategori Berita
C. Halaman Statis
D. Potensi Desa
E. Wisata Desa
F. Media / Gallery foundation
G. Homepage content foundation
H. Publish workflow foundation
I. SEO metadata
J. Audit trail

Namun JANGAN mengimplementasikan semuanya sekaligus.

Gunakan milestone.

============================================================

# 3. PHASE 3.3-A — REPOSITORY AUDIT

============================================================

LANGKAH PERTAMA.

Jalankan audit repository.

Minimal inspect:

D:\mitradesa
├── apps
├── packages
├── prisma
├── docs
├── package.json
├── package-lock.json / pnpm-lock / yarn.lock
└── workspace config

Kemudian:

apps/api
apps/web

Cari:

- existing CMS
- news
- berita
- article
- content
- page
- category
- media
- gallery
- upload
- storage
- slug
- SEO
- publish
- draft
- author
- audit

Gunakan pencarian repository.

Contoh:

Get-ChildItem -Recurse
Select-String
atau tool search yang tersedia.

Audit Prisma:

- schema.prisma
- migrations
- existing models
- enums
- relations
- indexes
- timestamps
- soft delete patterns

Audit API:

src/routes
src/services
src/middleware
src/utils
src/config
src/tests

Audit WEB:

src/pages
src/components
src/layouts
src/hooks
src/services
src/stores
src/types

============================================================

# 4. AUDIT REPORT WAJIB

============================================================

Sebelum implementasi CMS, buat:

docs/development/PHASE-3.3-AUDIT.md

Isi minimal:

1. Repository architecture
2. Existing CMS-related code
3. Existing database models
4. Existing API patterns
5. Existing authentication pattern
6. Existing RBAC pattern
7. Existing audit log pattern
8. Existing frontend architecture
9. Existing reusable components
10. Existing upload/media capability
11. Existing SEO implementation
12. Existing tests
13. Existing technical debt relevant to CMS
14. Reusable components
15. Components that must NOT be duplicated
16. Risks
17. Proposed CMS architecture
18. Proposed implementation sequence

Jangan implement CMS sebelum audit ini selesai.

============================================================

# 5. PHASE 3.3-B — CMS ARCHITECTURE

============================================================

Setelah audit, buat desain arsitektur CMS.

Target:

ADMIN
│
├── Dashboard
│
├── Content
│ ├── Berita
│ ├── Halaman
│ ├── Potensi Desa
│ └── Wisata Desa
│
├── Media
│ ├── Gallery
│ └── Media Library
│
├── Categories
│
└── Settings
└── SEO

PUBLIC
│
├── /
├── /berita
├── /berita/:slug
├── /profil
├── /potensi
├── /wisata
└── /halaman/:slug

Database-driven.

============================================================

# 6. DATABASE DESIGN

============================================================

Jangan membuat tabel sebelum audit schema.

Jika tabel CMS belum tersedia, desain model yang konsisten dengan Prisma existing.

Minimum conceptual entities:

CMSCategory
CMSPost / Berita
CMSPage
CMSMedia
CMSTag
CMSSEO
CMSRevision

Tetapi nama model HARUS disesuaikan dengan convention repository.

Jangan membuat duplicate model jika equivalent model sudah ada.

---

## BERITA

Minimum fields secara konseptual:

id
title
slug
excerpt
content
featuredImage
status
publishedAt
authorId
categoryId
createdAt
updatedAt

Status:

DRAFT
PUBLISHED
ARCHIVED

Pertimbangkan:

scheduled publish

jika architecture existing memungkinkan.

---

## CATEGORY

id
name
slug
description
isActive
createdAt
updatedAt

Unique:

slug

---

## PAGE

id
title
slug
content
status
publishedAt
createdAt
updatedAt

Unique:

slug

---

## MEDIA

Jangan langsung membuat upload system kompleks.

Audit dulu apakah storage sudah tersedia.

Concept:

id
filename
url
mimeType
size
alt
caption
createdBy
createdAt

---

## SEO

Concept:

metaTitle
metaDescription
ogTitle
ogDescription
ogImage
canonicalUrl
robotsIndex
robotsFollow

Jangan membuat SEO duplicate jika useSeo existing dapat diperluas.

============================================================

# 7. SLUG SYSTEM

============================================================

Slug harus:

- URL safe
- lowercase
- deterministic
- unique
- collision-safe

Contoh:

"Musyawarah Desa Tahun 2026"
→
musyawarah-desa-tahun-2026

Jika collision:

musyawarah-desa-tahun-2026-2

Jangan menggunakan ID sebagai public URL jika slug architecture sudah tersedia.

============================================================

# 8. CMS API

============================================================

Buat API secara modular.

Contoh conceptual:

GET
/api/cms/berita

GET
/api/cms/berita/:id

GET
/api/cms/berita/slug/:slug

POST
/api/cms/berita

PATCH
/api/cms/berita/:id

DELETE
/api/cms/berita/:id

POST
/api/cms/berita/:id/publish

POST
/api/cms/berita/:id/unpublish

---

CATEGORY:

GET
/api/cms/categories

POST
/api/cms/categories

PATCH
/api/cms/categories/:id

DELETE
/api/cms/categories/:id

---

PAGE:

GET
/api/cms/pages

GET
/api/cms/pages/:id

GET
/api/cms/pages/slug/:slug

POST
/api/cms/pages

PATCH
/api/cms/pages/:id

DELETE
/api/cms/pages/:id

---

PUBLIC API

CMS public endpoints harus dipisahkan dari admin endpoints.

Contoh:

GET
/api/public/berita

GET
/api/public/berita/:slug

GET
/api/public/pages/:slug

GET
/api/public/categories

Jangan expose draft ke public API.

============================================================

# 9. API RESPONSE STANDARD

============================================================

Gunakan response helper existing.

Jangan membuat format response baru jika existing sudah tersedia.

Existing pattern:

response.success()
response.created()
ApiError.notFound()
asyncHandler()

Pertahankan.

Pagination harus konsisten:

page
limit
total
totalPages

Search:

search

Filter:

status
category
publishedAt

============================================================

# 10. VALIDATION

============================================================

Gunakan Zod jika repository menggunakan Zod.

Validate:

title
slug
content
excerpt
category
status
SEO
pagination
filters

Reject malformed input.

Jangan menerima arbitrary unknown fields jika schema existing menggunakan strict validation.

============================================================

# 11. RBAC

============================================================

Audit permission registry.

Jika belum ada, conceptual permissions:

content.view
content.create
content.update
content.delete
content.publish

atau naming convention existing.

JANGAN menentukan naming secara blind.

Ikuti convention repository.

Roles minimal:

SUPER_ADMIN
ADMIN
EDITOR

Jika role existing berbeda,
gunakan role existing.

EDITOR:

view
create
update

Publisher:

publish

Admin:

full CMS

Jangan mengubah auth system existing.

============================================================

# 12. AUDIT LOG

============================================================

Semua mutation CMS harus dapat dilacak.

Minimal event:

CREATE
UPDATE
DELETE
PUBLISH
UNPUBLISH

Audit:

user/account
action
resource
resourceId
timestamp
IP
user-agent

Gunakan audit service existing.

Jangan membuat audit logging system kedua.

============================================================

# 13. CMS ADMIN UI

============================================================

Integrasikan dengan AdminLayout existing.

Jangan membuat layout admin kedua.

Target:

/admin/cms

/admin/cms/berita
/admin/cms/berita/new
/admin/cms/berita/:id/edit

/admin/cms/categories

/admin/cms/pages
/admin/cms/pages/new
/admin/cms/pages/:id/edit

/admin/cms/media

---

## BERITA LIST

UI:

- Search
- Filter status
- Filter category
- Pagination
- Create button
- Edit
- Publish
- Unpublish
- Delete
- Empty state
- Loading state
- Error state

---

## BERITA EDITOR

Fields:

Judul
Slug
Ringkasan
Konten
Kategori
Featured image
Status
SEO

Buttons:

Save Draft
Publish
Cancel

Jangan menggunakan editor library baru sebelum audit dependency.

Jika existing project belum punya rich text editor,
pilih solusi paling ringan yang kompatibel.

Jangan menambah dependency besar tanpa alasan.

============================================================

# 14. PUBLIC WEBSITE

============================================================

Integrasikan CMS dengan public website.

Tambahkan:

/berita

/berita/:slug

/halaman/:slug

/potensi

/wisata

Tetap gunakan:

PublicLayout
LoadingState
ErrorState
EmptyState
useSeo

Jangan duplicate component.

---

## PUBLIC BERITA

Tampilkan:

thumbnail
judul
excerpt
tanggal
kategori

---

## DETAIL BERITA

Tampilkan:

judul
tanggal
author
category
featured image
content
SEO

Jangan tampilkan draft.

============================================================

# 15. HOMEPAGE CMS

============================================================

Jangan langsung membuat page builder kompleks.

Phase 3.3 hanya foundation.

Homepage dapat menampilkan:

Hero
Berita terbaru
Potensi
Wisata
Informasi desa

Jika content belum tersedia:

gunakan EmptyState.

Jangan hardcode production content.

============================================================

# 16. MEDIA

============================================================

Audit terlebih dahulu:

Apakah sudah ada:

- multer
- storage
- Supabase Storage
- local storage
- upload service

Jika ada:
REUSE.

Jika belum:
buat abstraction ringan:

MediaService

Jangan mengikat business logic langsung ke filesystem.

Jangan upload file ke database sebagai binary kecuali architecture memang demikian.

============================================================

# 17. SEO

============================================================

Extend existing:

useSeo

Support:

title
description
canonical
og:title
og:description
og:image
robots

Public content harus menghasilkan SEO berdasarkan database.

Contoh:

Berita:
metaTitle → title fallback
metaDescription → excerpt fallback

============================================================

# 18. TESTING STRATEGY

============================================================

WAJIB.

Tambahkan tests untuk CMS.

Minimal:

CATEGORY:

- list
- create
- update
- delete

BERITA:

- list
- create
- detail
- update
- publish
- unpublish
- duplicate slug
- invalid payload
- unauthorized
- forbidden
- public draft protection
- public published article

PAGE:

- create
- update
- public access
- draft protection

SECURITY:

- unauthenticated
- insufficient permission
- valid permission

============================================================

# 19. REGRESSION TEST

============================================================

Setiap milestone:

npm test

HARUS:

77/77 PASS

ditambah CMS tests.

Target akhir:

77 existing tests PASS

- CMS tests PASS

Jangan menghapus test existing.

============================================================

# 20. TYPESCRIPT / LINT / BUILD

============================================================

Setelah implementasi:

API:

npm run typecheck
npm run lint
npm run build
npm test

WEB:

npm run typecheck
npm run lint
npm run build

Prisma:

npx prisma validate
npx prisma generate
npx prisma migrate status

Jika command berbeda:
gunakan script repository yang sebenarnya setelah audit.

============================================================

# 21. MIGRATION SAFETY

============================================================

Jangan:

prisma db push

untuk production schema evolution.

Gunakan:

prisma migrate dev

untuk development migration.

Migration harus:

- deterministic
- reversible where practical
- tidak menghapus existing data
- tidak mengubah existing column secara destructive tanpa alasan

Sebelum migration:

backup/verify schema state.

============================================================

# 22. SEED DATA

============================================================

Tambahkan CMS seed hanya jika diperlukan.

Seed harus:

idempotent.

Contoh:

npm run seed

dua kali tidak boleh menghasilkan duplicate.

Jangan merusak:

reference seed
test users
existing data

============================================================

# 23. ERROR HANDLING

============================================================

CMS harus menggunakan:

LoadingState
ErrorState
EmptyState

Backend:

ApiError
asyncHandler
response helper

HTTP semantics:

400 invalid request
401 unauthenticated
403 forbidden
404 not found
409 conflict
422 validation jika architecture menggunakannya
500 unexpected

Duplicate slug:
409 Conflict

============================================================

# 24. PERFORMANCE

============================================================

CMS list API:

gunakan pagination.

Jangan:

SELECT semua data.

Tambahkan index untuk field yang sering digunakan:

slug
status
publishedAt
categoryId
createdAt

Audit query performance jika diperlukan.

============================================================

# 25. ACCESSIBILITY

============================================================

Admin CMS:

- keyboard accessible
- semantic buttons
- labels
- focus states
- aria attributes jika diperlukan
- modal accessible
- form validation accessible

Public:

- semantic HTML
- heading hierarchy
- alt image
- keyboard navigation

============================================================

# 26. RESPONSIVE

============================================================

Admin CMS harus usable:

Desktop
Tablet
Mobile

Public:

Mobile-first.

Jangan merusak existing mobile menu.

============================================================

# 27. DOCUMENTATION

============================================================

Buat/update:

docs/development/PHASE-3.3-AUDIT.md

docs/development/PHASE-3.3-ARCHITECTURE.md

docs/development/PHASE-3.3-IMPLEMENTATION.md

Jika API bertambah:

docs/api/CMS.md

Dokumentasikan:

- routes
- permissions
- database models
- workflow
- test result
- known limitations

============================================================

# 28. IMPLEMENTATION ORDER

============================================================

JANGAN mengerjakan semuanya sekaligus.

Gunakan urutan berikut:

---

## MILESTONE 1 — AUDIT

Audit repository.

Deliver:

PHASE-3.3-AUDIT.md

NO CMS CODE YET.

Verify baseline:

77/77 PASS

---

## MILESTONE 2 — DATA MODEL

Implement hanya:

Category
Berita
Page

Migration.

Prisma generate.

Prisma validate.

Run tests.

Target:

77/77 PASS

---

## MILESTONE 3 — CMS SERVICE

Implement service layer.

CategoryService
BeritaService
PageService

No UI yet.

Tests.

Target:

77/77 + CMS service tests PASS

---

## MILESTONE 4 — CMS API

Implement routes.

Auth
RBAC
Validation
Audit

Tests.

Target:

77/77 + CMS API tests PASS

---

## MILESTONE 5 — ADMIN CMS

Integrate AdminLayout.

Berita CRUD.

Category CRUD.

Page CRUD.

Loading/Error/Empty.

Tests/build.

---

## MILESTONE 6 — PUBLIC CMS

Public:

/berita
/berita/:slug
/halaman/:slug

SEO.

Draft protection.

Tests/build.

---

## MILESTONE 7 — MEDIA FOUNDATION

Only after audit confirms storage architecture.

Implement minimal media abstraction.

---

## MILESTONE 8 — POTENSI + WISATA

Reuse content architecture.

Do not duplicate code unnecessarily.

---

## MILESTONE 9 — HOMEPAGE CMS INTEGRATION

Connect homepage sections to CMS data.

No hardcoded production content.

---

## MILESTONE 10 — FINAL QA

Run full test matrix.

============================================================

# 29. FINAL QA MATRIX

============================================================

DATABASE:
[ ] Pooler connected
[ ] Migration up to date
[ ] Prisma validate PASS

API:
[ ] TypeScript PASS
[ ] Lint PASS
[ ] Build PASS
[ ] Existing tests 77/77 PASS
[ ] CMS tests PASS
[ ] Auth tests PASS
[ ] RBAC tests PASS
[ ] Health PASS

WEB:
[ ] TypeScript PASS
[ ] Lint PASS
[ ] Build PASS
[ ] Public routes PASS
[ ] Admin routes PASS
[ ] Responsive PASS

CMS:
[ ] Category CRUD
[ ] Berita CRUD
[ ] Page CRUD
[ ] Publish workflow
[ ] Draft protection
[ ] Slug uniqueness
[ ] Pagination
[ ] Search
[ ] Filters
[ ] SEO
[ ] Audit log
[ ] RBAC
[ ] Loading state
[ ] Error state
[ ] Empty state

SECURITY:
[ ] No unauthenticated CMS mutation
[ ] No privilege escalation
[ ] No draft leakage
[ ] Input validation
[ ] No sensitive data exposure

============================================================

# 30. FINAL REPORT FORMAT

============================================================

Setelah seluruh phase selesai, buat laporan:

# PHASE 3.3 COMPLETE

## Repository Audit

...

## Database

...

## API

...

## CMS

...

## Admin UI

...

## Public UI

...

## SEO

...

## RBAC

...

## Audit Log

...

## Tests

Existing API Tests:
77/77 PASS

CMS Tests:
XX/XX PASS

Total:
XX/XX PASS

## Build

API:
PASS

WEB:
PASS

## Prisma

Validate:
PASS

Migration:
UP TO DATE

## Files Created

...

## Files Modified

...

## Known Issues

...

## Technical Debt

...

## Recommended Phase 3.4

...

============================================================

# 31. CRITICAL STOP CONDITIONS

============================================================

STOP implementation jika:

1. Database migration unexpectedly drops data.
2. Existing 77 tests mulai gagal.
3. Authentication behavior berubah.
4. RBAC behavior berubah tanpa alasan.
5. Existing public pages rusak.
6. Existing admin pages rusak.
7. Prisma schema conflict dengan existing model.
8. Duplicate CMS architecture ditemukan.
9. Storage architecture belum jelas tetapi agent ingin membuat upload system.
10. Existing API contract harus diubah untuk CMS.

Jika salah satu terjadi:

JANGAN workaround.

Lakukan:

DIAGNOSE
→ DOCUMENT
→ FIX
→ TEST
→ CONTINUE

============================================================

# 32. FINAL PRINCIPLE

============================================================

Mitradesa bukan sekadar website berita.

CMS harus menjadi CONTENT FOUNDATION untuk:

- Website Desa
- Informasi Desa
- Berita Desa
- Profil Desa
- Potensi Desa
- Wisata Desa
- Informasi publik
- SEO
- Homepage
- future digital services

Tetapi Phase 3.3 harus tetap:

SIMPLE
MODULAR
DATABASE-DRIVEN
SECURE
TESTABLE
SCALABLE

Jangan membangun "page builder" kompleks.

Jangan over-engineering.

Bangun foundation yang dapat dikembangkan pada Phase berikutnya.

============================================================

# EXECUTION COMMAND

============================================================

MULAI SEKARANG.

LANGKAH PERTAMA HARUS:

1. Audit repository secara menyeluruh.
2. Audit database/schema.
3. Audit API.
4. Audit frontend.
5. Audit auth/RBAC.
6. Audit existing CMS-related implementation.
7. Audit tests.
8. Jalankan baseline test.
9. Pastikan 77/77 PASS.
10. Buat PHASE-3.3-AUDIT.md.

JANGAN implement CMS sebelum langkah audit selesai.

Setelah audit selesai, tampilkan:

[PHASE 3.3 AUDIT COMPLETE]

dengan:

- architecture findings
- existing reusable components
- existing CMS components
- database findings
- API findings
- auth/RBAC findings
- frontend findings
- test baseline
- risks
- proposed architecture
- exact next implementation step

Kemudian lanjutkan milestone berikutnya secara bertahap.

TARGET UTAMA:

77/77 EXISTING TESTS MUST REMAIN GREEN.

============================================================
END OF PHASE 3.3 MASTER PROMPT
============================================================
