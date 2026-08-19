====================================================================
MITRADESA — PHASE 4 EXECUTION CONTRACT
MASTER REFERENCE DATA & CONFIGURATION ENGINE
====================================================================

STATUS: AUTHORIZED TO EXECUTE
PHASE: 4
PREREQUISITE: PHASE 0, 0.5, 1, 2, 3A, 3B STEP 1–5 = PASS

==================================================================== 0. MANDATORY ARCHITECTURE BASELINE
====================================================================

SEBELUM MENULIS ATAU MENGUBAH SOURCE CODE:

WAJIB membaca:

docs/architecture/ARCHITECTURE-BASELINE.md

dan seluruh dokumen architecture yang relevan, khususnya:

- 03-DATABASE-BLUEPRINT.md
- 04-MASTER-ERD.md
- 05-API-BLUEPRINT.md
- 06-RBAC-BLUEPRINT.md
- 07-WORKFLOW-ENGINE.md
- 08-DOCUMENT-ENGINE.md
- 09-TEMPLATE-ENGINE.md
- 10-NOTIFICATION-ENGINE.md
- 11-AUDIT-ENGINE.md
- 12-NO-HARDCODE-POLICY.md
- 13-SECURITY-ARCHITECTURE.md
- 14-TESTING-ARCHITECTURE.md
- 16-DEFINITION-OF-DONE.md
- 18-PROPOSED-ENHANCEMENTS.md

WAJIB membaca validation report:

- docs/development/PHASE-1-VALIDATION.md
- docs/development/PHASE-2-VALIDATION.md
- seluruh validation Phase 3A
- docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md
- docs/development/PHASE-3B-STEP-4-KELUARGA.md
- docs/development/PHASE-3B-STEP-5-PERANGKAT-DESA.md

JANGAN mengasumsikan isi schema berdasarkan prompt ini.
Gunakan repository aktual sebagai source of truth untuk implementasi.

====================================================================

1. # TUJUAN PHASE 4

Membangun fondasi:

MASTER REFERENCE DATA + CONFIGURATION ENGINE

yang akan digunakan oleh seluruh domain MITRADESA berikutnya.

Tujuan utama:

1. Menghilangkan business hardcode.
2. Menyediakan master/reference data terpusat.
3. Menyediakan konfigurasi yang dapat digunakan lintas domain.
4. Menjaga integritas relasi database.
5. Menyediakan API generic namun aman.
6. Menyediakan mekanisme aktif/nonaktif.
7. Menyediakan audit trail.
8. Menjadi fondasi Domain Surat, Template, Workflow,
   Notification, Perencanaan Pembangunan, dan domain berikutnya.

PHASE INI BUKAN IMPLEMENTASI DOMAIN SURAT.

==================================================================== 2. NON-NEGOTIABLE PRINCIPLE
====================================================================

DATABASE = SINGLE SOURCE OF TRUTH.

Business configuration TIDAK BOLEH berasal dari:

- hardcoded array
- enum business
- switch/case business
- if/else business
- constant business list
- hardcoded route configuration
- hardcoded jenis surat
- hardcoded jabatan
- hardcoded kode surat
- hardcoded status workflow
- hardcoded template field

Kode program hanya boleh menangani:

- validation
- authorization
- orchestration
- business rules yang memang bersifat invariant
- persistence
- transaction
- security

Data yang dapat berubah oleh administrator harus berasal dari database.

==================================================================== 3. STEP 1 — SYSTEM AUDIT
====================================================================

SEBELUM membuat model baru:

Audit seluruh Prisma schema dan database saat ini.

Inventarisasikan:

- seluruh model
- seluruh enum
- seluruh FK
- seluruh unique constraint
- seluruh index
- seluruh configuration model
- seluruh reference/master data
- seluruh hardcoded business data
- seluruh route terkait configuration
- seluruh permission
- seluruh audit event

Cari apakah sudah terdapat model:

- Configuration
- Setting
- Reference
- Lookup
- Master
- Dictionary
- Code
- Category
- Status

JANGAN membuat duplicate model.

Jika sudah ada model Configuration dari Phase sebelumnya:

WAJIB gunakan dan evolusikan secara kompatibel.

JANGAN mengganti arsitektur tanpa alasan dan dokumentasi.

