============================================================
MITRADESA — PHASE 2 REVISION
IDENTITY, CITIZEN ACCESS, AUTHENTICATION & RBAC
============================================================

## STATUS

PHASE 0 = COMPLETE
PHASE 0.5 = COMPLETE
PHASE 1 = COMPLETE

PHASE 2 ORIGINAL SPECIFICATION = SUPERSEDED

Gunakan dokumen ini sebagai spesifikasi Phase 2 yang baru.

============================================================
ARCHITECTURE SOURCE OF TRUTH
============================================================

WAJIB membaca sebelum melakukan perubahan:

1.  docs/architecture/ARCHITECTURE-BASELINE.md

2.  docs/architecture/phase-0.5/12-IMPLEMENTATION-CONTRACT.md

3.  docs/architecture/03-DATABASE-BLUEPRINT.md

4.  docs/architecture/04-MASTER-ERD.md

5.  docs/architecture/06-RBAC-BLUEPRINT.md

6.  docs/architecture/07-WORKFLOW-ENGINE.md

7.  docs/architecture/10-NOTIFICATION-ENGINE.md

8.  docs/architecture/11-AUDIT-ENGINE.md

9.  docs/architecture/12-NO-HARDCODE-POLICY.md

10. docs/development/PHASE-1-VALIDATION.md

============================================================
CRITICAL ARCHITECTURAL DECISION
============================================================

MITRADESA menggunakan DUA kategori identity/access:

A. CITIZEN / MASYARAKAT
B. INTERNAL ACCOUNT

Keduanya TIDAK boleh dicampur.

---

## A. CITIZEN / MASYARAKAT

Masyarakat TIDAK mempunyai Account internal.

Masyarakat menggunakan:

PENDUDUK
↓
NIK
↓
OTP VERIFICATION
↓
CITIZEN SESSION
↓
PUBLIC SERVICE

NIK adalah identity reference.

NIK BUKAN password.

NIK BUKAN role.

NIK BUKAN Account.

NIK BUKAN authentication secret.

Jangan membuat:

CitizenAccount
ResidentAccount
CitizenUser
ResidentUser

hanya untuk mengakomodasi login masyarakat.

Master identity masyarakat tetap:

PENDUDUK.

---

## B. INTERNAL ACCOUNT

Hanya tiga jenis role/account internal:

1. ADMIN
2. PIMPINAN
3. DEVELOPER

Tidak ada:

Masyarakat Account
Petugas Account terpisah
Operator Account terpisah

PETUGAS OPERASIONAL berada di bawah role ADMIN
apabila memang diperlukan oleh business authorization.

============================================================
MODEL IDENTITY
============================================================

Konsep utama:

PENDUDUK
│
│ NIK
▼
CITIZEN VERIFICATION
│
│ OTP
▼
CITIZEN SESSION
│
▼
PUBLIC SERVICE

ACCOUNT
│
▼
ACCOUNT_ROLE
│
▼
ROLE
│
▼
ROLE_PERMISSION
│
▼
PERMISSION

============================================================
CRITICAL SECURITY PRINCIPLE
============================================================

JANGAN menggunakan NIK saja sebagai authentication.

NIK adalah identifier yang dapat diketahui orang lain.

Authentication masyarakat harus:

NIK

- OTP
  ↓
  Verified Citizen Session

OTP harus dikirim ke nomor telepon yang terdaftar pada
master Penduduk, apabila nomor tersebut tersedia dan
valid sesuai data.

Jika nomor telepon tidak tersedia atau tidak dapat
diverifikasi:

JANGAN membuat bypass keamanan.

Sistem harus mengembalikan status yang jelas dan
mengarahkan proses verifikasi sesuai policy.

Jangan mengizinkan:

NIK → langsung login

============================================================
PHASE 2 MISSION
============================================================

Phase ini membangun FOUNDATION identity dan access control.

Phase ini mencakup:

1. Internal Account
2. Role
3. Permission
4. Account-Role
5. Citizen Identity Verification
6. OTP
7. Citizen Session
8. JWT/session strategy
9. Authentication middleware
10. Authorization middleware
11. Audit authentication events
12. Frontend authentication foundation
13. Security foundation
14. Testing

Phase ini TIDAK membangun business domain.

============================================================
DO NOT BUILD
============================================================

DILARANG membuat:

- Penduduk CRUD
- Keluarga CRUD
- Perangkat Desa CRUD
- Surat CRUD
- Jenis Surat CRUD
- Template Surat
- DNA Field
- Workflow Surat
- QR TTE
- WhatsApp business workflow
- RPJMDes
- RKPDes
- APBDes
- Voting
- BUMDes
- PBB
- Tourism
- Dashboard business

Database Penduduk hanya boleh digunakan sebagai
identity reference/testing fixture jika diperlukan.

============================================================
IMPORTANT — PHASE 1 PRESERVATION
============================================================

Phase 1 sudah PASS.

Jangan merusak:

- project structure
- build system
- TypeScript configuration
- Express configuration
- React/Vite configuration
- Prisma configuration
- Jest
- Playwright
- CI
- environment strategy

Sebelum mengubah file existing:

1. inspect file;
2. pahami fungsi;
3. gunakan kembali apabila memungkinkan;
4. jangan membuat duplicate infrastructure.

============================================================
DATABASE MODEL
============================================================

Gunakan database blueprint dan master ERD sebagai authority.

Phase 2 minimal membutuhkan domain:

INTERNAL:

Account
Role
Permission
AccountRole
RolePermission

CITIZEN ACCESS:

CitizenVerification / equivalent
OTP / OTP challenge
CitizenSession

Gunakan nama entity yang konsisten dengan
architecture baseline.

Jangan membuat duplicate identity table.

============================================================
PENDUDUK RELATIONSHIP
============================================================

Citizen access HARUS mengacu kepada:

Penduduk.id

bukan membuat salinan data penduduk.

Konsep:

CitizenVerification
│
└── penduduk_id
│
▼
Penduduk

CitizenSession
│
└── penduduk_id
│
▼
Penduduk

Jangan menyimpan:

nama_lengkap
alamat
KK
tanggal_lahir

sebagai duplicate permanent citizen identity
di CitizenSession.

Gunakan reference ke Penduduk.

============================================================
NIK
============================================================

NIK harus mengikuti master Penduduk.

Pastikan:

- unique
- indexed
- validated
- tidak dijadikan password
- tidak disimpan sebagai credential secret

API tidak boleh mengembalikan seluruh data Penduduk
ketika citizen verification hanya membutuhkan identity
minimal.

============================================================
CITIZEN AUTHENTICATION FLOW
============================================================

Implementasikan flow:

STEP 1

Citizen membuka layanan publik.

↓

STEP 2

Citizen memasukkan NIK.

↓

STEP 3

System mencari Penduduk berdasarkan NIK.

↓

STEP 4

Jika Penduduk tidak ditemukan:

STOP.

Jangan mengungkap informasi berlebihan.

Gunakan response aman seperti:

IDENTITY_VERIFICATION_FAILED

↓

STEP 5

Jika ditemukan:

periksa apakah citizen memiliki nomor HP
yang dapat digunakan untuk OTP.

↓

STEP 6

Generate OTP challenge.

↓

STEP 7

Kirim OTP melalui notification abstraction.

Jangan hardcode provider.

↓

STEP 8

Citizen memasukkan OTP.

↓

STEP 9

System memverifikasi:

- challenge valid
- belum expired
- belum digunakan
- attempt masih tersedia
- OTP benar

↓

STEP 10

Jika valid:

Citizen Session dibuat.

↓

STEP 11

Citizen dapat mengakses public service
sesuai authorization policy.

============================================================
OTP SECURITY
============================================================

OTP:

- jangan disimpan plaintext;
- simpan hash OTP apabila architecture memungkinkan;
- memiliki expiration;
- memiliki maximum attempt;
- hanya dapat digunakan sekali;
- memiliki cooldown;
- memiliki rate limit;
- memiliki challenge identifier.

Jangan menyimpan OTP dalam log.

Jangan mengembalikan OTP melalui API.

Jangan menampilkan OTP pada frontend.

Jangan menggunakan OTP statis.

============================================================
OTP LENGTH
============================================================

Gunakan konfigurasi yang ditentukan oleh security
architecture.

Jangan hardcode nilai business/security configuration
di frontend.

Jika baseline belum menentukan:

gunakan configuration layer.

============================================================
OTP PROVIDER
============================================================

Gunakan abstraction/adaptor.

Contoh konseptual:

Notification Service
↓
OTP Provider Adapter
↓
Provider

Jangan mengikat citizen authentication langsung
ke provider tertentu.

