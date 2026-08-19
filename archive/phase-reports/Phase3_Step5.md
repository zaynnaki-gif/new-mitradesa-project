# ============================================================

# MITRADESA — EXECUTION CONTRACT

# PHASE 3B — STEP 5

# PERANGKAT DESA + ACCOUNT INTEGRATION

# ============================================================

STATUS KONTRAK: APPROVED FOR EXECUTION
PHASE: 3B — MASTER DATA FOUNDATION
STEP: 5
SCOPE: Perangkat Desa + Integrasi Account
PRECONDITION: STEP 4 — KELUARGA & ANGGOTA KELUARGA = PASS
AUTHORIZATION: IMPLEMENT STEP 5 NOW
STOP AFTER: STEP 5 VALIDATION ONLY
============================================================

## 0. INSTRUKSI UTAMA

Anda adalah AI Software Engineer yang bekerja pada project MITRADESA.

STEP 4 telah selesai dan tervalidasi PASS.

Dengan prompt ini, Anda secara eksplisit DIIZINKAN untuk melanjutkan ke:

> STEP 5 — PERANGKAT DESA + ACCOUNT INTEGRATION

Jangan menganggap STOP CONDITION dari STEP 4 sebagai larangan
untuk menjalankan Step 5. STOP CONDITION Step 4 telah terpenuhi.

Namun:

> JANGAN melanjutkan ke Step 6 atau domain lain setelah Step 5 selesai.

Setelah validasi Step 5 PASS, BERHENTI dan berikan final validation report.

============================================================

# 1. WAJIB BACA SEBELUM MENYENTUH CODE

============================================================

Sebelum melakukan perubahan apa pun, baca dan pahami:

1. docs/architecture/ARCHITECTURE-BASELINE.md
2. docs/architecture/00-MITRADESA-CONSTITUTION.md
3. docs/architecture/03-DATABASE-BLUEPRINT.md
4. docs/architecture/04-MASTER-ERD.md
5. docs/architecture/05-API-BLUEPRINT.md
6. docs/architecture/06-RBAC-BLUEPRINT.md
7. docs/architecture/07-WORKFLOW-ENGINE.md
8. docs/architecture/08-DOCUMENT-ENGINE.md
9. docs/architecture/09-TEMPLATE-ENGINE.md
10. docs/architecture/10-NOTIFICATION-ENGINE.md
11. docs/architecture/11-AUDIT-ENGINE.md
12. docs/architecture/12-NO-HARDCODE-POLICY.md
13. docs/architecture/13-SECURITY-ARCHITECTURE.md
14. docs/architecture/14-TESTING-ARCHITECTURE.md
15. docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md
16. docs/development/PHASE-3B-STEP-4-KELUARGA.md
17. seluruh schema Prisma yang sedang digunakan
18. seluruh migration database yang sudah ada
19. implementasi Account, Role, Permission, AccountRole
20. implementasi Penduduk, Keluarga, AnggotaKeluarga

Jangan membuat asumsi terhadap schema.

Jika terdapat konflik antara dokumentasi dan implementasi aktual:

1. JANGAN langsung mengubah schema.
2. Audit terlebih dahulu.
3. Catat konflik.
4. Gunakan ARCHITECTURE-BASELINE sebagai referensi arsitektur.
5. Jangan melakukan redesign di luar scope Step 5.

============================================================

# 2. TUJUAN STEP 5

============================================================

Implementasikan domain:

> PERANGKAT DESA

dan integrasikan dengan:

> ACCOUNT / AUTHENTICATION / RBAC

Tujuan akhirnya:

Penduduk
│
└── dapat menjadi Perangkat Desa
│
└── memiliki Account internal bila membutuhkan akses sistem
│
├── ADMIN
├── PIMPINAN
└── DEVELOPER

Perangkat Desa dan Account adalah dua konsep berbeda.

JANGAN menggabungkan keduanya menjadi satu entitas.

---

# 3. KONSEP DATA WAJIB

---

## 3.1 Penduduk

Penduduk adalah sumber identitas orang.

Gunakan:

Penduduk.id = BIGINT PK

JANGAN menggunakan NIK sebagai foreign key.

NIK tetap sebagai business identifier.

---

## 3.2 PerangkatDesa

PerangkatDesa merepresentasikan posisi/peran seseorang
dalam struktur pemerintahan desa.

PerangkatDesa HARUS berelasi dengan:

Penduduk
Desa
dan bila diperlukan:
Jabatan/konfigurasi jabatan yang sesuai dengan architecture baseline.

Minimal relasi konseptual:

Penduduk 1 ──── N PerangkatDesa
Desa 1 ──── N PerangkatDesa

Gunakan FK BIGINT.

Contoh:

pendudukId BIGINT → Penduduk.id
desaId BIGINT → Desa.id

JANGAN:

nik VARCHAR → Penduduk.nik

---

# 4. ACCOUNT ≠ PERANGKAT DESA

============================================================

Ini adalah aturan arsitektur KRITIS.

Account adalah kredensial akses sistem.

PerangkatDesa adalah data struktur pemerintahan desa.

Jangan membuat:

Account = PerangkatDesa

Jangan menduplikasi:

nama
NIK
jabatan
data penduduk

ke dalam Account apabila data tersebut dapat direferensikan.

Gunakan relasi.

Konsep:

Penduduk
│
└── PerangkatDesa
│
└── Account (optional)

Account dapat dimiliki oleh PerangkatDesa.

Namun:

TIDAK semua PerangkatDesa wajib memiliki Account.

Contoh:

Perangkat Desa A
→ tidak membutuhkan akses aplikasi
→ tidak memiliki Account

Perangkat Desa B
→ membutuhkan akses
→ memiliki Account

---

# 5. ACCOUNT ROLE

============================================================

Project telah memiliki:

Account
Role
Permission
AccountRole
RolePermission

JANGAN membuat sistem role baru.

JANGAN membuat enum role baru apabila role sudah
database-driven.

Role yang telah disepakati:

1. ADMIN
2. PIMPINAN
3. DEVELOPER

Gunakan mekanisme RBAC yang sudah ada.

JANGAN hardcode authorization pada router.

Authorization harus menggunakan:

Permission
→ RolePermission
→ AccountRole

---

# 6. INTEGRASI ACCOUNT ↔ PERANGKAT DESA

============================================================

Buat relasi yang konsisten antara Account dan PerangkatDesa.

Sebelum menentukan FK final:

AUDIT schema existing.

Jika architecture baseline sudah menentukan arah relasi,
ikuti baseline.

Jika belum eksplisit, gunakan desain yang menjaga:

- satu Account maksimal merepresentasikan satu identitas
  internal pada satu konteks desa
- satu PerangkatDesa dapat tidak memiliki Account
- relasi dapat nullable pada sisi PerangkatDesa
- tidak boleh ada Account orphan yang mengklaim sebagai
  PerangkatDesa apabila sistem membutuhkan identitas tersebut

JANGAN membuat duplicate identity.

JANGAN menyalin NIK ke Account hanya sebagai convenience.

============================================================

# 7. FOTO PERANGKAT DESA

============================================================

PerangkatDesa harus mendukung:

> FOTO PERANGKAT DESA

Foto disimpan sebagai referensi file/storage,
BUKAN binary image di tabel database kecuali architecture
baseline secara eksplisit menentukan demikian.

Database menyimpan metadata/referensi yang diperlukan.

Contoh konsep:

fotoUrl
atau storagePath
atau file reference

Tetapi:

JANGAN hardcode provider storage.

Gunakan abstraction/configuration sesuai architecture.

Format gambar harus dapat menangani format gambar umum.

Validasi:

- MIME type
- extension
- ukuran file
- keamanan upload
- filename sanitization

Jangan percaya filename dari client.

============================================================

# 8. TTE QR CODE

============================================================

CATATAN ARSITEKTUR KRITIS:

MITRADESA menggunakan:

> TTE = QR CODE

TTE bukan entitas terpisah.

JANGAN membuat:

Tte table
Tte entity
Signature entity

hanya untuk QR TTE.

QR TTE merupakan bagian dari mekanisme dokumen/surat
yang akan digunakan pada domain Surat.

Untuk Step 5:

JANGAN mengimplementasikan workflow TTE Surat.

JANGAN membuat QR TTE.

JANGAN membuat tabel TTE.

Jika PerangkatDesa perlu menyimpan informasi terkait pejabat,
hanya simpan data yang memang menjadi atribut PerangkatDesa.

============================================================

# 9. DATA PERANGKAT DESA

============================================================

Audit terlebih dahulu architecture baseline.

PerangkatDesa minimal harus dapat merepresentasikan:

- id
- pendudukId
- desaId
- jabatan
- status aktif
- periode/masa jabatan bila diperlukan oleh baseline
- foto
- createdAt
- updatedAt
- deletedAt jika strategi soft delete digunakan

