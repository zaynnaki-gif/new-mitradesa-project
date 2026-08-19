============================================================
MITRADESA — GLOBAL CODEBASE CHARACTER NORMALIZATION
PRE-FLIGHT EXECUTION CONTRACT
============================================================

STATUS:
MANDATORY PRE-FLIGHT BEFORE PHASE 4.5

============================================================
TUJUAN
============================================================

Sebelum melanjutkan Phase 4.5 Infrastructure & Validation Recovery,
AI AGENT WAJIB memastikan seluruh CODEBASE MITRADESA menggunakan
identifier, filename, directory name, import path, export name,
Prisma identifier, dan technical symbol yang konsisten dengan
karakter ASCII standar.

Masalah ini dianggap sebagai:

CODEBASE INTEGRITY ISSUE

Bukan sekadar masalah formatting.

Contoh masalah yang harus dicegah:

    kep流动人口.service.ts
    ref-status-kep流动人口.service.ts
    RefStatusKep流动人口Service
    refStatusKep流动人口Service
    prisma.refStatusKep流动人口

Identifier seperti di atas DILARANG.

============================================================
CRITICAL PRINCIPLE
============================================================

BAHASA BISNIS BOLEH INDONESIA.

TECHNICAL IDENTIFIER WAJIB ASCII.

Contoh:

BENAR:

    penduduk
    keluarga
    anggotaKeluarga
    perangkatDesa
    statusKependudukan
    refStatusKependudukan
    ref-status-kependudukan.service.ts

SALAH:

    流动人口
    Kep流动人口
    status流动人口
    refStatusKep流动人口
    kep流动人口.service.ts

Jangan menerjemahkan istilah bisnis Indonesia ke bahasa lain
hanya karena AI menemukan istilah asing dari dataset, library,
hasil autocomplete, atau context sebelumnya.

============================================================
ASCII-ONLY TECHNICAL IDENTIFIER POLICY
============================================================

Untuk seluruh technical identifier MITRADESA:

WAJIB:

A-Z
a-z
0-9
\_

dan separator filesystem/API yang normal:

- /

Contoh valid:

    ref-status-kependudukan.service.ts
    refStatusKependudukanService
    RefStatusKependudukanService
    status_kependudukan
    perangkat-desa
    perangkatDesa

DILARANG menggunakan:

Chinese
Japanese
Korean
Arabic
Cyrillic
Greek
Devanagari
Thai
emoji
atau karakter Unicode non-ASCII lainnya

dalam technical identifier.

============================================================
SCOPE YANG WAJIB DIAUDIT
============================================================

Audit seluruh:

1. Filename
2. Directory name
3. TypeScript filename
4. JavaScript filename
5. TSX filename
6. JSX filename
7. Class name
8. Interface name
9. Type name
10. Function name
11. Variable name
12. Constant name
13. Prisma model
14. Prisma field
15. Prisma relation accessor
16. Enum identifier
17. Export name
18. Import name
19. Import path
20. Service name
21. Router name
22. DTO name
23. Middleware name
24. Hook name
25. Component name
26. Test identifier
27. API route technical segment
28. Audit entityType
29. Permission key
30. Configuration key
31. Environment variable
32. Database table technical name
33. Database column technical name
34. Script name
35. Generated-source references
36. Documentation references terhadap technical identifier

============================================================
IMPORTANT DISTINCTION
============================================================

Unicode pada DATA BISNIS bukan masalah.

Contoh data database:

    nama = "Bambang Nurdiansyah"

boleh.

Text UI:

    "Penduduk"

boleh.

Documentation prose:

    "Kependudukan"

boleh.

Yang DILARANG adalah Unicode di technical identifier.

============================================================
LANGUAGE NORMALIZATION
============================================================

MITRADESA menggunakan istilah bahasa Indonesia sebagai
business terminology utama.

Jika AI menemukan istilah asing yang masuk ke technical identifier,
normalisasi ke istilah Indonesia yang sudah digunakan oleh
Architecture Baseline.

Contoh:

SALAH:

    ref-status-kep流动人口.service.ts

NORMAL:

    ref-status-kependudukan.service.ts

SALAH:

    RefStatusKep流动人口Service

NORMAL:

    RefStatusKependudukanService

SALAH:

    refStatusKep流动人口

NORMAL:

    refStatusKependudukan

Jangan membuat istilah baru jika istilah yang benar sudah ada
di Architecture Baseline atau schema.

============================================================
MANDATORY PRE-FLIGHT AUDIT
============================================================

SEBELUM mengubah file:

1. Audit git status.
2. Audit current branch.
3. Audit seluruh source tree.
4. Audit filename.
5. Audit directory.
6. Audit TypeScript identifier.
7. Audit Prisma schema.
8. Audit import/export.
9. Audit route.
10. Audit service.
11. Audit DTO.
12. Audit tests.
13. Audit documentation references.
14. Audit generated output.
15. Audit dist/build artifacts jika ada.

Jangan langsung melakukan replacement massal.

============================================================
EXCLUDE DIRECTORIES
============================================================

