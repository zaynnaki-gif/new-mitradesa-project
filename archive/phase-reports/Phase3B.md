============================================================
MITRADESA — PHASE 3B
MASTER DATA — PENDUDUK + KELUARGA
============================================================

## STATUS PROJECT

PHASE 0 = COMPLETE
PHASE 0.5 = COMPLETE
PHASE 1 = COMPLETE
PHASE 2 = COMPLETE
PHASE 3A = COMPLETE

CURRENT:
PHASE 3B — PENDUDUK + KELUARGA

============================================================
MISSION
============================================================

Implementasikan Master Data:

1. Penduduk
2. Keluarga / Kartu Keluarga
3. Hubungan anggota keluarga

dan integrasikan dengan:

- Desa
- CitizenVerification
- CitizenSession
- Authentication
- RBAC
- Audit Engine
- API
- Frontend

Penduduk menjadi MASTER IDENTITY WARGA MITRADESA.

Jangan membuat Citizen sebagai identity baru.

Citizen = Penduduk.

============================================================
MANDATORY ARCHITECTURE READ
============================================================

SEBELUM MENULIS CODE, WAJIB membaca:

docs/architecture/ARCHITECTURE-BASELINE.md
docs/architecture/00-MITRADESA-CONSTITUTION.md
docs/architecture/02-DOMAIN-MAP.md
docs/architecture/03-DATABASE-BLUEPRINT.md
docs/architecture/04-MASTER-ERD.md
docs/architecture/05-API-BLUEPRINT.md
docs/architecture/06-RBAC-BLUEPRINT.md
docs/architecture/11-AUDIT-ENGINE.md
docs/architecture/12-NO-HARDCODE-POLICY.md
docs/architecture/13-SECURITY-ARCHITECTURE.md
docs/architecture/14-TESTING-ARCHITECTURE.md

WAJIB membaca:

docs/development/PHASE-2-VALIDATION.md
docs/development/PHASE-3A-VALIDATION.md

WAJIB membaca:

apps/api/prisma/schema.prisma

dan seluruh migration existing.

============================================================
CRITICAL RULE — EXISTING SCHEMA FIRST
============================================================

JANGAN langsung membuat model Penduduk.

Pertama:

1. Inspect Prisma schema.
2. Inspect CitizenVerification.
3. Inspect CitizenSession.
4. Inspect Desa.
5. Inspect IdentitasDesa.
6. Inspect Account.
7. Inspect Role.
8. Inspect Permission.
9. Inspect AuditLog.
10. Inspect existing migrations.
11. Inspect existing API contracts.
12. Inspect existing tests.

Tujuannya memastikan tidak ada duplicate identity
atau broken foreign key.

Jika terdapat conflict:

STOP.

Jangan memilih solusi sendiri.

Laporkan:

CONFLICT
CURRENT STRUCTURE
EXPECTED STRUCTURE
IMPACT
PROPOSED SOLUTION

============================================================
STRICT OUT OF SCOPE
============================================================

JANGAN membuat:

❌ PerangkatDesa
❌ JabatanPerangkat
❌ Surat
❌ JenisSurat
❌ TemplateSurat
❌ DNA Field
❌ Workflow Surat
❌ QR TTE
❌ WhatsApp
❌ RPJMDes
❌ RKPDes
❌ APBDes
❌ Voting
❌ BUMDes
❌ PBB
❌ Tourism
❌ Economic module
❌ Dashboard business

Phase 3B hanya:

PENDUDUK
KELUARGA
HUBUNGAN KELUARGA
CITIZEN ACCESS INTEGRATION

============================================================
CORE IDENTITY PRINCIPLE
============================================================

MITRADESA tidak memiliki tabel:

Citizen

sebagai identity warga.

MASTER:

Penduduk

CitizenVerification dan CitizenSession harus
mereferensikan Penduduk.

Concept:

Penduduk
│
├── CitizenVerification
│
└── CitizenSession

JANGAN membuat:

Citizen
│
└── Penduduk