Jangan menambahkan field hanya karena "mungkin berguna".

Setiap field baru harus memiliki alasan domain.

============================================================

# 10. JABATAN

============================================================

Jabatan TIDAK BOLEH hardcoded jika architecture baseline
menetapkan master data database-driven.

Contoh:

❌ if role === "Kepala Desa"
❌ if jabatan === "Sekretaris Desa"

Jangan membuat business logic berdasarkan string jabatan.

Gunakan database/configuration.

Jika model jabatan belum tersedia:

AUDIT terlebih dahulu.

Jangan otomatis membuat master jabatan baru tanpa memastikan
bahwa desain tersebut kompatibel dengan MASTER ERD.

============================================================

# 11. STATUS PERANGKAT DESA

============================================================

Status seperti:

AKTIF
NONAKTIF
BERHENTI

harus mengikuti schema/architecture yang sudah ada.

Jangan membuat enum baru jika desain menggunakan
database-driven configuration.

Tidak boleh ada hardcoded master data.

============================================================

# 12. DATABASE RULES

============================================================

WAJIB:

- BIGINT PK
- FK menggunakan BIGINT
- foreign key integrity
- unique constraint sesuai business rule
- index pada FK
- index pada field pencarian penting
- timestamp createdAt / updatedAt
- soft delete sesuai strategi project

JANGAN:

- menggunakan NIK sebagai FK
- menggunakan jabatan sebagai FK
- menggunakan nama sebagai FK
- duplicate model Desa
- duplicate model Penduduk
- duplicate Account
- hard delete tanpa mengikuti architecture

============================================================

# 13. BUSINESS INTEGRITY

============================================================

Implementasikan validasi:

1. Penduduk harus ada.
2. Desa harus ada.
3. Penduduk tidak boleh direferensikan secara invalid.
4. Account tidak boleh mengarah ke identitas yang tidak valid.
5. Tidak boleh terjadi duplicate assignment yang melanggar
   business rule.
6. PerangkatDesa nonaktif tidak boleh digunakan sebagai
   active internal actor jika rule tersebut berlaku.
7. Semua perubahan penting harus tercatat dalam AuditLog.

Jika seorang Penduduk sudah menjadi PerangkatDesa:

validasi apakah diperbolehkan memiliki lebih dari satu jabatan
berdasarkan architecture baseline.

JANGAN menebak.

Jika belum ditentukan:

catat sebagai DECISION REQUIRED dan jangan membuat
business rule baru secara diam-diam.

============================================================

# 14. TRANSACTION

============================================================

Operasi yang mengubah lebih dari satu tabel wajib atomic.

Contoh:

Create PerangkatDesa

- Account Integration
- AuditLog

Jika memang dilakukan dalam satu business operation,
gunakan transaction.

Jika salah satu gagal:

ROLLBACK seluruh perubahan.

Jangan menghasilkan:

PerangkatDesa berhasil
tetapi Account gagal
dan database berada dalam kondisi setengah jadi.

============================================================

# 15. API

============================================================

Buat API sesuai pola project existing.

Minimal domain endpoint:

GET /api/perangkat-desa
GET /api/perangkat-desa/:id
POST /api/perangkat-desa
PATCH /api/perangkat-desa/:id
DELETE /api/perangkat-desa/:id

Untuk Account integration, JANGAN membuat endpoint duplicate
yang mengambil alih Auth API.

Gunakan endpoint Account existing jika memungkinkan.

Jika diperlukan endpoint relationship:

GET /api/perangkat-desa/:id/account

atau pola yang paling konsisten dengan API blueprint.

Jangan membuat endpoint hanya karena terlihat nyaman.

Audit API Blueprint terlebih dahulu.

============================================================

# 16. DTO + VALIDATION

============================================================

Gunakan Zod atau mekanisme validation existing.

Semua input harus divalidasi.

Validasi:

- id
- pendudukId
- desaId
- jabatan reference
- status
- periode
- foto metadata
- account relationship

Jangan menerima object database mentah dari request.

Gunakan DTO.

============================================================

# 17. RBAC

============================================================

Gunakan permission database-driven.

Minimal permission domain:

perangkat_desa.view
perangkat_desa.create
perangkat_desa.update
perangkat_desa.delete

Jangan hardcode:

if user.role === "ADMIN"

Gunakan middleware authorization existing.

