============================================================
MITRADESA — PHASE 0.5
ARCHITECTURE REVIEW & DECISION FREEZE
============================================================

## CONTEXT

MITRADESA adalah GREENFIELD PROJECT.

Phase 0 — GREENFIELD ARCHITECTURE telah selesai.

Dokumen Phase 0 berada di:

docs/architecture/

Dokumen tersebut merupakan hasil desain awal arsitektur Mitradesa.

BELUM ADA:

- source code
- database
- migration
- API implementation
- frontend implementation

Phase 0.5 bukan tahap coding.

Tugas Anda sekarang adalah melakukan REVIEW TEKNIS terhadap
seluruh blueprint Phase 0, menemukan inkonsistensi, menyelesaikan
keputusan arsitektur yang masih terbuka, kemudian membuat
ARCHITECTURE BASELINE yang akan menjadi kontrak pembangunan.

============================================================
ATURAN MUTLAK
============================================================

RULE-001
JANGAN membuat source code.

RULE-002
JANGAN membuat database.

RULE-003
JANGAN membuat migration.

RULE-004
JANGAN membuat API implementation.

RULE-005
JANGAN membuat frontend.

RULE-006
JANGAN melakukan npm install.

RULE-007
JANGAN melakukan deployment.

RULE-008
JANGAN membuat fitur baru.

RULE-009
JANGAN mengubah business requirement secara diam-diam.

RULE-010
JANGAN mengarang keputusan yang belum ditentukan.

RULE-011
Jika terdapat keputusan yang belum cukup jelas, tandai:

DECISION REQUIRED

RULE-012
Jika mempunyai rekomendasi tambahan, tandai:

PROPOSED

Jangan menganggap PROPOSED sebagai keputusan final.

RULE-013
Semua keputusan harus mempunyai:

- alasan
- dampak
- trade-off
- konsekuensi terhadap database
- konsekuensi terhadap API
- konsekuensi terhadap frontend
- konsekuensi terhadap testing

RULE-014
Jangan menghapus domain yang sudah disepakati hanya karena
implementasinya kompleks.

RULE-015
Jangan menambahkan domain baru hanya karena menurut Anda
menarik.

============================================================
SUMBER INFORMASI
============================================================

Baca SELURUH dokumen di:

docs/architecture/

Minimal:

00-MITRADESA-CONSTITUTION.md
01-VISION-AND-GOALS.md
02-DOMAIN-MAP.md
03-DATABASE-BLUEPRINT.md
04-MASTER-ERD.md
05-API-BLUEPRINT.md
06-RBAC-BLUEPRINT.md
07-WORKFLOW-ENGINE.md
08-DOCUMENT-ENGINE.md
09-TEMPLATE-ENGINE.md
10-NOTIFICATION-ENGINE.md
11-AUDIT-ENGINE.md
12-NO-HARDCODE-POLICY.md
13-SECURITY-ARCHITECTURE.md
14-TESTING-ARCHITECTURE.md
15-IMPLEMENTATION-ROADMAP.md
16-DEFINITION-OF-DONE.md
17-DECISION-REQUIRED.md
18-PROPOSED-ENHANCEMENTS.md

Jangan hanya membaca nama file.

Baca isi dokumen dan lakukan cross-check antar dokumen.

============================================================
TUJUAN PHASE 0.5
============================================================

Pastikan blueprint Mitradesa:

1. konsisten;
2. tidak memiliki entity yang duplikat;
3. memiliki relationship yang jelas;
4. memiliki ownership domain yang jelas;
5. memiliki lifecycle yang jelas;
6. memiliki API contract yang konsisten;
7. memiliki authorization model yang konsisten;
8. memiliki workflow yang konsisten;
9. memiliki notification architecture yang konsisten;
10. memiliki document architecture yang konsisten;
11. tidak menghasilkan hardcoded business logic;
12. siap diimplementasikan secara bertahap oleh AI Agent.

============================================================
ARSITECTURE PRINCIPLES
============================================================

MITRADESA harus mengikuti prinsip:

1. DATABASE-FIRST BUSINESS CONSISTENCY

Database adalah source of truth untuk business data.

2. NO-HARDCODE BUSINESS RULE

