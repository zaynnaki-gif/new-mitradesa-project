============================================================
MITRADESA
PHASE 3B — STEP 4
KELUARGA & ANGGOTA KELUARGA DOMAIN
EXECUTION CONTRACT
============================================================

# STATUS PROJECT SAAT INI

PHASE 0
GREENFIELD ARCHITECTURE
STATUS: COMPLETE

PHASE 0.5
ARCHITECTURE REVIEW & DECISION FREEZE
STATUS: COMPLETE

PHASE 1
PROJECT FOUNDATION
STATUS: COMPLETE

PHASE 2
IDENTITY + AUTHENTICATION + RBAC
STATUS: COMPLETE

PHASE 3A
MASTER DATA FOUNDATION
STATUS: COMPLETE

PHASE 3B — STEP 1
SYSTEM AUDIT
STATUS: PASS

PHASE 3B — STEP 2
DATABASE DESIGN
STATUS: COMPLETE

PHASE 3B — STEP 3
PENDUDUK API
STATUS: PASS

============================================================
CURRENT TASK
============================================================

IMPLEMENT:

PHASE 3B — STEP 4

KELUARGA & ANGGOTA KELUARGA DOMAIN

Scope utama:

1. Keluarga
2. AnggotaKeluarga
3. Relasi Penduduk ↔ Keluarga
4. Kepala Keluarga
5. Business integrity rules
6. API
7. Service layer
8. Validation
9. Authorization
10. Audit
11. PII protection
12. Transaction integrity
13. Testing
14. Regression
15. Documentation

============================================================
ABSOLUTE RULE
============================================================

JANGAN mengubah Architecture Baseline.

JANGAN membuat architecture baru.

JANGAN membuat model Citizen baru.

JANGAN membuat model Desa/Village baru.

JANGAN membuat duplicate Penduduk.

JANGAN menggunakan NIK sebagai foreign key.

JANGAN menggunakan nomor KK sebagai primary key.

JANGAN hardcode master data.

JANGAN melanjutkan ke Step 5 setelah Step 4 selesai.

============================================================
MANDATORY DOCUMENT REVIEW
============================================================

SEBELUM MENULIS ATAU MENGUBAH SOURCE CODE:

WAJIB membaca:

docs/architecture/00-MITRADESA-CONSTITUTION.md
docs/architecture/ARCHITECTURE-BASELINE.md
docs/architecture/03-DATABASE-BLUEPRINT.md
docs/architecture/04-MASTER-ERD.md
docs/architecture/05-API-BLUEPRINT.md
docs/architecture/06-RBAC-BLUEPRINT.md
docs/architecture/07-WORKFLOW-ENGINE.md
docs/architecture/11-AUDIT-ENGINE.md
docs/architecture/12-NO-HARDCODE-POLICY.md
docs/architecture/13-SECURITY-ARCHITECTURE.md
docs/architecture/14-TESTING-ARCHITECTURE.md
docs/architecture/16-DEFINITION-OF-DONE.md

WAJIB membaca hasil Phase 3B sebelumnya:

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

docs/development/PHASE-3B-STEP-2-DATABASE-VALIDATION.md

docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md

WAJIB membaca:

apps/api/prisma/schema.prisma

serta:

existing routes
existing services
existing middleware
existing validators
existing DTO
existing audit implementation
existing tests

============================================================
FIRST ACTION — SYSTEM AUDIT
============================================================

SEBELUM IMPLEMENTASI:

audit terlebih dahulu kondisi aktual:

1. Prisma schema
2. migration
3. database relation
4. Penduduk model
5. Keluarga model
6. AnggotaKeluarga model
7. RBAC
8. audit system
9. existing Penduduk API
10. existing test architecture

JANGAN berasumsi schema aktual sama dengan dokumentasi.

Jika dokumentasi dan schema berbeda:

JANGAN langsung memilih salah satu.

Laporkan:

ARCHITECTURE CONFLICT

dan STOP jika konflik tersebut memengaruhi
integritas relasi.

============================================================
CORE DOMAIN MODEL
============================================================

Model utama:

Penduduk
Keluarga
AnggotaKeluarga

Relasi utama:

Desa
│
└── Penduduk
│
├── Keluarga
│
└── AnggotaKeluarga

Konsep:

Keluarga adalah entity rumah tangga/KK.

Penduduk adalah master citizen.

AnggotaKeluarga adalah relational entity
yang menghubungkan Penduduk dengan Keluarga.

============================================================
PENDUDUK
============================================================

Penduduk.id:

BIGINT
PRIMARY KEY

Penduduk.nik:

STRING / VARCHAR(16)
UNIQUE

PENTING:

NIK adalah business identifier.

Penduduk.id adalah internal relational identifier.

SELURUH foreign key internal:

WAJIB menggunakan:

Penduduk.id

DILARANG menggunakan:

Penduduk.nik

sebagai foreign key.

============================================================
KELUARGA
============================================================

Keluarga adalah entity keluarga/KK.

Minimal konsep:

id
BIGINT
PRIMARY KEY

nomorKK
STRING
UNIQUE

desaId
FK → Desa.id

kepalaId
FK → Penduduk.id

createdAt
updatedAt

soft-delete fields
sesuai schema existing.

JANGAN membuat field tambahan
jika tidak didukung Architecture Blueprint.

JANGAN mengubah:

nomorKK

menjadi primary key.

============================================================
NOMOR KK
============================================================

Nomor KK:

business identifier.

Harus:

- string
- valid
- unique
- tidak digunakan sebagai FK internal
- tidak digunakan sebagai PK

Duplicate nomor KK:

HTTP 409 Conflict.

JANGAN return:

500.

============================================================
KEPALA KELUARGA
============================================================

Kepala keluarga harus direpresentasikan
menggunakan:

kepalaId → Penduduk.id

JANGAN:

nikKepala → Penduduk.nik

JANGAN menyimpan:

kepalaNIK

sebagai relational field tambahan
jika tidak dibutuhkan architecture.

============================================================
VALIDASI KEPALA KELUARGA
============================================================

Saat membuat atau mengubah Keluarga:

kepalaId harus:

1. valid BIGINT
2. Penduduk exists
3. Penduduk aktif
4. sesuai Desa keluarga jika business rule
   architecture mensyaratkannya

Jika tidak valid:

jangan membuat Keluarga.

Gunakan transaction bila terdapat
multiple database operations.

============================================================
ANGGOTA KELUARGA
============================================================

AnggotaKeluarga adalah relational entity.

JANGAN menggunakan fixed columns:

suamiId
istriId
anak1Id
anak2Id
anak3Id

DILARANG.

Gunakan relational rows.

Contoh:

Keluarga
│
├── AnggotaKeluarga
│ └── Penduduk A
│
├── AnggotaKeluarga
│ └── Penduduk B
│
└── AnggotaKeluarga
└── Penduduk C

============================================================
RELATION
============================================================

Konsep:

AnggotaKeluarga.keluargaId
→ Keluarga.id

AnggotaKeluarga.pendudukId
→ Penduduk.id

Keduanya:

BIGINT FK.

JANGAN menggunakan:

NIK
Nomor KK

sebagai FK.

============================================================
HUBUNGAN KELUARGA
============================================================

Contoh hubungan:

KEPALA_KELUARGA
SUAMI
ISTRI
ANAK
ORANG_TUA
MERTUA
CUCU
FAMILI_LAIN
LAINNYA

TETAPI:

JANGAN hardcode daftar tersebut
ke dalam API/frontend.

Jika master hubungan keluarga
belum tersedia:

audit Architecture Blueprint dan schema.

Jika memang diperlukan sebagai master:

gunakan tabel master database.

JANGAN menggunakan hardcoded array
di source code.

============================================================
MASTER DATA
============================================================

Tidak boleh hardcode:

agama
pendidikan
pekerjaan
status hubungan keluarga
status keluarga
status perkawinan
dan master data lainnya.

Jika entity master sudah tersedia:

gunakan relation.

Jika belum tersedia:

JANGAN membuat enum hardcode.

Laporkan sebagai dependency
atau architecture gap.

============================================================
INTEGRITY RULE
============================================================

WAJIB memastikan:

Penduduk yang menjadi anggota
harus benar-benar ada.

Keluarga yang menjadi target
harus benar-benar ada.

Penduduk yang dihapus/soft deleted
tidak boleh digunakan sebagai anggota baru
jika business rule melarangnya.

