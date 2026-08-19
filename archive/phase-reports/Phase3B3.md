============================================================
MITRADESA — PHASE 3B
STEP 3 — PENDUDUK API
IMPLEMENTATION CONTRACT
============================================================

STATUS SEBELUM STEP 3:

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
DATABASE DESIGN & MIGRATION
STATUS: COMPLETE

============================================================
CURRENT TASK
============================================================

IMPLEMENT:

PHASE 3B
STEP 3 — PENDUDUK API

Scope:

Penduduk API
Penduduk Service
Penduduk Validation
Penduduk Authorization
Penduduk Audit
Penduduk Security
Penduduk Tests

============================================================
MANDATORY READ
============================================================

SEBELUM MENULIS SOURCE CODE:

WAJIB membaca:

docs/architecture/ARCHITECTURE-BASELINE.md

docs/architecture/03-DATABASE-BLUEPRINT.md

docs/architecture/04-MASTER-ERD.md

docs/architecture/05-API-BLUEPRINT.md

docs/architecture/06-RBAC-BLUEPRINT.md

docs/architecture/11-AUDIT-ENGINE.md

docs/architecture/12-NO-HARDCODE-POLICY.md

docs/architecture/13-SECURITY-ARCHITECTURE.md

docs/architecture/16-DEFINITION-OF-DONE.md

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

docs/development/PHASE-3B-STEP-2-DATABASE-VALIDATION.md

Baca juga:

apps/api/prisma/schema.prisma

router existing

service existing

middleware existing

validation existing

test existing

JANGAN membuat API berdasarkan asumsi.

Gunakan schema aktual hasil STEP 2.

============================================================
STEP 3 OBJECTIVE
============================================================

Membangun REST API untuk entity:

Penduduk

API harus mendukung kebutuhan internal
administrasi desa dan menjadi foundation
untuk domain berikutnya.

API harus:

- secure
- permission-based
- validated
- auditable
- paginated
- searchable
- filterable
- consistent
- PII-safe

============================================================
CRITICAL IDENTITY
============================================================

Penduduk:

id
BIGINT
PRIMARY KEY

NIK:

nik
16 digit
UNIQUE

PENTING:

# Penduduk.id

INTERNAL DATABASE ID

# Penduduk.nik

CITIZEN BUSINESS IDENTIFIER

JANGAN mengubah prinsip ini.

============================================================
NO CITIZEN DUPLICATE
============================================================

JANGAN membuat:

Citizen API
Citizen controller
Citizen service
Citizen table

sebagai duplicate identity.

Penduduk adalah master citizen identity.

Citizen authentication Phase 2 nantinya
berintegrasi dengan Penduduk.

============================================================
API ARCHITECTURE
============================================================

Ikuti struktur existing:

routes
services
middleware
validators
DTO
utils

Jangan membuat architecture baru jika
architecture existing sudah tersedia.

Contoh:

routes/penduduk.ts

services/penduduk.service.ts

validators/penduduk.validator.ts

dto/penduduk.dto.ts

Namun:

IKUTI NAMING CONVENTION PROJECT AKTUAL.

============================================================
ROUTE BASE
============================================================

Gunakan route convention yang sudah ditetapkan
oleh API Blueprint.

Jika blueprint menentukan:

/api/v1/penduduk

gunakan itu.

Jangan membuat:

/api/citizens

jika tidak ditentukan blueprint.

============================================================
CRUD
============================================================

Implementasikan minimal:

GET /penduduk
GET /penduduk/:id
POST /penduduk
PATCH /penduduk/:id
DELETE /penduduk/:id

Jika API Blueprint menggunakan path berbeda:

ikuti blueprint.

Jangan membuat duplicate route.

============================================================
LIST PENDUDUK
============================================================

GET list harus mendukung:

pagination

search

filter

sorting

Contoh konsep:

?page=1
&limit=20
&search=...
&desaId=...
&jenisKelamin=...
&status=...

TAPI:

HANYA implementasikan filter yang memang
didukung schema dan architecture.

Jangan membuat filter untuk field yang belum ada.

============================================================
PAGINATION
============================================================

WAJIB menggunakan pagination.

Jangan:

SELECT seluruh Penduduk

tanpa limit.

Default limit harus mengikuti API convention.

Maximum limit harus dibatasi.

============================================================
SEARCH
============================================================

Search harus efisien.

Jangan melakukan:

full table scan secara tidak perlu.

Gunakan index yang tersedia.

Jika search membutuhkan index tambahan:

analisis dahulu.

Jangan membuat index random.

============================================================
NIK SEARCH
============================================================

NIK adalah PII.

Jika pencarian NIK diizinkan:

WAJIB authorization.

Jangan menyediakan public endpoint:

GET /penduduk?nik=...

tanpa protection.

NIK tidak boleh muncul secara bebas
pada public API.

============================================================
PII RESPONSE
============================================================

Response Penduduk harus memiliki DTO.

JANGAN langsung:

return prisma.penduduk.findMany()

Gunakan response mapper/DTO.

Pisahkan:

internal response

dan

public/citizen response

jika architecture membutuhkan.

============================================================
NIK MASKING
============================================================

NIK full hanya boleh diberikan kepada
aktor yang memiliki permission yang sesuai.

Untuk response yang tidak membutuhkan full NIK:

mask.

Contoh:

327xxxxxxxxxxx12

Jangan hardcode masking di setiap route.

Gunakan utility/policy terpusat.

============================================================
PENDUDUK DETAIL
============================================================

GET /penduduk/:id

harus:

authenticate

authorize

validate id

query database

map DTO

audit jika diperlukan

Jangan expose:

password
OTP
session
internal security metadata

============================================================
ID VALIDATION
============================================================

:id:

harus divalidasi sebagai BIGINT yang valid.

Jangan menerima:

NaN
negative
decimal
arbitrary string

Jika invalid:

HTTP 400 / 422

sesuai API convention.

============================================================
CREATE PENDUDUK
============================================================

POST Penduduk harus:

1. authenticate
2. authorize
3. validate body
4. validate NIK
5. validate Desa
6. check duplicate NIK
7. create transaction
8. audit
9. return DTO

============================================================
NIK VALIDATION
============================================================

NIK wajib:

- string
- tepat 16 digit
- numeric
- tidak kosong
- unique

Jangan mengubah NIK menjadi:

BIGINT

NIK tetap STRING/VARCHAR.

============================================================
DUPLICATE NIK
============================================================

Jika NIK sudah ada:

HTTP 409 Conflict

BUKAN:

500 Internal Server Error.

Error harus aman dan tidak membocorkan
informasi berlebihan.

============================================================
DESA VALIDATION
============================================================

Penduduk harus terkait dengan:

Desa existing.

Jangan membuat Desa baru.

Validasi:

desaId valid
desa exists
desa active jika ada status

Jika tidak ditemukan:

404 / 422

sesuai convention.

============================================================
UPDATE PENDUDUK
============================================================

PATCH:

/penduduk/:id

Harus partial update.

Jangan mengharuskan seluruh object dikirim
kembali.

Jika NIK diubah:

- validasi format
- check uniqueness
- audit perubahan
- pertimbangkan security implications

Jika architecture/business rule melarang perubahan NIK:

ikuti architecture.

Jangan membuat business rule baru tanpa dasar.

============================================================
DELETE / SOFT DELETE
============================================================

Penduduk adalah historical master data.

JANGAN hard delete secara default.

Ikuti soft-delete strategy hasil STEP 2.

Jika schema menggunakan:

deletedAt

gunakan mekanisme tersebut.

Jika schema menggunakan:

isActive

ikuti schema.

Jangan membuat mekanisme soft-delete baru.

JANGAN:

prisma.penduduk.delete()

jika architecture menentukan soft delete.

============================================================
HISTORICAL INTEGRITY
============================================================