Buat:

docs/development/PHASE-4-STEP-1-SYSTEM-AUDIT.md

STOP setelah audit.

JANGAN implementasi sebelum audit selesai.

==================================================================== 4. STEP 2 — REFERENCE DATA ARCHITECTURE
====================================================================

Setelah audit PASS, desain reference data yang benar-benar diperlukan.

Minimal evaluasi kebutuhan berikut:

## A. MASTER GEOGRAFIS

Sudah tersedia dari Phase 3A.

JANGAN membuat ulang:

- Provinsi
- Kabupaten
- Kecamatan
- Desa

## B. MASTER PENDUDUK

Sudah tersedia dari Phase 3B.

JANGAN membuat duplicate:

- Penduduk
- Keluarga
- AnggotaKeluarga
- PerangkatDesa

## C. MASTER ORGANISASI DESA

Evaluasi kebutuhan:

- Jabatan perangkat desa
- kode/singkatan jabatan
- status jabatan
- urutan jabatan

Pastikan tidak merusak PerangkatDesa existing.

## D. MASTER REFERENCE PENDUDUK

Evaluasi kebutuhan:

- jenis kelamin
- agama
- pendidikan
- pekerjaan
- status perkawinan
- hubungan keluarga
- status kependudukan
- golongan darah
- kewarganegaraan
- dan reference lain yang memang diperlukan schema existing.

CATATAN:

Jangan membuat seluruh daftar hanya karena kemungkinan dibutuhkan.

Hanya buat reference yang memiliki alasan arsitektural nyata.

## E. SYSTEM CONFIGURATION

Evaluasi konfigurasi:

- nama aplikasi
- konfigurasi sistem
- konfigurasi desa
- format tertentu yang bersifat configurable
- feature flags bila memang diperlukan
- konfigurasi pagination
- konfigurasi upload bila memang diperlukan

JANGAN menyimpan secret/password/API key sebagai configuration biasa.

Secret harus melalui secure environment/secret management.

==================================================================== 5. DESIGN RULE — REFERENCE TABLE
====================================================================

Jika sebuah data:

- digunakan oleh banyak domain
- memiliki ID
- dapat berubah
- perlu aktif/nonaktif
- perlu CRUD
- perlu audit
- dapat berkembang

MAKA prioritaskan database reference table.

Contoh pola:

ReferenceCategory
│
└── ReferenceItem

atau model yang lebih tepat berdasarkan architecture existing.

Namun:

JANGAN memaksakan generic table jika typed relational table lebih tepat.

Contoh:

Jangan menggunakan generic key/value untuk data yang membutuhkan:

- FK kuat
- unique constraint
- query kompleks
- integrity constraint
- relasi domain

Gunakan relational model jika memang diperlukan.

==================================================================== 6. ENUM POLICY
====================================================================

Audit seluruh Prisma enum.

Bedakan:

A. TECHNICAL ENUM
Contoh:

- environment
- internal system state

B. BUSINESS ENUM
Contoh:

- agama
- pendidikan
- pekerjaan
- status tertentu
- jenis dokumen

BUSINESS ENUM yang perlu dikonfigurasi administrator
TIDAK BOLEH dikunci sebagai Prisma enum tanpa alasan kuat.

Jika business value harus database-driven:

gunakan reference table.

JANGAN melakukan migration destruktif tanpa justifikasi.

==================================================================== 7. DATA LIFECYCLE
====================================================================

Reference data minimal mendukung:

- active/inactive
- createdAt
- updatedAt
- ordering bila diperlukan
- code bila diperlukan
- label/name
- description bila diperlukan

Jangan hard delete reference yang sudah digunakan oleh data transaksi
jika penghapusan dapat merusak historical integrity.

Gunakan:

isActive

atau:

deletedAt

sesuai pola architecture existing.

Reference yang sudah digunakan oleh transaksi:

NONAKTIFKAN,
jangan menghapus secara destruktif.

==================================================================== 8. CODE & IDENTIFIER POLICY
====================================================================

Jika reference membutuhkan code:

- code harus UNIQUE sesuai scope
- code bukan primary key kecuali architecture secara eksplisit mengharuskan
- gunakan BIGINT sebagai PK sesuai keputusan architecture
- code adalah business identifier