Developer mendapatkan seluruh akses melalui RBAC,
bukan bypass middleware.

============================================================

# 18. PII PROTECTION

============================================================

PerangkatDesa mengandung data personal.

JANGAN expose:

- NIK full
- nomor telepon full
- data sensitif lain

ke public API.

Gunakan PII utility yang sudah dibuat pada Step 3.

Public endpoint dan internal endpoint harus berbeda
tingkat eksposur datanya.

IDOR wajib diuji.

Account A tidak boleh mengakses data internal
di luar scope authorization-nya.

============================================================

# 19. AUDIT LOGGING

============================================================

Gunakan AuditLog existing.

Minimal event:

PERANGKAT_DESA_CREATED
PERANGKAT_DESA_UPDATED
PERANGKAT_DESA_DELETED

Jika Account dihubungkan:

PERANGKAT_DESA_ACCOUNT_LINKED
PERANGKAT_DESA_ACCOUNT_UNLINKED

Gunakan struktur AuditLog existing.

Jangan membuat AuditLog baru.

============================================================

# 20. FRONTEND

============================================================

Implementasikan halaman admin untuk:

> Manajemen Perangkat Desa

Minimal:

1. List
2. Search/filter
3. Detail
4. Create
5. Edit
6. Soft delete
7. Hubungkan Account
8. Lepaskan Account
9. Upload/update foto

Gunakan design system existing.

JANGAN membuat design system baru.

JANGAN hardcode:

- jabatan
- desa
- status
- role
- permission

Semua berasal dari API/database.

============================================================

# 21. ACCOUNT MANAGEMENT

============================================================

Pada UI Perangkat Desa:

Tampilkan status:

- Belum memiliki Account
- Sudah memiliki Account

Jika membuat/menghubungkan Account:

gunakan Account model existing.

Jangan membuat credential system baru.

Password harus diproses oleh mekanisme authentication
existing.

Jangan menyimpan plaintext password.

Jangan menampilkan password.

============================================================

# 22. TESTING WAJIB

============================================================

Buat tests untuk:

### Database

- FK integrity
- unique constraints
- nullable account relation
- soft delete
- index/constraint behavior

### API

- GET
- POST
- PATCH
- DELETE
- validation
- unauthorized
- forbidden
- IDOR

### Account Integration

- link valid account
- unlink account
- duplicate relationship
- invalid account
- unauthorized account modification

### Transaction

Test:

1. Create PerangkatDesa berhasil
2. Account integration berhasil
3. Audit berhasil

dan:

1. PerangkatDesa gagal
2. Account gagal
3. Audit gagal

Pastikan rollback sesuai business transaction.

### Regression

WAJIB menjalankan regression test:

Phase 2
Phase 3A
Phase 3B Step 3
Phase 3B Step 4

Jangan menganggap test lama tetap valid hanya karena
TypeScript build berhasil.

============================================================

# 23. ERD

============================================================

Update:

docs/architecture/04-MASTER-ERD.md

Tambahkan relasi:

Provinsi
↓
Kabupaten
↓
Kecamatan
↓
Desa
↓
IdentitasDesa
↓
PerangkatDesa
↓
Penduduk

dan:

PerangkatDesa
↓
Account (optional)

Account
↓
AccountRole
↓
Role
↓
RolePermission
↓
Permission

Pastikan ERD aktual sama dengan Prisma schema.

JANGAN dokumentasikan relasi yang tidak benar-benar ada.

============================================================

# 24. NO-HARDCODE AUDIT

============================================================

Audit seluruh implementasi.

Cari:

- jabatan hardcoded
- status hardcoded
- role hardcoded
- desa hardcoded
- permission hardcoded
- ID hardcoded
- business configuration hardcoded

Business configuration harus database-driven.

Hardcode hanya diperbolehkan untuk:

- technical constants
- HTTP semantics
- internal implementation constants
- validation rules yang memang merupakan invariant teknis

============================================================

# 25. SECURITY AUDIT

============================================================

Periksa:

- authentication
- authorization
- RBAC
- IDOR
- PII masking
- SQL/ORM injection
- mass assignment
- file upload security
- path traversal
- unauthorized Account linking
- privilege escalation

Khusus Account linking:

User tidak boleh dapat menghubungkan PerangkatDesa
dengan Account secara arbitrer hanya dengan mengubah ID
pada request.

Validasi authorization harus dilakukan di service layer.

============================================================

# 26. MIGRATION

============================================================