Penduduk dapat direferensikan oleh:

Keluarga
AnggotaKeluarga
CitizenVerification
CitizenSession
domain lainnya di masa depan.

Jangan melakukan delete yang merusak FK.

Gunakan:

RESTRICT
SET NULL

atau strategy hasil STEP 2.

============================================================
RBAC
============================================================

API harus menggunakan:

authenticate middleware

-

authorize/permission middleware.

JANGAN:

if role === "ADMIN"

sebagai satu-satunya authorization.

Gunakan permission dari database.

============================================================
PERMISSION
============================================================

Gunakan permission yang sudah tersedia.

Contoh konsep:

PENDUDUK_READ
PENDUDUK_CREATE
PENDUDUK_UPDATE
PENDUDUK_DELETE

TETAPI:

JANGAN membuat permission baru jika sudah
tersedia.

Jika permission Penduduk belum ada:

cek RBAC Blueprint.

Jika memang diperlukan:

buat melalui seed/migration yang sesuai.

Jangan hardcode permission di route.

============================================================
DEVELOPER
============================================================

DEVELOPER dapat mengakses Penduduk sesuai
permission yang diberikan oleh RBAC.

Jangan membuat bypass authorization khusus
yang mengabaikan middleware.

============================================================
ADMIN
============================================================

ADMIN hanya dapat melakukan operasi yang
diberikan permission.

Jangan menganggap ADMIN = all access.

============================================================
PIMPINAN
============================================================

PIMPINAN hanya mendapatkan akses Penduduk
jika permission diberikan.

Jangan otomatis memberikan CRUD Penduduk
kepada PIMPINAN.

============================================================
CITIZEN ACCESS
============================================================

JANGAN membuat public CRUD Penduduk.

Citizen tidak boleh:

GET seluruh Penduduk
GET Penduduk citizen lain
POST Penduduk sembarangan
PATCH Penduduk citizen lain
DELETE Penduduk

Citizen hanya dapat mengakses resource dirinya
sendiri melalui mekanisme Citizen Session
yang akan diintegrasikan dengan Penduduk.

Jika endpoint citizen-self belum termasuk scope
STEP 3:

JANGAN membuatnya.

============================================================
IDOR
============================================================

WAJIB test:

Citizen A
tidak dapat mengakses:

Penduduk B.

Admin/Petugas hanya dapat mengakses sesuai
permission.

Jangan mempercayai:

URL id
query parameter
body pendudukId

sebagai bukti ownership.

============================================================
AUDIT
============================================================

Operasi berikut harus diaudit:

CREATE
UPDATE
SOFT_DELETE

Jika sistem audit architecture menentukan
READ audit untuk PII:

ikuti architecture.

Audit harus menyimpan:

actor
action
resource
resourceId
timestamp
result

JANGAN menyimpan:

password
OTP
JWT
secret

JANGAN menyimpan full NIK jika tidak diperlukan.

============================================================
AUDIT CHANGES
============================================================

Untuk UPDATE:

Jika audit architecture mendukung before/after:

catat field changes.

Namun:

JANGAN menyimpan sensitive values secara
sembarangan.

============================================================
TRANSACTION
============================================================

Create/update Penduduk yang melibatkan
lebih dari satu perubahan database harus
menggunakan Prisma transaction.

Contoh:

create Penduduk

- audit

harus atomic jika architecture mengharuskannya.

Jika audit dibuat transactionally:

jangan sampai data berhasil dibuat tetapi
audit gagal tanpa diketahui.

============================================================
ERROR HANDLING
============================================================

Gunakan error handler existing.

JANGAN:

try/catch
return raw database error.

JANGAN expose:

SQL
stack trace
database hostname
constraint internals

============================================================
DATABASE ERROR
============================================================

Map error:

duplicate NIK
→ 409

invalid FK
→ 422 / 400

not found
→ 404

unauthorized
→ 401

forbidden
→ 403

validation
→ 422

