---
trigger: always_on
---

---

title: DESAKU — Core Project Rules (Zero Tolerance)
apply: always

---

# IDENTITAS PROJECT

DESAKU/mitradesa — platform website pemerintahan desa. Model deployment:
SINGLE-TENANT (1 desa = 1 instalasi + 1 database dari template yang sama),
BUKAN multi-tenant SaaS bersama.

Stack terkunci: React 19 + Vite, Tailwind CSS v3.4, shadcn/ui,
TanStack Query v5, Zustand, Express 5, **Prisma ORM** (schema di
`apps/api/prisma/schema.prisma`), PostgreSQL 16, Redis 7, BullMQ 5,
pnpm + Turborepo (monorepo).

> Catatan: versi dokumentasi sebelumnya sempat menyebut Drizzle ORM sebagai
> stack terkunci — itu KELIRU. Kode aktual dan keputusan resmi project
> menggunakan Prisma. Jangan sarankan migrasi ke Drizzle kecuali diminta
> eksplisit oleh user.

Struktur backend mengikuti pola: `routes/` → `controllers/` → `services/`
→ `repositories/` (folder `apps/api/src/`). Ikuti pola ini untuk modul
baru — jangan menciptakan pola arsitektur berbeda tanpa alasan kuat.

7 domain fitur resmi (di luar ini = OUT OF SCOPE, jangan dikerjakan tanpa
konfirmasi eksplisit):

1. Profil Desa — Sejarah/Visi-Misi, Perangkat Desa, Lembaga Desa, BUMDes
2. Pelayanan Online — E-Surat, Registrasi Penduduk, Produk Hukum,
   Konsultasi Warga, Analitik
3. Informasi — Berita, Agenda, Pengumuman, Galeri
4. Keuangan — APBDes Awal & Perubahan, Realisasi Fisik & Keuangan
5. Pembangunan — RPJMDes, RKPDes, Rencana APBDes (+ Usulan Warga & Voting)
6. Marketplace — toko online UMKM/BUMDes
7. Pengaturan Dashboard

Modul yang SUDAH DIKELUARKAN dari cakupan aktif — jangan diimplementasikan
kecuali diminta ulang secara eksplisit: PBB-P2, **Kesehatan** (STATUS:
DITUNDA, bukan dihapus — kode masih ada penuh: model `PosyanduKunjungan`
& `Bumil` di schema.prisma, route `kesehatan/`, halaman `BumilPage.tsx` &
`AdminPosyanduKunjungan.tsx`. Modul ini di-soft-disable/disembunyikan dari
navigasi sampai giliran prioritasnya tiba — JANGAN dihapus/di-drop dari
database, dan JANGAN dikembangkan lebih jauh sampai user meminta eksplisit),
Kebencanaan, Wisata, Inventaris, GIS, RAG.

Desain: Portal Publik = gaya editorial/institutional (serif+sans, foto
dokumenter dominan, palet Dark Navy/Putih/Amber). Dashboard Admin = gaya
shadcn/ui utilitarian standar.

# ATURAN NON-NEGOTIABLE (tidak boleh dilanggar tanpa persetujuan eksplisit)

1. ZERO HALLUCINATION — setiap klaim tentang kode/skema/route yang kamu
   sampaikan wajib berdasarkan file yang benar-benar kamu baca (sebutkan
   file + line). Jika tidak yakin, katakan "tidak ditemukan/perlu
   konfirmasi" — jangan menebak atau mengarang.
2. ZERO HARDCODE / ZERO SKELETON PALSU — dilarang menampilkan
   skeleton/placeholder/data dummy di UI jika data sudah tersedia di
   database. Semua yang tampil di UI wajib bersumber dari database
   (via Prisma Client/repositories, bukan mock data).
3. TTE internal (bukan BSrE) — tanda tangan elektronik via barcode/QR yang
   menampilkan nomor registrasi surat + foto profil pejabat penandatangan.
4. QR code surat WAJIB digenerate SETELAH surat disetujui/ditandatangani —
   tidak boleh sebelum itu.
5. Autentikasi warga TIDAK BOLEH bergantung tunggal pada OTP WhatsApp
   (warga sering ganti nomor). Sediakan jalur alternatif.
6. Prinsip "semua proses online", kecuali surat yang bersifat
   penting/prinsip yang boleh/perlu tetap offline-fisik.
7. Tenant/village scoping wajib konsisten di SEMUA query database (setiap
   query Prisma yang menyentuh data desa wajib filter berdasarkan
   instalasi/desa terkait) — tidak boleh ada query yang bocor lintas
   desa/instalasi.
8. Dilarang mengubah keputusan arsitektur di atas secara sepihak — termasuk
   dilarang mengganti/migrasi ORM, mengubah model deployment, atau
   mengubah alur TTE/OTP/QR tanpa alasan tertulis dan persetujuan eksplisit.
9. Dilarang menyatakan task "selesai" jika masih ada error/warning yang
   diabaikan atau TODO yang di-skip diam-diam. Jika terhambat, laporkan
   blocker-nya secara eksplisit.
10. Setiap perubahan pada satu modul wajib dicek dampaknya ke: skema
    Prisma (relasi model/foreign key), route/controller/service lain yang
    memakai model yang sama, dan halaman frontend yang bergantung padanya,
    SEBELUM mengeksekusi perubahan.

# SEBELUM MENGERJAKAN TASK APA PUN YANG BERSIFAT STRUKTURAL

(menambah model Prisma, mengubah skema, membuat modul baru, refactor
lintas file) Jangan langsung eksekusi. Jalankan dulu workflow
`/deep-audit` bila kamu belum punya pemahaman penuh tentang goals &
kondisi sistem saat ini untuk area terkait. Setelah item rencana dari
`/deep-audit` disetujui, eksekusi lewat workflow `/execute` — jangan
menggabung fase analisis dan eksekusi dalam satu langkah.

Untuk task kecil yang jelas scope-nya (fix 1 bug spesifik, copy text,
styling minor), boleh langsung dikerjakan tanpa audit penuh — tapi tetap
tunduk pada 10 aturan non-negotiable di atas.