============================================================
ACTIVE MEMBERSHIP
============================================================

Seorang Penduduk dapat memiliki histori
keanggotaan keluarga.

Karena itu:

JANGAN menghapus historical membership
secara fisik.

Gunakan:

soft delete / inactive / valid-to
sesuai schema dan Architecture Blueprint.

JANGAN menciptakan mekanisme baru
tanpa dasar architecture.

============================================================
DUPLICATE MEMBERSHIP
============================================================

WAJIB mencegah duplicate active membership.

Contoh:

Keluarga A

- Penduduk X

tidak boleh memiliki dua
AnggotaKeluarga aktif yang identik.

Gunakan:

database constraint

dan/atau

service validation

sesuai schema.

Jika constraint database diperlukan:

gunakan migration.

============================================================
KEPALA KELUARGA
============================================================

WAJIB menjaga konsistensi:

kepalaId

dan

AnggotaKeluarga.

Jika architecture menetapkan
Kepala Keluarga juga harus tercatat
sebagai AnggotaKeluarga:

pastikan keduanya atomic.

Artinya:

Keluarga dibuat

- Anggota Kepala dibuat

dalam satu transaction.

Jangan sampai:

Keluarga berhasil dibuat

tetapi:

anggota kepala gagal dibuat.

============================================================
TRANSACTION
============================================================

WAJIB menggunakan Prisma transaction
untuk operasi yang mengubah beberapa entity.

Contoh:

CREATE KELUARGA:

1. create Keluarga
2. create AnggotaKeluarga kepala
3. audit

harus atomic apabila architecture
menentukan ketiganya satu unit bisnis.

Jika salah satu gagal:

ROLLBACK.

============================================================
UPDATE KELUARGA
============================================================

PATCH Keluarga harus mendukung
partial update sesuai API convention.

Jika mengubah:

nomorKK

validasi uniqueness.

Jika mengubah:

kepalaId

validasi Penduduk.

Jika perubahan kepala keluarga
membutuhkan perubahan AnggotaKeluarga:

WAJIB transaction.

============================================================
PERGANTIAN KEPALA KELUARGA
============================================================

Jangan sekadar:

UPDATE kepalaId.

Jika business rule membutuhkan
sinkronisasi anggota:

lakukan transaction:

1. validasi kepala baru
2. update kepalaId
3. update relation anggota
4. audit

Jika business rule belum didefinisikan:

JANGAN mengarang.

Laporkan sebagai:

BUSINESS RULE REQUIRES CONFIRMATION

============================================================
API DOMAIN
============================================================

Gunakan API convention existing.

Jika API Blueprint menetapkan:

/api/keluarga

gunakan itu.

JANGAN membuat:

/api/kk

kecuali Blueprint menetapkannya.

============================================================
MINIMUM KELUARGA API
============================================================

Implementasikan sesuai API Blueprint:

GET
/api/keluarga

GET
/api/keluarga/:id

POST
/api/keluarga

PATCH
/api/keluarga/:id

DELETE
/api/keluarga/:id

Jika endpoint berbeda ditentukan
Architecture Blueprint:

ikuti Blueprint.

============================================================
ANGGOTA API
============================================================

Gunakan nested resource jika sesuai
API Blueprint.

Konsep:

GET
/api/keluarga/:id/anggota

POST
/api/keluarga/:id/anggota

PATCH
/api/keluarga/:id/anggota/:anggotaId

DELETE
/api/keluarga/:id/anggota/:anggotaId

JANGAN membuat duplicate route
jika architecture sudah menentukan format.

============================================================
PAGINATION
============================================================

GET list keluarga:

WAJIB pagination.

GET anggota:

gunakan pagination jika jumlah data
dapat berkembang signifikan.

Jangan query seluruh database
tanpa limit.

Gunakan default dan maximum limit
yang sama dengan API convention.

============================================================
SEARCH KELUARGA
============================================================

Search harus mengikuti architecture.

Kemungkinan:

nomorKK
kepala keluarga
wilayah

Tetapi:

JANGAN expose full NIK secara public.

JANGAN menambahkan filter
yang tidak didukung schema.

============================================================
PII PROTECTION
============================================================

Data keluarga mengandung PII.

WAJIB menggunakan DTO.

JANGAN:

return raw Prisma object.