Contoh:

id = BIGINT PK
code = VARCHAR UNIQUE
name = VARCHAR

JANGAN menggunakan:

nama sebagai FK.

JANGAN menggunakan:

code sebagai PK

tanpa alasan arsitektural yang jelas.

==================================================================== 9. API ARCHITECTURE
====================================================================

Semua reference/configuration API wajib:

- authentication
- RBAC
- validation
- DTO
- service layer
- audit logging
- error handling
- IDOR protection jika relevan

JANGAN membuat API yang memungkinkan anonymous user
mengubah configuration.

Gunakan permission database-driven.

Minimal evaluasi permission:

reference.view
reference.create
reference.update
reference.delete

configuration.view
configuration.create
configuration.update
configuration.delete

Namun:

JANGAN otomatis membuat permission yang tidak diperlukan.

Sesuaikan dengan RBAC architecture existing.

==================================================================== 10. API DESIGN
====================================================================

Gunakan REST convention yang konsisten dengan project.

Contoh pola jika sesuai architecture:

GET /api/references
GET /api/references/:id
POST /api/references
PATCH /api/references/:id
DELETE /api/references/:id

Untuk category:

GET /api/reference-categories
GET /api/reference-categories/:id
POST /api/reference-categories
PATCH /api/reference-categories/:id

Nested item:

GET /api/reference-categories/:id/items
POST /api/reference-categories/:id/items

Configuration:

GET /api/configurations
GET /api/configurations/:key
PATCH /api/configurations/:key

TETAPI:

Jangan menyalin endpoint di atas secara buta.

Sesuaikan dengan schema dan architecture yang ditemukan pada STEP 1.

==================================================================== 11. SECURITY
====================================================================

Reference/configuration API harus dilindungi RBAC.

Wajib mencegah:

- unauthorized modification
- privilege escalation
- IDOR
- arbitrary configuration injection
- secret exposure

Configuration response harus membedakan:

PUBLIC CONFIG
vs
INTERNAL CONFIG
vs
SECRET CONFIG

SECRET:

JANGAN pernah dikembalikan melalui API public.

==================================================================== 12. NO-HARDCODE AUDIT
====================================================================

Cari seluruh source code yang mengandung business master hardcode.

Contoh pola:

const agama = [...]
const pendidikan = [...]
const pekerjaan = [...]
const jabatan = [...]

atau:

if (jenis === "KTP") ...
if (status === "MENIKAH") ...

atau:

switch (role) ...

Tidak semua if/switch otomatis salah.

Bedakan:

BUSINESS DATA
vs
PROGRAM CONTROL FLOW.

Jangan melakukan refactor massal tanpa bukti.

Jika menemukan hardcode yang relevan dengan Phase 4:

catat.

Jika aman dan scope-nya memang Phase 4:

migrasikan ke database.

Jika di luar scope:

dokumentasikan untuk phase berikutnya.

==================================================================== 13. SEED DATA
====================================================================

Reference/master data membutuhkan seed hanya untuk:

- initial system values
- nilai resmi yang memang diperlukan agar aplikasi dapat berjalan
- permission
- role
- configuration minimum

Seed harus:

- idempotent
- tidak membuat duplicate
- aman dijalankan berkali-kali
- menggunakan unique business identifier

JANGAN membuat seed random.

JANGAN memasukkan data dummy yang terlihat seperti data warga nyata.

==================================================================== 14. TRANSACTION POLICY
====================================================================

Operasi yang memengaruhi lebih dari satu tabel
WAJIB menggunakan transaction.

Contoh:

create category + items
update configuration + dependent records
deactivate reference + related operation

Gunakan Prisma transaction.

Jika salah satu operasi gagal:

ROLLBACK seluruh operasi.

==================================================================== 15. AUDIT LOGGING
====================================================================

Setiap mutation configuration/reference harus dapat diaudit.

Minimal:

REFERENCE_CREATED
REFERENCE_UPDATED
REFERENCE_ACTIVATED
REFERENCE_DEACTIVATED
REFERENCE_DELETED

CONFIGURATION_CREATED
CONFIGURATION_UPDATED
CONFIGURATION_DELETED