Provider dapat diganti tanpa mengubah business logic.

============================================================
CITIZEN SESSION
============================================================

Setelah OTP berhasil:

Citizen mendapatkan authenticated session.

Session harus memiliki:

- id
- penduduk reference
- created_at
- expires_at
- revoked_at jika diperlukan
- authentication metadata yang aman

Jangan menyimpan sensitive information secara berlebihan.

Session harus dapat:

- expire
- revoke
- logout

============================================================
CITIZEN AUTHORIZATION
============================================================

Citizen tidak menggunakan:

ROLE_ADMIN
ROLE_PIMPINAN
ROLE_DEVELOPER

Citizen memiliki access context:

CITIZEN

Authorization public service harus membedakan:

PUBLIC
CITIZEN
INTERNAL

Namun jangan membuat role internal untuk citizen
hanya demi authorization.

============================================================
INTERNAL ACCOUNT
============================================================

Hanya:

ADMIN
PIMPINAN
DEVELOPER

Account harus memiliki:

- id
- login identifier
- password hash
- status
- timestamps
- security metadata sesuai baseline

Jangan menyimpan password plaintext.

============================================================
ACCOUNT ↔ ROLE
============================================================

Gunakan relationship sesuai baseline.

Jika baseline memungkinkan multi-role:

gunakan AccountRole.

Jika baseline menetapkan single-role:

ikuti baseline.

Jangan mengubah cardinality tanpa decision.

============================================================
ROLE
============================================================

Role database-driven.

Seed:

ADMIN
PIMPINAN
DEVELOPER

Jika baseline menggunakan code/name berbeda:

ikuti baseline.

Role bukan hardcoded source of truth.

============================================================
PERMISSION
============================================================

Permission database-driven.

Contoh konseptual:

penduduk.read
penduduk.update
surat.read
surat.verify
surat.approve
surat.tte
settings.read
settings.update

CONTOH DI ATAS HANYA ILUSTRASI.

Gunakan permission yang ditentukan architecture
baseline.

Jangan membuat seluruh permission business module
pada Phase 2 jika module tersebut belum diimplementasikan.

============================================================
DEVELOPER ACCESS
============================================================

Developer memiliki seluruh akses melalui authorization
model.

Namun JANGAN membuat bypass:

if role == DEVELOPER then allow everything

sebagai satu-satunya mechanism.

Gunakan permission model.

Jika diperlukan wildcard permission:

gunakan mekanisme yang didefinisikan database/policy.

Contoh konseptual:

system.\*

atau permission set yang ekuivalen.

Jangan membuat hidden backdoor.

============================================================
ADMIN ACCESS
============================================================

Admin terbatas.

Jangan memberikan full access.

Admin hanya memperoleh permission yang di-seed.

============================================================
PIMPINAN ACCESS
============================================================

Pimpinan terbatas.

Jangan memberikan full access.

Pimpinan hanya memperoleh permission yang di-seed.

============================================================
AUTHENTICATION SEPARATION
============================================================

Pisahkan:

CITIZEN AUTHENTICATION

dan

INTERNAL ACCOUNT AUTHENTICATION.

Jangan membuat satu endpoint login yang membingungkan
kedua mekanisme.

Gunakan endpoint yang jelas.

Contoh konseptual:

POST /api/auth/internal/login

POST /api/auth/citizen/request-otp

POST /api/auth/citizen/verify-otp

GET /api/auth/me

POST /api/auth/logout

Nama final harus mengikuti API blueprint.

============================================================
INTERNAL LOGIN
============================================================

Flow:

Account
↓
credential
↓
password verification
↓
account status
↓
role
↓
permission
↓
authenticated session/token

Jika credential invalid:

jangan mengungkap apakah username
atau password yang salah.

============================================================
INTERNAL JWT
============================================================

JWT secret berasal dari environment.

JWT tidak boleh berisi:

- password
- password hash
- OTP
- sensitive personal data

Payload harus minimal.

Token expiration harus configuration-driven.

============================================================
CITIZEN TOKEN / SESSION
============================================================

Citizen session tidak boleh otomatis memperoleh
internal role.

Citizen:

CITIZEN

Internal:

ADMIN
PIMPINAN
DEVELOPER

Tidak boleh terjadi privilege escalation melalui
citizen session.

============================================================
AUTH MIDDLEWARE
============================================================

Buat centralized:

authenticateInternal()

authenticateCitizen()

atau abstraction equivalent.

Jangan mencampur identity context.

============================================================
AUTHORIZATION
============================================================

Gunakan:

authenticate
↓
authorize(permission)
↓
controller/service

Backend adalah authority.

Frontend permission checks hanya untuk UX.

============================================================
API
============================================================

Minimal implementasikan endpoint yang diperlukan.

INTERNAL:

POST /api/auth/internal/login
POST /api/auth/logout
GET /api/auth/me

CITIZEN:

POST /api/auth/citizen/request-otp
POST /api/auth/citizen/verify-otp
POST /api/auth/citizen/logout

Jika API blueprint memiliki naming berbeda:

IKUTI API BLUEPRINT.

Jangan membuat duplicate endpoint.

============================================================
CITIZEN REQUEST OTP
============================================================

Input:

NIK

Validasi:

- format NIK
- existence
- citizen eligibility
- phone verification availability
- rate limit

Jangan mengembalikan:

"Nomor HP warga adalah 081..."

Response harus tidak membocorkan PII.

============================================================
CITIZEN VERIFY OTP
============================================================

Input:

challenge/reference
OTP

Validasi:

- challenge valid
- OTP correct
- not expired
- not consumed
- attempts remaining

Jika berhasil:

Citizen Session.

============================================================
PUBLIC API
============================================================

Public endpoints tidak boleh otomatis memperoleh
citizen privilege.

Citizen verification hanya diperlukan ketika
layanan memerlukan identity.

============================================================
FRONTEND
============================================================

Frontend harus memiliki dua authentication experience:

1. Citizen Access
2. Internal Login

Contoh:

/layanan
/layanan/verifikasi
/layanan/otp

dan:

/login
/app

Nama route final mengikuti architecture.

============================================================
CITIZEN UX
============================================================

Citizen flow:

Masukkan NIK
↓
Verifikasi
↓
OTP dikirim
↓
Masukkan OTP
↓
Berhasil
↓
Layanan

Jangan meminta:

username
password
role

kepada citizen.

============================================================
INTERNAL UX
============================================================

Internal:

Login
↓
Authenticated
↓
Application

Menu harus dapat ditentukan berdasarkan permission.

Jangan membuat:

if role === admin

untuk seluruh menu.

Gunakan permission-aware navigation.

============================================================
ACCOUNT STATUS
============================================================

Minimal:

ACTIVE
INACTIVE

Account inactive:

401/appropriate authentication denial.

Tidak boleh mengakses API.

============================================================
AUDIT
============================================================

Audit minimal:

INTERNAL_LOGIN_SUCCESS
INTERNAL_LOGIN_FAILED
INTERNAL_LOGOUT

CITIZEN_OTP_REQUESTED
CITIZEN_OTP_VERIFIED
CITIZEN_OTP_FAILED
CITIZEN_SESSION_CREATED
CITIZEN_LOGOUT

ACCOUNT_DISABLED

PASSWORD_CHANGED

Jangan menyimpan:

password
OTP
JWT
secret

============================================================
PII PROTECTION
============================================================

NIK dan nomor HP merupakan data sensitif/personal.

Jangan memasukkan NIK penuh atau nomor HP penuh
ke application log apabila tidak diperlukan.

Gunakan masking/redaction.

Contoh:

NIK:
******\*\*\*\*******1234

Phone:
**\*\***1234

Audit payload harus mengikuti privacy policy.

============================================================
RATE LIMITING
============================================================

Rate limit:

Internal login
Citizen OTP request
Citizen OTP verification

Gunakan infrastructure/adapter yang sesuai.

Jangan membuat bypass.

============================================================
SECURITY TEST
============================================================

WAJIB test:

1. NIK invalid
2. NIK not found
3. NIK valid
4. OTP invalid
5. OTP expired
6. OTP reused
7. OTP maximum attempts
8. OTP request rate limit
9. citizen session expiration
10. citizen logout
11. internal login valid
12. internal login invalid
13. inactive account
14. invalid JWT
15. expired JWT
16. unauthorized permission
17. admin cannot access developer-only permission
18. pimpinan cannot access developer-only permission
19. developer can access assigned full permissions
20. citizen cannot access internal API

============================================================
NO PRIVILEGE ESCALATION
============================================================

WAJIB membuktikan:

Citizen
X
Internal API

