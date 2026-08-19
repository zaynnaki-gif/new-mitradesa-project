============================================================
MITRADESA — INFRASTRUCTURE STABILIZATION
TYPESCRIPT ERROR REPAIR CONTRACT
============================================================

STATUS:
Prisma Client sudah berhasil di-generate.

Environment:
D:\mitradesa\apps\api

Verified:

- Prisma generate: PASS
- Prisma validate: PASS
- Prisma Client: FRESH
- Database schema validation: PASS

Current TypeScript status:
58 errors in 18 files.

OBJECTIVE:
Memperbaiki SELURUH TypeScript compilation errors yang tersisa
TANPA mengubah arsitektur, business logic, database design,
API contract, security model, RBAC, atau domain behavior yang
sudah disetujui pada Phase sebelumnya.

============================================================

1. # ABSOLUTE RULES

WAJIB:

1. Audit error terlebih dahulu sebelum melakukan perubahan.
2. Perbaiki root cause, bukan sekadar menghilangkan error.
3. Gunakan Prisma Client hasil `npx prisma generate` sebagai
   source of truth untuk tipe database.
4. Jangan menggunakan `any` sebagai solusi umum.
5. Jangan menggunakan @ts-ignore.
6. Jangan menggunakan @ts-expect-error kecuali benar-benar
   diperlukan dan harus didokumentasikan.
7. Jangan menonaktifkan strict mode.
8. Jangan mengubah noUnusedLocals/noUnusedParameters hanya
   untuk menghilangkan error.
9. Jangan menghapus validasi keamanan.
10. Jangan menghapus middleware authentication.
11. Jangan menghapus middleware authorization/RBAC.
12. Jangan menghapus audit logging.
13. Jangan mengubah struktur database tanpa alasan yang
    benar-benar diperlukan.
14. Jangan membuat migration baru untuk memperbaiki error
    TypeScript.
15. Jangan mengubah API endpoint yang sudah ada.
16. Jangan mengubah nama model Prisma yang sudah ada.
17. Jangan membuat duplicate service/module.
18. Jangan membuat file dengan karakter Unicode/non-ASCII
    pada technical identifier, filename, directory, class,
    function, variable, Prisma identifier, route, permission,
    atau audit identifier.
19. Technical identifiers WAJIB ASCII-only.
20. Jangan melanjutkan ke Phase 5 atau domain baru.

============================================================ 2. ARCHITECTURE FREEZE
============================================================

Anggap seluruh pekerjaan berikut sebagai ARCHITECTURE FROZEN:

Phase 2:

- Account
- Role
- Permission
- AccountRole
- RolePermission
- CitizenVerification
- OtpChallenge
- CitizenSession
- InternalSession
- AuditLog
- Authentication
- RBAC

Phase 3A:

- Provinsi
- Kabupaten
- Kecamatan
- Desa
- IdentitasDesa

Phase 3B:

- Penduduk
- Keluarga
- AnggotaKeluarga
- PerangkatDesa

Phase 4:

- Reference data
- RefAgama
- RefGolDarah
- RefStatusPerkawinan
- RefHubunganKeluarga
- RefStatusKependudukan
- RefPendidikan
- RefPekerjaan
- RefJabatanPerangkat
- RefStatusPerangkat

JANGAN redesign model-model tersebut.

============================================================ 3. CURRENT ERROR INVENTORY
============================================================

Perbaiki error berdasarkan kategori berikut.

A. UNUSED IMPORTS / PARAMETERS
B. EXPRESS RETURN TYPE ERRORS
C. AUTH/RBAC ERRORS
D. PRISMA RELATION TYPE ERRORS
E. SERVICE SIGNATURE MISMATCH
F. DTO TYPE MISMATCH
G. GENERIC REFERENCE SERVICE ERRORS
H. TEST CONFIGURATION
I. RESPONSE UTILITY TYPE ERROR

Jangan menganggap semua error memiliki akar masalah yang sama.

============================================================ 4. PRIORITY ORDER
============================================================

Kerjakan dengan urutan:

STEP A
Prisma/type foundation

STEP B
Core middleware

STEP C
Authentication/RBAC

STEP D
Services

STEP E
Routes

STEP F
DTO/response utilities

STEP G
Test configuration

STEP H
Final compilation

============================================================ 5. PRISMA RULE
============================================================

Karena Prisma Client baru saja berhasil dibuat:

JANGAN:

- membuat schema baru
- mengganti relation hanya agar TypeScript PASS
- menghapus include
- mengganti BigInt menjadi string
- mengganti FK
- menggunakan `(prisma as any)`
- menggunakan dynamic Prisma access yang menghilangkan type safety

Gunakan schema Prisma yang SEKARANG ADA sebagai source of truth.

Jika TypeScript menunjukkan:

include: never

atau:

Property X does not exist

maka:

1. buka schema.prisma
2. verifikasi relation yang benar
3. verifikasi generated Prisma type
4. sesuaikan query dengan relation yang BENAR

Jangan mengarang relation.

============================================================ 6. AUTH SERVICE REPAIR
============================================================

Error:

auth.service.ts

include: { account: true }

include: never

dan:

account.status
account.accountRoles
account.id
account.username
account.email

WAJIB dianalisis terhadap model Prisma aktual.

Pastikan:

- relation benar-benar ada
- nama relation sesuai Prisma
- include nested sesuai schema
- hasil query memiliki tipe yang benar

Jangan menggunakan `as any`.

Authentication behavior harus tetap sama.

============================================================ 7. IDENTITAS DESA SERVICE
============================================================

Error:

identitas-desa.service.ts

- provinsi tidak valid di KecamatanInclude
- identitasDesa tidak tersedia
- kecamatan tidak tersedia

WAJIB:

1. periksa schema Prisma
2. periksa relation Desa → Kecamatan
3. periksa relation Kecamatan → Kabupaten
4. periksa relation Kabupaten → Provinsi
5. periksa relation Desa → IdentitasDesa
6. sesuaikan query include dengan relation aktual

JANGAN menambahkan relation baru hanya untuk membuat compile PASS
kecuali relation tersebut memang sudah menjadi bagian dari
architecture baseline.

Jika service menggunakan relation yang tidak ada lagi karena
schema telah berubah, sesuaikan service terhadap schema aktual.

============================================================ 8. KELUARGA ROUTE
============================================================

Error:

Expected 1 arguments, but got 4.

Pada:

req.user?.accountId,
req.ip,
req.headers['user-agent']

WAJIB:

1. buka service method yang dipanggil
2. identifikasi signature aktual
3. identifikasi parameter yang sebenarnya diperlukan
4. jangan menghapus audit/security context secara sembarangan
5. jika accountId/IP/user-agent memang diperlukan audit,
   teruskan melalui struktur parameter yang sesuai.

Jangan hanya menghapus 3 parameter untuk membuat compiler PASS.

============================================================ 9. MIDDLEWARE
============================================================

Error:

Not all code paths return a value.

Jangan menyelesaikan dengan mengubah behavior middleware.

Pastikan:

- successful next() tetap berjalan
- unauthorized tetap menghasilkan response
- forbidden tetap menghasilkan response
- error tetap diteruskan/dikembalikan sesuai architecture
- middleware tetap kompatibel dengan Express

Untuk parameter yang memang tidak digunakan:

ubah secara aman sesuai konfigurasi TypeScript/Express,
tanpa menonaktifkan compiler checks secara global.

============================================================ 10. UNUSED PARAMETERS / IMPORTS
============================================================

Untuk error seperti:

'Router' is declared but never read
'req' is declared but never read
'res' is declared but never read
'config' is declared but never read
'z' is declared but never read

WAJIB:

- hapus import yang benar-benar tidak digunakan
- hapus parameter yang memang tidak diperlukan jika signature
  memungkinkan
- atau gunakan parameter secara legitimate jika sebenarnya
  dibutuhkan

JANGAN:

- menambahkan kode dummy
- console.log dummy
- void variable hanya untuk membungkam compiler
- disable compiler rule