JANGAN expose:

password
OTP
session
JWT
secret
database credentials.

NIK full:

hanya boleh tampil jika permission
mengizinkan.

Jika tidak:

gunakan PII masking utility existing.

JANGAN membuat masking utility kedua.

Gunakan:

src/utils/pii.ts

jika memang itu implementation existing.

============================================================
NOMOR KK PRIVACY
============================================================

Nomor KK juga merupakan data sensitif.

Jangan tampilkan pada public endpoint
tanpa authorization.

Gunakan DTO/policy existing.

============================================================
RBAC
============================================================

Gunakan:

authenticate middleware

- authorize/permission middleware.

JANGAN:

if role === "ADMIN"

sebagai authorization utama.

Permission harus berasal dari
RBAC database.

============================================================
PERMISSION
============================================================

Gunakan permission existing.

Contoh konsep:

keluarga.view
keluarga.create
keluarga.update
keluarga.delete

anggota_keluarga.view
anggota_keluarga.create
anggota_keluarga.update
anggota_keluarga.delete

TETAPI:

JANGAN membuat permission baru
jika sudah tersedia.

Jika belum tersedia:

cek RBAC Blueprint.

Jika memang diperlukan:

tambahkan melalui mekanisme database/seed
yang sesuai.

JANGAN hardcode permission.

============================================================
ADMIN
============================================================

ADMIN tidak otomatis berarti
unlimited access.

ADMIN hanya dapat melakukan operasi
sesuai permission.

============================================================
PIMPINAN
============================================================

PIMPINAN tidak otomatis mendapatkan
CRUD Keluarga.

Gunakan permission.

============================================================
DEVELOPER
============================================================

DEVELOPER mengikuti RBAC.

JANGAN membuat:

developerBypass = true

atau bypass middleware.

============================================================
CITIZEN
============================================================

Citizen tidak mendapatkan
administrative Keluarga API.

Citizen tidak boleh:

GET seluruh keluarga
GET keluarga citizen lain
PATCH keluarga
DELETE keluarga
menambah anggota sembarangan.

Jika citizen-self API belum masuk scope:

JANGAN membuat endpoint tersebut.

============================================================
IDOR PROTECTION
============================================================

WAJIB test:

Citizen A
tidak dapat mengakses
Keluarga Citizen B.

User dengan permission tertentu
tidak boleh mendapatkan resource
di luar scope yang diizinkan.

Jangan mempercayai:

URL id
query id
body id

sebagai bukti ownership.

============================================================
SOFT DELETE
============================================================

Keluarga:

JANGAN hard delete jika architecture
mengharuskan historical retention.

Gunakan strategy yang sudah ditentukan
STEP 2.

Contoh:

isAktif
deletedAt

Tetapi:

JANGAN membuat field baru
jika schema tidak menggunakannya.

============================================================
ANGGOTA SOFT DELETE
============================================================

AnggotaKeluarga juga harus mempertahankan
historical relationship jika architecture
mengharuskannya.

JANGAN:

prisma.anggotaKeluarga.delete()

secara sembarangan.

Ikuti soft-delete strategy existing.

============================================================
FOREIGN KEY SAFETY
============================================================

JANGAN melakukan delete yang menyebabkan:

Penduduk
→ Keluarga
→ AnggotaKeluarga

menjadi broken reference.

Gunakan FK strategy hasil STEP 2.

============================================================
AUDIT
============================================================

WAJIB audit:

Keluarga CREATED
Keluarga UPDATED
Keluarga DELETED/SOFT_DELETED

AnggotaKeluarga CREATED
AnggotaKeluarga UPDATED
AnggotaKeluarga DELETED/SOFT_DELETED

Audit harus mencatat minimal:

actor
action
resource
resourceId
timestamp
result

JANGAN mencatat:

password
OTP
JWT
secret.

JANGAN menyimpan PII penuh
jika tidak diperlukan.

============================================================
AUDIT RELATIONAL CHANGE
============================================================

Jika terjadi:

perubahan kepala keluarga

atau:

perubahan anggota keluarga

audit harus cukup jelas untuk mengetahui
perubahan relasi tersebut.

Contoh:

KELUARGA_HEAD_CHANGED

atau event equivalent

HANYA jika audit architecture mendukung
event granular tersebut.

