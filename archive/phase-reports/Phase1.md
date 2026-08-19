============================================================
MITRADESA — PHASE 1
PROJECT FOUNDATION
============================================================

## STATUS

PHASE 0 = COMPLETE
PHASE 0.5 = COMPLETE
ARCHITECTURE = FROZEN

Architecture baseline:

docs/architecture/ARCHITECTURE-BASELINE.md

Implementation contract:

docs/architecture/phase-0.5/12-IMPLEMENTATION-CONTRACT.md

============================================================
MISSION
============================================================

Sekarang mulai IMPLEMENTATION.

Tujuan Phase 1 hanya membangun FOUNDATION PROJECT.

Phase 1 TIDAK membangun business domain lengkap.

Jangan membuat:

- Penduduk module
- Keluarga module
- Perangkat Desa module
- Surat module
- Jenis Surat module
- Template Surat
- DNA Field
- Workflow Surat
- QR TTE
- WhatsApp workflow
- RPJMDes
- RKPDes
- APBDes
- Voting
- BUMDes
- PBB
- Tourism
- Public service module

Semua domain tersebut akan dibangun pada phase berikutnya.

============================================================
MANDATORY FIRST STEP
============================================================

Sebelum melakukan perubahan:

1. Baca:

docs/architecture/ARCHITECTURE-BASELINE.md

2. Baca:

docs/architecture/phase-0.5/12-IMPLEMENTATION-CONTRACT.md

3. Baca:

docs/architecture/15-IMPLEMENTATION-ROADMAP.md

4. Periksa kondisi repository.

5. Pastikan apakah repository benar-benar kosong atau sudah
   memiliki file.

JANGAN menghapus file existing tanpa alasan dan tanpa laporan.

Jika repository kosong:

buat project foundation dari nol.

Jika ditemukan file:

audit terlebih dahulu.

Jangan mengasumsikan file tersebut boleh dihapus.

============================================================
FROZEN TECHNOLOGY STACK
============================================================

Gunakan EXACT stack berikut:

Frontend:
React
TypeScript
Vite

Backend:
Express.js
TypeScript

ORM:
Prisma

Database:
PostgreSQL 15+

Authentication:
JWT

Testing:
Jest
Playwright

JANGAN mengganti:

Prisma → Drizzle

Express → Fastify

React → framework lain

PostgreSQL → database lain

kecuali ARCHITECTURE-BASELINE secara eksplisit diubah melalui
architectural decision.

============================================================
PHASE 1 PRINCIPLES
============================================================

1. Clean foundation
2. Type safety
3. Environment separation
4. Database migration ready
5. API ready
6. Frontend ready
7. Testing ready
8. Build ready
9. CI ready
10. Documentation ready

============================================================
TARGET PROJECT STRUCTURE
============================================================

Gunakan struktur yang konsisten dengan architecture baseline.

Target konseptual:

MITRADESA/
│
├── apps/
│ ├── web/
│ └── api/
│
├── packages/
│ ├── config/
│ ├── types/
│ └── shared/
│
├── prisma/
│ ├── schema.prisma
│ ├── migrations/
│ └── seed/
│
├── docs/
│
├── tests/
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md

Jika architecture baseline menentukan struktur berbeda,
IKUTI BASELINE.

Jangan membuat monorepo structure yang bertentangan dengan
baseline.

============================================================
STEP 1 — REPOSITORY FOUNDATION
============================================================

Buat:

- package configuration
- TypeScript configuration
- lint configuration jika diperlukan
- formatting configuration jika diperlukan
- gitignore
- environment example
- README

Pastikan command dasar tersedia untuk:

development
build
test
typecheck
lint

Jangan menambahkan dependency yang tidak diperlukan.

============================================================
STEP 2 — ENVIRONMENT CONFIGURATION
============================================================

Buat environment strategy:

Development
Test
Production

Minimal:

DATABASE_URL
JWT_SECRET
API_PORT
WEB_PORT
NODE_ENV

Jangan pernah menyimpan secret di repository.

Buat:

.env.example

Jangan membuat:

.env

berisi credential nyata.

============================================================
STEP 3 — POSTGRESQL FOUNDATION
============================================================

Konfigurasikan PostgreSQL 15+.

Pastikan:

- connection string
- database connection
- Prisma datasource
- migration capability

Database harus dapat diakses melalui Prisma.

Jangan membuat business tables terlebih dahulu.

