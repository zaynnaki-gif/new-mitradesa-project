-- Migration: 20260904000000_add_desa_modules_and_financial_kode_rekening
-- Consolidated official migration for all secondary village modules, financial kode_rekening, and single-tenant desa_id links.

-- CreateEnum
CREATE TYPE "ApbdesKategori" AS ENUM ('PENDAPATAN', 'BELANJA', 'PEMBIAYAAN');

-- CreateEnum
CREATE TYPE "AgendaStatus" AS ENUM ('MENDATANG', 'BERLANGSUNG', 'SELESAI', 'BATAL');

-- CreateEnum
CREATE TYPE "SuratMasukStatus" AS ENUM ('DITERIMA', 'DIPROSES', 'SELESAI', 'DIARSIPKAN');

-- CreateEnum
CREATE TYPE "DisposisiStatus" AS ENUM ('PENDING', 'DIPROSES', 'SELESAI');

-- CreateTable
CREATE TABLE "umkm" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "gambar_url" VARCHAR(500),
    "harga" VARCHAR(100),
    "kontak" VARCHAR(50) NOT NULL,
    "pemilik" VARCHAR(100) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "umkm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blanko" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "paper_size" VARCHAR(50) NOT NULL DEFAULT 'F4',
    "margin" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blanko_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kode_isian_master" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "sumber_data" VARCHAR(255) NOT NULL,
    "keterangan" TEXT,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kode_isian_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apbdes" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "total_pendapatan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_belanja" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_pembiayaan" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "dokumen_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apbdes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apbdes_item" (
    "id" BIGSERIAL NOT NULL,
    "apbdes_id" BIGINT NOT NULL,
    "kategori" "ApbdesKategori" NOT NULL,
    "kode_rekening" VARCHAR(50),
    "nama" VARCHAR(255) NOT NULL,
    "anggaran" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "realisasi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apbdes_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agenda" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "lokasi" VARCHAR(255) NOT NULL,
    "penyelenggara" VARCHAR(255) NOT NULL,
    "tanggal_mulai" TIMESTAMP(6) NOT NULL,
    "tanggal_selesai" TIMESTAMP(6) NOT NULL,
    "status" "AgendaStatus" NOT NULL DEFAULT 'MENDATANG',
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surat_masuk" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "nomor_surat" VARCHAR(100) NOT NULL,
    "tanggal_surat" DATE NOT NULL,
    "tanggal_diterima" DATE NOT NULL,
    "pengirim" VARCHAR(255) NOT NULL,
    "perihal" VARCHAR(500) NOT NULL,
    "lampiran" VARCHAR(255),
    "file_scan_url" VARCHAR(500),
    "status" "SuratMasukStatus" NOT NULL DEFAULT 'DITERIMA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surat_masuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disposisi" (
    "id" BIGSERIAL NOT NULL,
    "surat_masuk_id" BIGINT NOT NULL,
    "tujuan" VARCHAR(255) NOT NULL,
    "instruksi" TEXT NOT NULL,
    "tanggal_selesai" DATE,
    "status" "DisposisiStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disposisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "potensi_desa" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "kategori" VARCHAR(100) NOT NULL,
    "gambar_url" VARCHAR(500),
    "lokasi" VARCHAR(255),
    "kontak" VARCHAR(50),
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "potensi_desa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banner" (
    "id" BIGSERIAL NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(500),
    "gambar_url" VARCHAR(500) NOT NULL,
    "link_url" VARCHAR(255),
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "desa_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posyandu_kunjungan" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "penduduk_id" BIGINT NOT NULL,
    "tanggal_kunjungan" DATE NOT NULL,
    "kategori" VARCHAR(30) NOT NULL,
    "mingguKehamilan" INTEGER,
    "tekanan_darah" VARCHAR(20),
    "beratBadanIbu" DOUBLE PRECISION,
    "beratBadan" DOUBLE PRECISION,
    "panjangBadan" DOUBLE PRECISION,
    "lingkarKepala" DOUBLE PRECISION,
    "statusGizi" TEXT,
    "gulaDarah" DOUBLE PRECISION,
    "imunisasi" TEXT,
    "vitamin" TEXT,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posyandu_kunjungan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bumil" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "penduduk_id" BIGINT NOT NULL,
    "nama_lengkap" VARCHAR(255) NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "telepon" TEXT,
    "alamat" TEXT,
    "trimester" INTEGER DEFAULT 1,
    "gubug_id" BIGINT,
    "rw_id" BIGINT,
    "rt_id" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bumil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas_umum" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "tanggal" DATE NOT NULL,
    "jenis" VARCHAR(20) NOT NULL,
    "uraian" VARCHAR(500) NOT NULL,
    "jumlah" DOUBLE PRECISION NOT NULL,
    "saldo" DOUBLE PRECISION NOT NULL,
    "kode_rekening" VARCHAR(50),
    "apbdes_item_id" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kas_umum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buku_bank" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "bank" VARCHAR(100) NOT NULL,
    "tanggal" DATE NOT NULL,
    "uraian" VARCHAR(500) NOT NULL,
    "kode_bukti" VARCHAR(50),
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kredit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL,
    "rekonsiliasi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buku_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bansos" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "nama" VARCHAR(255) NOT NULL,
    "jenis" VARCHAR(100) NOT NULL,
    "tahun" INTEGER NOT NULL,
    "periode" VARCHAR(50),
    "jumlah_penerima" INTEGER NOT NULL DEFAULT 0,
    "jumlah_dana" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bansos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saran_aduan" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "judul" VARCHAR(255) NOT NULL,
    "isi" TEXT NOT NULL,
    "kategori" VARCHAR(50) NOT NULL,
    "status" "SaranAduanStatus" NOT NULL DEFAULT 'BARU',
    "nama_pengirim" VARCHAR(255),
    "email_pengirim" VARCHAR(255),
    "telepon_pengirim" VARCHAR(20),
    "jawaban" TEXT,
    "dijawab_oleh" VARCHAR(255),
    "dijawab_pada" TIMESTAMP(6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saran_aduan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_penduduk" (
    "id" TEXT NOT NULL,
    "desa_id" BIGINT,
    "jenis_mutasi" "MutasiJenis" NOT NULL,
    "tanggal_mutasi" DATE NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "nama_lengkap" VARCHAR(255) NOT NULL,
    "jenis_kelamin" VARCHAR(1),
    "tanggal_lahir" DATE,
    "tempat_lahir" VARCHAR(100),
    "nik_ayah" VARCHAR(16),
    "nik_ibu" VARCHAR(16),
    "penyebab_mati" VARCHAR(255),
    "alamat_asal" VARCHAR(500),
    "desa_asal" VARCHAR(255),
    "kecamatan_asal" VARCHAR(255),
    "kabupaten_asal" VARCHAR(255),
    "alamat_tujuan" VARCHAR(500),
    "desa_tujuan" VARCHAR(255),
    "kecamatan_tujuan" VARCHAR(255),
    "kabupaten_tujuan" VARCHAR(255),
    "gubug_asal_id" BIGINT,
    "rw_asal_id" BIGINT,
    "rt_asal_id" BIGINT,
    "gubug_tujuan_id" BIGINT,
    "rw_tujuan_id" BIGINT,
    "rt_tujuan_id" BIGINT,
    "keterangan" VARCHAR(500),
    "dokumen_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mutasi_penduduk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "umkm_slug_key" ON "umkm"("slug");

-- CreateIndex
CREATE INDEX "umkm_desa_id_idx" ON "umkm"("desa_id");

-- CreateIndex
CREATE INDEX "umkm_slug_idx" ON "umkm"("slug");

-- CreateIndex
CREATE INDEX "umkm_kategori_idx" ON "umkm"("kategori");

-- CreateIndex
CREATE INDEX "blanko_desa_id_idx" ON "blanko"("desa_id");

-- CreateIndex
CREATE UNIQUE INDEX "kode_isian_master_kode_key" ON "kode_isian_master"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "apbdes_desa_id_tahun_key" ON "apbdes"("desa_id", "tahun");

-- CreateIndex
CREATE INDEX "apbdes_item_apbdes_id_idx" ON "apbdes_item"("apbdes_id");

-- CreateIndex
CREATE INDEX "apbdes_item_kode_rekening_idx" ON "apbdes_item"("kode_rekening");

-- CreateIndex
CREATE UNIQUE INDEX "agenda_slug_key" ON "agenda"("slug");

-- CreateIndex
CREATE INDEX "agenda_desa_id_idx" ON "agenda"("desa_id");

-- CreateIndex
CREATE INDEX "agenda_tanggal_mulai_idx" ON "agenda"("tanggal_mulai");

-- CreateIndex
CREATE INDEX "agenda_status_idx" ON "agenda"("status");

-- CreateIndex
CREATE INDEX "surat_masuk_desa_id_idx" ON "surat_masuk"("desa_id");

-- CreateIndex
CREATE INDEX "surat_masuk_nomor_surat_idx" ON "surat_masuk"("nomor_surat");

-- CreateIndex
CREATE INDEX "disposisi_surat_masuk_id_idx" ON "disposisi"("surat_masuk_id");

-- CreateIndex
CREATE UNIQUE INDEX "potensi_desa_slug_key" ON "potensi_desa"("slug");

-- CreateIndex
CREATE INDEX "potensi_desa_desa_id_idx" ON "potensi_desa"("desa_id");

-- CreateIndex
CREATE INDEX "potensi_desa_slug_idx" ON "potensi_desa"("slug");

-- CreateIndex
CREATE INDEX "potensi_desa_kategori_idx" ON "potensi_desa"("kategori");

-- CreateIndex
CREATE INDEX "banner_desa_id_idx" ON "banner"("desa_id");

-- CreateIndex
CREATE INDEX "banner_urutan_idx" ON "banner"("urutan");

-- CreateIndex
CREATE INDEX "posyandu_kunjungan_desa_id_idx" ON "posyandu_kunjungan"("desa_id");

-- CreateIndex
CREATE INDEX "posyandu_kunjungan_penduduk_id_idx" ON "posyandu_kunjungan"("penduduk_id");

-- CreateIndex
CREATE INDEX "posyandu_kunjungan_tanggal_kunjungan_idx" ON "posyandu_kunjungan"("tanggal_kunjungan");

-- CreateIndex
CREATE INDEX "posyandu_kunjungan_kategori_idx" ON "posyandu_kunjungan"("kategori");

-- CreateIndex
CREATE UNIQUE INDEX "bumil_penduduk_id_key" ON "bumil"("penduduk_id");

-- CreateIndex
CREATE INDEX "bumil_desa_id_idx" ON "bumil"("desa_id");

-- CreateIndex
CREATE INDEX "bumil_penduduk_id_idx" ON "bumil"("penduduk_id");

-- CreateIndex
CREATE INDEX "bumil_gubug_id_idx" ON "bumil"("gubug_id");

-- CreateIndex
CREATE INDEX "bumil_rw_id_idx" ON "bumil"("rw_id");

-- CreateIndex
CREATE INDEX "bumil_rt_id_idx" ON "bumil"("rt_id");

-- CreateIndex
CREATE INDEX "kas_umum_desa_id_idx" ON "kas_umum"("desa_id");

-- CreateIndex
CREATE INDEX "kas_umum_apbdes_item_id_idx" ON "kas_umum"("apbdes_item_id");

-- CreateIndex
CREATE INDEX "kas_umum_kode_rekening_idx" ON "kas_umum"("kode_rekening");

-- CreateIndex
CREATE INDEX "buku_bank_desa_id_idx" ON "buku_bank"("desa_id");

-- CreateIndex
CREATE INDEX "bansos_desa_id_idx" ON "bansos"("desa_id");

-- CreateIndex
CREATE INDEX "saran_aduan_desa_id_idx" ON "saran_aduan"("desa_id");

-- CreateIndex
CREATE INDEX "saran_aduan_kategori_idx" ON "saran_aduan"("kategori");

-- CreateIndex
CREATE INDEX "saran_aduan_status_idx" ON "saran_aduan"("status");

-- CreateIndex
CREATE INDEX "saran_aduan_created_at_idx" ON "saran_aduan"("created_at");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_desa_id_idx" ON "mutasi_penduduk"("desa_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_jenis_mutasi_idx" ON "mutasi_penduduk"("jenis_mutasi");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_tanggal_mutasi_idx" ON "mutasi_penduduk"("tanggal_mutasi");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_nik_idx" ON "mutasi_penduduk"("nik");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_gubug_asal_id_idx" ON "mutasi_penduduk"("gubug_asal_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_rw_asal_id_idx" ON "mutasi_penduduk"("rw_asal_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_rt_asal_id_idx" ON "mutasi_penduduk"("rt_asal_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_gubug_tujuan_id_idx" ON "mutasi_penduduk"("gubug_tujuan_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_rw_tujuan_id_idx" ON "mutasi_penduduk"("rw_tujuan_id");

-- CreateIndex
CREATE INDEX "mutasi_penduduk_rt_tujuan_id_idx" ON "mutasi_penduduk"("rt_tujuan_id");

-- AddForeignKey
ALTER TABLE "umkm" ADD CONSTRAINT "umkm_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "blanko" ADD CONSTRAINT "blanko_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "apbdes" ADD CONSTRAINT "apbdes_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "apbdes_item" ADD CONSTRAINT "apbdes_item_apbdes_id_fkey" FOREIGN KEY ("apbdes_id") REFERENCES "apbdes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "surat_masuk" ADD CONSTRAINT "surat_masuk_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disposisi" ADD CONSTRAINT "disposisi_surat_masuk_id_fkey" FOREIGN KEY ("surat_masuk_id") REFERENCES "surat_masuk"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "potensi_desa" ADD CONSTRAINT "potensi_desa_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "banner" ADD CONSTRAINT "banner_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posyandu_kunjungan" ADD CONSTRAINT "posyandu_kunjungan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bumil" ADD CONSTRAINT "bumil_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bumil" ADD CONSTRAINT "bumil_gubug_id_foreign" FOREIGN KEY ("gubug_id") REFERENCES "gubug"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bumil" ADD CONSTRAINT "bumil_rw_id_foreign" FOREIGN KEY ("rw_id") REFERENCES "Rw"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bumil" ADD CONSTRAINT "bumil_rt_id_foreign" FOREIGN KEY ("rt_id") REFERENCES "Rt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kas_umum" ADD CONSTRAINT "kas_umum_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "kas_umum" ADD CONSTRAINT "kas_umum_apbdes_item_id_fkey" FOREIGN KEY ("apbdes_item_id") REFERENCES "apbdes_item"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "buku_bank" ADD CONSTRAINT "buku_bank_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bansos" ADD CONSTRAINT "bansos_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "saran_aduan" ADD CONSTRAINT "saran_aduan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_penduduk_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_gubug_asal_id_foreign" FOREIGN KEY ("gubug_asal_id") REFERENCES "gubug"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_rw_asal_id_foreign" FOREIGN KEY ("rw_asal_id") REFERENCES "Rw"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_rt_asal_id_foreign" FOREIGN KEY ("rt_asal_id") REFERENCES "Rt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_gubug_tujuan_id_foreign" FOREIGN KEY ("gubug_tujuan_id") REFERENCES "gubug"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_rw_tujuan_id_foreign" FOREIGN KEY ("rw_tujuan_id") REFERENCES "Rw"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_rt_tujuan_id_foreign" FOREIGN KEY ("rt_tujuan_id") REFERENCES "Rt"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "penanda_tangan" ADD CONSTRAINT "penanda_tangan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "penanda_tangan" ADD CONSTRAINT "penanda_tangan_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION;


-- AlterTable
ALTER TABLE "penanda_tangan" ADD COLUMN IF NOT EXISTS "pin_hash" VARCHAR(255);
