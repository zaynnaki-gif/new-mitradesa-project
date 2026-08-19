============================================================
MITRADESA — PHASE 0
ARCHITECTURE DISCOVERY & MASTER SPECIFICATION
============================================================

## ROLE

Anda bertindak sebagai:

- Principal Software Architect
- Database Architect
- Backend Architect
- API Architect
- QA/Test Architect
- Technical Documentation Architect

Anda sedang mengerjakan project bernama:

MITRADESA
Manajemen Informasi dan Administrasi Desa

Project ini bukan kumpulan aplikasi/modul yang berdiri sendiri.
Project ini harus dibangun sebagai SATU EKOSISTEM TERINTEGRASI dengan
satu sumber kebenaran data, satu arsitektur API, satu sistem
authorization, dan reusable core engines.

============================================================
TUJUAN PHASE 0
============================================================

TUJUAN UTAMA:

Menganalisis project yang SEDANG ADA secara menyeluruh dan membuat
MASTER SPECIFICATION yang menjadi SINGLE SOURCE OF TRUTH untuk
seluruh pengembangan Mitradesa berikutnya.

PHASE INI ADALAH PHASE ANALYSIS + DOCUMENTATION.

JANGAN melakukan implementasi fitur baru.

JANGAN melakukan refactoring kode.

JANGAN membuat migration database.

JANGAN mengubah schema database.

JANGAN menghapus file.

JANGAN membuat tabel baru.

JANGAN membuat endpoint baru.

JANGAN mengubah UI.

JANGAN mengubah konfigurasi deployment.

JANGAN melakukan perubahan destructive apa pun.

Output utama Phase 0 adalah DOKUMENTASI ARSITEKTUR.

============================================================
PRINSIP ABSOLUT
============================================================

RULE-001
Jangan berasumsi.

RULE-002
Jangan mengarang struktur database yang tidak ditemukan.

RULE-003
Jangan mengarang API yang tidak ditemukan.

RULE-004
Jangan mengarang fitur yang tidak ditemukan.

RULE-005
Jangan menganggap dokumentasi lama sebagai fakta apabila berbeda
dengan implementasi aktual.

RULE-006
Jika informasi tidak ditemukan, tulis:
"NOT FOUND IN CURRENT PROJECT"

Jangan mengisi kekosongan dengan asumsi.

RULE-007
Bedakan dengan jelas:

[EXISTING]
Benar-benar ditemukan di project.

[PLANNED]
Sudah menjadi keputusan/arah arsitektur yang ditentukan dalam
instruksi project.

[PROPOSED]
Rekomendasi arsitektur yang belum disetujui.

[UNKNOWN]
Belum dapat dibuktikan dari project.

RULE-008
Jangan mencampurkan EXISTING, PLANNED, PROPOSED dan UNKNOWN.

RULE-009
Jika menemukan konflik antara dokumentasi dan kode aktual,
kode/schema/API aktual menjadi sumber fakta teknis.

RULE-010
Jangan mengubah sesuatu hanya karena menurut Anda lebih baik.

Catat sebagai PROPOSED IMPROVEMENT.

============================================================
KONTEKS ARSITEKTUR YANG SUDAH DISEPAKATI
============================================================

Mitradesa diarahkan menjadi:

Integrated Village Information and Administration Platform.

Core domain yang direncanakan:

1. MASTER DATA
   - Identitas Desa
   - Wilayah
   - Penduduk
   - Keluarga
   - Perangkat Desa
   - Akun
   - Role
   - Permission

2. GOVERNANCE / PUBLIC SERVICE
   - Pelayanan Surat
   - Template Surat
   - Jenis Surat
   - Workflow Surat
   - Verifikasi
   - Approval
   - QR TTE
   - Arsip Surat
   - Pengaduan

3. DEVELOPMENT PLANNING
   - RPJMDes
   - RKPDes
   - Usulan Online
   - Validasi keselarasan RPJMDes
   - Voting masyarakat
   - Seleksi program/kegiatan
   - APBDes ringkas
   - Pendapatan
   - Belanja
   - Sumber Dana
   - Realisasi
   - Transparansi pembangunan

4. ECONOMIC / VILLAGE DEVELOPMENT
   - PBB
   - BUMDes
   - UMKM
   - Pariwisata
   - Modul ekonomi lain yang akan ditentukan kemudian

5. SHARED CORE ENGINES
   - Authentication
   - RBAC
   - Configuration Engine
   - Workflow Engine
   - Document Engine
   - Template Engine
   - Notification Engine
   - Audit Engine
   - Reporting Engine
   - GIS/Location capability bila diperlukan