karena akan membuat duplicate identity.

============================================================
PENDUDUK — CORE
============================================================

Model Penduduk harus merepresentasikan satu warga.

Primary key:

BIGINT AUTO_INCREMENT

sesuai Architecture Baseline.

NIK:

- wajib
- unique
- tidak boleh duplicate
- diperlakukan sebagai identifier sensitif
- tidak boleh diekspos sembarangan dalam API

JANGAN menggunakan NIK sebagai database primary key.

Gunakan:

penduduk.id

sebagai internal PK.

============================================================
PENDUDUK — DATA
============================================================

Gunakan DATABASE BLUEPRINT sebagai authority.

JANGAN mengarang field.

Jika blueprint belum menentukan field tertentu,
jangan langsung menambahkannya tanpa analisis.

Field penduduk harus dipisahkan secara konseptual:

IDENTITAS

- id
- NIK
- nama lengkap

KELAHIRAN

- tempat lahir
- tanggal lahir

JENIS KELAMIN

- reference/value sesuai architecture

AGAMA

- reference/value sesuai architecture

STATUS PERKAWINAN

- reference/value sesuai architecture

PENDIDIKAN

- reference/value sesuai architecture

PEKERJAAN

- reference/value sesuai architecture

KEWARGANEGARAAN

- reference/value sesuai architecture

DATA ADMINISTRATIF

- nomor KK / family relation
- status penduduk
- status domisili
- desa

CATATAN:

Jangan membuat semua field menjadi free-text jika
master/reference table diperlukan.

Namun jangan membuat master table baru tanpa
memeriksa DATABASE BLUEPRINT.

============================================================
NIK SECURITY
============================================================

NIK adalah PII.

API response harus menerapkan PII protection.

Jangan selalu mengembalikan NIK lengkap pada:

- list endpoint
- dashboard
- search result
- public endpoint
- audit metadata

Jika kebutuhan administratif memerlukan NIK penuh,
pastikan endpoint membutuhkan authorization yang sesuai.

Public API:

JANGAN mengembalikan:

NIK lengkap
tanggal lahir lengkap
data keluarga
alamat sensitif
data pribadi lainnya

kecuali architecture/security policy secara eksplisit
mengizinkan.

============================================================
NIK VALIDATION
============================================================

Backend WAJIB memvalidasi:

- exactly 16 digit
- numeric
- unique
- tidak null
- tidak duplicate

Frontend validation tidak cukup.

Database harus tetap memiliki UNIQUE constraint.

============================================================
DESA RELATION
============================================================

Penduduk harus terhubung dengan Desa.

Concept:

Desa
│
└── Penduduk

Gunakan:

desa_id

sebagai foreign key.

JANGAN menyimpan:

nama_desa

sebagai source of truth.

Nama desa diambil dari relation.

============================================================
PENDUDUK + WILAYAH
============================================================

Hierarchy:

Provinsi
↓
Kabupaten
↓
Kecamatan
↓
Desa
↓
Penduduk

Jangan duplicate hierarchy di Penduduk.

Penduduk hanya membutuhkan relation ke Desa
jika itu sesuai blueprint.

Wilayah induk diperoleh melalui relation.

============================================================
KELUARGA / KK
============================================================

Buat model keluarga sesuai DATABASE BLUEPRINT.

Kartu Keluarga harus memiliki internal:

BIGINT PK

dan identifier KK sesuai aturan database.

Nomor KK:

- unique
- sensitive
- protected from public exposure

Jangan menggunakan nomor KK sebagai PK.

============================================================
RELATION PENDUDUK ↔ KELUARGA
============================================================

Jangan menyimpan hubungan keluarga sebagai:

anggota1
anggota2
anggota3

atau kolom fixed.

Gunakan relational model.

Concept:

Keluarga
│
├── AnggotaKeluarga
│ │
│ └── Penduduk
│
└── AnggotaKeluarga
│
└── Penduduk

Dengan demikian satu keluarga dapat memiliki
jumlah anggota dinamis.