============================================================
STEP 4 — PRISMA FOUNDATION
============================================================

Konfigurasikan:

Prisma schema
Prisma client
Migration
Seed infrastructure

Pastikan:

npx prisma validate

berhasil.

Pastikan:

npx prisma generate

berhasil.

Pastikan migration dapat dijalankan.

============================================================
STEP 5 — DATABASE FOUNDATION
============================================================

Buat HANYA tabel infrastructure yang benar-benar diperlukan
untuk Phase 1.

Jangan membuat seluruh domain database.

Jika architecture baseline membutuhkan tabel tertentu untuk
foundation, gunakan baseline.

Jika tidak dibutuhkan:

JANGAN MEMBUATNYA.

Jangan membuat dummy:

penduduk
surat
jenis surat
RPJMDes
APBDes

hanya untuk memenuhi database.

============================================================
STEP 6 — BACKEND FOUNDATION
============================================================

Buat Express application.

Minimal:

GET /api/health

Response harus memiliki informasi:

- status
- timestamp
- service
- version/environment jika diperlukan

Tambahkan:

- middleware
- JSON parser
- CORS configuration
- error handler
- 404 handler
- request logging
- environment validation

Jangan membuat business API.

============================================================
STEP 7 — ERROR HANDLING
============================================================

Buat centralized error handling.

Gunakan struktur error response konsisten.

Minimal:

{
success: false,
error: {
code: "...",
message: "..."
}
}

Jangan expose:

- database credentials
- stack trace production
- secret
- internal infrastructure details

============================================================
STEP 8 — FRONTEND FOUNDATION
============================================================

Buat React + TypeScript + Vite application.

Minimal:

- application shell
- routing foundation
- error boundary
- loading state
- not found page
- API client foundation

Jangan membuat dashboard business.

Jangan membuat:

Penduduk UI
Surat UI
RPJMDes UI
APBDes UI

============================================================
STEP 9 — API CLIENT
============================================================

Frontend harus memiliki centralized API client.

Jangan melakukan fetch langsung secara acak di component.

Minimal architecture:

React Component
↓
API Client
↓
HTTP API
↓
Express

============================================================
STEP 10 — SECURITY FOUNDATION
============================================================

Implementasi security foundation saja.

Minimal:

- secure environment handling
- CORS policy
- request validation foundation
- security headers
- safe error handling
- password/JWT infrastructure preparation

Jangan membuat full authentication module pada Phase 1.

Authentication akan menjadi Phase 2.

============================================================
STEP 11 — LOGGING
============================================================

Buat logging foundation.

Minimal:

- request
- error
- startup
- shutdown

Jangan mencatat:

- password
- JWT
- secret
- token
- sensitive personal data

============================================================
STEP 12 — TESTING FOUNDATION
============================================================

Konfigurasikan Jest.

Buat minimal test:

Backend:

GET /api/health → 200

Frontend:

application renders successfully.

============================================================
STEP 13 — E2E FOUNDATION
============================================================

Konfigurasikan Playwright.

Buat minimal E2E:

1. browser membuka application
2. homepage berhasil dimuat
3. tidak terjadi fatal console error
4. API health endpoint dapat diakses melalui application flow
   jika sesuai architecture

Jangan membuat E2E business module.

============================================================
STEP 14 — BUILD
============================================================

Pastikan:

Frontend build PASS.

Backend build PASS.

TypeScript PASS.

Prisma validation PASS.

Tests PASS.

Playwright PASS.

============================================================
STEP 15 — DOCUMENTATION
============================================================

Update README dengan:

- project description
- architecture overview
- prerequisites
- installation
- environment setup
- database setup
- Prisma commands
- development commands
- test commands
- build commands

Buat:

docs/development/

01-LOCAL-DEVELOPMENT.md
02-ENVIRONMENT.md
03-DATABASE-SETUP.md
04-TESTING.md

============================================================
STEP 16 — CI FOUNDATION
============================================================

Jika sesuai architecture baseline, buat CI foundation.

Minimal pipeline:

install
↓
typecheck
↓
lint
↓
test
↓
build

Jangan membuat deployment pipeline.

============================================================
DATABASE RULE
============================================================

PENTING:

Phase 1 bukan database modeling phase.

Jangan membuat tabel domain hanya karena tabel tersebut sudah
dijelaskan di:

03-DATABASE-BLUEPRINT.md

Database domain akan dibuat pada phase Master Data.

============================================================
NO-HARDCODE RULE
============================================================