CATATAN:
Daftar di atas adalah ARAH ARSITEKTUR / PLANNED,
bukan klaim bahwa semua fitur tersebut sudah ada di project.

Anda WAJIB memeriksa kondisi aktual project.

============================================================
PRINSIP DATABASE
============================================================

Mitradesa harus mengikuti prinsip:

DATABASE-FIRST BUSINESS CONSISTENCY.

Database merupakan sumber kebenaran untuk data bisnis.

Tidak boleh membuat duplicate master data.

Contoh:

Penduduk hanya berasal dari tabel penduduk.

Wilayah hanya berasal dari tabel wilayah.

Identitas desa hanya berasal dari tabel identitas desa.

Perangkat desa hanya berasal dari tabel perangkat desa.

Akun hanya berasal dari tabel akun.

Role dan permission harus berasal dari RBAC.

Jangan membuat tabel alternatif seperti:

users_penduduk
users_admin
citizen
resident
village_users

jika tabel master yang sesuai sudah tersedia.

Jika menemukan tabel yang secara fungsi duplikatif:
JANGAN menghapus atau menggabungkannya pada Phase 0.

Catat sebagai:

POTENTIAL DUPLICATION / ARCHITECTURAL CONFLICT.

============================================================
PRINSIP NO-HARDCODE
============================================================

Mitradesa diarahkan agar business configuration tidak hardcoded.

Yang direncanakan harus dapat berasal dari database/configuration,
antara lain:

- jenis surat
- field surat
- kategori surat
- status workflow
- role
- permission
- bidang pembangunan
- program pembangunan
- satuan
- sumber dana
- kategori APBDes
- notification template
- scoring criteria
- bobot scoring
- konfigurasi nomor surat
- konfigurasi template
- parameter bisnis lain

Namun:

JANGAN membuat tabel tersebut sekarang.

Pada Phase 0 hanya identifikasi:

- apakah sudah ada;
- bagaimana implementasinya saat ini;
- konflik yang ditemukan;
- kebutuhan arsitektur ke depan.

============================================================
PRINSIP RELATIONAL INTEGRITY
============================================================

Semua domain harus mempunyai relasi yang jelas.

Contoh target arsitektur:

PENDUDUK
↓
USULAN MASYARAKAT
↓
RPJMDes PROGRAM
↓
RKPDes ACTIVITY
↓
VOTING
↓
SELECTION
↓
APBDes
↓
REALIZATION

Contoh lain:

PENDUDUK
↓
PENGAJUAN SURAT
↓
WORKFLOW
↓
VERIFIKASI
↓
PIMPINAN
↓
QR TTE
↓
DOCUMENT
↓
ARCHIVE
↓
NOTIFICATION

Tetapi Anda WAJIB memeriksa implementasi aktual sebelum menyatakan
bahwa relasi tersebut sudah tersedia.

============================================================
TUGAS 1 — INVENTARISASI PROJECT
============================================================

Lakukan scan terhadap seluruh repository.

Periksa minimal:

- package.json
- lockfile
- source code
- database schema
- migration
- seed
- API routes
- controllers
- services
- repositories
- models
- ORM configuration
- authentication
- authorization
- frontend routes
- frontend components
- hooks
- state management
- utilities
- configuration
- environment example
- test
- Playwright
- CI/CD
- Docker jika ada
- documentation
- scripts

Jangan hanya membaca nama folder.

Periksa isi file yang relevan.

Buat:

PROJECT_INVENTORY.md

Isi minimal:

| Area | Existing | Location | Status | Notes |
| ---- | -------- | -------- | ------ | ----- |

============================================================
TUGAS 2 — TECH STACK ACTUAL
============================================================

Identifikasi stack AKTUAL.

Minimal:

- frontend framework
- backend framework
- language
- database
- ORM
- authentication
- authorization
- validation
- file storage
- testing framework
- E2E framework
- build tool
- package manager
- deployment configuration

Jangan menebak.

Jika tidak ditemukan:
NOT FOUND IN CURRENT PROJECT.

Buat:

CURRENT-TECH-STACK.md

============================================================
TUGAS 3 — DATABASE FORENSIC
============================================================

Analisis schema database aktual.

Inventarisasikan SEMUA tabel yang ditemukan.

Untuk setiap tabel catat:

- table name
- purpose
- columns
- data types
- nullable
- default
- primary key
- foreign key
- unique constraint
- check constraint
- indexes
- relations
- referenced tables
- referencing tables

Buat:

CURRENT-DATABASE-SCHEMA.md