============================================================
ANGGOTA KELUARGA
============================================================

Gunakan associative model antara:

Keluarga
dan
Penduduk.

Minimal konsep:

Keluarga
↓
AnggotaKeluarga
↓
Penduduk

AnggotaKeluarga harus dapat menyimpan atribut
relationship yang memang dibutuhkan.

Contoh konseptual:

- kepala keluarga
- suami
- istri
- anak
- orang tua
- anggota keluarga lainnya

JANGAN hardcode relationship sebagai boolean:

is_kepala
is_suami
is_istri
is_anak

jika architecture menentukan master relationship.

Gunakan reference/master relationship sesuai blueprint.

============================================================
KEPALA KELUARGA
============================================================

Sistem harus dapat mengetahui siapa kepala keluarga.

Jangan membuat duplicate citizen record.

Kepala keluarga tetap:

Penduduk

yang terhubung melalui:

AnggotaKeluarga.

Database harus mencegah satu keluarga memiliki
lebih dari satu kepala keluarga jika aturan tersebut
ditetapkan oleh model.

Gunakan constraint/service validation yang tepat.

============================================================
PENDUDUK TANPA KK
============================================================

Jangan memaksa Penduduk harus selalu memiliki KK
jika architecture/data policy memungkinkan warga
belum terdaftar dalam KK lokal.

Pastikan model dapat menangani kondisi:

Penduduk
│
└── belum memiliki relasi keluarga

tanpa membuat dummy KK.

Jika DATABASE BLUEPRINT menentukan wajib KK,
ikuti blueprint.

============================================================
STATUS PENDUDUK
============================================================

Status penduduk harus database/configuration-driven
jika architecture memerlukan master.

Jangan membuat business logic seperti:

if status === "AKTIF"

tanpa mengikuti enum/master yang sudah ditetapkan.

Contoh status yang mungkin:

ACTIVE
INACTIVE
DECEASED
MOVED
UNKNOWN

Tetapi JANGAN langsung membuat daftar tersebut
jika blueprint belum menetapkannya.

Database Blueprint adalah authority.

============================================================
DOMISILI
============================================================

Bedakan:

identity
dan
domicile/status.

Jangan menganggap:

penduduk desa = selalu berdomisili aktif di desa.

Jika architecture membutuhkan status domisili,
implementasikan secara relational/config-driven.

============================================================
CITIZEN VERIFICATION INTEGRATION
============================================================

Phase 2 memiliki:

CitizenVerification

Sekarang harus memiliki relation:

CitizenVerification
│
▼
Penduduk

Pastikan tidak ada lagi identity reference
yang menggunakan entity Citizen yang berbeda.

============================================================
CITIZEN SESSION INTEGRATION
============================================================

CitizenSession harus dapat mengetahui:

penduduk_id

sehingga setelah NIK + OTP berhasil:

Citizen
→ authenticated identity
→ Penduduk

CitizenSession tidak boleh hanya menyimpan
NIK sebagai string tanpa relation jika schema
architecture memungkinkan foreign key.

============================================================
CITIZEN OTP FLOW
============================================================

JANGAN mengubah mekanisme OTP Phase 2
kecuali diperlukan untuk integrasi Penduduk.

Expected flow:

NIK
↓
lookup Penduduk
↓
verification
↓
OTP
↓
CitizenVerification
↓
CitizenSession
↓
Penduduk authenticated

Jika NIK tidak ditemukan:

jangan membuat Penduduk otomatis.

Return appropriate error.

Jangan auto-create citizen identity
dari OTP.

============================================================
CITIZEN PRIVACY
============================================================

Citizen hanya boleh memperoleh data miliknya
sendiri sesuai authorization policy.

Citizen A:

TIDAK boleh melihat data Penduduk B.

Citizen tidak boleh:

- melihat seluruh warga
- search NIK warga lain
- melihat KK warga lain
- melihat daftar keluarga warga lain

kecuali endpoint memiliki business authorization
yang eksplisit pada fase berikutnya.