Gunakan AuditLog existing.

JANGAN membuat tabel audit kedua.

==================================================================== 16. FRONTEND
====================================================================

Buat halaman admin hanya untuk configuration/reference
yang memang sudah disetujui dalam database design.

Frontend:

- tidak menyimpan master data business sebagai constant
- mengambil data melalui API
- menggunakan design system existing
- RBAC-aware
- loading state
- empty state
- validation error
- success/error feedback

JANGAN membuat dashboard kompleks yang belum diperlukan.

Prioritas:

CORRECTNESS > COMPLETENESS > VISUAL COMPLEXITY.

==================================================================== 17. TESTING
====================================================================

Wajib membuat:

A. Unit tests

- validation
- service logic
- code uniqueness
- active/inactive

B. API tests

- authorization
- CRUD
- validation
- duplicate handling

C. Security tests

- unauthorized access
- forbidden role
- IDOR
- secret exposure

D. Transaction tests

- rollback
- partial failure

E. Regression tests

WAJIB memastikan:

Phase 2 PASS
Phase 3A PASS
Phase 3B Step 3 PASS
Phase 3B Step 4 PASS
Phase 3B Step 5 PASS

tidak rusak.

==================================================================== 18. DATABASE MIGRATION
====================================================================

Migration harus:

- Prisma migration
- reversible secara konseptual
- non-destructive
- mempertahankan data existing
- memiliki FK yang benar
- memiliki index yang diperlukan
- memiliki unique constraint yang tepat

JANGAN:

- drop table existing
- rename destructive
- reset database
- prisma db push --force-reset
- menghapus data existing

tanpa authorization eksplisit.

DATABASE EXISTING HARUS DIANGGAP BERISI DATA PENTING.

==================================================================== 19. ERD
====================================================================

Update:

docs/architecture/04-MASTER-ERD.md

dan dokumentasi Phase 4.

Pastikan relasi:

Wilayah
Penduduk
Keluarga
PerangkatDesa
Account
RBAC
Reference
Configuration

jelas.

Tidak boleh ada orphan FK.

Tidak boleh ada duplicate domain model.

==================================================================== 20. BACKWARD COMPATIBILITY
====================================================================

Perubahan Phase 4 tidak boleh merusak:

- authentication
- citizen OTP
- internal session
- RBAC
- wilayah
- identitas desa
- penduduk
- keluarga
- anggota keluarga
- perangkat desa
- account

Jika ditemukan konflik:

STOP.

Jangan memperbaiki secara spekulatif.

Dokumentasikan conflict dan tunggu instruksi.

==================================================================== 21. OUT OF SCOPE — STRICT
====================================================================

PHASE 4 DILARANG mengimplementasikan:

❌ Domain Surat
❌ Jenis Surat 47+
❌ DNA Field Surat
❌ Template Surat
❌ Kop Surat Engine
❌ Nomor Surat
❌ Registrasi Surat
❌ Workflow Surat
❌ QR TTE
❌ WhatsApp
❌ Notification Engine implementation
❌ RPJMDes
❌ RKPDes
❌ APBDes
❌ Usulan Online
❌ Voting Program
❌ BUMDes
❌ Tourism
❌ PBB
❌ Dashboard analytics kompleks

Phase 4 hanya membangun FOUNDATION
yang akan digunakan domain-domain tersebut.

==================================================================== 22. DEFINITION OF DONE
====================================================================

PHASE 4 hanya boleh dinyatakan PASS apabila:

[ ] System audit selesai
[ ] Tidak ada duplicate model
[ ] Reference architecture disetujui secara internal
[ ] Configuration architecture konsisten
[ ] Prisma schema valid
[ ] Migration berhasil
[ ] Existing data aman
[ ] FK valid
[ ] Unique constraint valid
[ ] Index valid
[ ] API selesai
[ ] DTO selesai
[ ] Validation selesai
[ ] RBAC selesai
[ ] Audit selesai
[ ] Soft-delete/inactive strategy selesai
[ ] Transaction test PASS
[ ] Security test PASS
[ ] Regression test PASS
[ ] Frontend sesuai kebutuhan
[ ] No-hardcode audit PASS
[ ] Build PASS
[ ] ERD updated
[ ] Documentation updated

