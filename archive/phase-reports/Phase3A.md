============================================================
MITRADESA — PHASE 3A
MASTER DATA FOUNDATION
WILAYAH + IDENTITAS DESA
============================================================

## STATUS

PHASE 0 = COMPLETE
PHASE 0.5 = COMPLETE
PHASE 1 = COMPLETE
PHASE 2 = COMPLETE

CURRENT:
PHASE 3A — WILAYAH + IDENTITAS DESA

DO NOT START PHASE 3B.

============================================================
MISSION
============================================================

Bangun fondasi Master Data MITRADESA yang terdiri dari:

1. Provinsi
2. Kabupaten
3. Kecamatan
4. Desa
5. Identitas Desa

Domain ini akan menjadi referensi bagi seluruh domain MITRADESA
di fase berikutnya.

Phase ini harus:

DATABASE-FIRST
API-FIRST
RBAC-AWARE
AUDITABLE
NO-HARDCODE
ERD-CONSISTENT

============================================================
MANDATORY DOCUMENTS TO READ
============================================================

SEBELUM MENULIS CODE, WAJIB membaca:

docs/architecture/ARCHITECTURE-BASELINE.md

docs/architecture/00-MITRADESA-CONSTITUTION.md

docs/architecture/03-DATABASE-BLUEPRINT.md

docs/architecture/04-MASTER-ERD.md

docs/architecture/05-API-BLUEPRINT.md

docs/architecture/06-RBAC-BLUEPRINT.md

docs/architecture/11-AUDIT-ENGINE.md

docs/architecture/12-NO-HARDCODE-POLICY.md

docs/architecture/13-SECURITY-ARCHITECTURE.md

docs/architecture/14-TESTING-ARCHITECTURE.md

docs/development/PHASE-2-VALIDATION.md

Juga baca seluruh schema Prisma yang saat ini telah dibuat
pada Phase 1 dan Phase 2.

============================================================
CRITICAL RULE
============================================================

JANGAN mengasumsikan struktur database.

JANGAN membuat schema baru sebelum memeriksa:

1. Prisma schema existing
2. Master ERD
3. Database blueprint
4. Model dari Phase 2
5. Existing migrations
6. Existing relations

Jika terdapat conflict:

STOP.

Jangan memilih sendiri.

Laporkan conflict sebelum melakukan perubahan.

============================================================
SCOPE PHASE 3A
============================================================

HANYA:

A. WILAYAH

- Provinsi
- Kabupaten
- Kecamatan
- Desa

B. IDENTITAS DESA

- Identitas Desa
- konfigurasi dasar desa

C. API

CRUD dan lookup yang diperlukan.

D. RBAC

Authorization berdasarkan permission.

E. AUDIT

Audit perubahan master data.

F. FRONTEND

Admin interface dasar untuk mengelola wilayah
dan identitas desa.

G. TESTING

Unit/API/E2E.

============================================================
STRICTLY OUT OF SCOPE
============================================================

JANGAN membuat:

❌ Penduduk
❌ Keluarga
❌ KK
❌ Perangkat Desa
❌ Account baru
❌ Role baru
❌ Permission baru yang tidak diperlukan
❌ Surat
❌ Jenis Surat
❌ Template Surat
❌ DNA Field
❌ Workflow Surat
❌ QR TTE
❌ WhatsApp workflow
❌ RPJMDes
❌ RKPDes
❌ APBDes
❌ Voting
❌ BUMDes
❌ PBB
❌ Tourism
❌ Dashboard business

Phase 3A hanya fondasi wilayah dan identitas desa.

============================================================
DATABASE HIERARCHY
============================================================

Gunakan hierarchy:

PROVINSI
│
└── KABUPATEN
│
└── KECAMATAN
│
└── DESA
│
└── IDENTITAS DESA

Relationship:

Provinsi 1:N Kabupaten
Kabupaten 1:N Kecamatan
Kecamatan 1:N Desa

IdentitasDesa harus mereferensikan Desa.

Jangan menyimpan nama wilayah sebagai satu-satunya
relational reference.

============================================================
WILAYAH — PROVINSI
============================================================

Minimal konsep:

Provinsi

Fields harus mengikuti DATABASE BLUEPRINT.

Jangan membuat field tambahan hanya karena asumsi.

Pastikan:

- primary key BIGINT sesuai decision
- kode wilayah apabila memang ditentukan architecture
- nama
- status jika diperlukan
- timestamps

Jika kode wilayah diperlukan, beri unique constraint.

============================================================
WILAYAH — KABUPATEN
============================================================

Kabupaten harus memiliki:

provinsi_id

sebagai foreign key.

Concept:

Provinsi
│
└── Kabupaten

Tidak boleh menyimpan:

nama_provinsi

sebagai source of truth relational.

============================================================
WILAYAH — KECAMATAN
============================================================

Kecamatan harus memiliki:

kabupaten_id

sebagai foreign key.

Concept:

Kabupaten
│
└── Kecamatan

============================================================
WILAYAH — DESA
============================================================

Desa harus memiliki:

kecamatan_id

sebagai foreign key.

Concept:

Kecamatan
│
└── Desa

Desa adalah level administratif yang akan menjadi
tenant/context utama MITRADESA.

============================================================
SINGLE-VILLAGE / MULTI-VILLAGE READY
============================================================

Architecture decision:

Single-village sekarang,
multi-village ready.

Implementasi saat ini:

MITRADESA beroperasi pada satu Desa aktif.

Namun schema tidak boleh dibuat sedemikian rupa sehingga
sulit dikembangkan menjadi multi-village.

Jangan membuat:

global hardcoded desa.

Contoh DILARANG:

const DESA_ID = 1;

atau:

if (desa === "Seruni Mumbul")

atau:

WHERE desa_id = 1

sebagai business rule permanen.

Gunakan database/configuration/context.

============================================================
IDENTITAS DESA
============================================================

IdentitasDesa merupakan konfigurasi utama Desa.

Harus memiliki reference:

desa_id

dan tidak boleh berdiri tanpa Desa.

Relationship:

Desa 1:1 IdentitasDesa

Gunakan unique constraint pada desa_id.

============================================================
IDENTITAS DESA — DATA
============================================================

Minimal support field berikut:

- nama desa
- nama kecamatan
- nama kabupaten
- nama provinsi
- alamat
- kontak
- email
- website
- kodepos
- logo desa
- logo kabupaten
- favicon
- singkatan jabatan
- singkatan desa

NAMUN:

JANGAN menyimpan nama kecamatan,
kabupaten, dan provinsi sebagai duplicate
source of truth apabila sudah tersedia melalui
relational hierarchy.

Data tersebut boleh ditampilkan melalui JOIN/relations.

Contoh:

IdentitasDesa
↓
Desa
↓
Kecamatan
↓
Kabupaten
↓
Provinsi

Source of truth:

Provinsi.nama
Kabupaten.nama
Kecamatan.nama
Desa.nama

Bukan duplicate text di IdentitasDesa.

============================================================
IDENTITAS DESA — ADDITIONAL CONFIGURATION
============================================================

Architecture harus memungkinkan konfigurasi tambahan
di masa depan tanpa mengubah schema setiap kali
configuration baru diperlukan.

Tetapi:

JANGAN langsung membuat generic JSON/config table
jika tidak dibutuhkan architecture.

Ikuti DATABASE BLUEPRINT.

Jika blueprint belum menentukan mekanisme:

buat architecture note terlebih dahulu,
jangan improvisasi.

============================================================
LOGO DESA
============================================================

Logo desa dan logo kabupaten merupakan asset/image.

Jangan menyimpan binary image langsung dalam database
kecuali architecture baseline secara eksplisit menentukan
hal tersebut.

Gunakan reference/path/object key sesuai storage architecture.

Field database harus dapat menunjuk ke asset.

Contoh konseptual:

logo_desa_asset_id

logo_kabupaten_asset_id

Jangan mengasumsikan nama field final jika blueprint
sudah menentukan nama berbeda.

============================================================
FAVICON
============================================================

Favicon juga merupakan asset.

Jangan menyimpan binary image langsung di table
IdentitasDesa.

Gunakan asset reference sesuai architecture.

Jika asset engine belum dibuat pada Phase ini:

gunakan struktur reference yang compatible dengan
Document/Asset architecture dan dokumentasikan
dependency tersebut.

Jangan membuat asset engine besar di Phase 3A.

============================================================
FORMAT GAMBAR
============================================================

Jangan membatasi database hanya:

PNG

atau:

JPG

Karena sebelumnya keputusan:

semua format gambar dapat didukung.

Validasi file type harus dilakukan pada storage/upload layer.

Database menyimpan metadata/reference,
bukan binary image.

============================================================
SINGKATAN DESA
============================================================

Digunakan untuk:

nomor surat

dan kebutuhan sistem lainnya.

Namun Phase 3A hanya menyediakan MASTER DATA.

Jangan membuat generator nomor surat.

Jangan membuat modul surat.

============================================================
SINGKATAN JABATAN
============================================================

