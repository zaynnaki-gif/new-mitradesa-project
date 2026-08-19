============================================================
MITRADESA — PHASE 3B
STEP 2 — DATABASE DESIGN & MIGRATION
============================================================

STATUS:

STEP 1 — SYSTEM AUDIT
PASS

AUDIT REPORT:

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

MULAI STEP 2 SEKARANG.

============================================================
OBJECTIVE
============================================================

Finalisasi database foundation untuk:

1. Penduduk
2. Keluarga
3. AnggotaKeluarga
4. Integrasi Penduduk dengan CitizenVerification
5. Integrasi Penduduk dengan CitizenSession
6. Integrasi dengan Desa existing

STEP 2 HANYA fokus pada:

DATABASE
PRISMA
ERD
MIGRATION
CONSTRAINT
INDEX
RELATIONSHIP INTEGRITY

JANGAN mengerjakan:

API
Frontend
RBAC
Workflow
Surat
Perangkat Desa
Notifikasi
WhatsApp
RPJMDes
RKPDes
APBDes

============================================================
MANDATORY READ
============================================================

WAJIB membaca:

docs/architecture/ARCHITECTURE-BASELINE.md

docs/architecture/03-DATABASE-BLUEPRINT.md

docs/architecture/04-MASTER-ERD.md

docs/architecture/12-NO-HARDCODE-POLICY.md

docs/development/PHASE-3B-STEP-1-SYSTEM-AUDIT.md

apps/api/prisma/schema.prisma

SELURUH migration existing.

============================================================
CRITICAL FINDING
============================================================

Audit menemukan:

CURRENT:

Keluarga.nikKepala
VARCHAR(16)
→ Penduduk.nik

EXPECTED:

Keluarga.kepalaId
BIGINT
→ Penduduk.id

WAJIB DIPERBAIKI.

NIK TIDAK BOLEH menjadi relational FK internal.

NIK adalah:

BUSINESS IDENTIFIER

- PII

PK internal:

Penduduk.id

BIGINT AUTO_INCREMENT.

============================================================
NON-NEGOTIABLE IDENTITY RULE
============================================================

Gunakan:

Penduduk.id
BIGINT

sebagai internal relational identity.

Gunakan:

Penduduk.nik
VARCHAR/String 16 digit
UNIQUE

sebagai citizen business identifier.

JANGAN membuat:

FK → Penduduk.nik

untuk relationship internal baru.

JANGAN menggunakan:

NIK sebagai PK.

JANGAN membuat:

Citizen table baru.

============================================================
TARGET RELATIONAL MODEL
============================================================

Target:

Desa
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

Dan:

Keluarga
│
├── AnggotaKeluarga
│ │
│ └── Penduduk
│
└── kepalaId
│
└── Penduduk.id

============================================================
PENDUDUK MODEL
============================================================

Finalisasi model Penduduk.

Primary key:

id
BIGINT AUTO_INCREMENT

NIK:

nik
String/VARCHAR
exactly 16 digit
UNIQUE
NOT NULL

JANGAN menggunakan NIK sebagai PK.

Penduduk harus memiliki relation ke Desa existing.

Gunakan FK ke:

Desa.id

Jika actual schema menggunakan naming berbeda,
ikuti actual schema.

JANGAN membuat duplicate Desa/Village.

============================================================
PENDUDUK DATA DESIGN
============================================================

Sebelum menambah setiap field:

Tanyakan:

1. Apakah diwajibkan DATABASE BLUEPRINT?
2. Apakah diperlukan untuk identity?
3. Apakah membutuhkan master/reference?
4. Apakah field tersebut sudah tersedia di schema?
5. Apakah field tersebut akan digunakan domain berikutnya?

JANGAN menambahkan field hanya karena "umumnya
data penduduk memiliki field tersebut".

============================================================
MASTER DATA GAP
============================================================

Audit menemukan:

Agama
Pendidikan
Pekerjaan
dan master lainnya

belum tersedia.

JANGAN membuat hardcoded enum/list.

Untuk Phase 3B:

Jika field membutuhkan master data yang belum tersedia,
JANGAN membuat random master table.

Dokumentasikan:

MASTER DATA GAP

di:

docs/development/PHASE-3B-STEP-2-MASTER-DATA-GAPS.md

Format:

FIELD
REASON
REQUIRED MASTER
CURRENT STATE
FUTURE PHASE
IMPACT

Namun jika field tersebut sudah ditentukan secara
eksplisit oleh DATABASE BLUEPRINT sebagai enum/reference,
ikuti blueprint.

============================================================
KELUARGA MODEL
============================================================

Finalisasi:

Keluarga

Primary key:

id
BIGINT AUTO_INCREMENT

Nomor KK:

nomorKk
UNIQUE
NOT NULL
PII protected

Kepala keluarga:

kepalaId
BIGINT
FK → Penduduk.id

JANGAN:

nikKepala
FK → Penduduk.nik

Jika kolom lama:

nikKepala

masih digunakan:

REFACTOR.

Jangan mempertahankan duplicate relationship.

============================================================
KEPALA KELUARGA
============================================================

Kepala keluarga harus merupakan Penduduk.

Relationship:

Keluarga.kepalaId
↓
Penduduk.id

Pastikan kepala keluarga juga merupakan anggota
dari Keluarga melalui AnggotaKeluarga jika business
rule memang demikian.

Jika constraint tersebut tidak dapat dibuat langsung
di database karena circular dependency:

gunakan service/database transaction validation.

Jangan membuat data inconsistent.

============================================================
ANGGOTA KELUARGA
============================================================

Implementasikan:

AnggotaKeluarga

PK:

id
BIGINT AUTO_INCREMENT

FK:

keluargaId
→ Keluarga.id

pendudukId
→ Penduduk.id

Keduanya menggunakan BIGINT.

JANGAN menggunakan:

nik
nomorKk

sebagai FK internal.

============================================================
DUPLICATE MEMBERSHIP
============================================================

Satu Penduduk tidak boleh memiliki duplicate
membership dalam Keluarga yang sama.

Buat unique constraint:

(keluargaId, pendudukId)

Jika architecture/business rule membutuhkan
history membership:

jangan membuat unique constraint yang menghalangi
historical records.

Analisis terlebih dahulu.

Jika history belum diperlukan Phase 3B:

gunakan unique constraint aktif.

Dokumentasikan keputusan.

============================================================
KEPALA KELUARGA CONSTRAINT
============================================================

Database harus mencegah atau service harus memastikan:

satu Keluarga
→ maksimal satu kepala keluarga.

Karena kepalaId berada di Keluarga:

secara struktural hanya ada satu.

Namun harus divalidasi bahwa:

kepalaId
merupakan Penduduk valid.

Dan jika business rule mensyaratkan:

kepalaId
harus menjadi anggota keluarga tersebut.

Pastikan transaction menjamin konsistensi.

============================================================
CITIZEN VERIFICATION
============================================================

Audit menemukan CitizenVerification existing.

Sekarang evaluasi:

Bagaimana model tersebut mengidentifikasi citizen?

Target:

CitizenVerification
↓
Penduduk.id

Jika saat ini menggunakan:

NIK string

jangan langsung menghapus field.

Analisis migration impact.

Jika memungkinkan:

tambahkan:

pendudukId
BIGINT
FK → Penduduk.id

kemudian migration data.

Jika database masih kosong:

gunakan clean migration.

Jika data development sudah ada:

buat migration aman.

============================================================
CITIZEN SESSION
============================================================

Target:

CitizenSession
↓
Penduduk.id

Jika CitizenSession saat ini hanya menyimpan NIK:

evaluasi apakah harus ditambahkan:

pendudukId