============================================================
ADMIN ACCESS
============================================================

Admin dapat mengelola Penduduk/Keluarga sesuai
permission.

Namun:

Jangan menggunakan role string sebagai satu-satunya
security authority.

Gunakan:

permission-based authorization.

============================================================
PIMPINAN ACCESS
============================================================

Pimpinan:

read/write hanya jika permission diberikan.

Jangan otomatis memberikan seluruh CRUD.

============================================================
DEVELOPER ACCESS
============================================================

Developer memiliki akses sesuai permission model
yang sudah dibuat Phase 2.

Jangan membuat bypass:

if role === DEVELOPER

di seluruh controller.

============================================================
ACCOUNT RELATION
============================================================

Phase 3B TIDAK membuat hubungan:

Account ↔ Penduduk

kecuali hubungan tersebut memang diperlukan
oleh Architecture Baseline.

Account adalah identity internal.

Penduduk adalah citizen identity.

Jangan menggabungkan keduanya.

Perangkat Desa akan menjadi bridge pada Phase 3C/3D.

============================================================
DATABASE CONSTRAINTS
============================================================

WAJIB:

Penduduk.id
BIGINT PK

Penduduk.nik
UNIQUE

Penduduk.desa_id
FK → Desa.id

Keluarga.id
BIGINT PK

Keluarga.nomor_kk
UNIQUE

AnggotaKeluarga.id
BIGINT PK

AnggotaKeluarga.keluarga_id
FK → Keluarga.id

AnggotaKeluarga.penduduk_id
FK → Penduduk.id

CitizenVerification.penduduk_id
FK → Penduduk.id

CitizenSession.penduduk_id
FK → Penduduk.id

NAMUN:

JANGAN mengubah nama field jika schema Phase 2
sudah menggunakan naming convention berbeda.

Pertahankan consistency.

============================================================
RELATIONAL INTEGRITY
============================================================

Pastikan:

Tidak ada AnggotaKeluarga tanpa Penduduk.

Tidak ada AnggotaKeluarga tanpa Keluarga.

Tidak ada CitizenSession tanpa Penduduk.

Tidak ada CitizenVerification tanpa Penduduk.

Tidak ada Penduduk tanpa Desa jika blueprint
menentukan desa wajib.

Tidak ada duplicate NIK.

Tidak ada duplicate KK.

============================================================
DELETE POLICY
============================================================

JANGAN hard delete Penduduk yang sudah memiliki:

CitizenVerification
CitizenSession
AnggotaKeluarga
data historis lainnya.

Gunakan policy sesuai architecture:

soft delete
status
restrict

Jangan menggunakan cascade delete sembarangan.

============================================================
HISTORICAL DATA
============================================================

Penduduk adalah master identity.

Perubahan status warga jangan menyebabkan
historical record hilang.

Jika Penduduk pindah atau meninggal:

jangan delete identity.

Gunakan status/history mechanism sesuai blueprint.

Jika blueprint belum menentukan historical mechanism:

dokumentasikan sebagai architecture gap.

Jangan mengarang sistem history besar pada phase ini.

============================================================
API
============================================================

Buat REST API sesuai API Blueprint.

Capability minimal:

GET /penduduk
GET /penduduk/:id
POST /penduduk
PUT/PATCH /penduduk/:id

GET /keluarga
GET /keluarga/:id
POST /keluarga
PUT/PATCH /keluarga/:id

GET anggota keluarga
POST anggota keluarga
UPDATE anggota keluarga
REMOVE anggota keluarga

Endpoint final HARUS mengikuti convention existing.

Jangan membuat duplicate router.

============================================================
API LIST PENDUDUK
============================================================

List harus mendukung:

pagination
filter
search

Tetapi search harus mengikuti authorization.

Search berdasarkan:

nama
NIK

NIK search harus restricted.

Jangan mengembalikan seluruh PII pada list.

Response gunakan DTO.

Jangan return Prisma object mentah.