============================================================
TUGAS 4 — DATABASE RELATIONSHIP AUDIT
============================================================

Cari:

1. orphan tables
2. orphan foreign keys
3. missing foreign keys
4. duplicate master tables
5. duplicate columns
6. inconsistent naming
7. inconsistent ID types
8. inconsistent timestamp strategy
9. inconsistent status implementation
10. hardcoded business values
11. JSON fields yang sebenarnya merupakan relational data
12. circular dependency
13. potential normalization problems

JANGAN memperbaiki.

Hanya dokumentasikan.

Buat:

DATABASE-RELATIONSHIP-AUDIT.md

============================================================
TUGAS 5 — API FORENSIC
============================================================

Inventarisasikan seluruh API yang AKTUAL.

Untuk setiap endpoint:

- method
- route
- controller/handler
- authentication requirement
- authorization requirement
- request schema
- response schema
- database tables used
- service used
- validation
- error handling
- status code

Buat:

CURRENT-API-CATALOG.md

============================================================
TUGAS 6 — FRONTEND ROUTE AUDIT
============================================================

Inventarisasikan seluruh route/page yang ada.

Untuk setiap halaman:

- route
- purpose
- role/access
- API dependency
- database/domain dependency
- status
- responsive status bila dapat dibuktikan

Buat:

CURRENT-FRONTEND-ROUTES.md

============================================================
TUGAS 7 — EXISTING FEATURE MATRIX
============================================================

Buat matriks:

| Domain | Feature | Existing | Partial | Missing | Evidence |
| ------ | ------- | -------- | ------- | ------- | -------- |

Minimal domain:

- Master Data
- Penduduk
- Wilayah
- Perangkat Desa
- Akun/RBAC
- Surat
- Template Surat
- Arsip
- Notification
- Workflow
- RPJMDes
- RKPDes
- Usulan
- Voting
- APBDes
- PBB
- BUMDes
- UMKM
- Wisata
- Pengaduan
- Reporting
- GIS
- Audit

Jika tidak ada:
MISSING.

============================================================
TUGAS 8 — MASTER DOMAIN MAP
============================================================

Buat:

MASTER-DOMAIN-MAP.md

Gunakan struktur:

CORE
MASTER DATA
GOVERNANCE
PUBLIC SERVICE
DEVELOPMENT PLANNING
ECONOMIC
SHARED ENGINES
PUBLIC TRANSPARENCY

Untuk setiap domain tandai:

EXISTING
PLANNED
PROPOSED
UNKNOWN

============================================================
TUGAS 9 — TARGET MASTER ERD
============================================================

JANGAN membuat schema baru.

Buat dua diagram:

A. CURRENT ERD

Hanya tabel yang benar-benar ada.

B. TARGET CONCEPTUAL ERD

Hanya menggambarkan target hubungan arsitektur,
tanpa membuat migration.

Target conceptual relationship minimal harus menunjukkan:

IDENTITAS_DESA
↓
WILAYAH
↓
PENDUDUK
↓
AKUN / ROLE

dan domain:

PENDUDUK
↓
COMMUNITY_PROPOSAL
↓
RPJMDES_PROGRAM
↓
RKPDES_ACTIVITY
↓
VOTING
↓
PLANNING_SELECTION
↓
APBDES
↓
REALIZATION

serta:

PENDUDUK
↓
SURAT
↓
WORKFLOW
↓
DOCUMENT
↓
ARCHIVE

Gunakan Mermaid ERD.

============================================================
TUGAS 10 — SHARED ENGINE ANALYSIS
============================================================

Periksa apakah project sudah memiliki:

1. Auth Engine
2. RBAC
3. Configuration
4. Workflow
5. Document
6. Template
7. Notification
8. Audit
9. Reporting
10. GIS

Untuk masing-masing:

STATUS:
EXISTING
PARTIAL
MISSING
UNKNOWN

Kemudian jelaskan:

- implementasi aktual
- lokasi source
- tabel terkait
- API terkait
- masalah
- kebutuhan target

Buat:

SHARED-ENGINE-AUDIT.md

============================================================
TUGAS 11 — HARD-CODE AUDIT
============================================================

Cari business logic/value yang hardcoded.

Minimal cari:

- role
- status
- jenis surat
- kategori
- bidang
- satuan
- sumber dana
- nomor surat
- menu permission
- workflow transition
- notification text
- business constants

Pisahkan:

ACCEPTABLE CONSTANT
vs
BUSINESS CONFIGURATION THAT SHOULD BE DATABASE-DRIVEN.