JANGAN membuat event baru tanpa dasar
jika tidak diperlukan.

============================================================
ERROR HANDLING
============================================================

Gunakan error handler existing.

Mapping minimal:

duplicate KK
→ 409

duplicate active member
→ 409

not found
→ 404

invalid FK
→ 422 / 400

unauthorized
→ 401

forbidden
→ 403

validation
→ 422

rate limit
→ 429

Jangan expose raw Prisma error.

============================================================
BIGINT
============================================================

Semua:

id
FK

harus mengikuti BIGINT.

Perhatikan JSON serialization.

Jangan mengirim native BigInt
yang menyebabkan:

TypeError:
Do not know how to serialize a BigInt

Gunakan serialization strategy
yang sudah dipakai project.

============================================================
PRISMA
============================================================

Gunakan Prisma existing.

Jangan menambahkan ORM baru.

Jangan membuat raw SQL
kecuali benar-benar diperlukan.

Jika raw SQL:

WAJIB parameterized.

============================================================
DATABASE CONSTRAINTS
============================================================

Pastikan constraint yang diperlukan
berada pada database.

Minimal periksa:

Keluarga.nomorKK UNIQUE

FK Keluarga.desaId
→ Desa.id

FK Keluarga.kepalaId
→ Penduduk.id

FK AnggotaKeluarga.keluargaId
→ Keluarga.id

FK AnggotaKeluarga.pendudukId
→ Penduduk.id

unique active membership
sesuai strategy schema.

JANGAN menambahkan constraint
yang bertentangan dengan histori keluarga.

============================================================
DESA CONSISTENCY
============================================================

Keluarga berada dalam Desa.

Penduduk juga memiliki Desa.

Jika business rule mengharuskan:

Penduduk anggota keluarga
harus berada pada Desa yang sama
dengan Keluarga:

WAJIB validasi.

Namun:

JANGAN membuat rule tersebut
jika Architecture Blueprint
tidak mendukungnya.

Jika rule belum ditentukan:

STOP pada bagian tersebut dan laporkan
BUSINESS RULE REQUIRES CONFIRMATION.

============================================================
API RESPONSE
============================================================

Ikuti response format existing.

JANGAN membuat format baru.

Contoh konsep jika existing:

{
success: true,
data: ...
}

ikuti format tersebut.

============================================================
SERVICE LAYER
============================================================

Business logic:

WAJIB berada di service layer.

Router hanya menangani:

request
validation
authorization
service call
response.

JANGAN menaruh business logic kompleks
di router.

============================================================
VALIDATION
============================================================

Gunakan validation library existing.

Jika project menggunakan Zod:

gunakan Zod.

Validasi:

Keluarga create
Keluarga update
Anggota create
Anggota update
ID
nomorKK
kepalaId
pendudukId
keluargaId

============================================================
API TESTING
============================================================

WAJIB membuat tests.

MINIMUM KELUARGA TEST:

1. GET list authorized
2. GET list unauthorized
3. GET detail authorized
4. GET detail not found
5. POST valid keluarga
6. POST duplicate nomor KK
7. POST invalid kepalaId
8. POST invalid desaId
9. PATCH valid
10. PATCH invalid kepalaId
11. PATCH duplicate nomor KK
12. soft delete
13. PII protection
14. permission denied
15. pagination
16. search

============================================================
ANGGOTA TESTING
============================================================

WAJIB:

1. GET anggota
2. POST anggota valid
3. invalid pendudukId
4. invalid keluargaId
5. duplicate active membership
6. update anggota
7. delete/soft delete anggota
8. unauthorized
9. forbidden
10. PII masking
11. audit
12. transaction rollback

============================================================
INTEGRITY TESTING
============================================================

WAJIB test:

CASE 1:

Create Keluarga berhasil

- create Kepala berhasil

→ COMMIT

CASE 2:

Create Keluarga berhasil

- create Kepala gagal

→ ROLLBACK

CASE 3:

Create anggota gagal

→ database tidak meninggalkan
partial state.

CASE 4:

Perubahan kepala gagal

→ kepala lama tetap konsisten.

============================================================
REGRESSION TEST
============================================================

WAJIB menjalankan:

Phase 2 tests

Phase 3A tests

Phase 3B Step 3 tests