NIK boleh tetap digunakan sebagai authentication
input/reference sesuai architecture.

Tetapi relational identity harus:

pendudukId.

============================================================
OTP PLACEHOLDER
============================================================

Audit menemukan:

OTP service menggunakan:

BigInt(1)

placeholder.

STEP 2:

JANGAN memperbaiki service OTP.

Namun pastikan schema Penduduk memungkinkan
OTP/CitizenVerification nantinya memiliki FK
yang benar.

Catat:

OTP PLACEHOLDER REMAINS
OUT OF SCOPE FOR STEP 2

============================================================
SOFT DELETE
============================================================

Untuk master data historis, gunakan strategy
yang konsisten dengan Architecture Baseline.

Jangan otomatis menambahkan:

deletedAt

ke semua tabel.

Tentukan berdasarkan model.

Penduduk:

historical identity harus tetap dapat direferensikan.

Keluarga:

historical integrity harus tetap terjaga.

AnggotaKeluarga:

jangan menyebabkan historical relation hilang.

Jangan menggunakan CASCADE DELETE sembarangan.

============================================================
ON DELETE POLICY
============================================================

Review setiap FK:

Penduduk → Desa
Keluarga → Penduduk
AnggotaKeluarga → Keluarga
AnggotaKeluarga → Penduduk
CitizenVerification → Penduduk
CitizenSession → Penduduk

Untuk setiap FK tentukan:

RESTRICT
SET NULL
CASCADE

berdasarkan business semantics.

Jangan menggunakan CASCADE sebagai default.

============================================================
INDEX
============================================================

Pastikan index tersedia untuk query penting.

Minimal evaluasi:

Penduduk.nik
Penduduk.desaId
Keluarga.nomorKk
Keluarga.kepalaId
AnggotaKeluarga.keluargaId
AnggotaKeluarga.pendudukId

CitizenVerification.pendudukId
CitizenSession.pendudukId

JANGAN membuat index duplicate.

Periksa index existing sebelum menambahkan.

============================================================
UNIQUE
============================================================

Minimal:

Penduduk.nik UNIQUE

Keluarga.nomorKk UNIQUE

AnggotaKeluarga:

UNIQUE(keluargaId, pendudukId)

sesuai history policy.

============================================================
NULLABILITY
============================================================

Jangan menjadikan semua field:

NOT NULL

hanya agar schema terlihat rapi.

Tentukan berdasarkan:

business requirement
data source
historical data
migration compatibility

Dokumentasikan field optional.

============================================================
NAMING CONVENTION
============================================================

Ikuti naming convention existing.

Jangan mengganti:

snake_case
camelCase

secara arbitrer.

Contoh:

Jika existing menggunakan:

kepalaId

gunakan kepalaId.

Jika menggunakan:

kepala_id

ikuti existing convention.

Consistency > preference.

============================================================
MIGRATION SAFETY
============================================================

SEBELUM MIGRATION:

1. validate schema
2. inspect current DB
3. check migration history
4. check existing data

JANGAN:

prisma migrate reset
DROP DATABASE
TRUNCATE
DELETE production data

Jika database development kosong:

boleh migration normal.

Jika data existing:

gunakan migration-safe strategy.

============================================================
PRISMA VALIDATION
============================================================

WAJIB menjalankan:

prisma validate

prisma generate

dan migration command yang sesuai
dengan environment project.

JANGAN menganggap schema valid hanya karena
IDE tidak menunjukkan error.

============================================================
ERD UPDATE
============================================================

Update:

docs/architecture/04-MASTER-ERD.md

Buat:

docs/architecture/phase-3b/07-PHASE-3B-ERD.md

ERD wajib menunjukkan:

Provinsi
↓
Kabupaten
↓
Kecamatan
↓
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

Serta:

Keluarga
↓
kepalaId
↓
Penduduk

============================================================
ERD VALIDATION
============================================================

Pastikan ERD dan Prisma:

100% konsisten.

