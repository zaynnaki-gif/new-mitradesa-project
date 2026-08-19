============================================================
MITRADESA — PHASE 0
GREENFIELD ARCHITECTURE & SYSTEM BLUEPRINT
============================================================

## ROLE

Anda bertindak sebagai Principal Software Architect dan Lead
System Designer untuk membangun aplikasi baru bernama:

MITRADESA
Manajemen Informasi dan Administrasi Desa

MITRADESA ADALAH GREENFIELD PROJECT.

PENTING:

Repository/codebase belum tersedia.

Database belum tersedia.

API belum tersedia.

Frontend belum tersedia.

Migration belum tersedia.

Jangan melakukan audit terhadap existing implementation.

Jangan menganggap ada tabel, API, route, service, component,
atau engine yang sudah tersedia.

Kita sedang membangun sistem DARI NOL.

============================================================
TUJUAN PHASE INI
============================================================

Phase ini BUKAN implementation phase.

Tujuan Phase 0 adalah menghasilkan BLUEPRINT LENGKAP yang
akan menjadi dasar pembangunan project.

Jangan menulis source code aplikasi.

Jangan membuat migration.

Jangan membuat endpoint implementation.

Jangan membuat frontend implementation.

Jangan membuat database fisik.

Jangan melakukan npm install.

Jangan melakukan deployment.

Hanya buat:

1. Architecture Specification
2. Domain Model
3. Database Blueprint
4. ERD
5. API Blueprint
6. RBAC Blueprint
7. Workflow Blueprint
8. Document Blueprint
9. Notification Blueprint
10. Audit Blueprint
11. No-Hardcode Policy
12. Development Rules
13. Implementation Roadmap
14. Definition of Done

============================================================
ATURAN ANTI-HALUSINASI
============================================================

RULE-001

Jangan mengklaim sesuatu sudah tersedia.

Karena project masih GREENFIELD, semua komponen dianggap:

NOT IMPLEMENTED.

---

RULE-002

Jika keputusan belum ditentukan dalam specification ini,
jangan mengarang.

Gunakan:

DECISION REQUIRED

---

RULE-003

Jangan membuat domain baru hanya karena menurut Anda menarik.

Jika Anda memiliki ide baru:

PROPOSED ENHANCEMENT

dan pisahkan dari architecture yang sudah disepakati.

---

RULE-004

Jangan membuat tabel hanya karena sebuah halaman membutuhkan
data.

Setiap tabel harus mempunyai:

- business purpose
- owner domain
- primary key
- foreign key
- relationship
- lifecycle
- data integrity rule

---

RULE-005

Jangan membuat duplicate master data.

Contoh:

Tidak boleh ada:

users
citizens
residents
village_users

yang semuanya menyimpan identitas orang yang sama.

Gunakan satu master entity yang tepat dan hubungkan dengan
relasi.

---

RULE-006

Tidak boleh hardcode business configuration.

Business configuration harus dirancang agar dapat berasal
dari database/configuration layer.

Contoh:

- role
- permission
- status
- jenis surat
- field surat
- kategori
- bidang
- program
- kegiatan
- satuan
- sumber dana
- workflow
- notification template
- numbering rule
- template document
- scoring rule

---

RULE-007

Jangan membuat entity yang sebenarnya hanya merupakan
attribute dari entity lain.

Gunakan normalisasi yang rasional.

---

RULE-008

Setiap relationship antar-domain harus mempunyai alasan bisnis
yang jelas.

============================================================
VISI MITRADESA
============================================================

MITRADESA bukan sekadar aplikasi administrasi desa.

MITRADESA dirancang sebagai:

INTEGRATED VILLAGE INFORMATION,
ADMINISTRATION,
PUBLIC SERVICE,
PARTICIPATORY PLANNING,
AND TRANSPARENCY PLATFORM.

Arsitektur harus memungkinkan sistem digunakan oleh:

1. Masyarakat
2. Admin/operator desa
3. Perangkat desa
4. Pimpinan desa
5. Pengelola modul
6. Publik

============================================================
MASTER DOMAIN
============================================================

Domain utama yang HARUS dipertimbangkan:

---

## A. MASTER DATA

1. Identitas Desa
2. Wilayah
3. Penduduk
4. Keluarga
5. Perangkat Desa
6. Akun
7. Role
8. Permission

---

## B. PELAYANAN

1. Jenis Surat
2. DNA/Field Definition Surat
3. Template Surat
4. Pengajuan Surat
5. Verifikasi
6. Approval
7. QR TTE
8. Registrasi Surat
9. Arsip Surat
10. Notifikasi

---

## C. PEMBANGUNAN DESA

1. RPJMDes
2. RKPDes
3. Usulan Online Masyarakat
4. Validasi Usulan
5. Voting Program/Kegiatan
6. Seleksi Program/Kegiatan
7. APBDes
8. Pendapatan
9. Belanja
10. Sumber Dana
11. Realisasi
12. Transparansi

---

## D. EKONOMI / DESA

