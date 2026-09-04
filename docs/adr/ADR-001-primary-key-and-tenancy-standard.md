# ADR-001: Standarisasi Model Tenancy dan Konvensi Primary Key (PK)

**Status**: DITERIMA & BERLAKU (Accepted)  
**Tanggal**: 2026-09-04  
**Konteks Arsitektur**: Proyek Mitradesa (Sistem Informasi Desa)

---

## 1. Keputusan Model Tenancy: Single-Tenant Database Isolation

### Keputusan:
Mitradesa secara resmi dan final mengadopsi model **Single-Tenant Deployment** (1 Desa = 1 Instalasi Aplikasi & 1 Basis Data PostgreSQL terisolasi).

### Rasional:
1. **Kedaulatan & Sensitivitas Hukum Data Desa**: Data kependudukan (NIK, KK, biodata), keuangan desa (APBDes, BKU), dan Tanda Tangan Elektronik (TTE) kepala desa memiliki implikasi hukum tinggi di bawah UU Desa & UU PDP.
2. **Eliminasi Risiko Data Leak Antar-Desa**: Menghilangkan risiko kebocoran data (*cross-tenant data leakage*) yang inheren pada multi-tenant shared database.
3. **Reproducibility & Otonomi**: Tiap desa dapat di-backup, di-restore, dan di-migrasi secara independen menggunakan template migrasi Prisma resmi (`prisma migrate deploy`).
4. **Scope Enforcing**: Variabel konfigurasi `INSTANCE_DESA_ID` tetap dipertahankan pada runtime sebagai context anchor instance desa aktif.

---

## 2. Standarisasi Konvensi Primary Key (PK)

### Kebijakan Resmi:

| Kategori Model | Standar Primary Key | Tipe Data | Kebijakan & Rasional |
|---|---|---|---|
| **Model Baru (Greenfield)** | `String @id @default(cuid())` | `VARCHAR(30)` / CUID | **WAJIB untuk seluruh model baru ke depan**. Alasan: Non-sequential, tidak dapat ditebak (*anti-enumeration*), ramah replikasi/sinkronisasi offline, dan tidak rentan tabrakan ID. Contoh: `KasUmum`, `BukuBank`, `CitizenSession`. |
| **Model Inti Warisan (Legacy Core)** | `BigInt @id @default(autoincrement())` | `BIGINT` | **DIPERTAHANKAN (Freeze / Tidak Dimigrasikan Surut)**. Model inti seperti `Penduduk`, `Keluarga`, `Desa`, `Account`, dan `Ref*` tetap menggunakan `BigInt`. Alasan: Mengubah PK tabel inti kependudukan dengan ribuan relasi foreign key akan memicu lock table berat, risiko korupsi data relasional, dan ketidakcocokan pemetaan data historis. |

### Aturan untuk Kontributor & Pengembang:
1. **Dilarang** membuat model baru dengan `BigInt @default(autoincrement())`. Gunakan `String @default(cuid())`.
2. **Dilarang** mengubah tipe PK pada model legacy tanpa audit migrasi database berjenjang.
3. Relasi foreign key antara model baru (CUID) dan model legacy (BigInt) harus konsisten terhadap tipe data relasi terkait (`BigInt` jika merujuk ke tabel legacy, `String` jika merujuk ke tabel baru).