Jangan merusak:

Authentication
RBAC
Citizen Verification
Citizen Session
Internal Session
Wilayah
IdentitasDesa
Penduduk API

============================================================
FRONTEND
============================================================

STEP 4 fokus utama:

DOMAIN + API.

JANGAN membuat dashboard keluarga
yang kompleks jika roadmap memisahkan
frontend implementation.

Minimal API client integration
boleh dilakukan jika dibutuhkan.

JANGAN mengubah UI architecture.

JANGAN membuat hardcoded master data
di frontend.

============================================================
NO HARDCODE POLICY
============================================================

DILARANG hardcode:

relationship types
agama
pendidikan
pekerjaan
status keluarga
desa
role
permission
business configuration

Semua master/business configuration
harus berasal dari database/configuration
yang telah ditetapkan Architecture Baseline.

============================================================
FILES
============================================================

Gunakan struktur existing.

Kemungkinan:

apps/api/src/routes/keluarga/
apps/api/src/services/keluarga.service.ts
apps/api/src/services/anggota-keluarga.service.ts
apps/api/src/dto/keluarga.dto.ts
apps/api/src/dto/anggota-keluarga.dto.ts
apps/api/src/validators/...

TETAPI:

IKUTI struktur aktual project.

Jangan membuat struktur duplicate
jika sudah ada.

============================================================
DATABASE MIGRATION
============================================================

Jika STEP 2 sudah memiliki schema final:

JANGAN membuat migration duplicate.

Jika diperlukan perubahan schema:

1. jelaskan perubahan
2. validasi terhadap Architecture Baseline
3. buat migration
4. jalankan migration
5. regenerate Prisma
6. test

Jika perubahan tersebut mengubah
Architecture Baseline:

STOP.

Jangan lanjut.

============================================================
DOCUMENTATION
============================================================

Buat:

docs/development/PHASE-3B-STEP-4-KELUARGA.md

Dokumentasi minimal:

# PHASE 3B — STEP 4

## STATUS

PASS / BLOCKED

## SYSTEM AUDIT

hasil audit.

## DATABASE

Keluarga
AnggotaKeluarga

## RELATIONSHIP

Desa
Penduduk
Keluarga
AnggotaKeluarga

## BUSINESS RULES

jelaskan seluruh rule.

## API

daftar endpoint.

## RBAC

permission yang digunakan.

## PII

jelaskan protection.

## SOFT DELETE

jelaskan strategy.

## TRANSACTION

jelaskan atomic operation.

## AUDIT

jelaskan event.

## TESTING

jumlah test.

## REGRESSION

Phase 2:
PASS / FAIL

Phase 3A:
PASS / FAIL

Step 3:
PASS / FAIL

## SECURITY

NONE / FINDINGS

## ARCHITECTURE CONFLICT

NONE / FINDINGS

============================================================
ERD UPDATE
============================================================

Jika Step 4 membutuhkan perubahan ERD:

update:

docs/architecture/04-MASTER-ERD.md

TETAPI:

Jangan mengubah architecture
tanpa alasan.

Jika ERD existing sudah benar:

JANGAN melakukan perubahan
hanya untuk membuat dokumentasi baru.

Pastikan dokumentasi menggambarkan
schema aktual.

============================================================
API DOCUMENTATION
============================================================

Jika project memiliki API documentation:

update sesuai endpoint baru.

Jangan membuat API documentation system
baru hanya untuk Step 4.

============================================================
CRITICAL STOP CONDITIONS
============================================================

STOP dan status:

BLOCKED

jika ditemukan:

1. Penduduk.id bukan BIGINT
2. Penduduk.nik digunakan sebagai FK
3. nomorKK digunakan sebagai PK
4. FK Keluarga → Penduduk rusak
5. FK AnggotaKeluarga → Penduduk rusak
6. FK AnggotaKeluarga → Keluarga rusak
7. duplicate active membership tidak dapat dicegah
8. soft-delete strategy tidak jelas
9. transaction tidak dapat diterapkan
10. RBAC tidak tersedia
11. PII leakage
12. IDOR
13. Phase 2 regression failure
14. Phase 3A regression failure
15. Step 3 regression failure
16. schema dan architecture conflict
17. database migration conflict
18. business rule kepala keluarga ambigu
19. business rule keanggotaan keluarga ambigu