1. PBB
2. BUMDes
3. UMKM
4. Pariwisata

Modul lain tidak boleh ditambahkan tanpa keputusan eksplisit.

---

## E. SHARED CORE ENGINE

1. Authentication
2. RBAC
3. Configuration Engine
4. Workflow Engine
5. Document Engine
6. Template Engine
7. Notification Engine
8. Audit Engine
9. Reporting Engine

============================================================
MASTER DATA RELATIONSHIP
============================================================

Target relationship konseptual:

IDENTITAS_DESA
│
└── WILAYAH
│
└── PENDUDUK
│
├── AKUN
│
├── USULAN MASYARAKAT
│
└── PENGAJUAN SURAT

PERANGKAT_DESA
│
└── AKUN
│
└── ROLE
│
└── PERMISSION

Pastikan relationship sebenarnya dijelaskan secara detail
dalam ERD.

============================================================
SURAT — TARGET BUSINESS FLOW
============================================================

USER
↓
Submit Pengajuan
↓
Notifikasi WhatsApp Admin
↓
Admin Verifikasi
↓
Preview Template
↓
┌───────────────┐
│ │
Tolak Terima
│ │
↓ ↓
Alasan Menunggu
Penolakan Tanda Tangan
│ │
↓ ↓
Notifikasi Notifikasi
User Pimpinan
│
↓
Pimpinan
│
┌───────┴───────┐
│ │
Tolak Terima
│ │
↓ ↓
Alasan Generate
Penolakan Nomor
│ Registrasi
↓ │
Notifikasi ↓
User QR TTE
│
↓
Generate Document
│
↓
WhatsApp Pemohon
│
↓
Arsip
│
↓
SELESAI

CATATAN PENTING:

TTE adalah QRCode.

Jangan membuat TTE sebagai entitas terpisah dari QRCode.

============================================================
ATURAN NOMOR SURAT
============================================================

Nomor urut surat:

BOLEH SAMA jika:

- kode surat berbeda
  ATAU
- jenis surat berbeda

Nomor urut TIDAK BOLEH SAMA jika:

kode surat sama

- jenis surat sama
- tahun sama.

Database harus dapat menegakkan aturan ini.

============================================================
REVISI SURAT
============================================================

Jika surat ditolak:

User
↓
Status Ditolak
↓
Lihat alasan penolakan
↓
Revisi
↓
Form Pengajuan Autofill
↓
Submit ulang
↓
Workflow baru / revision cycle

Desain harus menjaga audit trail dan histori versi.

============================================================
DNA SURAT
============================================================

Jenis surat harus dapat mempunyai DNA/field berbeda.

Jangan membuat:

surat_jenis_a memiliki kolom khusus hardcoded
surat_jenis_b memiliki kolom khusus hardcoded

Sebaliknya desain:

Jenis Surat
↓
Field Definition
↓
Field Type
↓
Validation
↓
Option
↓
Template Binding
↓
Form Rendering
↓
Document Rendering

Field harus dapat:

- text
- textarea
- number
- date
- datetime
- select
- multi-select
- checkbox
- radio
- boolean
- file
- image
- relation
- penduduk relation
- wilayah relation
- perangkat relation

Gunakan pendekatan database-driven.

============================================================
PERENCANAAN PEMBANGUNAN
============================================================

Target relationship:

RPJMDes
↓
Program
↓
RKPDes
↓
Kegiatan
↓
Usulan Masyarakat
↓
Validasi terhadap RPJMDes
↓
Voting
↓
Seleksi
↓
APBDes
↓
Realisasi

ATURAN:

Usulan masyarakat yang tidak mempunyai hubungan yang valid
dengan RPJMDes harus dapat ditolak secara otomatis sesuai
business rule.

Voting hanya untuk program/kegiatan yang eligible.

Hasil seleksi menjadi input APBDes.

Jangan membuat sistem penganggaran yang terlalu detail.

Minimal:

Pendapatan

- sumber dana
- nilai

Belanja

- bidang
- nama kegiatan
- volume
- satuan
- biaya
- sumber dana

============================================================
ERD REQUIREMENT
============================================================

Buat:

1. MASTER ERD
2. SURAT ERD
3. PLANNING ERD
4. CORE ENGINE ERD
5. FULL INTEGRATED ERD

Semua harus menggunakan Mermaid ERD.

FULL INTEGRATED ERD harus menunjukkan hubungan antar-domain.

Jangan membuat entity yang tidak diperlukan.

============================================================
API REQUIREMENT
============================================================

Buat API BLUEPRINT.

Belum perlu implementation.

Setiap API harus mempunyai:

- method
- route
- purpose
- actor
- authorization
- request
- response
- validation
- related entity
- error cases

Gunakan REST API convention yang konsisten.

============================================================
RBAC
============================================================

Rancang:

ACCOUNT
↓
ROLE
↓
PERMISSION

Role tidak boleh hardcoded.

Minimal pertimbangkan:

- masyarakat
- admin/operator
- perangkat desa
- pimpinan
- super admin