Business configuration tidak boleh ditanam secara permanen
di source code apabila dapat dikelola melalui database.

3. SINGLE MASTER DATA

Tidak boleh ada duplicate master entity.

4. SHARED ENGINE

Capability yang digunakan banyak domain harus menjadi shared engine.

5. API-FIRST

Frontend tidak boleh melakukan business logic langsung terhadap
database.

6. AUDITABLE

Business mutation penting harus dapat ditelusuri.

7. ROLE-BASED ACCESS CONTROL

Akses berdasarkan role dan permission.

8. WORKFLOW-DRIVEN

Proses bisnis kompleks harus menggunakan workflow yang terdefinisi.

9. EVENT-DRIVEN NOTIFICATION

Notifikasi dipicu oleh business event.

10. MULTI-VILLAGE READY

Arsitektur harus memungkinkan pengembangan ke banyak desa
tanpa membuat implementasi awal menjadi terlalu kompleks.

============================================================
REVIEW 001 — PRIMARY KEY
============================================================

Evaluasi pilihan:

A. UUID
B. BIGINT
C. UUID public identifier + internal numeric key

Pertimbangkan:

- PostgreSQL
- indexing
- API
- security
- distributed architecture
- SaaS multi-desa
- future synchronization
- offline capability
- database performance

Pilih SATU strategi.

Berikan:

RECOMMENDATION:
REASON:
TRADE-OFF:
DATABASE IMPACT:
API IMPACT:
FINAL DECISION:

============================================================
REVIEW 002 — DATABASE
============================================================

Evaluasi PostgreSQL.

Pastikan cocok untuk:

- relational integrity
- foreign key
- transaction
- JSONB
- indexing
- audit trail
- workflow
- reporting
- full-text search bila diperlukan
- future multi-village architecture

Berikan:

FINAL DECISION.

============================================================
REVIEW 003 — BACKEND
============================================================

Evaluasi:

Node.js + TypeScript.

Bandingkan secara teknis:

- Express
- Fastify

Pertimbangkan:

- ecosystem
- performance
- maintainability
- validation
- middleware
- testing
- scalability
- AI Agent maintainability

Pilih SATU framework backend.

Jangan mempertahankan dua framework.

============================================================
REVIEW 004 — FRONTEND
============================================================

Evaluasi:

React + TypeScript + Vite.

Pastikan cocok untuk:

- Admin Dashboard
- Public Portal
- responsive web
- PWA
- form-heavy application
- dynamic forms
- workflow interface
- document preview
- future APK/PWA packaging

Pilih architecture frontend final.

============================================================
REVIEW 005 — ORM
============================================================

Evaluasi:

Drizzle ORM.

Pertimbangkan:

- PostgreSQL
- migrations
- relations
- type safety
- transaction
- query flexibility
- performance
- maintainability

Berikan keputusan final.

============================================================
REVIEW 006 — WHATSAPP
============================================================

WhatsApp merupakan channel utama notifikasi.

Tetapi CORE SYSTEM tidak boleh bergantung langsung pada
satu provider WhatsApp.

Gunakan konsep:

Notification Engine
↓
Channel Adapter
↓
WhatsApp Provider
↓
External Service

Provider harus dapat diganti.

Minimal desain:

WhatsAppAdapter
ProviderInterface
NotificationTemplate
NotificationEvent
NotificationDelivery
NotificationLog

Jangan memilih vendor tertentu jika belum diperlukan.

============================================================
REVIEW 007 — MULTI-DESA
============================================================

MITRADESA pertama kali digunakan untuk:

Desa Seruni Mumbul.

Namun architecture harus:

MULTI-VILLAGE READY.

Evaluasi:

- village_id
- tenant boundary
- data isolation
- role scope
- configuration scope
- notification scope
- audit scope
- document scope

Jangan membuat arsitektur multi-tenant yang terlalu kompleks.

Gunakan prinsip:

READY FOR MULTI-VILLAGE
WITHOUT PREMATURE COMPLEXITY.

============================================================
REVIEW 008 — MASTER DATA
============================================================

Pastikan entity berikut tidak duplikatif:

- Identitas Desa
- Wilayah
- Penduduk
- Keluarga
- Perangkat Desa
- Akun
- Role
- Permission