==================================================================== 23. REQUIRED DOCUMENTATION
====================================================================

Buat:

docs/development/
└── PHASE-4-STEP-1-SYSTEM-AUDIT.md

└── PHASE-4-REFERENCE-DATA-DESIGN.md

└── PHASE-4-CONFIGURATION-DESIGN.md

└── PHASE-4-API.md

└── PHASE-4-VALIDATION.md

Jika struktur dokumentasi project memiliki convention berbeda,
ikuti convention existing.

==================================================================== 24. EXECUTION ORDER
====================================================================

WAJIB mengikuti urutan:

STEP 1
SYSTEM AUDIT
↓
STEP 2
REFERENCE DATA DESIGN
↓
STEP 3
DATABASE + MIGRATION
↓
STEP 4
SERVICE + DTO
↓
STEP 5
API + RBAC
↓
STEP 6
AUDIT + SECURITY
↓
STEP 7
FRONTEND
↓
STEP 8
TESTING
↓
STEP 9
REGRESSION
↓
STEP 10
ERD + DOCUMENTATION
↓
STEP 11
FINAL VALIDATION
↓
MANDATORY STOP

==================================================================== 25. ANTI-HALLUCINATION RULE
====================================================================

AI AGENT DILARANG:

- mengarang model yang belum diverifikasi
- mengarang field yang tidak ada
- mengarang API existing
- mengarang permission existing
- mengarang relation
- mengarang business requirement
- mengasumsikan database kosong
- menghapus schema karena dianggap tidak diperlukan
- membuat duplicate model
- membuat domain baru di luar scope

Jika informasi tidak tersedia:

JANGAN MENEBak.

Tulis:

"UNVERIFIED — NEEDS INSPECTION"

kemudian lakukan audit repository/database jika tool tersedia.

Jika tetap tidak dapat diverifikasi:

STOP dan laporkan.

==================================================================== 26. CHANGE CONTROL
====================================================================

Setiap perubahan schema harus dicatat:

CHANGE:
REASON:
IMPACT:
AFFECTED MODELS:
AFFECTED API:
AFFECTED TESTS:
BACKWARD COMPATIBILITY:
ROLLBACK STRATEGY:

Tidak boleh ada perubahan arsitektur diam-diam.

==================================================================== 27. FINAL REPORT
====================================================================

Setelah seluruh pekerjaan selesai, hasil akhir WAJIB berupa:

============================================================
PHASE 4 FINAL VALIDATION REPORT
============================================================

PHASE:
4 — MASTER REFERENCE DATA & CONFIGURATION ENGINE

STATUS:
PASS / FAIL / BLOCKED

DATABASE:
PASS / FAIL

REFERENCE DATA:
PASS / FAIL

CONFIGURATION:
PASS / FAIL

API:
PASS / FAIL

RBAC:
PASS / FAIL

SECURITY:
PASS / FAIL

AUDIT:
PASS / FAIL

TRANSACTION:
PASS / FAIL

TESTING:
PASS / FAIL

REGRESSION:
PASS / FAIL

FRONTEND:
PASS / FAIL

BUILD:
PASS / FAIL

ERD:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

ARCHITECTURE CONFLICT:
NONE / FOUND

BUSINESS RULE CONFLICT:
NONE / FOUND

SECURITY FINDINGS:
NONE / FOUND

FILES CREATED:
[list]

FILES MODIFIED:
[list]

DATABASE MODELS CREATED:
[list]

DATABASE MODELS MODIFIED:
[list]

API ENDPOINTS:
[list]

PERMISSIONS:
[list]

MIGRATIONS:
[list]

TEST RESULTS:
[list]

DOCUMENTATION:
[list]

KNOWN LIMITATIONS:
[list]

============================================================

==================================================================== 28. MANDATORY STOP
====================================================================

SETELAH FINAL VALIDATION:

STOP.

JANGAN:

- membuat Domain Surat
- membuat Template Engine implementation
- membuat QR TTE
- membuat WhatsApp
- membuat RPJMDes/RKPDes/APBDes
- membuat domain lain
- melanjutkan Phase berikutnya

Tunggu instruksi berikutnya.

====================================================================
END OF PHASE 4 EXECUTION CONTRACT
====================================================================