Sediakan struktur yang dapat digunakan oleh domain
Perangkat Desa dan Surat pada fase berikutnya.

Jangan membuat hardcoded:

KADES
SEKDES

dan sebagainya di source code sebagai business authority.

Jika architecture memerlukan master jabatan:

ikuti blueprint.

Jika belum:

jangan membuat domain Perangkat Desa sekarang.

Dokumentasikan dependency.

============================================================
RELATION TO FUTURE PENDUDUK
============================================================

Phase 3A BELUM membuat tabel Penduduk.

Tetapi desain harus memungkinkan:

Desa
│
└── Penduduk

pada Phase 3B.

Jangan membuat duplicate Desa/Penduduk reference.

============================================================
RELATION TO FUTURE PERANGKAT DESA
============================================================

Phase 3A BELUM membuat Perangkat Desa.

Namun harus memungkinkan:

Desa
│
└── PerangkatDesa
│
└── Penduduk
│
└── Account

Jangan implementasikan sekarang.

============================================================
RELATION TO FUTURE SURAT
============================================================

IdentitasDesa nantinya akan menjadi source untuk:

Kop Surat
Nomor Surat
Nama Desa
Alamat
Kontak
Email
Website
Logo Desa
Logo Kabupaten
Singkatan Desa
Singkatan Jabatan

Tetapi:

JANGAN membuat Template Surat sekarang.

============================================================
NO HARDCODE
============================================================

DILARANG:

const villageName = "Seruni Mumbul";

const district = "Pringgabaya";

const regency = "Lombok Timur";

const province = "Nusa Tenggara Barat";

atau konfigurasi equivalent.

Frontend harus mengambil data dari API.

Backend harus mengambil data dari database/configuration.

============================================================
API
============================================================

Buat API REST sesuai API Blueprint.

Minimal capability:

GET provinces
GET province by id

GET regencies
GET regency by id

GET districts
GET district by id

GET villages
GET village by id

GET village identity

CREATE/UPDATE village identity

Endpoint final HARUS mengikuti naming convention
yang sudah ada di API Blueprint.

Jangan membuat duplicate endpoint.

============================================================
FILTERING
============================================================

API wilayah harus mendukung relational filtering
yang memang diperlukan.

Contoh:

Kabupaten berdasarkan Provinsi.

Kecamatan berdasarkan Kabupaten.

Desa berdasarkan Kecamatan.

Jangan mengambil seluruh hierarchy jika hanya
satu level yang dibutuhkan.

============================================================
VALIDATION
============================================================

Gunakan Zod atau validation layer yang sudah
digunakan project.

Validasi:

- required fields
- string length
- email
- URL
- kodepos
- foreign key
- unique fields
- asset reference

Jangan mempercayai frontend.

Backend adalah authority.

============================================================
RBAC
============================================================

JANGAN membuat role baru.

Gunakan role Phase 2:

ADMIN
PIMPINAN
DEVELOPER

Master wilayah dan identitas desa merupakan
administrative configuration.

Permission harus database-driven.

Admin:

boleh melakukan operasi sesuai permission.

Pimpinan:

hanya read jika permission tidak memberikan
write.

Developer:

sesuai permission yang telah ditentukan.

Jangan:

if role === "developer"

sebagai satu-satunya security authority.

============================================================
PUBLIC ACCESS
============================================================

Data tertentu seperti:

nama desa
alamat
website
kontak

mungkin diperlukan public website.

Namun jangan otomatis membuka seluruh master wilayah
dan configuration.

Pisahkan:

PUBLIC READ

dan

ADMINISTRATIVE WRITE.

Gunakan authorization policy.

============================================================
AUDIT
============================================================

WAJIB audit:

CREATE
UPDATE
DELETE

untuk master data wilayah jika operasi tersebut
memang diperbolehkan.

Untuk IdentitasDesa:

IDENTITY_CREATED
IDENTITY_UPDATED

Audit harus mencatat:

actor
action
entity
entity_id
timestamp
metadata yang aman

Jangan memasukkan secret.

============================================================
DELETE POLICY
============================================================

Jangan melakukan hard delete terhadap master wilayah
yang sudah digunakan oleh data lain jika menyebabkan
orphan reference.

Gunakan:

restrict

atau

soft delete/status

sesuai architecture baseline.

Jangan mengarang cascade delete.

============================================================
DATABASE CONSTRAINTS
============================================================

WAJIB memastikan:

Provinsi.kode unique jika field tersebut ada.

Kabupaten.kode unique sesuai scope yang ditentukan
blueprint.

Kecamatan.kode unique sesuai scope.