Pastikan hubungan:

PENDUDUK
↓
AKUN

dan:

PERANGKAT DESA
↓
AKUN

serta:

AKUN
↓
ROLE
↓
PERMISSION

Jika terdapat alternatif desain, pilih satu dan jelaskan alasannya.

============================================================
REVIEW 009 — WILAYAH
============================================================

Pastikan hierarchy:

PROVINSI
↓
KABUPATEN
↓
KECAMATAN
↓
DESA

Jika wilayah membutuhkan level tambahan, jangan menambahkannya
tanpa alasan.

Identitas Desa harus terhubung dengan wilayah.

============================================================
REVIEW 010 — SURAT
============================================================

Pastikan architecture:

JENIS SURAT
↓
FIELD DEFINITION
↓
FIELD VALIDATION
↓
TEMPLATE
↓
PENGAJUAN SURAT
↓
WORKFLOW
↓
VERIFIKASI
↓
APPROVAL
↓
REGISTRASI SURAT
↓
QR TTE
↓
GENERATED DOCUMENT
↓
ARCHIVE
↓
NOTIFICATION

============================================================
REVIEW 011 — DNA SURAT
============================================================

Jenis surat dapat mempunyai field yang berbeda.

Jangan membuat struktur:

surat_kematian
surat_domisili
surat_usaha
surat_pengantar

sebagai tabel bisnis terpisah hanya karena field-nya berbeda.

Gunakan pendekatan:

Jenis Surat
↓
Field Definition
↓
Field Type
↓
Validation
↓
Options
↓
Template Binding
↓
Dynamic Form
↓
Document Rendering

Field dapat berupa:

- text
- textarea
- number
- date
- datetime
- boolean
- select
- multi-select
- radio
- checkbox
- file
- image
- relation
- penduduk relation
- wilayah relation
- perangkat relation

Pastikan architecture mampu menangani DNA field yang berbeda
tanpa hardcode.

============================================================
REVIEW 012 — QR TTE
============================================================

PENTING:

TTE adalah QRCode.

Jangan membuat:

TTE entity

- QRCode entity

sebagai dua entitas bisnis berbeda.

QR TTE harus menjadi bagian dari mekanisme validasi dokumen.

Review:

- QR payload
- verification URL
- document identity
- signing/approval identity
- timestamp
- integrity
- revocation
- verification status

Jangan mengklaim QR sebagai tanda tangan kriptografis apabila
implementasi sebenarnya hanya merupakan verification mechanism.

Jika istilah "TTE" memerlukan keputusan hukum/teknis tambahan,
tandai DECISION REQUIRED.

============================================================
REVIEW 013 — NOMOR REGISTRASI SURAT
============================================================

Aturan bisnis:

Nomor urut boleh sama apabila:

- kode surat berbeda
  ATAU
- jenis surat berbeda.

Nomor urut TIDAK BOLEH sama apabila:

kode surat sama
AND
jenis surat sama
AND
tahun sama.

Database harus mampu menegakkan uniqueness rule.

Pastikan race condition juga dipertimbangkan.

Jangan hanya mengandalkan pengecekan frontend.

============================================================
REVIEW 014 — WORKFLOW SURAT
============================================================

Workflow:

USER SUBMIT
↓
NOTIFIKASI ADMIN
↓
ADMIN VERIFIKASI
↓
PREVIEW
↓
TERIMA / TOLAK

Jika TOLAK:

ALASAN
↓
NOTIFIKASI USER
↓
STATUS DITOLAK

Jika TERIMA:

STATUS MENUNGGU TANDA TANGAN
↓
NOTIFIKASI PIMPINAN
↓
PREVIEW
↓
TERIMA / TOLAK

Jika TOLAK:

ALASAN
↓
NOTIFIKASI USER
↓
STATUS DITOLAK

Jika TERIMA:

GENERATE NOMOR
↓
GENERATE QR TTE
↓
GENERATE DOCUMENT
↓
KIRIM WHATSAPP
↓
ARSIP
↓
SELESAI

Pastikan admin TIDAK memiliki kemampuan tanda tangan.

============================================================
REVIEW 015 — REVISION
============================================================

Jika user menerima status:

DITOLAK

user dapat:

Lihat alasan
↓
Revisi
↓
Form autofill
↓
Submit ulang

Pastikan:

- histori pengajuan tetap tersedia;
- alasan penolakan tetap tersedia;
- revision number/version tersedia;
- audit trail tidak hilang;
- dokumen lama tidak tertimpa secara destruktif.

============================================================
REVIEW 016 — PLANNING
============================================================

Architecture harus mendukung:

RPJMDes
↓
Program
↓
RKPDes
↓
Kegiatan
↓
Usulan Masyarakat
↓
Validasi RPJMDes
↓
Voting
↓
Seleksi
↓
APBDes
↓
Realisasi

Aturan:

Usulan masyarakat yang tidak sesuai dengan RPJMDes
dapat ditolak otomatis sesuai business rule.

Voting hanya untuk kegiatan eligible.

Kegiatan terpilih menjadi input APBDes.

APBDes cukup pada level umum.

Minimal:

PENDAPATAN:

- sumber dana
- nilai

BELANJA:

- bidang
- nama kegiatan
- volume
- satuan
- biaya
- sumber dana

Jangan membuat detail akuntansi desa yang belum diperlukan.

============================================================
REVIEW 017 — VOTING
============================================================

Voting harus memiliki:

- voter identity
- target activity/program
- period
- eligibility
- duplicate prevention
- audit
- result

Pastikan satu masyarakat tidak dapat melakukan voting
berulang apabila business rule melarangnya.

Jangan membuat voting sebagai sistem terpisah dari planning.

============================================================
REVIEW 018 — NOTIFICATION
============================================================

Notification Engine harus generic.

Architecture:

BUSINESS EVENT
↓
NOTIFICATION RULE
↓
RECIPIENT RESOLVER
↓
MESSAGE TEMPLATE
↓
CHANNEL
↓
DELIVERY
↓
LOG

Channel:

1. WhatsApp
2. In-App

Email:

OUT OF SCOPE.

Contoh event:

SURAT_SUBMITTED
SURAT_VERIFIED
SURAT_REJECTED
SURAT_APPROVED
SURAT_SIGNED
SURAT_COMPLETED
PROPOSAL_SUBMITTED
PROPOSAL_APPROVED
PROPOSAL_REJECTED

Event harus tidak terikat hanya kepada Surat.

============================================================
REVIEW 019 — AUDIT
============================================================

Audit harus dapat mencatat:

WHO
WHAT
WHEN
WHERE
BEFORE
AFTER

Minimal:

- authentication event
- data mutation
- verification
- approval
- rejection
- QR TTE generation
- document generation
- notification
- planning mutation
- voting
- selection
- APBDes mutation

============================================================
REVIEW 020 — DOCUMENT ENGINE
============================================================

Document Engine harus generic.

Mendukung:

- template
- template version
- generated document
- document metadata
- archive
- verification
- revision

Jangan membuat document engine khusus Surat.

============================================================
REVIEW 021 — TEMPLATE ENGINE
============================================================

Template harus database-driven.

Template harus mampu mengambil data:

- Identitas Desa
- Wilayah
- Penduduk
- Keluarga
- Perangkat Desa
- Pengajuan
- DNA field
- Nomor Surat
- QR TTE

Tidak boleh terdapat data bisnis hardcoded di template.

============================================================
REVIEW 022 — NO-HARDCODE
============================================================

Pisahkan tiga kategori:

A. STATIC SYSTEM CONSTANT

Contoh:
technical protocol
internal system constant

B. APPLICATION CONFIGURATION

Contoh:
environment configuration
provider credential
deployment setting

C. BUSINESS CONFIGURATION

Contoh:
jenis surat
status
role
permission
workflow
field surat
bidang
program
kegiatan
sumber dana
satuan
notification template
numbering rule

Kategori C harus database-driven.

============================================================
REVIEW 023 — API ARCHITECTURE
============================================================

Pastikan:

Frontend
↓
API
↓
Application Service
↓
Domain Logic
↓
Repository / ORM
↓
Database

Frontend tidak boleh:

Frontend
↓
Direct Database

Setiap mutation harus melalui business/service layer.

============================================================
REVIEW 024 — RBAC
============================================================

Architecture:

ACCOUNT
↓
ROLE
↓
PERMISSION

Minimal role yang perlu dipertimbangkan:

- masyarakat
- admin/operator
- perangkat desa
- pimpinan
- super admin

Jangan membuat role tambahan tanpa business requirement.

Pastikan role dapat dikonfigurasi tanpa hardcode.

============================================================
REVIEW 025 — SECURITY
============================================================

Review architecture untuk:

- authentication
- authorization
- password hashing
- session/token
- refresh token
- IDOR
- input validation
- SQL injection
- file upload
- CORS
- CSRF jika relevan
- secrets
- environment variables
- sensitive data
- audit

Jangan melakukan penetration testing destruktif.

============================================================
REVIEW 026 — TESTING
============================================================

Architecture testing minimal:

UNIT
INTEGRATION
API
DATABASE
E2E
SECURITY
BUILD
TYPECHECK

Pastikan setiap domain dapat diuji secara independent.

============================================================
REVIEW 027 — ARCHITECTURE DEPENDENCY
============================================================

Buat dependency graph.

Pastikan dependency mengikuti:

CORE
↓
MASTER DATA
↓
DOMAIN SERVICES
↓
APPLICATION
↓
PRESENTATION

Jangan membuat circular dependency.

============================================================
REVIEW 028 — MULTI-VILLAGE
============================================================

Pastikan semua data bisnis yang memang bersifat desa dapat
ditelusuri ke desa pemiliknya.

Contoh domain:

Penduduk
Perangkat Desa
Surat
Jenis Surat
Template
Workflow Configuration
Planning
APBDes
Notification Configuration
Audit

Evaluasi apakah perlu:

village_id

dan pada level mana.

Jangan menambahkan village_id ke tabel yang tidak memiliki
business ownership desa.

============================================================
CROSS DOCUMENT VALIDATION
============================================================

Bandingkan secara silang:

03-DATABASE-BLUEPRINT.md
04-MASTER-ERD.md
05-API-BLUEPRINT.md
06-RBAC-BLUEPRINT.md
07-WORKFLOW-ENGINE.md
08-DOCUMENT-ENGINE.md
09-TEMPLATE-ENGINE.md
10-NOTIFICATION-ENGINE.md
11-AUDIT-ENGINE.md
12-NO-HARDCODE-POLICY.md

Cari:

- duplicate entity
- missing entity
- missing FK
- wrong FK
- inconsistent naming
- inconsistent status
- inconsistent lifecycle
- inconsistent authorization
- inconsistent API
- inconsistent workflow
- inconsistent ownership
- circular dependency

============================================================
DATABASE BLUEPRINT VALIDATION
============================================================

Untuk setiap tabel yang direncanakan, pastikan tersedia:

- purpose
- domain
- primary key
- foreign keys
- indexes
- unique constraints
- check constraints jika diperlukan
- timestamps
- lifecycle
- owner
- audit strategy

Jika salah satu belum jelas:

DECISION REQUIRED.

============================================================
API BLUEPRINT VALIDATION
============================================================

Untuk setiap endpoint:

- HTTP method
- route
- actor
- authorization
- request
- response
- validation
- error
- related entity
- transaction requirement

Pastikan API tidak mengandung business logic yang hanya
terdapat di frontend.

============================================================
DELIVERABLES
============================================================

Buat directory:

docs/architecture/phase-0.5/

Buat file:

01-ARCHITECTURE-REVIEW.md

02-DECISION-FINAL.md

03-ERD-CONSISTENCY-REPORT.md

04-DATABASE-CONSISTENCY-REPORT.md

05-API-CONSISTENCY-REPORT.md

06-RBAC-CONSISTENCY-REPORT.md

07-WORKFLOW-CONSISTENCY-REPORT.md

08-NOTIFICATION-CONSISTENCY-REPORT.md

09-DOCUMENT-CONSISTENCY-REPORT.md

10-MULTI-VILLAGE-ARCHITECTURE.md

11-NO-HARDCODE-BOUNDARY.md

12-IMPLEMENTATION-CONTRACT.md

============================================================
DECISION-FINAL
============================================================

Resolve:

DECISION-001
Primary Key

DECISION-002
Backend Framework