Jangan memodifikasi dependency pihak ketiga.

Minimal exclude:

    node_modules/
    .git/
    .next/
    dist/
    build/
    coverage/

Jika generated artifact memiliki identifier invalid,
jangan memperbaiki source generated secara manual.

Perbaiki SOURCE lalu regenerate artifact.

============================================================
DETECTION
============================================================

Cari seluruh karakter non-ASCII pada:

    apps/api/src
    apps/web/src
    apps/api/prisma
    tests
    scripts
    configuration files

Kemudian cari filename/directory non-ASCII di seluruh project
dengan pengecualian dependency dan generated directories.

Gunakan tooling yang sesuai dengan Windows/PowerShell.

Jangan mengandalkan visual inspection saja.

============================================================
SAFE NORMALIZATION RULE
============================================================

Jangan melakukan:

    regex replacement global
    blind find-and-replace
    transliteration otomatis tanpa validasi
    rename massal tanpa dependency analysis

Setiap rename harus dianalisis terhadap:

    import
    export
    route
    Prisma accessor
    service registry
    test
    documentation
    script
    barrel export

============================================================
RENAME PROCEDURE
============================================================

Jika ditemukan filename invalid:

1. Tentukan nama Indonesia yang benar.
2. Pastikan tidak terjadi collision.
3. Rename source file.
4. Update seluruh import.
5. Update seluruh export.
6. Update service registry.
7. Update route references.
8. Update tests.
9. Update documentation.
10. Search ulang stale reference.
11. Build/check kembali.

Contoh:

SEBELUM:

    ref-status-kep流动人口.service.ts

SESUDAH:

    ref-status-kependudukan.service.ts

============================================================
IDENTIFIER PROCEDURE
============================================================

Jika ditemukan:

    RefStatusKep流动人口Service

ubah menjadi:

    RefStatusKependudukanService

Jika ditemukan:

    refStatusKep流动人口Service

ubah menjadi:

    refStatusKependudukanService

Jika ditemukan Prisma accessor:

    prisma.refStatusKep流动人口

ubah menjadi accessor sesuai nama Prisma model yang
valid dan konsisten dengan schema.

Jangan menggunakan:

    (prisma as any)

sebagai solusi.

============================================================
PRISMA RULE
============================================================

Prisma identifier WAJIB ASCII.

Periksa:

    model
    field
    relation
    enum
    mapped name
    generated accessor

Jika database physical table/column menggunakan nama lain
karena @map atau @@map, jangan mengubah database hanya
untuk normalization kecuali memang diperlukan dan telah
ditentukan Architecture Baseline.

Prioritas:

    Prisma technical identifier = ASCII
    Database physical name = mengikuti architecture/schema

============================================================
API RULE
============================================================

API technical path WAJIB ASCII.

Contoh:

    /api/reference/status-kependudukan

BENAR.

Jangan:

    /api/reference/流动人口

Namun value yang dikirim melalui JSON boleh menggunakan
bahasa Indonesia.

============================================================
RBAC RULE
============================================================

Permission key WAJIB ASCII.

Contoh:

    penduduk.view
    keluarga.view
    perangkat_desa.view
    reference.view

DILARANG:

    penduduk.流动人口
    perangkat.流动人口

============================================================
AUDIT RULE
============================================================

Audit event/entityType technical identifier WAJIB ASCII.

Contoh:

    PENDUDUK_CREATED
    KELUARGA_CREATED
    REFERENCE_UPDATED
    ref_status_kependudukan

Tidak boleh:

    REFERENCE_流动人口
    ref_status_流动人口

============================================================
DOCUMENTATION RULE
============================================================

Dokumentasi boleh menggunakan Unicode untuk kalimat biasa.

Tetapi ketika menulis:

    filename
    class
    function
    variable
    Prisma model
    API route
    permission
    environment variable

gunakan identifier yang benar-benar digunakan codebase.

Jangan mendokumentasikan nama lama setelah rename.

============================================================
STALE REFERENCE AUDIT
============================================================

Setelah normalization:

Cari seluruh nama lama.

Contoh jika sebelumnya:

    kep流动人口

maka search:

    kep流动人口

harus menghasilkan:

    ZERO RESULTS

Lakukan juga terhadap seluruh variant:

    kep流动人口
    Kep流动人口
    refStatusKep流动人口
    ref-status-kep流动人口
    ref_status_kep流动人口

============================================================
DUPLICATE MODULE AUDIT
============================================================

Pastikan rename tidak menghasilkan:

    old-file.ts
    new-file.ts

yang sebenarnya adalah module yang sama.

Jika duplicate ditemukan:

1. tentukan canonical module;
2. hapus duplicate hanya jika aman;
3. update imports;
4. pastikan tidak ada stale reference.

Jangan menghapus file secara membabi buta.

============================================================
SOURCE OF TRUTH
============================================================

Untuk menentukan istilah technical yang benar,
gunakan urutan prioritas:

1. ARCHITECTURE-BASELINE.md
2. MASTER ERD
3. DATABASE BLUEPRINT
4. Prisma schema
5. API Blueprint
6. existing canonical source code
7. documentation Phase terkait