Desa.kode unique sesuai scope.

IdentitasDesa.desa_id UNIQUE.

Foreign key:

Kabupaten → Provinsi

Kecamatan → Kabupaten

Desa → Kecamatan

IdentitasDesa → Desa

============================================================
INDEX
============================================================

Buat index berdasarkan query aktual:

kode wilayah
nama wilayah jika diperlukan
foreign key

Jangan membuat index berlebihan tanpa alasan.

============================================================
PRISMA
============================================================

Implementasikan schema menggunakan Prisma.

WAJIB:

prisma format

prisma validate

migration

prisma generate

test migration

Jangan menggunakan:

prisma db push

sebagai pengganti migration untuk production schema.

============================================================
SEED DATA
============================================================

Untuk development/testing boleh membuat seed
minimal.

Jangan mengisi seluruh database wilayah Indonesia
secara manual.

Jika membutuhkan data contoh:

gunakan dataset fixture kecil.

Contoh:

1 provinsi
1 kabupaten
1 kecamatan
1 desa

Tetapi jangan hardcode data tersebut ke business logic.

============================================================
FRONTEND
============================================================

Buat administrative interface minimal:

/admin/master/wilayah

/admin/master/identitas-desa

Route final mengikuti architecture.

UI harus:

- mengambil data melalui API
- tidak menggunakan hardcoded desa
- menampilkan hierarchy
- validasi form
- loading state
- error state
- success state
- permission-aware action

============================================================
IDENTITAS DESA FORM
============================================================

Form minimal:

DESA

- pilih/tampilkan desa

WILAYAH

- provinsi
- kabupaten
- kecamatan
- desa

KONTAK

- alamat
- kodepos
- kontak
- email
- website

BRANDING

- logo desa
- logo kabupaten
- favicon

KONFIGURASI SURAT

- singkatan desa
- singkatan jabatan

Jangan membuat field surat lainnya
yang belum ditentukan architecture.

============================================================
DEPENDENT SELECT
============================================================

Jika UI menggunakan dropdown:

Provinsi
↓
Kabupaten
↓
Kecamatan
↓
Desa

Ketika parent berubah:

reset child selection yang invalid.

Jangan mengirim:

desa yang tidak termasuk kecamatan.

Backend tetap harus memvalidasi hierarchy.

============================================================
API SECURITY
============================================================

Semua write operation harus:

authenticate
↓
authorize(permission)
↓
validate
↓
service
↓
database
↓
audit

Jangan:

frontend → database

============================================================
SERVICE LAYER
============================================================

Jangan menaruh seluruh business logic
di route handler.

Gunakan struktur yang konsisten dengan project.

Contoh konseptual:

route
↓
middleware
↓
controller
↓
service
↓
repository/Prisma
↓
database

Ikuti struktur existing.

Jangan membuat arsitektur paralel.

============================================================
ERROR HANDLING
============================================================

Gunakan error format yang sudah ditentukan project.

Minimal:

NOT_FOUND
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
CONFLICT
INTERNAL_ERROR

Jangan expose Prisma raw error ke client.

============================================================
TESTING — API
============================================================

WAJIB test:

1. create province jika endpoint tersedia
2. duplicate province code
3. create regency with valid province
4. invalid province reference
5. create district with valid regency
6. invalid regency reference
7. create village with valid district
8. invalid district reference
9. create village identity
10. duplicate village identity
11. update village identity
12. invalid email
13. invalid URL
14. unauthorized write
15. forbidden write
16. authorized write
17. audit generated
18. relational lookup

============================================================
TESTING — SECURITY
============================================================

Pastikan:

Citizen tidak dapat melakukan administrative write.

Admin hanya dapat melakukan permission yang diberikan.

Pimpinan hanya dapat melakukan permission yang diberikan.

Developer mengikuti permission model.

Tidak ada endpoint write yang hanya dilindungi frontend.

============================================================
TESTING — E2E
============================================================

Playwright minimal:

1. Login Admin
2. Buka Master Wilayah
3. Lihat hierarchy
4. Buka Identitas Desa
5. Load data melalui API
6. Update data yang diizinkan
7. Simpan
8. Reload
9. Pastikan data tetap ada
10. Logout

Citizen:

Pastikan citizen tidak dapat membuka administrative
master-data write page.

============================================================
NO-HARDCODE AUDIT
============================================================

Cari source code:

"Seruni Mumbul"
"Pringgabaya"
"Lombok Timur"
"Nusa Tenggara Barat"

dan nilai wilayah lain yang seharusnya berasal
dari database.