Jangan hardcode:

- database URL
- JWT secret
- API URL
- port
- WhatsApp credential
- business configuration

Gunakan environment/configuration layer.

Business configuration tetap mengikuti:

docs/architecture/12-NO-HARDCODE-POLICY.md

============================================================
SEARCH BEFORE CREATE
============================================================

Sebelum membuat file:

1. periksa apakah file sudah ada;
2. periksa package.json;
3. periksa tsconfig;
4. periksa existing config;
5. periksa existing documentation.

Jangan membuat duplicate file/configuration.

============================================================
NO UNRELATED REFACTOR
============================================================

Jangan melakukan:

- refactor yang tidak diperlukan;
- dependency upgrade massal;
- perubahan architecture;
- perubahan naming convention;
- perubahan database strategy.

============================================================
EVIDENCE REQUIRED
============================================================

Setiap milestone harus diverifikasi.

Gunakan command yang relevan.

Minimal buktikan:

1. npm install PASS
2. typecheck PASS
3. lint PASS
4. Prisma validate PASS
5. Prisma generate PASS
6. migration PASS
7. backend test PASS
8. frontend test PASS
9. Playwright PASS
10. backend build PASS
11. frontend build PASS

Jangan menyatakan PASS tanpa menjalankan verification.

============================================================
PHASE 1 DEFINITION OF DONE
============================================================

Phase 1 COMPLETE hanya jika:

[ ] repository foundation selesai
[ ] frontend foundation selesai
[ ] backend foundation selesai
[ ] PostgreSQL connection berhasil
[ ] Prisma berhasil
[ ] migration infrastructure berhasil
[ ] environment strategy selesai
[ ] API health PASS
[ ] centralized error handling PASS
[ ] logging foundation PASS
[ ] frontend shell PASS
[ ] API client foundation PASS
[ ] Jest PASS
[ ] Playwright PASS
[ ] TypeScript PASS
[ ] lint PASS
[ ] frontend build PASS
[ ] backend build PASS
[ ] documentation selesai
[ ] CI foundation PASS jika diperlukan
[ ] tidak ada business module yang dibangun
[ ] tidak ada architecture baseline yang diubah
[ ] tidak ada secret di repository

============================================================
PHASE 1 VALIDATION REPORT
============================================================

Buat:

docs/development/PHASE-1-VALIDATION.md

Isi:

PROJECT:
MITRADESA

PHASE:
1 — PROJECT FOUNDATION

STATUS:
PASS / BLOCKED

TECHNOLOGY:
Frontend:
Backend:
ORM:
Database:
Testing:

VALIDATIONS:

Repository:
PASS / FAIL

Environment:
PASS / FAIL

PostgreSQL:
PASS / FAIL

Prisma:
PASS / FAIL

Migration:
PASS / FAIL

Backend:
PASS / FAIL

Frontend:
PASS / FAIL

API:
PASS / FAIL

Jest:
PASS / FAIL

Playwright:
PASS / FAIL

Typecheck:
PASS / FAIL

Lint:
PASS / FAIL

Build:
PASS / FAIL

CI:
PASS / FAIL / N/A

ISSUES:
[list]

ARCHITECTURAL CHANGES:
NONE

Jika terdapat perubahan architecture:

STOP.

Jangan mengubah baseline secara diam-diam.

============================================================
FINAL RESPONSE
============================================================

Setelah selesai, tampilkan:

PHASE:
1 — PROJECT FOUNDATION

STATUS:
PASS / BLOCKED

PROJECT STRUCTURE:
[summary]

TECHNOLOGY:
[list]

DATABASE:
PASS / FAIL

PRISMA:
PASS / FAIL

BACKEND:
PASS / FAIL

FRONTEND:
PASS / FAIL

TESTING:
PASS / FAIL

BUILD:
PASS / FAIL

CI:
PASS / FAIL / N/A

FILES CREATED:
[list]

VALIDATION REPORT:
docs/development/PHASE-1-VALIDATION.md

BUSINESS MODULES CREATED:
NONE

ARCHITECTURE CHANGES:
NONE

BLOCKERS:
[list]

NEXT PHASE:
PHASE 2 — AUTHENTICATION + RBAC

============================================================
IMPORTANT
============================================================

Jangan melanjutkan ke Phase 2.

Setelah Phase 1 PASS:

STOP.

Tunggu instruksi berikutnya.

============================================================
END PHASE 1
============================================================
