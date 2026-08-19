#!/usr/bin/env python3
"""
Generate baseline migration SQL for Mitradesa project.
This script creates a complete migration that builds the entire schema from scratch.
"""

output_path = "prisma/migrations/20260813000000_baseline_initial_schema/migration.sql"

sql_content = """-- ============================================================
-- MITRADESA BASELINE MIGRATION
-- Created: 2026-08-13
-- Description: Complete initial schema for Mitradesa project
-- This migration creates ALL tables, enums, indexes, and foreign keys
-- for a fresh database setup.
-- ============================================================

-- ============================================================
-- SECTION 1: ENUMS
-- ============================================================

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'CANCELLED');
CREATE TYPE "OtpStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED');
CREATE TYPE "ActorType" AS ENUM ('USER', 'SYSTEM', 'API');
CREATE TYPE "ConfigType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON');
CREATE TYPE "BeritaStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "HalamanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AuditAction enum with ALL values
CREATE TYPE "AuditAction" AS ENUM (
    'CREATE', 'UPDATE', 'DELETE',
    'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
    'OTP_REQUESTED', 'OTP_VERIFIED', 'OTP_FAILED',
    'SESSION_CREATED', 'SESSION_EXPIRED', 'SESSION_REVOKED',
    'ACCOUNT_DISABLED', 'ACCOUNT_ENABLED', 'PASSWORD_CHANGED',
    'IDENTITY_CREATED', 'IDENTITY_UPDATED',
    'WILAYAH_CREATED', 'WILAYAH_UPDATED', 'WILAYAH_DELETED',
    'PENDUDUK_CREATED', 'PENDUDUK_UPDATED', 'PENDUDUK_DELETED',
    'KELUARGA_CREATED', 'KELUARGA_UPDATED', 'KELUARGA_DELETED',
    'ANGGOTA_ADDED', 'ANGGOTA_REMOVED',
    'KATEGORI_CREATED', 'KATEGORI_UPDATED', 'KATEGORI_DELETED',
    'BERITA_CREATED', 'BERITA_UPDATED', 'BERITA_DELETED', 'BERITA_PUBLISHED', 'BERITA_ARCHIVED',
    'HALAMAN_CREATED', 'HALAMAN_UPDATED', 'HALAMAN_DELETED', 'HALAMAN_PUBLISHED', 'HALAMAN_ARCHIVED',
    'MEDIA_UPLOADED', 'MEDIA_DELETED'
);

-- ============================================================
-- SECTION 2: TABLES WITHOUT FOREIGN KEYS
-- ============================================================

-- Provinsi
CREATE TABLE "provinsi" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provinsi_pkey" PRIMARY KEY ("id")
);

-- RefAgama
CREATE TABLE "ref_agama" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_agama_pkey" PRIMARY KEY ("id")
);

-- RefGolonganDarah
CREATE TABLE "ref_gol_darah" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(5) NOT NULL,
    "nama" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_gol_darah_pkey" PRIMARY KEY ("id")
);

-- RefStatusPerkawinan
CREATE TABLE "ref_status_perkawinan" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(50) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_status_perkawinan_pkey" PRIMARY KEY ("id")
);

-- RefHubunganKeluarga
CREATE TABLE "ref_hubungan_keluarga" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(50) NOT NULL,
    "kategori" VARCHAR(20) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_hubungan_keluarga_pkey" PRIMARY KEY ("id")
);

-- RefStatusKependudukan
CREATE TABLE "ref_status_kependudukan" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_status_kependudukan_pkey" PRIMARY KEY ("id")
);

-- RefPendidikan
CREATE TABLE "ref_pendidikan" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "jenjang" INTEGER NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_pendidikan_pkey" PRIMARY KEY ("id")
);

-- RefPekerjaan
CREATE TABLE "ref_pekerjaan" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(50),
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_pekerjaan_pkey" PRIMARY KEY ("id")
);

-- RefJabatanPerangkat
CREATE TABLE "ref_jabatan_perangkat" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(50) NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_jabatan_perangkat_pkey" PRIMARY KEY ("id")
);

-- RefStatusPerangkat
CREATE TABLE "ref_status_perangkat" (
    "id" BIGSERIAL NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(50) NOT NULL,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ref_status_perangkat_pkey" PRIMARY KEY ("id")
);

-- Account
CREATE TABLE "account" (
    "id" BIGSERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" "AccountStatus" DEFAULT 'ACTIVE',
    "last_login_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- Role
CREATE TABLE "role" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "role_code_key" UNIQUE ("code")
);

-- Permission
CREATE TABLE "permission" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "group_name" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "permission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "permission_code_key" UNIQUE ("code")
);

-- ============================================================
-- SECTION 3: TABLES WITH FOREIGN KEYS (Level 1)
-- ============================================================

-- Kabupaten (FK to Provinsi)
CREATE TABLE "kabupaten" (
    "id" BIGSERIAL NOT NULL,
    "provinsi_id" BIGINT NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kabupaten_pkey" PRIMARY KEY ("id")
);

-- Kecamatan (FK to Kabupaten)
CREATE TABLE "kecamatan" (
    "id" BIGSERIAL NOT NULL,
    "kabupaten_id" BIGINT NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "kecamatan_pkey" PRIMARY KEY ("id")
);

-- Desa (FK to Kecamatan)
CREATE TABLE "desa" (
    "id" BIGSERIAL NOT NULL,
    "kecamatan_id" BIGINT NOT NULL,
    "kode" VARCHAR(10) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "desa_pkey" PRIMARY KEY ("id")
);

-- IdentitasDesa (FK to Desa)
CREATE TABLE "identitas_desa" (
    "id" BIGSERIAL NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "nama_desa" VARCHAR(100) NOT NULL,
    "singkatan_desa" VARCHAR(20),
    "kode_desa" VARCHAR(10),
    "alamat" TEXT,
    "kodepos" VARCHAR(10),
    "telepon" VARCHAR(20),
    "whatsapp" VARCHAR(20),
    "email" VARCHAR(255),
    "website" VARCHAR(255),
    "logo_desa_url" VARCHAR(500),
    "logo_kabupaten_url" VARCHAR(500),
    "favicon_url" VARCHAR(500),
    "kepala_desa" VARCHAR(100),
    "sekretaris_desa" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "identitas_desa_pkey" PRIMARY KEY ("id")
);

-- AccountRole (FK to Account, Role)
CREATE TABLE "account_role" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "role_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_role_pkey" PRIMARY KEY ("id")
);

-- RolePermission (FK to Role, Permission)
CREATE TABLE "role_permission" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- AuditLog (no FK)
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" BIGINT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actor_id" BIGINT,
    "actorType" "ActorType" DEFAULT 'USER',
    "actor_ip" VARCHAR(45),
    "actor_agent" VARCHAR(500),
    "before_data" JSONB,
    "after_data" JSONB,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- Configuration (no FK)
CREATE TABLE "configuration" (
    "id" BIGSERIAL NOT NULL,
    "group_name" VARCHAR(100) NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT,
    "value_type" "ConfigType" DEFAULT 'STRING',
    "description" TEXT,
    "is_system" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "configuration_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- SECTION 4: TABLES WITH FOREIGN KEYS (Level 2)
-- ============================================================

-- Penduduk (FK to Desa)
CREATE TABLE "penduduk" (
    "id" BIGSERIAL NOT NULL,
    "nik" VARCHAR(16) NOT NULL,
    "nama_lengkap" VARCHAR(255) NOT NULL,
    "tempat_lahir" VARCHAR(100) NOT NULL,
    "tanggal_lahir" DATE NOT NULL,
    "jenis_kelamin" VARCHAR(1) NOT NULL,
    "gol_darah" VARCHAR(3),
    "agama" VARCHAR(50),
    "status_perkawinan" VARCHAR(50) NOT NULL,
    "hubungan_keluarga" VARCHAR(50),
    "alamat" TEXT,
    "rt" VARCHAR(10),
    "rw" VARCHAR(10),
    "dusun" VARCHAR(100),
    "kode_pos" VARCHAR(10),
    "telepon" VARCHAR(20),
    "email" VARCHAR(255),
    "warga_negara" VARCHAR(50) DEFAULT 'Indonesia',
    "nik_ayah" VARCHAR(16),
    "nik_ibu" VARCHAR(16),
    "is_aktif" BOOLEAN DEFAULT true,
    "status_kepindahan" VARCHAR(50),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "desa_id" BIGINT,
    CONSTRAINT "penduduk_pkey" PRIMARY KEY ("id")
);

-- Keluarga (FK to Penduduk, Desa)
CREATE TABLE "keluarga" (
    "id" BIGSERIAL NOT NULL,
    "no_kk" VARCHAR(16) NOT NULL,
    "kepala_id" BIGINT NOT NULL,
    "alamat" TEXT,
    "rt" VARCHAR(10),
    "rw" VARCHAR(10),
    "dusun" VARCHAR(100),
    "kode_pos" VARCHAR(10),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "desa_id" BIGINT,
    CONSTRAINT "keluarga_pkey" PRIMARY KEY ("id")
);

-- InternalSession (FK to Account)
CREATE TABLE "internal_session" (
    "id" BIGSERIAL NOT NULL,
    "account_id" BIGINT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "internal_session_pkey" PRIMARY KEY ("id")
);

-- CitizenSession (FK to Penduduk)
CREATE TABLE "citizen_session" (
    "id" BIGSERIAL NOT NULL,
    "penduduk_id" BIGINT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "revoked_at" TIMESTAMP(6),
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "citizen_session_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- SECTION 5: TABLES WITH FOREIGN KEYS (Level 3)
-- ============================================================

-- CitizenVerification (FK to Penduduk)
CREATE TABLE "citizen_verification" (
    "id" BIGSERIAL NOT NULL,
    "penduduk_id" BIGINT NOT NULL,
    "verification_challenge" VARCHAR(100) NOT NULL,
    "status" "VerificationStatus" DEFAULT 'PENDING',
    "attempts" INTEGER DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "verified_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "citizen_verification_pkey" PRIMARY KEY ("id")
);

-- OtpChallenge (FK to CitizenVerification)
CREATE TABLE "otp_challenge" (
    "id" BIGSERIAL NOT NULL,
    "verification_id" BIGINT NOT NULL,
    "otp_hash" VARCHAR(255) NOT NULL,
    "otp_challenge" VARCHAR(100) NOT NULL,
    "status" "OtpStatus" DEFAULT 'ACTIVE',
    "attempts" INTEGER DEFAULT 0,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "otp_challenge_pkey" PRIMARY KEY ("id")
);

-- AnggotaKeluarga (FK to Keluarga, Penduduk)
CREATE TABLE "anggota_keluarga" (
    "id" BIGSERIAL NOT NULL,
    "keluarga_id" BIGINT NOT NULL,
    "penduduk_id" BIGINT NOT NULL,
    "hubungan" VARCHAR(50) NOT NULL,
    "is_aktif" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "anggota_keluarga_pkey" PRIMARY KEY ("id")
);

-- PerangkatDesa (FK to Penduduk, Desa, Account)
CREATE TABLE "perangkat_desa" (
    "id" BIGSERIAL NOT NULL,
    "penduduk_id" BIGINT NOT NULL,
    "desa_id" BIGINT NOT NULL,
    "jabatan" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'AKTIF',
    "foto_url" VARCHAR(500),
    "account_id" BIGINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "perangkat_desa_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- SECTION 6: CMS TABLES
-- ============================================================

-- Kategori (FK to Desa)
CREATE TABLE "kategori" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "deskripsi" VARCHAR(500),
    "ikon" VARCHAR(50),
    "warna" VARCHAR(20),
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desa_id" BIGINT,
    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- Berita (FK to Account, Kategori)
CREATE TABLE "berita" (
    "id" BIGSERIAL NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "excerpt" VARCHAR(500),
    "konten" TEXT NOT NULL,
    "gambar_url" VARCHAR(500),
    "status" "BeritaStatus" NOT NULL DEFAULT 'DRAFT',
    "penulis_id" BIGINT,
    "kategori_id" BIGINT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "meta_title" VARCHAR(255),
    "meta_deskripsi" VARCHAR(500),
    "meta_keywords" VARCHAR(255),
    "og_image_url" VARCHAR(500),
    CONSTRAINT "berita_pkey" PRIMARY KEY ("id")
);

-- Halaman (FK to Account, Desa)
CREATE TABLE "halaman" (
    "id" BIGSERIAL NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "konten" TEXT NOT NULL,
    "excerpt" VARCHAR(500),
    "gambar_url" VARCHAR(500),
    "status" "HalamanStatus" NOT NULL DEFAULT 'DRAFT',
    "created_by_id" BIGINT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "meta_title" VARCHAR(255),
    "meta_deskripsi" VARCHAR(500),
    "meta_keywords" VARCHAR(255),
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "is_menu" BOOLEAN NOT NULL DEFAULT false,
    "desa_id" BIGINT,
    CONSTRAINT "halaman_pkey" PRIMARY KEY ("id")
);

-- Media (FK to Account)
CREATE TABLE "media" (
    "id" BIGSERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" VARCHAR(500),
    "file_url" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "alt" VARCHAR(255),
    "kategori" VARCHAR(50),
    "uploaded_by_id" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- SECTION 7: INDEXES
-- ============================================================

-- Provinsi indexes
CREATE UNIQUE INDEX "provinsi_kode_key" ON "provinsi"("kode");
CREATE INDEX "provinsi_nama_idx" ON "provinsi"("nama");

-- Ref tables indexes
CREATE UNIQUE INDEX "ref_agama_kode_key" ON "ref_agama"("kode");
CREATE UNIQUE INDEX "ref_gol_darah_kode_key" ON "ref_gol_darah"("kode");
CREATE UNIQUE INDEX "ref_status_perkawinan_kode_key" ON "ref_status_perkawinan"("kode");
CREATE UNIQUE INDEX "ref_hubungan_keluarga_kode_key" ON "ref_hubungan_keluarga"("kode");
CREATE UNIQUE INDEX "ref_status_kependudukan_kode_key" ON "ref_status_kependudukan"("kode");
CREATE UNIQUE INDEX "ref_pendidikan_kode_key" ON "ref_pendidikan"("kode");
CREATE UNIQUE INDEX "ref_pekerjaan_kode_key" ON "ref_pekerjaan"("kode");
CREATE UNIQUE INDEX "ref_jabatan_perangkat_kode_key" ON "ref_jabatan_perangkat"("kode");
CREATE UNIQUE INDEX "ref_status_perangkat_kode_key" ON "ref_status_perangkat"("kode");

-- Account indexes
CREATE UNIQUE INDEX "account_username_key" ON "account"("username");
CREATE UNIQUE INDEX "account_email_key" ON "account"("email");

-- Role Permission indexes
CREATE UNIQUE INDEX "role_permission_role_id_permission_id_key" ON "role_permission"("role_id", "permission_id");

-- Account Role indexes
CREATE UNIQUE INDEX "account_role_account_id_role_id_key" ON "account_role"("account_id", "role_id");

-- Audit log indexes
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- Configuration indexes
CREATE UNIQUE INDEX "configuration_group_name_key_key" ON "configuration"("group_name", "key");

-- Kabupaten indexes
CREATE UNIQUE INDEX "kabupaten_provinsi_id_kode_key" ON "kabupaten"("provinsi_id", "kode");
CREATE INDEX "kabupaten_kode_idx" ON "kabupaten"("kode");
CREATE INDEX "kabupaten_nama_idx" ON "kabupaten"("nama");

-- Kecamatan indexes
CREATE UNIQUE INDEX "kecamatan_kabupaten_id_kode_key" ON "kecamatan"("kabupaten_id", "kode");
CREATE INDEX "kecamatan_kode_idx" ON "kecamatan"("kode");
CREATE INDEX "kecamatan_nama_idx" ON "kecamatan"("nama");

-- Desa indexes
CREATE UNIQUE INDEX "desa_kecamatan_id_kode_key" ON "desa"("kecamatan_id", "kode");
CREATE INDEX "desa_kode_idx" ON "desa"("kode");
CREATE INDEX "desa_nama_idx" ON "desa"("nama");

-- Identitas desa indexes
CREATE UNIQUE INDEX "identitas_desa_desa_id_key" ON "identitas_desa"("desa_id");

-- Penduduk indexes
CREATE UNIQUE INDEX "penduduk_nik_key" ON "penduduk"("nik");
CREATE INDEX "penduduk_desa_id_idx" ON "penduduk"("desa_id");
CREATE INDEX "penduduk_nama_lengkap_idx" ON "penduduk"("nama_lengkap");

-- Keluarga indexes
CREATE UNIQUE INDEX "keluarga_no_kk_key" ON "keluarga"("no_kk");
CREATE UNIQUE INDEX "keluarga_kepala_id_key" ON "keluarga"("kepala_id");
CREATE INDEX "keluarga_desa_id_idx" ON "keluarga"("desa_id");

-- Anggota keluarga indexes
CREATE UNIQUE INDEX "anggota_keluarga_keluarga_id_penduduk_id_key" ON "anggota_keluarga"("keluarga_id", "penduduk_id");
CREATE INDEX "anggota_keluarga_keluarga_id_idx" ON "anggota_keluarga"("keluarga_id");
CREATE INDEX "anggota_keluarga_penduduk_id_idx" ON "anggota_keluarga"("penduduk_id");

-- Session indexes
CREATE UNIQUE INDEX "internal_session_token_key" ON "internal_session"("token");
CREATE UNIQUE INDEX "citizen_session_token_key" ON "citizen_session"("token");

-- Citizen verification indexes
CREATE UNIQUE INDEX "citizen_verification_verification_challenge_key" ON "citizen_verification"("verification_challenge");

-- OTP challenge indexes
CREATE UNIQUE INDEX "otp_challenge_otp_challenge_key" ON "otp_challenge"("otp_challenge");

-- Perangkat desa indexes
CREATE INDEX "perangkat_desa_penduduk_id_idx" ON "perangkat_desa"("penduduk_id");
CREATE INDEX "perangkat_desa_desa_id_idx" ON "perangkat_desa"("desa_id");
CREATE INDEX "perangkat_desa_jabatan_idx" ON "perangkat_desa"("jabatan");
CREATE INDEX "perangkat_desa_status_idx" ON "perangkat_desa"("status");

-- CMS Kategori indexes
CREATE UNIQUE INDEX "kategori_slug_key" ON "kategori"("slug");
CREATE INDEX "kategori_urutan_idx" ON "kategori"("urutan");
CREATE INDEX "kategori_desa_id_idx" ON "kategori"("desa_id");

-- CMS Berita indexes
CREATE UNIQUE INDEX "berita_slug_key" ON "berita"("slug");
CREATE INDEX "berita_status_idx" ON "berita"("status");
CREATE INDEX "berita_published_at_idx" ON "berita"("published_at");
CREATE INDEX "berita_kategori_id_idx" ON "berita"("kategori_id");
CREATE INDEX "berita_penulis_id_idx" ON "berita"("penulis_id");

-- CMS Halaman indexes
CREATE UNIQUE INDEX "halaman_slug_key" ON "halaman"("slug");
CREATE INDEX "halaman_status_idx" ON "halaman"("status");
CREATE INDEX "halaman_urutan_idx" ON "halaman"("urutan");
CREATE INDEX "halaman_is_menu_idx" ON "halaman"("is_menu");
CREATE INDEX "halaman_desa_id_idx" ON "halaman"("desa_id");

-- CMS Media indexes
CREATE UNIQUE INDEX "media_slug_key" ON "media"("slug");
CREATE INDEX "media_file_type_idx" ON "media"("file_type");
CREATE INDEX "media_kategori_idx" ON "media"("kategori");
CREATE INDEX "media_uploaded_by_id_idx" ON "media"("uploaded_by_id");

-- ============================================================
-- SECTION 8: FOREIGN KEYS
-- ============================================================

-- Kabupaten FK
ALTER TABLE "kabupaten" ADD CONSTRAINT "kabupaten_provinsi_id_foreign"
    FOREIGN KEY ("provinsi_id") REFERENCES "provinsi"("id")
    ON UPDATE NO ACTION;

-- Kecamatan FK
ALTER TABLE "kecamatan" ADD CONSTRAINT "kecamatan_kabupaten_id_foreign"
    FOREIGN KEY ("kabupaten_id") REFERENCES "kabupaten"("id")
    ON UPDATE NO ACTION;

-- Desa FK
ALTER TABLE "desa" ADD CONSTRAINT "desa_kecamatan_id_foreign"
    FOREIGN KEY ("kecamatan_id") REFERENCES "kecamatan"("id")
    ON UPDATE NO ACTION;

-- IdentitasDesa FK
ALTER TABLE "identitas_desa" ADD CONSTRAINT "identitas_desa_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- AccountRole FK
ALTER TABLE "account_role" ADD CONSTRAINT "account_role_account_id_foreign"
    FOREIGN KEY ("account_id") REFERENCES "account"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "account_role" ADD CONSTRAINT "account_role_role_id_foreign"
    FOREIGN KEY ("role_id") REFERENCES "role"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- RolePermission FK
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_foreign"
    FOREIGN KEY ("role_id") REFERENCES "role"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_foreign"
    FOREIGN KEY ("permission_id") REFERENCES "permission"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- Penduduk FK
ALTER TABLE "penduduk" ADD CONSTRAINT "penduduk_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON UPDATE NO ACTION;

-- Keluarga FK
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_kepala_id_foreign"
    FOREIGN KEY ("kepala_id") REFERENCES "penduduk"("id")
    ON UPDATE NO ACTION;
ALTER TABLE "keluarga" ADD CONSTRAINT "keluarga_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON UPDATE NO ACTION;

-- AnggotaKeluarga FK
ALTER TABLE "anggota_keluarga" ADD CONSTRAINT "anggota_keluarga_keluarga_id_foreign"
    FOREIGN KEY ("keluarga_id") REFERENCES "keluarga"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "anggota_keluarga" ADD CONSTRAINT "anggota_keluarga_penduduk_id_foreign"
    FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- InternalSession FK
ALTER TABLE "internal_session" ADD CONSTRAINT "internal_session_account_id_foreign"
    FOREIGN KEY ("account_id") REFERENCES "account"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- CitizenSession FK
ALTER TABLE "citizen_session" ADD CONSTRAINT "citizen_session_penduduk_id_foreign"
    FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- CitizenVerification FK
ALTER TABLE "citizen_verification" ADD CONSTRAINT "citizen_verification_penduduk_id_foreign"
    FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- OtpChallenge FK
ALTER TABLE "otp_challenge" ADD CONSTRAINT "otp_challenge_verification_id_foreign"
    FOREIGN KEY ("verification_id") REFERENCES "citizen_verification"("id")
    ON DELETE CASCADE ON UPDATE NO ACTION;

-- PerangkatDesa FK
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_penduduk_id_foreign"
    FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id")
    ON UPDATE NO ACTION;
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON UPDATE NO ACTION;
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_account_id_foreign"
    FOREIGN KEY ("account_id") REFERENCES "account"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "perangkat_desa" ADD CONSTRAINT "perangkat_desa_account_id_key" UNIQUE ("account_id");

-- Kategori FK
ALTER TABLE "kategori" ADD CONSTRAINT "kategori_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON UPDATE NO ACTION;

-- Berita FK
ALTER TABLE "berita" ADD CONSTRAINT "berita_penulis_id_foreign"
    FOREIGN KEY ("penulis_id") REFERENCES "account"("id")
    ON UPDATE NO ACTION;
ALTER TABLE "berita" ADD CONSTRAINT "berita_kategori_id_foreign"
    FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id")
    ON UPDATE NO ACTION;

-- Halaman FK
ALTER TABLE "halaman" ADD CONSTRAINT "halaman_created_by_id_foreign"
    FOREIGN KEY ("created_by_id") REFERENCES "account"("id")
    ON UPDATE NO ACTION;
ALTER TABLE "halaman" ADD CONSTRAINT "halaman_desa_id_foreign"
    FOREIGN KEY ("desa_id") REFERENCES "desa"("id")
    ON UPDATE NO ACTION;

-- Media FK
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_foreign"
    FOREIGN KEY ("uploaded_by_id") REFERENCES "account"("id")
    ON UPDATE NO ACTION;
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(sql_content)

print(f"Baseline migration created: {output_path}")
print(f"File size: {len(sql_content)} bytes")