Jika ditemukan:

1. tentukan apakah hanya fixture/test/documentation;
2. jika business logic/UI production → ubah menjadi database-driven;
3. jika test fixture → dokumentasikan.

============================================================
ERD UPDATE
============================================================

Update:

docs/architecture/04-MASTER-ERD.md

Tambahkan:

Provinsi
Kabupaten
Kecamatan
Desa
IdentitasDesa

dan seluruh relationship.

Jangan menghapus relationship Phase 2.

WAJIB memastikan:

CitizenSession
CitizenVerification
Account
Role
Permission
AuditLog

tetap valid setelah penambahan Master Data.

============================================================
CREATE PHASE DOCUMENTATION
============================================================

Buat:

docs/architecture/phase-3a/

01-WILAYAH-MODEL.md
02-IDENTITAS-DESA-MODEL.md
03-WILAYAH-API.md
04-IDENTITAS-DESA-API.md
05-PHASE-3A-ERD.md
06-PHASE-3A-RBAC.md

============================================================
VALIDATION
============================================================

Buat:

docs/development/PHASE-3A-VALIDATION.md

Format:

PHASE:
3A — WILAYAH + IDENTITAS DESA

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

API:
PASS / FAIL

RBAC:
PASS / FAIL

AUDIT:
PASS / FAIL

FRONTEND:
PASS / FAIL

SECURITY:
PASS / FAIL

NO-HARDCODE:
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

Phase 3A hanya PASS apabila:

[ ] Provinsi implemented
[ ] Kabupaten implemented
[ ] Kecamatan implemented
[ ] Desa implemented
[ ] IdentitasDesa implemented
[ ] Relations valid
[ ] Foreign keys valid
[ ] Unique constraints valid
[ ] Indexes valid
[ ] Prisma migration PASS
[ ] Prisma generate PASS
[ ] API PASS
[ ] Validation PASS
[ ] RBAC PASS
[ ] Audit PASS
[ ] Frontend PASS
[ ] Playwright PASS
[ ] Jest/API tests PASS
[ ] TypeScript PASS
[ ] Lint PASS
[ ] Build PASS
[ ] Phase 2 regression PASS
[ ] ERD updated
[ ] Documentation updated
[ ] No-hardcode audit PASS
[ ] No business module created
[ ] No duplicate identity created

============================================================
PHASE 2 REGRESSION CHECK
============================================================

Setelah implementasi:

JALANKAN ULANG seluruh test Phase 2.

Pastikan:

Citizen NIK + OTP masih PASS.

Internal Admin login masih PASS.

Internal Pimpinan login masih PASS.

Internal Developer login masih PASS.

Authorization masih PASS.

Audit authentication masih PASS.

Tidak ada perubahan behavior yang tidak
didokumentasikan.

============================================================
ARCHITECTURE CHANGE RULE
============================================================

Jika ditemukan bahwa Phase 3A membutuhkan perubahan
terhadap:

- Architecture Baseline
- Master ERD
- RBAC
- Authentication
- API contract
- Database decision

JANGAN diam-diam mengubahnya.

STOP.

Dokumentasikan:

CONFLICT
IMPACT
PROPOSED CHANGE
REASON
AFFECTED DOCUMENTS

dan laporkan.

============================================================
FINAL REPORT
============================================================

Setelah semua selesai, tampilkan:

PHASE:
3A — WILAYAH + IDENTITAS DESA

STATUS:
PASS / BLOCKED

IMPLEMENTED:
[list]

DATABASE:
PASS / FAIL

ERD:
PASS / FAIL

API:
PASS / FAIL

RBAC:
PASS / FAIL

AUDIT:
PASS / FAIL

FRONTEND:
PASS / FAIL

TESTING:
PASS / FAIL

SECURITY:
PASS / FAIL

NO-HARDCODE:
PASS / FAIL

PHASE 2 REGRESSION:
PASS / FAIL

BUILD:
PASS / FAIL

DOCUMENTATION:
PASS / FAIL

ARCHITECTURE CHANGE:
NONE / [list]

BLOCKERS:
[list]

VALIDATION:
docs/development/PHASE-3A-VALIDATION.md

============================================================
STOP CONDITION
============================================================

SETELAH PHASE 3A PASS:

STOP.

JANGAN MEMULAI PHASE 3B.

JANGAN membuat:

Penduduk
Keluarga
Perangkat Desa
Surat
Template Surat
Workflow
RPJMDes
RKPDes
APBDes
Voting
BUMDes
PBB

Tunggu instruksi berikutnya.

============================================================
END PHASE 3A
============================================================