Tidak boleh ada:

ERD relationship
yang tidak ada di Prisma.

Prisma relationship
yang tidak terdokumentasi di ERD.

============================================================
MIGRATION VALIDATION
============================================================

Setelah migration:

cek:

FK
UNIQUE
INDEX
NULLABILITY
RELATION

Jika database PostgreSQL tersedia:

gunakan database inspection/read-only
untuk memastikan constraint benar-benar terbentuk.

============================================================
STEP 2 DOCUMENTATION
============================================================

Buat:

docs/development/PHASE-3B-STEP-2-DATABASE-VALIDATION.md

Isi:

## STATUS

PASS / BLOCKED

## PENDUDUK

PASS / FAIL

## KELUARGA

PASS / FAIL

## ANGGOTA KELUARGA

PASS / FAIL

## CITIZEN VERIFICATION

PASS / FAIL

## CITIZEN SESSION

PASS / FAIL

## FK INTEGRITY

PASS / FAIL

## UNIQUE

PASS / FAIL

## INDEX

PASS / FAIL

## SOFT DELETE / HISTORY

PASS / FAIL

## MIGRATION

PASS / FAIL

## PRISMA

PASS / FAIL

## ERD

PASS / FAIL

## MASTER DATA GAPS

NONE / LIST

## ARCHITECTURE CONFLICT

NONE / LIST

## FILES CREATED

LIST

## FILES MODIFIED

LIST

## MIGRATION CREATED

LIST

============================================================
CRITICAL STOP CONDITIONS
============================================================

STOP dan jangan lanjut jika ditemukan:

1. Penduduk PK bukan BIGINT
2. NIK bukan unique
3. Keluarga masih FK ke Penduduk.nik
4. Citizen identity duplicate
5. CitizenSession tidak dapat dikaitkan dengan
   Penduduk secara konsisten
6. FK circular dependency tidak dapat diselesaikan
7. Migration berpotensi kehilangan data
8. Existing Phase 2/3A migration rusak
9. Architecture Baseline harus diubah
10. Database existing harus di-reset

Jika salah satu terjadi:

BLOCKED.

Jangan improvisasi.

============================================================
SCOPE PROTECTION
============================================================

STEP 2 DILARANG membuat:

PerangkatDesa
Account ↔ Perangkat
Surat
JenisSurat
TemplateSurat
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
FINAL STOP
============================================================

SETELAH:

1. Prisma schema finalized
2. migration selesai
3. FK verified
4. unique verified
5. index verified
6. ERD updated
7. documentation created
8. validation report created

STOP.

JANGAN lanjut STEP 3.

JANGAN membuat API.

JANGAN membuat frontend.

JANGAN membuat test Phase 3B API.

Tunggu instruksi berikutnya.

============================================================
FINAL RESPONSE
============================================================

Tampilkan:

STEP:
3B — STEP 2 DATABASE DESIGN & MIGRATION

STATUS:
PASS / BLOCKED

PENDUDUK:
PASS / FAIL

KELUARGA:
PASS / FAIL

ANGGOTA KELUARGA:
PASS / FAIL

CITIZEN VERIFICATION:
PASS / FAIL

CITIZEN SESSION:
PASS / FAIL

FK:
PASS / FAIL

UNIQUE:
PASS / FAIL

INDEX:
PASS / FAIL

MIGRATION:
PASS / FAIL

PRISMA:
PASS / FAIL

ERD:
PASS / FAIL

MASTER DATA GAP:
NONE / LIST

ARCHITECTURE CONFLICT:
NONE / LIST

DATA LOSS RISK:
NONE / LIST

FILES CREATED:
LIST

FILES MODIFIED:
LIST

MIGRATIONS:
LIST

VALIDATION:
docs/development/PHASE-3B-STEP-2-DATABASE-VALIDATION.md

NEXT:
STOP — WAIT FOR INSTRUCTION
============================================================