Jika schema berubah:

1. generate Prisma migration
2. review SQL migration
3. pastikan tidak destructive tanpa alasan
4. jalankan migration
5. regenerate Prisma Client
6. test database

Jangan reset database.

Jangan drop table existing.

Jangan membuat migration yang menghapus data existing.

Database existing adalah sumber data yang harus dijaga.

============================================================

# 27. DILARANG MELAKUKAN

============================================================

❌ Jangan membuat domain Surat
❌ Jangan membuat Template Surat
❌ Jangan membuat Workflow Surat
❌ Jangan membuat QR TTE
❌ Jangan membuat Notification WhatsApp
❌ Jangan membuat RPJMDes
❌ Jangan membuat RKPDes
❌ Jangan membuat APBDes
❌ Jangan membuat Perencanaan Pembangunan
❌ Jangan membuat domain Ekonomi
❌ Jangan redesign Authentication
❌ Jangan redesign RBAC
❌ Jangan membuat Citizen Account
❌ Jangan membuat tabel Citizen baru
❌ Jangan membuat duplicate Penduduk
❌ Jangan membuat duplicate Desa
❌ Jangan membuat duplicate Account
❌ Jangan menggunakan NIK sebagai FK
❌ Jangan hardcode business master data

============================================================

# 28. DOCUMENTATION

============================================================

Buat:

docs/development/PHASE-3B-STEP-5-PERANGKAT-DESA.md

Dokumen wajib berisi:

1. Scope
2. Existing schema audit
3. Database changes
4. ERD changes
5. PerangkatDesa model
6. Account integration
7. API
8. DTO
9. RBAC
10. PII protection
11. Audit logging
12. Transaction behavior
13. Soft delete
14. Frontend
15. Testing
16. Security audit
17. No-hardcode audit
18. Regression results
19. Known limitations
20. Architecture decision jika ada

============================================================

# 29. DEFINITION OF DONE

============================================================

STEP 5 hanya boleh dinyatakan PASS jika:

[ ] Prisma schema valid
[ ] Migration valid
[ ] Database integrity PASS
[ ] PerangkatDesa implemented
[ ] Penduduk relation PASS
[ ] Desa relation PASS
[ ] Account integration PASS
[ ] RBAC PASS
[ ] PII protection PASS
[ ] IDOR protection PASS
[ ] Audit logging PASS
[ ] Transaction test PASS
[ ] Rollback test PASS
[ ] Soft delete PASS
[ ] API tests PASS
[ ] Frontend PASS
[ ] Regression PASS
[ ] Build PASS
[ ] ERD updated
[ ] Documentation updated
[ ] No-hardcode audit PASS
[ ] Security audit PASS
[ ] Architecture conflict = NONE

Jika salah satu critical check gagal:

STATUS = FAIL

Jangan menyatakan PASS hanya karena build berhasil.

============================================================

# 30. FINAL VALIDATION REPORT

============================================================

Setelah seluruh pekerjaan selesai, tampilkan laporan:

PHASE:
3B — STEP 5

STATUS:
PASS / FAIL

DATABASE:
PASS / FAIL

PERANGKAT DESA:
PASS / FAIL

ACCOUNT INTEGRATION:
PASS / FAIL

RBAC:
PASS / FAIL

PII:
PASS / FAIL

IDOR:
PASS / FAIL

AUDIT:
PASS / FAIL

TRANSACTION:
PASS / FAIL

ROLLBACK:
PASS / FAIL

SOFT DELETE:
PASS / FAIL

API:
PASS / FAIL

FRONTEND:
PASS / FAIL

TESTING:
PASS / FAIL

REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

ERD:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

SECURITY:
PASS / FAIL

ARCHITECTURE CONFLICT:
NONE / FOUND

FILES CREATED:
[list]

FILES MODIFIED:
[list]

MIGRATIONS:
[list]

API ENDPOINTS:
[list]

KNOWN LIMITATIONS:
[list]

DECISION REQUIRED:
[list]

============================================================

# 31. MANDATORY STOP

============================================================

SETELAH FINAL VALIDATION REPORT:

STOP.

JANGAN:

- menjalankan Step 6
- membuat domain Surat
- membuat domain Pembangunan
- membuat domain Ekonomi
- membuat fitur tambahan
- melakukan refactor besar di luar scope
- membuat improvement yang tidak diminta

Tunggu instruksi berikutnya.

============================================================

# END OF EXECUTION CONTRACT

============================================================