============================================================
API KELUARGA
============================================================

List keluarga harus mendukung:

pagination
search nomor KK restricted
filter desa

Jangan expose nomor KK lengkap
kepada public.

============================================================
API ANGGOTA KELUARGA
============================================================

API harus dapat:

menampilkan anggota keluarga
menambahkan anggota
mengubah hubungan
menghapus hubungan

Tetapi operasi harus menjaga:

satu penduduk tidak memiliki duplicate
membership yang tidak valid.

============================================================
TRANSACTION
============================================================

Operasi yang mengubah beberapa entity sekaligus
harus menggunakan database transaction.

Contoh:

create keluarga

- create anggota

atau:

ubah kepala keluarga.

Jangan meninggalkan partial state.

============================================================
VALIDATION
============================================================

Gunakan validation layer existing.

Minimal:

NIK:

- 16 digit
- numeric
- unique

KK:

- sesuai format yang ditentukan architecture

Nama:

- required
- length validation

Tanggal:

- valid date
- tidak boleh impossible

Email:

- valid jika ada

Foreign key:

- harus existing

Relationship:

- harus valid

============================================================
FRONTEND
============================================================

Buat administrative pages sesuai architecture.

Minimal:

/admin/master/penduduk

/admin/master/penduduk/:id

/admin/master/keluarga

/admin/master/keluarga/:id

Route final mengikuti convention existing.

============================================================
PENDUDUK UI
============================================================

List:

- nama
- masked NIK
- desa
- status
- actions

Detail:

- identitas
- data kelahiran
- data administratif
- keluarga
- status

Jangan menampilkan seluruh PII tanpa authorization.

============================================================
KELUARGA UI
============================================================

Detail keluarga:

- nomor KK masked sesuai policy
- kepala keluarga
- daftar anggota
- hubungan anggota
- status

Jangan membuat fixed:

Anggota 1
Anggota 2
Anggota 3
...

Gunakan dynamic relational list.

============================================================
NO HARDCODE
============================================================

DILARANG hardcode:

status penduduk
jenis kelamin
agama
status perkawinan
pendidikan
pekerjaan
hubungan keluarga

jika architecture menentukan data tersebut
berasal dari master/reference.

Jangan membuat:

const statuses = [...]

sebagai business source of truth.

============================================================
MASTER DATA GAP RULE
============================================================

Jika field membutuhkan master:

contoh:

agama
pendidikan
pekerjaan
hubungan keluarga

dan master tersebut belum tersedia:

JANGAN membuat array hardcoded.

JANGAN membuat random table tanpa architecture review.

STOP pada bagian tersebut dan dokumentasikan:

MASTER DATA GAP

dengan:

field
required reference
current architecture
proposed model
impact

Namun lanjutkan bagian Phase 3B yang tidak terblokir
jika aman.

============================================================
AUDIT
============================================================

Audit minimal:

PENDUDUK_CREATED
PENDUDUK_UPDATED
PENDUDUK_STATUS_CHANGED

KELUARGA_CREATED
KELUARGA_UPDATED

ANGGOTA_KELUARGA_ADDED
ANGGOTA_KELUARGA_UPDATED
ANGGOTA_KELUARGA_REMOVED

CITIZEN_IDENTITY_LINKED

Audit metadata:

actor
action
entity
entity_id
timestamp

Jangan menyimpan OTP.

Jangan menyimpan password.

Jangan menyimpan secret.

Jangan menulis NIK/KK lengkap ke audit metadata
kecuali architecture secara eksplisit mewajibkan.

============================================================
ERD
============================================================

Update:

docs/architecture/04-MASTER-ERD.md

Tambahkan:

Penduduk
Keluarga
AnggotaKeluarga

Update relations:

Desa
↓
Penduduk
↓
AnggotaKeluarga
↓
Keluarga

dan:

Penduduk
↓
CitizenVerification

Penduduk
↓
CitizenSession

Jangan merusak relations Phase 2/3A.

============================================================
TARGET ERD
============================================================