Admin
X
Developer-only operation

Pimpinan
X
Developer-only operation

Developer
✓
Authorized operations

Jangan menggunakan frontend sebagai security boundary.

============================================================
DATABASE CONSTRAINTS
============================================================

Pastikan:

NIK unique
Role unique
Permission unique
AccountRole unique
RolePermission unique

Foreign key valid.

Index:

NIK
account login identifier
session lookup
OTP challenge lookup
role relationship
permission relationship

Gunakan index sesuai query aktual.

============================================================
SEED
============================================================

Seed:

ROLE:

ADMIN
PIMPINAN
DEVELOPER

PERMISSION:

Hanya permission foundation yang benar-benar diperlukan.

Jangan seed ratusan permission business yang belum
memiliki module.

Buat development accounts:

admin
pimpinan
developer

Credential development harus:

- documented
- non-production
- tidak digunakan production.

============================================================
MIGRATION
============================================================

Gunakan Prisma migration.

WAJIB:

schema
↓
format
↓
validate
↓
migration
↓
generate
↓
test

Jangan mengganti migration dengan db push.

============================================================
API RESPONSE
============================================================

Success:

{
"success": true,
"data": {}
}

Error:

{
"success": false,
"error": {
"code": "...",
"message": "..."
}
}

Jangan expose:

password
OTP
secret
internal stack trace
unnecessary PII

============================================================
TESTING
============================================================

Jest/API:

- internal authentication
- citizen OTP
- session
- authorization
- permission
- security

Playwright:

TEST 001
Citizen membuka layanan.

TEST 002
Citizen memasukkan NIK.

TEST 003
OTP flow.

TEST 004
Citizen berhasil authenticated.

TEST 005
Citizen logout.

TEST 006
Internal admin login.

TEST 007
Internal pimpinan login.

TEST 008
Internal developer login.

TEST 009
Protected route.

TEST 010
Unauthorized access.

Gunakan test OTP mechanism yang aman untuk environment test.

Jangan menggunakan OTP production provider
dalam automated test.

============================================================
ARCHITECTURAL DOCUMENTATION
============================================================

Buat:

docs/architecture/phase-2/

01-IDENTITY-MODEL.md
02-CITIZEN-AUTHENTICATION.md
03-INTERNAL-AUTHENTICATION.md
04-RBAC-MODEL.md
05-AUTHORIZATION-MODEL.md
06-SECURITY-MODEL.md

Update jika diperlukan:

docs/architecture/04-MASTER-ERD.md
docs/architecture/06-RBAC-BLUEPRINT.md
docs/architecture/10-NOTIFICATION-ENGINE.md
docs/architecture/11-AUDIT-ENGINE.md

PENTING:

Jika dokumen baseline berubah karena keputusan baru ini,
jelaskan perubahan tersebut secara eksplisit.

Jangan mengubah baseline tanpa mencatat architectural change.

============================================================
ARCHITECTURE CHANGE RECORD
============================================================

Buat:

docs/architecture/phase-2/ARCHITECTURE-CHANGE.md

Isi minimal:

CHANGE:

Citizen does not have internal Account.

Citizen authentication uses:

NIK + OTP

Internal accounts are limited to:

ADMIN
PIMPINAN
DEVELOPER

RATIONALE:

- mengurangi account management masyarakat
- menghindari password management citizen
- memanfaatkan Penduduk sebagai master identity
- memisahkan citizen access dari internal authorization
- mengurangi attack surface
- menyederhanakan UX masyarakat

SECURITY NOTE:

NIK alone is not authentication.

============================================================
ERD CONSISTENCY
============================================================

WAJIB melakukan consistency check:

PENDUDUK
│
├── CITIZEN VERIFICATION
│
└── CITIZEN SESSION

ACCOUNT
│
└── ACCOUNT ROLE
│
└── ROLE
│
└── PERMISSION

Pastikan tidak ada:

duplicate identity
duplicate account concept
orphan foreign key
circular dependency yang tidak diperlukan.

============================================================
NO-HARDCODE AUDIT
============================================================

Cari seluruh source code.

Pastikan tidak ada authorization seperti:

if (role === "admin")

if (role === "pimpinan")

if (role === "developer")

yang menjadi security authority.

Role dan permission harus berasal dari database/policy.

Hardcoded route labels/UI text diperbolehkan jika bukan
business configuration.

============================================================
IMPORTANT DISTINCTION
============================================================

