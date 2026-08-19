LANJUTKAN IMPLEMENTASI PHASE 3B SEKARANG.

Gunakan seluruh instruksi Phase 3B sebelumnya sebagai
IMPLEMENTATION CONTRACT.

Jangan meminta klarifikasi ulang.

============================================================
EXECUTION ORDER
============================================================

Eksekusi secara berurutan:

STEP 1 — EXISTING SYSTEM AUDIT
STEP 2 — DATABASE DESIGN & MIGRATION
STEP 3 — PENDUDUK
STEP 4 — KELUARGA
STEP 5 — ANGGOTA KELUARGA
STEP 6 — CITIZEN INTEGRATION
STEP 7 — API
STEP 8 — RBAC + SECURITY
STEP 9 — AUDIT
STEP 10 — FRONTEND
STEP 11 — TESTING
STEP 12 — REGRESSION
STEP 13 — DOCUMENTATION
STEP 14 — VALIDATION
STEP 15 — STOP

============================================================
STEP 1 — EXISTING SYSTEM AUDIT
============================================================

Sebelum mengubah file:

Audit terlebih dahulu:

- Prisma schema
- migrations
- CitizenVerification
- CitizenSession
- Desa
- IdentitasDesa
- Account
- Role
- Permission
- AccountRole
- RolePermission
- AuditLog
- authentication middleware
- authorization middleware
- API router
- API service
- frontend routing
- existing tests

Pastikan terminology yang digunakan source code
sesuai dengan Architecture Baseline.

Jika model Desa menggunakan nama lain seperti:

Village

gunakan model EXISTING tersebut.

JANGAN membuat model duplicate:

Desa
Village

atau:

Citizen
Penduduk

============================================================
STEP 2 — DATABASE
============================================================

Implementasikan:

Penduduk
Keluarga
AnggotaKeluarga

dengan Prisma.

Sebelum migration:

verifikasi ERD.

Setiap FK harus benar.

Setiap UNIQUE constraint harus benar.

Setiap index harus memiliki alasan query/performance.

Jangan menambahkan index secara berlebihan.

============================================================
STEP 3 — PENDUDUK
============================================================

Implementasikan Penduduk sebagai:

MASTER IDENTITY WARGA.

NIK:

- BIGINT/PK TIDAK digunakan untuk NIK
- internal PK = BIGINT AUTO_INCREMENT
- NIK = unique business identifier
- exactly 16 digit
- numeric
- sensitive

Pastikan duplicate NIK menghasilkan:

HTTP 409 Conflict

bukan HTTP 500.

============================================================
STEP 4 — KELUARGA
============================================================

Implementasikan Keluarga/KK.

Nomor KK:

- unique
- validated
- sensitive
- tidak menjadi primary key

Pastikan satu Keluarga dapat memiliki banyak
AnggotaKeluarga.

============================================================
STEP 5 — ANGGOTA KELUARGA
============================================================

Gunakan associative relation:

Keluarga
↓
AnggotaKeluarga
↓
Penduduk

Jangan menggunakan kolom fixed:

anggota_1
anggota_2
anggota_3
dst.

Relationship harus relational/config-driven.

============================================================
STEP 6 — CITIZEN INTEGRATION
============================================================

Integrasikan:

Penduduk
↓
CitizenVerification

dan:

Penduduk
↓
CitizenSession

Citizen tidak boleh menjadi identity kedua.

FLOW:

NIK
↓
Penduduk lookup
↓
OTP
↓
CitizenVerification
↓
CitizenSession
↓
Penduduk authenticated

Jika NIK tidak ditemukan:

JANGAN create Penduduk otomatis.

============================================================
STEP 7 — TRANSACTION
============================================================

WAJIB menggunakan database transaction untuk
operasi multi-table.

Contoh:

Create Keluarga

- Create AnggotaKeluarga

Harus atomic.

Jika salah satu gagal:

ROLLBACK SEMUA.

Hal yang sama berlaku untuk:

- perubahan kepala keluarga
- perubahan membership
- operasi yang menyentuh beberapa record

============================================================
STEP 8 — SOFT DELETE / HISTORICAL DATA
============================================================

Jangan hard delete master Penduduk yang sudah
memiliki historical references.

Gunakan soft delete/status sesuai architecture.

Pastikan soft delete tidak menyebabkan:

- citizen login rusak secara silent
- foreign key orphan
- anggota keluarga orphan
- audit kehilangan referensi

============================================================
STEP 9 — API
============================================================

Implementasikan API sesuai API Blueprint.

Jangan membuat endpoint berdasarkan improvisasi
pribadi jika convention existing sudah tersedia.

Gunakan:

router
→ middleware
→ controller/service
→ validation
→ transaction
→ Prisma
→ audit

Jangan menaruh business logic kompleks di router.

DTO wajib digunakan.

Jangan return Prisma entity mentah.

============================================================
STEP 10 — SECURITY
============================================================

NIK dan KK adalah PII.

Public endpoint:

NO full NIK
NO full KK
NO complete family information

Administrative endpoint:

gunakan permission.

Citizen endpoint:

OWN DATA ONLY.

Citizen A tidak boleh mengakses:

Citizen B
Penduduk B
Keluarga B

melalui manipulasi ID.

Test IDOR secara eksplisit.

============================================================
STEP 11 — FRONTEND
============================================================

Implementasikan UI administrasi:

Penduduk
Keluarga
Detail Keluarga

Gunakan design system existing.

Jangan membuat UI system baru.

Jangan hardcode:

status
agama
pendidikan
pekerjaan
hubungan keluarga
jenis kelamin
status perkawinan

Jika master belum tersedia:

JANGAN membuat array hardcoded.

Catat sebagai:

MASTER DATA GAP.

============================================================
STEP 12 — TESTING
============================================================

Minimal test:

DATABASE

[ ] create Penduduk
[ ] duplicate NIK
[ ] invalid NIK
[ ] create Keluarga
[ ] duplicate KK
[ ] add anggota
[ ] duplicate anggota
[ ] invalid FK
[ ] kepala keluarga
[ ] transaction rollback
[ ] soft delete

CITIZEN

[ ] valid NIK
[ ] invalid NIK
[ ] OTP success
[ ] OTP failure
[ ] CitizenSession → Penduduk
[ ] own data access
[ ] other citizen blocked
[ ] admin endpoint blocked

SECURITY

[ ] 401
[ ] 403
[ ] 404
[ ] 409
[ ] IDOR protection
[ ] PII masking

RBAC

[ ] Admin
[ ] Pimpinan
[ ] Developer

REGRESSION

[ ] Phase 2 tests
[ ] Phase 3A tests

============================================================
STEP 13 — BUILD VALIDATION
============================================================

WAJIB menjalankan:

Prisma validation
Prisma generate
database migration
TypeScript typecheck
lint
unit/API tests
Playwright
production build

Jangan menyatakan PASS berdasarkan kode saja.

PASS hanya jika command validation benar-benar
berhasil dijalankan.

============================================================
STEP 14 — DOCUMENTATION
============================================================

Update:

docs/architecture/04-MASTER-ERD.md

dan buat:

docs/architecture/phase-3b/

01-PENDUDUK-MODEL.md
02-KELUARGA-MODEL.md
03-ANGGOTA-KELUARGA-MODEL.md
04-CITIZEN-INTEGRATION.md
05-PENDUDUK-API.md
06-KELUARGA-API.md
07-PHASE-3B-ERD.md
08-PHASE-3B-RBAC.md
09-PII-SECURITY.md

Buat:

docs/development/PHASE-3B-VALIDATION.md

============================================================
CRITICAL RULE
============================================================

Jangan menyelesaikan Phase 3B dengan cara:

"kode berhasil compile = PASS".

PASS hanya jika:

DATABASE

- ERD
- API
- RBAC
- SECURITY
- CITIZEN
- FRONTEND
- TEST
- REGRESSION
- DOCUMENTATION

semuanya PASS.

============================================================
ARCHITECTURE CHANGE
============================================================

Jika menemukan konflik dengan:

Architecture Baseline
Phase 2
Phase 3A
Master ERD
CitizenVerification
CitizenSession
RBAC

JANGAN memperbaiki secara diam-diam.

STOP pada bagian konflik.

Dokumentasikan:

CONFLICT
CURRENT
EXPECTED
IMPACT
PROPOSED SOLUTION

Tetapi lanjutkan bagian lain yang tidak terkena
dependency conflict apabila aman.

============================================================
FINAL REPORT
============================================================

Setelah semua selesai, tampilkan hanya laporan:

PHASE:
3B — PENDUDUK + KELUARGA

STATUS:
PASS / BLOCKED

DATABASE:
PASS / FAIL

ERD:
PASS / FAIL

PENDUDUK:
PASS / FAIL

KELUARGA:
PASS / FAIL

ANGGOTA KELUARGA:
PASS / FAIL

CITIZEN INTEGRATION:
PASS / FAIL

API:
PASS / FAIL

RBAC:
PASS / FAIL

SECURITY:
PASS / FAIL

AUDIT:
PASS / FAIL

FRONTEND:
PASS / FAIL

UNIT/API TEST:
PASS / FAIL

E2E:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

PHASE 3A REGRESSION:
PASS / FAIL

TYPECHECK:
PASS / FAIL

LINT:
PASS / FAIL

BUILD:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL

MASTER DATA GAP:
NONE / LIST

ARCHITECTURE CONFLICT:
NONE / LIST

BLOCKERS:
NONE / LIST

FILES CREATED:
LIST

FILES MODIFIED:
LIST

VALIDATION REPORT:
docs/development/PHASE-3B-VALIDATION.md

============================================================
STOP CONDITION
============================================================

SETELAH REPORT SELESAI:

STOP.

JANGAN memulai Phase 3C.

Tunggu instruksi berikutnya.