JANGAN menyelesaikan ambiguity
dengan asumsi.

Laporkan:

BLOCKED
BUSINESS RULE REQUIRES CONFIRMATION

============================================================
SCOPE LOCK
============================================================

STEP 4 HANYA:

Keluarga
AnggotaKeluarga
Penduduk relationship
API
Service
DTO
Validation
RBAC
Audit
PII
Transaction
Testing
Documentation

DILARANG:

PerangkatDesa
JenisSurat
TemplateSurat
Surat
Workflow Engine
Notification Engine
WhatsApp
RPJMDes
RKPDes
APBDes
Voting
PBB
BUMDes
Ekonomi
Tourism
Dashboard kompleks
Mobile application
Offline mode

JANGAN mengerjakan domain tersebut
meskipun terlihat mudah.

============================================================
DEFINITION OF DONE
============================================================

STEP 4 hanya boleh berstatus PASS jika:

[ ] System audit selesai
[ ] Database relation valid
[ ] Keluarga model valid
[ ] AnggotaKeluarga model valid
[ ] Penduduk relation valid
[ ] Desa relation valid
[ ] Kepala keluarga valid
[ ] Nomor KK unique
[ ] Nomor KK bukan PK
[ ] Penduduk.id digunakan sebagai FK
[ ] Tidak ada NIK sebagai FK
[ ] Active membership integrity valid
[ ] Soft delete valid
[ ] Transaction valid
[ ] Keluarga API selesai
[ ] AnggotaKeluarga API selesai
[ ] DTO selesai
[ ] Validation selesai
[ ] Authentication aktif
[ ] Authorization aktif
[ ] RBAC aktif
[ ] PII protection aktif
[ ] IDOR protection aktif
[ ] Audit aktif
[ ] Error handling konsisten
[ ] Pagination aktif
[ ] Search sesuai schema
[ ] Integrity tests PASS
[ ] Transaction rollback tests PASS
[ ] Phase 2 regression PASS
[ ] Phase 3A regression PASS
[ ] Step 3 regression PASS
[ ] TypeScript PASS
[ ] Build PASS
[ ] Documentation selesai
[ ] ERD konsisten
[ ] No-hardcode policy PASS
[ ] No architecture conflict

============================================================
FINAL RESPONSE FORMAT
============================================================

Setelah selesai:

PHASE:
3B — STEP 4 KELUARGA & ANGGOTA KELUARGA

STATUS:
PASS / BLOCKED

SYSTEM AUDIT:
PASS / FAIL

DATABASE:
PASS / FAIL

PRISMA:
PASS / FAIL

KELUARGA:
PASS / FAIL

ANGGOTA KELUARGA:
PASS / FAIL

PENDUDUK RELATION:
PASS / FAIL

DESA RELATION:
PASS / FAIL

KEPALA KELUARGA:
PASS / FAIL

NOMOR KK:
PASS / FAIL

ACTIVE MEMBERSHIP:
PASS / FAIL

SOFT DELETE:
PASS / FAIL

TRANSACTION:
PASS / FAIL

AUTHENTICATION:
PASS / FAIL

AUTHORIZATION:
PASS / FAIL

RBAC:
PASS / FAIL

PII PROTECTION:
PASS / FAIL

IDOR:
PASS / FAIL

AUDIT:
PASS / FAIL

API:
PASS / FAIL

TESTING:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

PHASE 3A REGRESSION:
PASS / FAIL

STEP 3 REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

ERD:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

ARCHITECTURE CONFLICT:
NONE / LIST

BUSINESS RULE CONFLICT:
NONE / LIST

SECURITY FINDINGS:
NONE / LIST

FILES CREATED:
LIST

FILES MODIFIED:
LIST

VALIDATION REPORT:
docs/development/PHASE-3B-STEP-4-KELUARGA.md

============================================================
MANDATORY STOP
============================================================

SETELAH STEP 4 SELESAI:

JANGAN lanjut ke Step 5.

JANGAN mengimplementasikan PerangkatDesa.

JANGAN mengimplementasikan domain lain.

JANGAN memperluas scope.

STOP.

Tunggu instruksi berikutnya dari developer/user.

============================================================
END OF EXECUTION CONTRACT
============================================================