Conceptual target:

Provinsi
│
└── Kabupaten
│
└── Kecamatan
│
└── Desa
│
├── IdentitasDesa
│
└── Penduduk
│
├── CitizenVerification
│
├── CitizenSession
│
└── AnggotaKeluarga
│
└── Keluarga

IMPORTANT:

Implementasikan sesuai Prisma schema actual.

Jangan membuat relationship yang tidak diperlukan.

============================================================
API SECURITY FLOW
============================================================

Semua administrative write:

authenticate
↓
authorize(permission)
↓
validate
↓
service
↓
transaction
↓
database
↓
audit

Citizen:

authenticate NIK + OTP
↓
CitizenSession
↓
resolve Penduduk
↓
authorization
↓
OWN DATA ONLY

============================================================
TESTING — DATABASE
============================================================

WAJIB test:

1. create Penduduk
2. duplicate NIK
3. invalid Desa
4. create Keluarga
5. duplicate KK
6. add anggota
7. invalid Penduduk
8. invalid Keluarga
9. duplicate membership
10. kepala keluarga constraint
11. transaction rollback
12. delete restriction
13. status update

============================================================
TESTING — CITIZEN
============================================================

WAJIB:

1. NIK existing
2. NIK non-existing
3. OTP success
4. OTP failure
5. CitizenSession linked to Penduduk
6. Citizen sees own identity
7. Citizen cannot see other citizen
8. Citizen cannot list all Penduduk
9. Citizen cannot modify master Penduduk
10. Citizen cannot access admin endpoint

============================================================
TESTING — RBAC
============================================================

Test:

ADMIN
PIMPINAN
DEVELOPER

untuk:

read
create
update
delete

sesuai permission.

Jangan menganggap role otomatis memiliki semua
permission.

============================================================
TESTING — API
============================================================

Test:

- pagination
- filtering
- validation
- authorization
- PII masking
- 404
- 409 duplicate
- 403 forbidden
- 401 unauthorized

============================================================
TESTING — E2E
============================================================

Playwright:

ADMIN:

login
→ master penduduk
→ create
→ save
→ search
→ detail
→ edit
→ save

KELUARGA:

create keluarga
→ add anggota
→ set kepala keluarga
→ save
→ reload
→ verify

CITIZEN:

NIK
→ OTP
→ citizen session
→ dashboard/profile
→ own data

CITIZEN NEGATIVE:

attempt admin page
→ blocked

attempt other citizen data
→ blocked

============================================================
PHASE 2 REGRESSION
============================================================

JALANKAN seluruh Phase 2 tests.

Pastikan:

Admin login PASS
Pimpinan login PASS
Developer login PASS

Citizen NIK + OTP PASS

JWT/session PASS

RBAC PASS

Permission PASS

Audit PASS

Rate limiting PASS

Security headers PASS

============================================================
PHASE 3A REGRESSION
============================================================

JALANKAN seluruh Phase 3A tests.

Pastikan:

Provinsi PASS
Kabupaten PASS
Kecamatan PASS
Desa PASS
IdentitasDesa PASS

Wilayah relations PASS.

Tidak ada perubahan behavior
yang tidak terdokumentasi.

============================================================
NO-HARDCODE AUDIT
============================================================

Search seluruh source code:

"Seruni Mumbul"
"Pringgabaya"
"Lombok Timur"
"Nusa Tenggara Barat"

dan hardcoded:

status
agama
pendidikan
pekerjaan
hubungan keluarga
jenis kelamin
status perkawinan

Jika ditemukan:

1. production business logic:
   REMOVE / DATABASE-DRIVEN

2. test fixture:
   ALLOW + DOCUMENT

3. documentation:
   ALLOW

============================================================
DOCUMENTATION
============================================================

Buat:

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
VALIDATION REPORT
============================================================

Format:

PHASE:
3B — PENDUDUK + KELUARGA

STATUS:
PASS / BLOCKED

DATABASE:
PASS / FAIL

PRISMA:
PASS / FAIL