Jangan membuat istilah baru jika canonical terminology
sudah tersedia.

============================================================
VALIDATION
============================================================

Setelah normalization lakukan:

1. Search non-ASCII identifiers
2. Search non-ASCII filenames
3. Search non-ASCII directories
4. Search stale references
5. Search duplicate modules
6. Prisma validate
7. Prisma generate jika diperlukan
8. TypeScript build
9. Jest discovery
10. Relevant tests

Jika build/test gagal karena masalah existing yang tidak
berhubungan dengan normalization:

JANGAN mengklaim normalization gagal.

Pisahkan:

    NORMALIZATION RESULT
    PRE-EXISTING BUILD RESULT
    PRE-EXISTING TEST RESULT

============================================================
PROHIBITED FIXES
============================================================

DILARANG:

1. Menggunakan `any` untuk menutupi error.
2. Menggunakan @ts-ignore.
3. Menggunakan @ts-expect-error.
4. Menghapus test.
5. Men-disable strict mode.
6. Mengubah architecture.
7. Mengubah business logic.
8. Mengubah database business data.
9. Mengubah API contract tanpa alasan.
10. Menghapus model.
11. Membuat duplicate model.
12. Mengganti istilah Indonesia menjadi bahasa asing.
13. Mengubah dependency pihak ketiga.

============================================================
DATABASE SAFETY
============================================================

Character normalization ini TIDAK boleh mengubah:

    data penduduk
    NIK
    KK
    nama
    alamat
    data keluarga
    data wilayah

dan tidak boleh melakukan:

    DROP DATABASE
    TRUNCATE
    DELETE massal
    prisma migrate reset

Tanpa instruksi eksplisit.

============================================================
DOCUMENTATION
============================================================

Buat:

docs/development/
CODEBASE-CHARACTER-NORMALIZATION.md

Isi:

# MITRADESA CODEBASE CHARACTER NORMALIZATION

## STATUS

PASS / BLOCKED

## FILES SCANNED

jumlah aktual.

## DIRECTORIES SCANNED

jumlah aktual.

## INVALID IDENTIFIERS FOUND

jumlah aktual.

## INVALID FILENAMES FOUND

jumlah aktual.

## INVALID DIRECTORIES FOUND

jumlah aktual.

## RENAMES

daftar before → after.

## IMPORTS FIXED

jumlah aktual.

## EXPORTS FIXED

jumlah aktual.

## PRISMA REFERENCES FIXED

jumlah aktual.

## ROUTES FIXED

jumlah aktual.

## RBAC REFERENCES FIXED

jumlah aktual.

## AUDIT REFERENCES FIXED

jumlah aktual.

## STALE REFERENCES

jumlah aktual.

## DUPLICATE MODULES

jumlah aktual.

## PRISMA VALIDATE

PASS / FAIL

## BUILD

PASS / FAIL / BLOCKED

## TESTS

PASS / FAIL / BLOCKED

## DATABASE CHANGES

NONE / list actual changes.

## ARCHITECTURE CHANGES

NONE / list actual changes.

## BUSINESS LOGIC CHANGES

NONE / list actual changes.

## SECURITY IMPACT

NONE / describe.

============================================================
FINAL VALIDATION RULE
============================================================

NORMALIZATION = PASS hanya jika:

1. Technical identifiers ASCII-only.
2. Filename ASCII-only.
3. Directory ASCII-only.
4. No stale invalid references.
5. No duplicate modules.
6. Prisma identifiers valid.
7. Imports valid.
8. Exports valid.
9. API technical paths valid.
10. RBAC keys valid.
11. Audit identifiers valid.
12. No business logic changed.
13. No architecture changed.
14. No data loss.
15. Prisma validate PASS.

Build dan test harus dilaporkan secara terpisah jika
memang sudah memiliki pre-existing blocker.

============================================================
MANDATORY STOP
============================================================

SETELAH NORMALIZATION SELESAI:

STOP.

JANGAN:

- menjalankan Phase 4.5
- membuat Phase 5
- membuat Surat
- membuat Template Engine
- membuat QR TTE
- membuat WhatsApp
- membuat RPJMDes
- membuat RKPDes
- membuat APBDes
- membuat domain baru

Kirim:

CODEBASE CHARACTER NORMALIZATION FINAL REPORT

saja.

============================================================
IMPORTANT
============================================================

Jangan percaya laporan normalization sebelumnya.

Verifikasi ulang PROJECT AKTUAL.

Jangan menyatakan:

    "ASCII-only"

hanya karena laporan sebelumnya mengatakan demikian.

Lakukan scan aktual terhadap filesystem dan source code.

Jika ditemukan bahkan SATU technical identifier,
filename, directory, import, export, Prisma identifier,
API technical path, RBAC key, atau audit identifier
yang menggunakan karakter non-ASCII:

STATUS = BLOCKED

Perbaiki terlebih dahulu.

============================================================
END OF PRE-FLIGHT CONTRACT
============================================================