DECISION-003
Frontend Framework

DECISION-004
ORM

DECISION-005
Database

DECISION-006
WhatsApp Provider Architecture

Untuk setiap keputusan gunakan:

ID:
TOPIC:
OPTIONS:
RECOMMENDED:
RATIONALE:
TRADE-OFF:
DATABASE IMPACT:
API IMPACT:
FRONTEND IMPACT:
TESTING IMPACT:
FINAL STATUS:

Jika tidak aman untuk diputuskan:

DEFERRED

dan jelaskan alasannya.

============================================================
IMPLEMENTATION CONTRACT
============================================================

Buat dokumen:

12-IMPLEMENTATION-CONTRACT.md

Dokumen ini wajib berisi aturan yang harus dipatuhi
oleh semua AI Agent pada phase berikutnya.

Minimal:

1. READ ARCHITECTURE BEFORE CODE
2. SEARCH BEFORE CREATE
3. NO DUPLICATE ENTITY
4. NO DUPLICATE MASTER DATA
5. NO HARDcoded BUSINESS RULE
6. DATABASE CHANGE = MIGRATION
7. API CHANGE = DOCUMENTATION
8. NEW FEATURE = TEST
9. BUSINESS MUTATION = AUDIT
10. AUTHORIZATION REQUIRED
11. PRESERVE DATA INTEGRITY
12. NO UNRELATED REFACTOR
13. NO SILENT ARCHITECTURE CHANGE
14. STOP ON ARCHITECTURAL CONFLICT
15. EVIDENCE REQUIRED

============================================================
ARCHITECTURE BASELINE
============================================================

Setelah seluruh review selesai:

Buat:

docs/architecture/ARCHITECTURE-BASELINE.md

Dokumen ini menjadi:

SINGLE SOURCE OF TRUTH

untuk implementation phase.

Architecture baseline harus mencantumkan:

- approved decisions
- approved domain
- approved database strategy
- approved API strategy
- approved RBAC
- approved workflow
- approved notification
- approved document architecture
- approved template architecture
- approved security baseline
- approved testing baseline
- implementation constraints

AI Agent TIDAK BOLEH mengubah baseline secara diam-diam.

Jika implementation menemukan masalah:

STOP
↓
DOCUMENT
↓
ARCHITECTURAL DECISION
↓
UPDATE BASELINE
↓
CONTINUE

============================================================
PHASE 0.5 DEFINITION OF DONE
============================================================

Phase 0.5 hanya COMPLETE jika:

[ ] seluruh dokumen Phase 0 telah dibaca
[ ] architecture review selesai
[ ] primary key diputuskan
[ ] backend diputuskan
[ ] frontend diputuskan
[ ] ORM diputuskan
[ ] database diputuskan
[ ] WhatsApp architecture diputuskan
[ ] multi-village strategy jelas
[ ] master data relationship jelas
[ ] ERD konsisten
[ ] API konsisten
[ ] RBAC konsisten
[ ] workflow konsisten
[ ] notification konsisten
[ ] document architecture konsisten
[ ] template architecture konsisten
[ ] no-hardcode boundary jelas
[ ] security architecture konsisten
[ ] testing architecture konsisten
[ ] implementation contract selesai
[ ] architecture baseline dibuat

============================================================
LARANGAN FINAL
============================================================

SETELAH PHASE 0.5 SELESAI:

JANGAN MEMBUAT SOURCE CODE.

JANGAN MEMBUAT DATABASE.

JANGAN MEMBUAT MIGRATION.

JANGAN MEMULAI PHASE 1.

Tunggu instruksi berikutnya.

============================================================
FINAL RESPONSE
============================================================

Tampilkan hanya:

PHASE:
0.5 — ARCHITECTURE REVIEW & DECISION FREEZE

STATUS:
PASS / BLOCKED

DECISIONS APPROVED:
[list]

DECISIONS DEFERRED:
[list]

ARCHITECTURAL CONFLICTS:
[list]

CRITICAL RISKS:
[list]

DOCUMENTS CREATED:
[list]

ARCHITECTURE BASELINE:
[path]

NEXT PHASE:
PHASE 1 — PROJECT FOUNDATION

============================================================
END OF PHASE 0.5
============================================================