rate limit
→ 429

sesuai API Blueprint.

============================================================
VALIDATION LIBRARY
============================================================

Gunakan validation library existing project.

Jika project sudah menggunakan:

Zod

gunakan Zod.

JANGAN menambahkan validation library baru
tanpa alasan.

============================================================
PRISMA
============================================================

Gunakan Prisma existing.

JANGAN melakukan raw SQL kecuali memang
diperlukan dan sesuai architecture.

Jika raw SQL diperlukan:

gunakan parameterized query.

DILARANG string concatenation SQL.

============================================================
BIGINT SERIALIZATION
============================================================

PERHATIKAN:

Prisma BIGINT tidak selalu aman langsung
dikirim melalui JSON.

JANGAN:

JSON.stringify()
terhadap BigInt tanpa serializer.

Gunakan response serialization strategy
yang sudah digunakan project.

Konsisten untuk seluruh API.

============================================================
API RESPONSE FORMAT
============================================================

Ikuti response format existing.

Jika project menggunakan:

{
data: ...
}

atau:

{
success: true,
data: ...
}

gunakan format existing.

JANGAN membuat response format baru
khusus Penduduk.

============================================================
PAGINATION RESPONSE
============================================================

Ikuti convention existing.

Minimal informasi:

data
page
limit
total

jika architecture mengharuskannya.

============================================================
FRONTEND
============================================================

STEP 3 fokus utama:

BACKEND API.

JANGAN membangun halaman frontend kompleks
jika Phase 3B roadmap memisahkannya.

Jika endpoint integration membutuhkan
perubahan API client:

boleh dilakukan secara minimal.

JANGAN membuat dashboard Penduduk penuh
pada STEP 3 jika belum termasuk scope.

============================================================
TESTING
============================================================

WAJIB membuat API tests.

Minimal:

1. GET list authorized
2. GET list unauthorized
3. GET detail authorized
4. GET detail not found
5. POST valid
6. POST invalid NIK
7. POST duplicate NIK
8. POST invalid desaId
9. PATCH valid
10. PATCH not found
11. PATCH duplicate NIK
12. DELETE/soft delete
13. PII masking
14. unauthorized access
15. forbidden access
16. invalid BIGINT id
17. pagination
18. search
19. filter
20. audit creation
21. audit update
22. audit delete

============================================================
SECURITY TEST
============================================================

WAJIB memastikan:

password tidak muncul
OTP tidak muncul
JWT tidak muncul
database credential tidak muncul
service_role tidak muncul

pada:

API response
logs
AuditLog

============================================================
REGRESSION TEST
============================================================

Setelah Penduduk API:

Phase 2 tests harus tetap PASS.

Phase 3A tests harus tetap PASS.

Jangan merusak:

Authentication
RBAC
Wilayah
IdentitasDesa

============================================================
BUILD
============================================================

WAJIB:

TypeScript check
unit tests
API tests
build

Jika project memiliki:

lint

jalankan juga.

============================================================
DOCUMENTATION
============================================================

Buat:

docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md

Isi:

# PHASE 3B — STEP 3 PENDUDUK API

## STATUS

PASS / BLOCKED

## API ROUTES

list seluruh endpoint.

## AUTHORIZATION

jelaskan permission.

## VALIDATION

jelaskan validation.

## PII PROTECTION

jelaskan masking/protection.

## SOFT DELETE

jelaskan strategy.

## AUDIT

jelaskan event.

## PAGINATION

jelaskan strategy.

## SEARCH

jelaskan strategy.

## TESTING

jumlah test dan hasil.

## REGRESSION

Phase 2:
PASS / FAIL

Phase 3A:
PASS / FAIL

## DATABASE

PASS / FAIL

## ARCHITECTURE CONFLICT

NONE / LIST

## SECURITY FINDINGS

NONE / LIST

============================================================
API DOCUMENTATION
============================================================

Jika project memiliki OpenAPI/Swagger:

update documentation.

Jika belum ada:

JANGAN membuat Swagger system baru
kecuali API Blueprint mengharuskannya.

============================================================
NO HARDCODE
============================================================

DILARANG hardcode:

role
permission
desa
agama
pendidikan
pekerjaan
status
business configuration

Jika field master data belum tersedia:

JANGAN membuat enum sembarangan.

JANGAN hardcode list.

============================================================
SCOPE LOCK
============================================================

STEP 3 ONLY:

Penduduk API.

BOLEH:

Penduduk Service
Penduduk Validator
Penduduk DTO
Penduduk Router
Penduduk API Tests
Audit integration
minimal API client integration

DILARANG:

Keluarga API
AnggotaKeluarga API
PerangkatDesa
JenisSurat
TemplateSurat
Surat
Workflow
Notification
WhatsApp
RPJMDes
RKPDes
APBDes
Voting
PBB
BUMDes

============================================================
CRITICAL STOP CONDITIONS
============================================================

STOP dan status:

BLOCKED

jika:

1. Schema Penduduk hasil STEP 2 tidak sesuai
2. Migration database tidak konsisten
3. Penduduk.id bukan BIGINT
4. NIK bukan UNIQUE
5. NIK digunakan sebagai relational FK
6. Desa relation rusak
7. Soft-delete strategy tidak tersedia
8. RBAC tidak dapat diterapkan
9. PII leakage ditemukan
10. IDOR ditemukan
11. Existing Phase 2 rusak
12. Existing Phase 3A rusak
13. Tests critical gagal
14. Architecture Baseline harus diubah

JANGAN improvisasi.

============================================================
DEFINITION OF DONE
============================================================

STEP 3 PASS hanya jika:

[ ] Penduduk Router selesai
[ ] Penduduk Service selesai
[ ] Validation selesai
[ ] DTO selesai
[ ] Authentication aktif
[ ] Authorization aktif
[ ] RBAC aktif
[ ] NIK validation aktif
[ ] Duplicate NIK → 409
[ ] Desa FK validation aktif
[ ] Pagination aktif
[ ] Search aktif jika didukung
[ ] Filter aktif jika didukung
[ ] PII protection aktif
[ ] IDOR protection aktif
[ ] Soft delete sesuai schema
[ ] Audit aktif
[ ] Error handling konsisten
[ ] API tests PASS
[ ] Phase 2 regression PASS
[ ] Phase 3A regression PASS
[ ] TypeScript PASS
[ ] Build PASS
[ ] Documentation selesai

============================================================
FINAL STOP
============================================================

SETELAH STEP 3 selesai:

JANGAN lanjut STEP 4.

JANGAN membuat Keluarga API.

JANGAN membuat AnggotaKeluarga API.

JANGAN membuat frontend Penduduk penuh.

STOP.

Tunggu instruksi berikutnya.

============================================================
FINAL RESPONSE
============================================================

PHASE:
3B — STEP 3 PENDUDUK API

STATUS:
PASS / BLOCKED

DATABASE:
PASS / FAIL

PRISMA:
PASS / FAIL

API:
PASS / FAIL

AUTHENTICATION:
PASS / FAIL

AUTHORIZATION:
PASS / FAIL

RBAC:
PASS / FAIL

NIK VALIDATION:
PASS / FAIL

PII PROTECTION:
PASS / FAIL

IDOR:
PASS / FAIL

SOFT DELETE:
PASS / FAIL

AUDIT:
PASS / FAIL

PAGINATION:
PASS / FAIL

SEARCH:
PASS / FAIL

TESTING:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

PHASE 3A REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

ARCHITECTURE CONFLICT:
NONE / LIST

SECURITY FINDINGS:
NONE / LIST

FILES CREATED:
LIST

FILES MODIFIED:
LIST

VALIDATION REPORT:
docs/development/PHASE-3B-STEP-3-PENDUDUK-API.md

NEXT:
STOP — WAIT FOR INSTRUCTION
============================================================