Jangan mengubah kode.

Buat:

HARDCODE-AUDIT.md

============================================================
TUGAS 12 — SECURITY BASELINE
============================================================

Audit:

- authentication
- authorization
- password handling
- session/token
- API access
- IDOR risk
- input validation
- SQL injection
- file upload
- CORS
- CSRF bila relevan
- secrets
- environment variables
- logging
- sensitive data exposure

Jangan melakukan exploit destruktif.

Hanya static/runtime-safe audit.

Buat:

SECURITY-BASELINE.md

============================================================
TUGAS 13 — TESTING BASELINE
============================================================

Inventarisasikan:

- unit tests
- integration tests
- E2E tests
- Playwright
- API tests
- database tests
- build checks
- lint
- typecheck

Kemudian tentukan:

CURRENT TEST COVERAGE BASELINE

Buat:

TESTING-BASELINE.md

============================================================
TUGAS 14 — ARCHITECTURAL CONFLICTS
============================================================

Identifikasi konflik yang dapat menghambat target Mitradesa.

Contoh:

- duplicate user system
- duplicate resident system
- duplicate village system
- duplicate notification system
- duplicate document system
- hardcoded workflow
- hardcoded status
- inconsistent API pattern
- direct DB access from frontend
- route → DB tanpa service
- missing FK
- inconsistent IDs
- inconsistent tenant/village isolation
- duplicate file storage
- duplicate template system

JANGAN memperbaiki.

Buat:

ARCHITECTURAL-CONFLICTS.md

Setiap temuan wajib mempunyai:

ID
SEVERITY
LOCATION
EVIDENCE
IMPACT
RECOMMENDATION

============================================================
TUGAS 15 — MASTER SPECIFICATION
============================================================

Setelah seluruh audit selesai, buat:

MITRADESA-MASTER-SPECIFICATION.md

Dokumen ini menjadi SINGLE SOURCE OF TRUTH.

Struktur WAJIB:

1. Project Identity
2. Vision
3. Goals
4. Non-Goals
5. Architecture Principles
6. Current Technology Stack
7. Current Domain Map
8. Target Domain Map
9. Current Database Architecture
10. Target Database Architecture
11. Current API Architecture
12. Target API Architecture
13. Authentication
14. RBAC
15. Configuration Strategy
16. Workflow Engine
17. Document Engine
18. Template Engine
19. Notification Engine
20. Audit Engine
21. Master Data Strategy
22. Planning Architecture
23. Public Service Architecture
24. Economic Architecture
25. Public Transparency
26. No-Hardcode Policy
27. Data Integrity Policy
28. API Standards
29. Testing Standards
30. Security Standards
31. Deployment Principles
32. Architectural Risks
33. Technical Debt
34. Implementation Dependencies
35. Phase Roadmap
36. Definition of Done
37. AI Agent Development Rules

============================================================
TUGAS 16 — AI AGENT DEVELOPMENT RULES
============================================================

Di dalam Master Specification buat bagian khusus:

"AI AGENT DEVELOPMENT CONTRACT"

Aturan minimal:

1. READ BEFORE MODIFY
   Agent wajib membaca Master Specification sebelum coding.

2. SEARCH BEFORE CREATE
   Agent wajib mencari existing implementation sebelum membuat
   tabel, API, service, component, utility atau engine baru.

3. NO DUPLICATION
   Agent dilarang membuat duplicate master data.

4. NO UNAUTHORIZED REFACTOR
   Agent tidak boleh melakukan refactor besar di luar task.

5. NO UNRELATED CHANGE
   Agent tidak boleh mengubah domain lain tanpa alasan eksplisit.

6. DATABASE MIGRATION REQUIRED
   Perubahan database wajib menggunakan migration.

7. API CONTRACT REQUIRED
   Endpoint baru harus terdokumentasi.

8. AUTHORIZATION REQUIRED
   Endpoint baru harus mempunyai authorization rule.

9. TEST REQUIRED
   Feature baru harus memiliki test sesuai levelnya.

10. AUDIT REQUIRED
    Business mutation harus dapat diaudit.

11. NO HARDCODE BUSINESS RULE
    Business configuration harus database/configuration-driven.

12. PRESERVE EXISTING BEHAVIOR
    Jangan merusak behavior yang sudah berjalan.

13. EVIDENCE REQUIRED
    Setiap klaim "implemented" harus disertai bukti:
    file, test, endpoint, migration atau runtime evidence.

14. STOP ON CONFLICT
    Jika menemukan konflik schema/architecture yang tidak dapat
    diselesaikan secara aman:
    STOP.
    Jangan menebak.
    Laporkan konflik.

