---
description:
---

---

title: Execute Approved Task (Disiplin Eksekusi)
trigger: /execute

---

# EXECUTE APPROVED TASK

Gunakan workflow ini HANYA untuk mengeksekusi SATU item task yang scope-nya
sudah jelas (baik dari hasil `/deep-audit` FASE 4 yang sudah disetujui,
maupun bug fix/task kecil yang scope-nya sudah dijelaskan eksplisit oleh
user di prompt ini). Semua aturan di `.agents/rules/00-project-core.md`
tetap berlaku penuh.

Jangan mulai eksekusi jika scope task belum jelas — jika ragu, tanyakan
dulu ke user sebelum menyentuh file apa pun.

## SEBELUM MULAI (wajib, ringkas)

Nyatakan dalam 2-4 kalimat:

1. Apa yang akan diubah/dibuat (spesifik: nama file, tabel, endpoint)
2. Kenapa perubahan ini tidak akan merusak modul lain (sebutkan hasil cek
   dependency singkat: tabel/relasi ERD yang tersentuh, endpoint lain yang
   memakai fungsi/tabel yang sama)

Jika ternyata saat memulai kamu menemukan dependency/dampak yang TIDAK
disebutkan di rencana awal, STOP — laporkan temuan itu ke user dan tunggu
konfirmasi sebelum melanjutkan. Jangan diam-diam memperluas scope.

## GATE WAJIB — PERINTAH YANG MENGUBAH DATABASE

Sebelum menjalankan PERINTAH APA PUN yang mengubah struktur atau isi
database sungguhan (termasuk namun tidak terbatas pada: `prisma migrate
dev` tanpa `--create-only`, `prisma migrate deploy`, `prisma db execute`,
`prisma db push`, atau query SQL langsung yang ALTER/DROP/UPDATE/DELETE),
kamu WAJIB:

1. Tunjukkan isi SQL/perintah persis yang akan dijalankan
2. STOP total — jangan eksekusi apa pun setelah itu di respons yang sama
3. Tunggu balasan eksplisit dari user berisi kata persetujuan (mis.
   "lanjutkan", "jalankan", "disetujui") sebelum benar-benar menjalankannya

Ini berlaku SELALU, tanpa pengecualian — termasuk ketika kamu menemukan
kendala teknis di tengah jalan (mis. shadow database gagal, koneksi
pooler tidak mendukung suatu fitur) yang memaksa kamu memakai pendekatan
berbeda dari rencana awal. Kendala teknis TIDAK memberi izin untuk
berimprovisasi dan langsung mengeksekusi tanpa persetujuan — laporkan
kendalanya sebagai blocker dan tunggu arahan, meskipun itu berarti task
tertunda. Melanggar gate ini dianggap pelanggaran serius terhadap aturan
non-negotiable #8 di rules file (dilarang mengubah keputusan arsitektur/
eksekusi secara sepihak).

## SELAMA EKSEKUSI

1. Kerjakan HANYA file yang relevan dengan task ini. Jangan "sekalian"
   memperbaiki/merapikan hal lain yang tidak diminta — catat saja sebagai
   saran terpisah di laporan akhir.
2. Ikuti pola yang sudah ada di codebase (mis. 4-file backend module
   pattern) — jangan menciptakan pola baru tanpa alasan kuat yang dijelaskan.
3. Tenant/village scoping wajib disertakan di setiap query baru yang
   menyentuh data desa.
4. Tidak boleh ada hardcode, skeleton palsu, atau data dummy yang
   ditinggalkan di kode akhir — termasuk yang sifatnya "sementara untuk
   testing", kecuali eksplisit ditandai TODO dan dilaporkan sebagai
   incomplete.
5. Jika menemukan error saat proses (type error, runtime error, test
   gagal): JANGAN di-suppress, di-skip, atau "diakali" dengan workaround
   yang menyembunyikan akar masalah. Perbaiki akar masalahnya. Jika tidak
   bisa diperbaiki dalam scope task ini, STOP dan laporkan sebagai blocker.

## VERIFIKASI SEBELUM MENYATAKAN "SELESAI"

Task baru boleh disebut selesai jika SEMUA berikut terpenuhi — jika salah
satu tidak terpenuhi, laporkan sebagai "belum selesai" beserta alasannya:

- [ ] Kode berhasil di-build/compile tanpa error
- [ ] Type-check/lint dijalankan dan lulus (atau errornya dilaporkan apa
      adanya jika tidak bisa diperbaiki dalam scope ini)
- [ ] Jika ada test terkait, test dijalankan dan hasilnya (pass/fail)
      dilaporkan apa adanya — bukan diasumsikan
- [ ] Fitur/perbaikan dicoba jalan (bukan hanya dibaca ulang kodenya) dan
      hasil aktualnya dilaporkan
- [ ] Tidak ada skeleton/placeholder/hardcode tersisa yang seharusnya
      berasal dari database
- [ ] Perubahan pada satu domain tidak memutus fitur lain yang sebelumnya
      berfungsi (sebutkan apa yang dicek untuk memastikan ini)

## LAPORAN AKHIR (format wajib)

1. **Apa yang diubah** — daftar file + ringkasan perubahan per file
2. **Hasil verifikasi** — checklist di atas, isi apa adanya (termasuk yang
   gagal/belum sempat dicek)
3. **Deviasi dari rencana** — jika ada perubahan dari rencana awal dan
   alasannya
4. **Blocker/isu terbuka** — apa pun yang belum tuntas, jangan disembunyikan
5. **Saran di luar scope** — hal lain yang ditemukan tapi sengaja tidak
   dikerjakan karena di luar task ini (biar user yang putuskan)
6. **Rollback** — cara membatalkan perubahan ini jika diperlukan

Jangan mengakhiri laporan dengan klaim "semua sudah sempurna" jika checklist
verifikasi di atas ada yang tidak tercentang.