MIGRATION:
PASS / FAIL

ERD:
PASS / FAIL

PENDUDUK:
PASS / FAIL

KELUARGA:
PASS / FAIL

ANGGOTA_KELUARGA:
PASS / FAIL

CITIZEN INTEGRATION:
PASS / FAIL

API:
PASS / FAIL

RBAC:
PASS / FAIL

AUDIT:
PASS / FAIL

PII SECURITY:
PASS / FAIL

FRONTEND:
PASS / FAIL

UNIT/API TEST:
PASS / FAIL

E2E:
PASS / FAIL

TYPECHECK:
PASS / FAIL

LINT:
PASS / FAIL

BUILD:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

PHASE 3A REGRESSION:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

MASTER DATA GAP:
NONE / [list]

ARCHITECTURE CONFLICT:
NONE / [list]

BLOCKERS:
[list]

FILES CREATED:
[list]

FILES MODIFIED:
[list]

DATABASE MODELS:
[list]

API ENDPOINTS:
[list]

============================================================
DEFINITION OF DONE
============================================================

Phase 3B hanya PASS jika:

[ ] Penduduk implemented
[ ] NIK unique
[ ] NIK validation
[ ] Desa relation valid
[ ] Keluarga implemented
[ ] KK unique
[ ] AnggotaKeluarga implemented
[ ] Family relationship valid
[ ] Kepala keluarga constraint valid
[ ] CitizenVerification linked
[ ] CitizenSession linked
[ ] Citizen ownership enforced
[ ] PII protection implemented
[ ] API implemented
[ ] RBAC implemented
[ ] Audit implemented
[ ] Prisma migration PASS
[ ] Prisma generate PASS
[ ] Database constraints PASS
[ ] Transaction handling PASS
[ ] Frontend PASS
[ ] Jest/API tests PASS
[ ] Playwright PASS
[ ] Phase 2 regression PASS
[ ] Phase 3A regression PASS
[ ] TypeScript PASS
[ ] Lint PASS
[ ] Build PASS
[ ] ERD updated
[ ] Documentation updated
[ ] No-hardcode audit PASS
[ ] No duplicate Citizen identity
[ ] No PerangkatDesa created
[ ] No Surat module created
[ ] No business domain created

============================================================
ARCHITECTURE CHANGE RULE
============================================================

Jika implementasi membutuhkan perubahan terhadap:

Architecture Baseline
Master ERD
Authentication
CitizenVerification
CitizenSession
RBAC
API contract
Database decision

JANGAN mengubah secara diam-diam.

STOP.

Dokumentasikan:

CONFLICT
CURRENT
EXPECTED
IMPACT
PROPOSED CHANGE

dan laporkan.

============================================================
FINAL REPORT
============================================================

Setelah selesai tampilkan:

PHASE:
3B — PENDUDUK + KELUARGA

STATUS:
PASS / BLOCKED

IMPLEMENTED:
[list]

DATABASE:
PASS / FAIL

ERD:
PASS / FAIL

CITIZEN:
PASS / FAIL

API:
PASS / FAIL

RBAC:
PASS / FAIL

AUDIT:
PASS / FAIL

PII:
PASS / FAIL

TESTING:
PASS / FAIL

E2E:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

PHASE 3A REGRESSION:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

BUILD:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL

MASTER DATA GAP:
NONE / [list]

ARCHITECTURE CHANGE:
NONE / [list]

BLOCKERS:
[list]

VALIDATION:
docs/development/PHASE-3B-VALIDATION.md

============================================================
STOP CONDITION
============================================================

SETELAH PHASE 3B PASS:

STOP.

JANGAN MEMULAI PHASE 3C.

JANGAN membuat:

Perangkat Desa
Jabatan Perangkat
Account ↔ Perangkat
Surat
Template
Workflow
RPJMDes
RKPDes
APBDes
Voting
BUMDes
PBB

Tunggu instruksi berikutnya.

============================================================
END PHASE 3B
============================================================