============================================================ 11. OTP SERVICE
============================================================

Periksa:

- config tidak digunakan
- COOLDOWN_MINUTES tidak digunakan
- ipAddress tidak digunakan
- userAgent tidak digunakan

Jangan menghapus security behavior.

Jika cooldown memang merupakan bagian dari security requirement,
implementasikan secara benar.

Jika IP/user-agent memang diperlukan untuk audit/security,
pastikan digunakan secara konsisten.

============================================================ 12. PENDUDUK SERVICE
============================================================

Error:

tanggalLahir:
string | null

sedangkan DTO:

tanggalLahir: string

WAJIB mengikuti database semantics.

Jika tanggalLahir memang nullable di database:

DTO/response type harus mencerminkan nullable state.

Jangan memalsukan nilai dengan:

""
"0000-00-00"
new Date()

Jangan mengubah database hanya untuk menghilangkan error ini.

============================================================ 13. REFERENCE SERVICE
============================================================

Error:

unused generic T
unused tableName
unused kode
unused skip

ReferenceService masih memiliki template/generic method.

WAJIB:

- audit apakah method benar-benar digunakan
- jika method memang diperlukan, implementasikan dengan benar
- jika method adalah dead code/template yang tidak digunakan,
  hapus secara aman

Jangan mempertahankan generic abstraction kosong hanya demi
architecture appearance.

Namun:

JANGAN menghapus service yang digunakan oleh reference domain.

============================================================ 14. RESPONSE UTILITY
============================================================

Error:

Spread types may only be created from object types.

Pada:

...(details && { details })

WAJIB memperbaiki typing secara type-safe.

Jangan menggunakan:

as any

atau

@ts-ignore

Pastikan response contract tetap konsisten.

============================================================ 15. TEST CONFIGURATION
============================================================

Error:

Cannot find name 'jest'
Cannot find name 'afterAll'

Pada:

src/config/test-setup.ts

WAJIB menentukan apakah file tersebut:

- seharusnya masuk compilation production
  atau
- hanya digunakan Jest.

Jika hanya Jest:

pisahkan konfigurasi TypeScript dengan benar.

Jangan memasukkan dependency test ke production runtime hanya
untuk membuat tsc PASS.

Jangan menghapus test setup.

============================================================ 16. API CONTRACT FREEZE
============================================================

JANGAN mengubah endpoint yang telah tersedia.

Contoh:

/api/auth/_
/api/penduduk/_
/api/keluarga/_
/api/perangkat-desa/_
/api/wilayah/_
/api/identitas-desa/_
/api/reference/\*

Tidak boleh ada breaking change.

============================================================ 17. SECURITY FREEZE
============================================================

Tidak boleh mengurangi:

- JWT authentication
- Citizen OTP
- RBAC
- Permission checks
- Rate limiting
- PII masking
- IDOR protection
- Audit logging
- Soft delete

Jangan expose:

- full NIK
- full KK
- password
- token
- OTP
- service credentials

============================================================ 18. CHARACTER NORMALIZATION
============================================================

WAJIB ASCII ONLY untuk:

- filenames
- directories
- TypeScript identifiers
- JavaScript identifiers
- Prisma model names
- Prisma fields
- API routes
- RBAC permissions
- audit event identifiers
- database technical identifiers
- imports
- exports

Contoh DILARANG:

kep流动人口.service.ts
RefStatusKep流动人口Service
refStatusKep流动人口
kep流动人口

Contoh BENAR:

ref-status-kependudukan.service.ts
RefStatusKependudukanService
refStatusKependudukan

Unicode hanya diperbolehkan pada:

- user-facing text
- documentation prose
- legitimate database content
- string literals yang memang merupakan data bahasa

Bukan technical identifiers.

============================================================ 19. VALIDATION AFTER EACH CATEGORY
============================================================

Setelah setiap kelompok perbaikan:

jalankan:

npx tsc --noEmit

Jangan menunggu semua perubahan selesai.

Catat:

BEFORE
58 errors

AFTER CATEGORY A
X errors