Tetapi jangan membuat role tambahan tanpa alasan.

============================================================
NOTIFICATION
============================================================

Notification harus menjadi shared engine.

Channel minimal:

- WhatsApp
- in-app

Jangan membuat WhatsApp notification khusus untuk surat saja.

Notification harus berbasis event.

Contoh:

EVENT
↓
Notification Rule
↓
Recipient Resolver
↓
Notification Template
↓
Channel
↓
Delivery
↓
Log

============================================================
AUDIT
============================================================

Business mutation harus dapat dilacak:

WHO
WHAT
WHEN
WHERE
BEFORE
AFTER

Minimal untuk:

- pengajuan
- verifikasi
- approval
- rejection
- TTE
- perubahan data
- perubahan perencanaan
- voting
- seleksi
- APBDes
- realisasi

============================================================
DOCUMENT ENGINE
============================================================

Dokumen harus menjadi shared capability.

Mendukung:

- template
- version
- generated document
- attachment
- archive
- metadata

Template tidak boleh hardcoded di frontend.

============================================================
NO-HARDCODE ARCHITECTURE
============================================================

Buat tabel/komponen konseptual yang menjelaskan mana yang:

DATABASE-DRIVEN
CONFIGURATION-DRIVEN
STATIC SYSTEM CONSTANT

Jangan menyatakan semua hal harus berada di database.

Contoh:

System technical constants boleh static.

Business configuration harus database-driven.

============================================================
OUTPUT PHASE 0
============================================================

Buat:

docs/architecture/

Dengan struktur:

00-MITRADESA-CONSTITUTION.md
01-VISION-AND-GOALS.md
02-DOMAIN-MAP.md
03-DATABASE-BLUEPRINT.md
04-MASTER-ERD.md
05-API-BLUEPRINT.md
06-RBAC-BLUEPRINT.md
07-WORKFLOW-ENGINE.md
08-DOCUMENT-ENGINE.md
09-TEMPLATE-ENGINE.md
10-NOTIFICATION-ENGINE.md
11-AUDIT-ENGINE.md
12-NO-HARDCODE-POLICY.md
13-SECURITY-ARCHITECTURE.md
14-TESTING-ARCHITECTURE.md
15-IMPLEMENTATION-ROADMAP.md
16-DEFINITION-OF-DONE.md
17-DECISION-REQUIRED.md
18-PROPOSED-ENHANCEMENTS.md

============================================================
DECISION REQUIRED
============================================================

Jika ada keputusan teknis yang belum dapat ditentukan secara
aman, JANGAN menebak.

Masukkan ke:

17-DECISION-REQUIRED.md

Format:

ID:
TOPIC:
QUESTION:
WHY IT MATTERS:
OPTIONS:
RECOMMENDED OPTION:
CONSEQUENCE:

============================================================
FINAL VALIDATION
============================================================

Sebelum menyatakan Phase 0 selesai, lakukan:

1. ERD consistency check
2. FK consistency check
3. Domain consistency check
4. API ↔ Entity consistency check
5. RBAC consistency check
6. Workflow consistency check
7. Notification consistency check
8. Document consistency check
9. No-hardcode consistency check
10. Duplicate entity check
11. Circular dependency check
12. Planning dependency check
13. Surat numbering rule check
14. Revision workflow check

Jika ditemukan konflik:

JANGAN memperbaikinya diam-diam.

Masukkan ke DECISION-REQUIRED.

============================================================
PHASE 0 DEFINITION OF DONE
============================================================

Phase 0 hanya COMPLETE apabila:

[ ] Vision terdokumentasi
[ ] Domain map selesai
[ ] Database blueprint selesai
[ ] Master ERD selesai
[ ] API blueprint selesai
[ ] RBAC selesai
[ ] Workflow selesai
[ ] Document engine selesai
[ ] Template engine selesai
[ ] Notification engine selesai
[ ] Audit engine selesai
[ ] No-hardcode policy selesai
[ ] Security architecture selesai
[ ] Testing architecture selesai
[ ] Roadmap selesai
[ ] Definition of Done selesai
[ ] Decision Required terdokumentasi
[ ] Semua ERD konsisten
[ ] Semua domain mempunyai owner
[ ] Tidak ada duplicate entity
[ ] Tidak ada keputusan yang diambil berdasarkan asumsi
[ ] Tidak ada source code yang dibuat

============================================================
FINAL RESPONSE
============================================================

Tampilkan:

PHASE:
0 — GREENFIELD ARCHITECTURE

STATUS:
PASS / BLOCKED

DOCUMENTS CREATED:
[list]

DOMAINS DEFINED:
[list]

CORE ENGINES DEFINED:
[list]

CRITICAL ARCHITECTURAL DECISIONS:
[list]

DECISIONS REQUIRED:
[list]

PROPOSED ENHANCEMENTS:
[list]

NEXT PHASE:
PHASE 1 — PROJECT FOUNDATION

JANGAN melakukan implementation setelah Phase 0.

============================================================
END
============================================================
