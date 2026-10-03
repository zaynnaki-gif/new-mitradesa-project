---
title: Deep Audit & Alignment Protocol
trigger: /deep-audit
---

# DEEP AUDIT & ALIGNMENT PROTOCOL

Jalankan protokol ini sebelum mengeksekusi task struktural apa pun
(skema baru, modul baru, refactor lintas file). Semua aturan di
`.agents/rules/00-project-core.md` tetap berlaku penuh selama protokol
ini berjalan. DILARANG melompat ke eksekusi kode sebelum FASE 4 disetujui
secara eksplisit oleh user, dan DILARANG mengeksekusi seluruh FASE 4
sekaligus — satu item, satu persetujuan, satu eksekusi, satu laporan.

## FASE 1 — DISCOVERY MENYELURUH
Baca (jangan tulis apa pun dulu):
- Seluruh file blueprint arsitektur (docs/blueprint/*.md atau lokasi serupa)
- Skema database aktual (Drizzle schema files) — bandingkan dengan ERD yang
  terdokumentasi, catat SETIAP perbedaan
- Seluruh API route definitions (Express routers), kelompokkan per domain
  (publik/warga/admin), catat method, path, middleware, validasi
- Struktur frontend: halaman, komponen, TanStack Query hooks, Zustand store
- Konfigurasi monorepo (turborepo, pnpm workspaces) untuk batas antar package

Output: **Inventory Report** — file yang dibaca, ringkasan 1-2 kalimat per
area (DB/API/Frontend/Infra), dan daftar awal red flag yang langsung
terlihat.

## FASE 2 — REKONSTRUKSI GOALS
Nyatakan ulang dengan bahasamu sendiri (bukti pemahaman, bukan copy-paste):
1. Tujuan akhir platform, untuk siapa, masalah apa yang diselesaikan
2. Cakupan domain fitur yang relevan dengan task ini, dan batasnya
3. Alur kerja kritis yang terkait task ini (mis. alur E-Surat lengkap)
4. Aturan zero-tolerance yang relevan dari rules file

**STOP.** Sajikan hasil FASE 2 untuk dikonfirmasi/dikoreksi user SEBELUM
lanjut ke FASE 3.

## FASE 3 — GAP MAPPING
Tabel per area terkait task:
| Area | Kondisi Saat Ini | Kondisi Diharapkan | Gap | Kategori | Dampak jika Diubah |

Kategori: **KEEP** (sudah sesuai) / **FIX** (bug, desain tetap) /
**BUILD** (belum ada) / **REFACTOR** (struktur keliru mendasar).

Kolom "Dampak jika Diubah" wajib sebutkan: tabel/relasi ERD tersentuh,
endpoint API tersentuh + siapa consumer-nya, modul/halaman frontend yang
bergantung, dan risiko regresi ke fitur lain.

## FASE 4 — RENCANA EKSEKUSI
Urutkan berdasarkan: dependency dulu → risiko terendah dulu → yang paling
menghambat operasional warga/admin saat ini.

Setiap item wajib memuat: deskripsi spesifik, file yang disentuh, perlu
migrasi DB atau tidak (sertakan skrip migrasi, bukan drop/recreate), cara
verifikasi sebelum dianggap selesai, dan rollback plan singkat.

Sajikan rencana ini per item. Setelah satu item disetujui, eksekusi item
itu saja → laporkan hasil apa adanya termasuk error yang muncul → baru
lanjut ke item berikutnya setelah disetujui lagi.

## FORMAT
Bahasa Indonesia, heading jelas per fase, detail teknis presisi (nama
tabel/endpoint/file sebenarnya) karena akan dipakai sebagai acuan kerja.

Mulai dari FASE 1.