DILARANG menyamakan:

IDENTIFICATION
AUTHENTICATION
AUTHORIZATION

Contoh:

NIK
= identification

OTP
= authentication factor

Citizen Session
= authenticated citizen context

Permission
= authorization

============================================================
PHASE 2 DEFINITION OF DONE
============================================================

[ ] Phase 1 tetap PASS
[ ] Account internal selesai
[ ] Role selesai
[ ] Permission selesai
[ ] AccountRole selesai
[ ] RolePermission selesai
[ ] Citizen verification selesai
[ ] OTP challenge selesai
[ ] OTP security selesai
[ ] Citizen session selesai
[ ] Internal authentication selesai
[ ] Citizen authentication selesai
[ ] JWT/session strategy selesai
[ ] Authentication middleware selesai
[ ] Authorization middleware selesai
[ ] Account status enforcement selesai
[ ] Audit authentication selesai
[ ] PII protection selesai
[ ] Rate limiting foundation selesai
[ ] Frontend citizen authentication selesai
[ ] Frontend internal authentication selesai
[ ] Protected route selesai
[ ] Permission-aware navigation selesai
[ ] Prisma migration PASS
[ ] Seed PASS
[ ] API tests PASS
[ ] Security tests PASS
[ ] Playwright PASS
[ ] Typecheck PASS
[ ] Lint PASS
[ ] Backend build PASS
[ ] Frontend build PASS
[ ] Documentation selesai
[ ] ERD consistency PASS
[ ] No-hardcode audit PASS
[ ] Tidak ada business module

============================================================
VALIDATION REPORT
============================================================

Buat:

docs/development/PHASE-2-VALIDATION.md

Format:

PHASE:
2 — IDENTITY + CITIZEN ACCESS + AUTHENTICATION + RBAC

STATUS:
PASS / BLOCKED

IDENTITY MODEL:
PASS / FAIL

CITIZEN ACCESS:
PASS / FAIL

OTP:
PASS / FAIL

CITIZEN SESSION:
PASS / FAIL

INTERNAL ACCOUNT:
PASS / FAIL

ROLE:
PASS / FAIL

PERMISSION:
PASS / FAIL

AUTHENTICATION:
PASS / FAIL

AUTHORIZATION:
PASS / FAIL

JWT/SESSION:
PASS / FAIL

AUDIT:
PASS / FAIL

SECURITY:
PASS / FAIL

PII PROTECTION:
PASS / FAIL

RATE LIMITING:
PASS / FAIL

FRONTEND:
PASS / FAIL

DATABASE:
PASS / FAIL

PRISMA:
PASS / FAIL

API TEST:
PASS / FAIL

E2E:
PASS / FAIL

TYPECHECK:
PASS / FAIL

LINT:
PASS / FAIL

BUILD:
PASS / FAIL

ERD CONSISTENCY:
PASS / FAIL

NO-HARDCODE AUDIT:
PASS / FAIL

ARCHITECTURE CHANGES:
[list]

BLOCKERS:
[list]

============================================================
FINAL RESPONSE
============================================================

Tampilkan:

PHASE:
2 — IDENTITY + CITIZEN ACCESS + AUTHENTICATION + RBAC

STATUS:
PASS / BLOCKED

CITIZEN:
NIK + OTP

INTERNAL ACCOUNT:
ADMIN
PIMPINAN
DEVELOPER

IMPLEMENTED:
[list]

DATABASE:
PASS / FAIL

CITIZEN AUTH:
PASS / FAIL

INTERNAL AUTH:
PASS / FAIL

RBAC:
PASS / FAIL

SECURITY:
PASS / FAIL

AUDIT:
PASS / FAIL

TESTING:
PASS / FAIL

BUILD:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL

ARCHITECTURE CHANGES:
[list]

BLOCKERS:
[list]

VALIDATION:
docs/development/PHASE-2-VALIDATION.md

BUSINESS MODULES:
NONE

============================================================
STOP CONDITION
============================================================

SETELAH PHASE 2 SELESAI:

STOP.

JANGAN MEMULAI PHASE 3.

Jangan membuat Master Data.

Jangan membuat CRUD Penduduk.

Jangan membuat Surat.

Jangan membuat RPJMDes/RKPDes/APBDes.

Tunggu instruksi berikutnya.

============================================================
END PHASE 2 REVISION
============================================================