AFTER CATEGORY B
X errors

dst.

Tujuannya memastikan tidak ada error baru.

============================================================ 20. REQUIRED VALIDATION
============================================================

Setelah semua error diperbaiki:

1.

npx prisma validate

2.

npx prisma generate

3.

npx tsc --noEmit

Expected:

0 TypeScript errors.

Kemudian:

4. npm test

Jika test gagal karena database:

jangan menyatakan code PASS.

Catat secara eksplisit:

TEST BLOCKED — DATABASE UNAVAILABLE

atau error sebenarnya.

============================================================ 21. BUILD
============================================================

Setelah tsc PASS:

npm run build

Expected:

BUILD PASS.

Jika build gagal:

analisis root cause.

Jangan menyatakan PASS.

============================================================ 22. REGRESSION
============================================================

WAJIB memastikan tidak ada regression pada:

Phase 2:

- authentication
- citizen OTP
- internal login
- RBAC
- audit

Phase 3A:

- wilayah
- identitas desa

Phase 3B:

- penduduk
- keluarga
- anggota keluarga
- perangkat desa

Phase 4:

- reference data

============================================================ 23. DATABASE
============================================================

JANGAN menjalankan:

prisma migrate reset
prisma db push --force-reset
database reset
DROP DATABASE
DROP TABLE

Tidak boleh ada destructive operation.

Database existing harus dipertahankan.

============================================================ 24. GIT SAFETY
============================================================

Sebelum perubahan:

git status

Setelah perubahan:

git diff --stat
git diff

Jangan menghapus file yang tidak berkaitan.

Jangan melakukan git reset --hard.

Jangan melakukan git clean -fd.

============================================================ 25. DOCUMENTATION
============================================================

Buat:

docs/development/INFRASTRUCTURE-STABILIZATION-FINAL.md

Isi:

1. Initial error count
2. Root causes
3. Files modified
4. Error reduction per stage
5. Prisma validation
6. TypeScript validation
7. Build validation
8. Jest validation
9. Regression validation
10. Security validation
11. Character normalization validation
12. Remaining blockers jika ada

============================================================ 26. DEFINITION OF DONE
============================================================

Phase Infrastructure Stabilization hanya PASS jika:

[ ] Prisma generate PASS
[ ] Prisma validate PASS
[ ] TypeScript = 0 errors
[ ] Build PASS
[ ] Jest runs
[ ] Tests PASS
[ ] Regression PASS
[ ] No new security issue
[ ] No Unicode technical identifiers
[ ] No architecture changes
[ ] No API breaking changes
[ ] No database destructive changes
[ ] Documentation complete

Jika salah satu gagal:

STATUS = BLOCKED

Jangan mengklaim PASS.

============================================================ 27. FINAL REPORT FORMAT
============================================================

Jika berhasil:

# MITRADESA INFRASTRUCTURE STABILIZATION

## FINAL VALIDATION

STATUS: PASS

Prisma Generate: PASS
Prisma Validate: PASS
TypeScript: 0 errors
Build: PASS
Jest: PASS
Regression: PASS
Security: PASS
Character Normalization: PASS

Files Modified:
...

Architecture Changes:
NONE

Database Changes:
NONE

API Breaking Changes:
NONE

Remaining Issues:
NONE

============================================================

Jika masih ada error:

STATUS: BLOCKED

TypeScript Errors:
X

Build:
BLOCKED

Tests:
BLOCKED

Remaining Errors:
...

Root Causes:
...

Required Next Actions:
...

MANDATORY STOP.

============================================================ 28. ABSOLUTE STOP CONDITION
============================================================

SETELAH INFRASTRUCTURE STABILIZATION SELESAI:

STOP.

JANGAN:

- membuat Phase 5
- membuat domain baru
- membuat Surat
- membuat WhatsApp
- membuat QR TTE
- membuat marketplace
- membuat PBB
- membuat berita
- membuat pariwisata
- membuat RPJMDes
- membuat APBDes

Tunggu instruksi berikutnya.

============================================================
END OF EXECUTION CONTRACT
============================================================