============================================================
ATURAN KERJA PHASE 0
============================================================

Urutan kerja WAJIB:

STEP 1
Scan repository.

STEP 2
Inventarisasikan struktur.

STEP 3
Audit database.

STEP 4
Audit API.

STEP 5
Audit frontend.

STEP 6
Audit authentication/RBAC.

STEP 7
Audit shared engines.

STEP 8
Audit hardcode.

STEP 9
Audit security.

STEP 10
Audit testing.

STEP 11
Identifikasi conflicts.

STEP 12
Susun Master Specification.

STEP 13
Validasi silang seluruh dokumentasi.

STEP 14
Buat final summary.

JANGAN coding sebelum STEP 14 selesai.

============================================================
SELF-CONSISTENCY CHECK
============================================================

Sebelum menyelesaikan Phase 0, lakukan pemeriksaan:

CHECK-001
Apakah semua tabel yang disebut dalam dokumentasi memang
dapat dibuktikan keberadaannya?

CHECK-002
Apakah tabel yang belum ada ditandai PLANNED/PROPOSED?

CHECK-003
Apakah semua FK yang disebut dapat dibuktikan?

CHECK-004
Apakah semua API yang disebut benar-benar ada?

CHECK-005
Apakah semua route yang disebut benar-benar ada?

CHECK-006
Apakah ada duplicate master data?

CHECK-007
Apakah ada hardcoded business rule?

CHECK-008
Apakah target architecture bertentangan dengan current architecture?

CHECK-009
Apakah ada informasi yang Anda asumsikan tanpa evidence?

CHECK-010
Apakah dokumentasi membedakan EXISTING, PLANNED, PROPOSED,
dan UNKNOWN?

Jika ada jawaban yang tidak dapat dibuktikan:
tandai UNKNOWN.

============================================================
OUTPUT DIRECTORY
============================================================

Buat dokumentasi di:

docs/architecture/phase-0/

Struktur:

docs/architecture/phase-0/
│
├── 00-PHASE-0-README.md
├── 01-PROJECT-INVENTORY.md
├── 02-CURRENT-TECH-STACK.md
├── 03-CURRENT-DATABASE-SCHEMA.md
├── 04-DATABASE-RELATIONSHIP-AUDIT.md
├── 05-CURRENT-API-CATALOG.md
├── 06-CURRENT-FRONTEND-ROUTES.md
├── 07-FEATURE-MATRIX.md
├── 08-MASTER-DOMAIN-MAP.md
├── 09-CURRENT-ERD.md
├── 10-TARGET-CONCEPTUAL-ERD.md
├── 11-SHARED-ENGINE-AUDIT.md
├── 12-HARDCODE-AUDIT.md
├── 13-SECURITY-BASELINE.md
├── 14-TESTING-BASELINE.md
├── 15-ARCHITECTURAL-CONFLICTS.md
└── 16-MITRADESA-MASTER-SPECIFICATION.md

============================================================
IMPORTANT
============================================================

PHASE 0 TIDAK DINYATAKAN SELESAI hanya karena file markdown
berhasil dibuat.

PHASE 0 hanya COMPLETE apabila:

- repository telah dianalisis;
- database telah dianalisis;
- API telah dianalisis;
- frontend telah dianalisis;
- authentication/RBAC telah dianalisis;
- shared engines telah dianalisis;
- hardcode telah diaudit;
- security baseline telah diperiksa;
- testing baseline telah diperiksa;
- architectural conflicts telah dicatat;
- current ERD telah dibuat;
- target conceptual ERD telah dibuat;
- Master Specification telah dibuat;
- seluruh dokumen telah cross-checked;
- tidak ada klaim unsupported;
- tidak ada perubahan source code yang dilakukan.

============================================================
FINAL RESPONSE FORMAT
============================================================

Setelah selesai, JANGAN memberikan penjelasan panjang.

Tampilkan:

PHASE 0 STATUS:
PASS / BLOCKED

FILES CREATED:
[list]

CURRENT PROJECT SUMMARY:
[ringkas]

EXISTING:
[list]

PLANNED:
[list]

PROPOSED:
[list]

UNKNOWN:
[list]

CRITICAL CONFLICTS:
[list]

CRITICAL RISKS:
[list]

NEXT PHASE:
PHASE 1 — FOUNDATION

Jika BLOCKED:
jelaskan persis apa yang menghalangi dan jangan melanjutkan
ke implementasi.

============================================================
END OF PHASE 0
============================================================
