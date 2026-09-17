-- Migration: add_service_document_engine
-- Description: Service Document Template Engine Foundation Models
-- Created: 2026-08-13
-- NOTE: Tables must be created in dependency order

-- ============================================================
-- Create Enums
-- ============================================================

CREATE TYPE "FieldType" AS ENUM (
    'TEXT',
    'NUMBER',
    'DATE',
    'DATETIME',
    'SELECT',
    'MULTISELECT',
    'RADIO',
    'CHECKBOX',
    'TEXTAREA',
    'FILE',
    'NIK',
    'EMAIL',
    'PHONE',
    'ADDRESS'
);

CREATE TYPE "RequestStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'VERIFICATION',
    'PROCESSING',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE "VersionStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TYPE "DocumentStatus" AS ENUM (
    'GENERATED',
    'PENDING_SIGNATURE',
    'SIGNED',
    'VERIFIED',
    'ARCHIVED'
);

CREATE TYPE "SignatureType" AS ENUM (
    'IMAGE'
);

-- ============================================================
-- Create Tables in dependency order
-- ============================================================

-- 1. Layanan (no foreign keys except to existing tables)
CREATE TABLE "layanan" (
    "id" BIGSERIAL PRIMARY KEY,
    "desa_id" BIGINT NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "kategori" VARCHAR(100),
    "requires_document" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    CONSTRAINT "layanan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "layanan_desa_id_kode_key" ON "layanan"("desa_id", "kode");
CREATE INDEX "layanan_desa_id_idx" ON "layanan"("desa_id");
CREATE INDEX "layanan_slug_idx" ON "layanan"("slug");
CREATE INDEX "layanan_kategori_idx" ON "layanan"("kategori");
CREATE INDEX "layanan_is_active_idx" ON "layanan"("is_active");
CREATE UNIQUE INDEX "layanan_slug_key" ON "layanan"("slug");

-- 2. DokumenDefinition (depends on layanan)
CREATE TABLE "dokumen_definition" (
    "id" BIGSERIAL PRIMARY KEY,
    "layanan_id" BIGINT NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dokumen_definition_layanan_id_fkey" FOREIGN KEY ("layanan_id") REFERENCES "layanan"("id") ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "dokumen_definition_layanan_id_kode_key" ON "dokumen_definition"("layanan_id", "kode");
CREATE INDEX "dokumen_definition_layanan_id_idx" ON "dokumen_definition"("layanan_id");
CREATE UNIQUE INDEX "dokumen_definition_slug_key" ON "dokumen_definition"("slug");

-- 3. TemplateSurat (depends on dokumen_definition)
CREATE TABLE "template_surat" (
    "id" BIGSERIAL PRIMARY KEY,
    "dokumen_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_surat_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "dokumen_definition"("id") ON UPDATE NO ACTION
);

CREATE INDEX "template_surat_dokumen_id_idx" ON "template_surat"("dokumen_id");
CREATE UNIQUE INDEX "template_surat_slug_key" ON "template_surat"("slug");

-- 4. FieldDefinition (depends on layanan AND template_surat)
CREATE TABLE "field_definition" (
    "id" BIGSERIAL PRIMARY KEY,
    "layanan_id" BIGINT,
    "template_id" BIGINT,
    "key" VARCHAR(100) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "type" "FieldType" NOT NULL,
    "source" VARCHAR(100),
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "default_value" VARCHAR(500),
    "description" TEXT,
    "options" JSONB,
    "placeholder" VARCHAR(255),
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "field_definition_layanan_id_fkey" FOREIGN KEY ("layanan_id") REFERENCES "layanan"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "field_definition_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template_surat"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "field_definition_layanan_id_key_key" ON "field_definition"("layanan_id", "key");
CREATE UNIQUE INDEX "field_definition_template_id_key_key" ON "field_definition"("template_id", "key");
CREATE INDEX "field_definition_layanan_id_idx" ON "field_definition"("layanan_id");
CREATE INDEX "field_definition_template_id_idx" ON "field_definition"("template_id");

-- 5. NomorDokumen (depends on desa)
CREATE TABLE "nomor_dokumen" (
    "id" BIGSERIAL PRIMARY KEY,
    "desa_id" BIGINT NOT NULL,
    "last_sequence" BIGINT NOT NULL DEFAULT 0,
    "last_year" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nomor_dokumen_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "nomor_dokumen_desa_id_key" ON "nomor_dokumen"("desa_id");

-- 6. NomorSuratConfig (depends on layanan)
CREATE TABLE "nomor_surat_config" (
    "id" BIGSERIAL PRIMARY KEY,
    "layanan_id" BIGINT NOT NULL,
    "format_template" VARCHAR(255) NOT NULL,
    "starting_number" BIGINT NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "nomor_surat_config_layanan_id_fkey" FOREIGN KEY ("layanan_id") REFERENCES "layanan"("id") ON UPDATE NO ACTION
);

CREATE INDEX "nomor_surat_config_layanan_id_idx" ON "nomor_surat_config"("layanan_id");
CREATE UNIQUE INDEX "nomor_surat_config_layanan_id_key" ON "nomor_surat_config"("layanan_id");

-- 7. PenandaTangan (depends on desa)
CREATE TABLE "penanda_tangan" (
    "id" BIGSERIAL PRIMARY KEY,
    "desa_id" BIGINT NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "jabatan" VARCHAR(255) NOT NULL,
    "nip" VARCHAR(50),
    "tanda_tangan_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "penanda_tangan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON UPDATE NO ACTION
);

CREATE INDEX "penanda_tangan_desa_id_idx" ON "penanda_tangan"("desa_id");

-- 8. TemplateVersion (depends on template_surat and account)
CREATE TABLE "template_version" (
    "id" BIGSERIAL PRIMARY KEY,
    "template_id" BIGINT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "kop_config" JSONB,
    "signature_config" JSONB,
    "status" "VersionStatus" NOT NULL DEFAULT 'DRAFT',
    "changelog" TEXT,
    "created_by" BIGINT,
    "published_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "template_version_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "template_surat"("id") ON UPDATE NO ACTION,
    CONSTRAINT "template_version_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "account"("id") ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "template_version_template_id_version_key" ON "template_version"("template_id", "version");
CREATE INDEX "template_version_template_id_idx" ON "template_version"("template_id");
CREATE INDEX "template_version_status_idx" ON "template_version"("status");

-- 9. PermintaanLayanan (depends on layanan, penduduk, account)
CREATE TABLE "permintaan_layanan" (
    "id" BIGSERIAL PRIMARY KEY,
    "layanan_id" BIGINT NOT NULL,
    "penduduk_id" BIGINT,
    "desa_id" BIGINT NOT NULL,
    "nomor_permintaan" VARCHAR(50) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "data_json" JSONB,
    "catatan" TEXT,
    "submitted_at" TIMESTAMP(6),
    "processed_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "created_by" BIGINT,
    "processed_by" BIGINT,
    "approved_by" BIGINT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    CONSTRAINT "permintaan_layanan_layanan_id_fkey" FOREIGN KEY ("layanan_id") REFERENCES "layanan"("id") ON UPDATE NO ACTION,
    CONSTRAINT "permintaan_layanan_penduduk_id_fkey" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON UPDATE NO ACTION
);

CREATE INDEX "permintaan_layanan_desa_id_idx" ON "permintaan_layanan"("desa_id");
CREATE INDEX "permintaan_layanan_layanan_id_idx" ON "permintaan_layanan"("layanan_id");
CREATE INDEX "permintaan_layanan_penduduk_id_idx" ON "permintaan_layanan"("penduduk_id");
CREATE INDEX "permintaan_layanan_status_idx" ON "permintaan_layanan"("status");
CREATE INDEX "permintaan_layanan_created_by_idx" ON "permintaan_layanan"("created_by");
CREATE UNIQUE INDEX "permintaan_layanan_nomor_permintaan_key" ON "permintaan_layanan"("nomor_permintaan");

-- 10. InstanDokumen (depends on dokumen_definition, template_version, permintaan_layanan)
CREATE TABLE "instan_dokumen" (
    "id" BIGSERIAL PRIMARY KEY,
    "dokumen_id" BIGINT NOT NULL,
    "permintaan_id" BIGINT,
    "template_version_id" BIGINT NOT NULL,
    "nomor_dokumen" VARCHAR(50) NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "data_snapshot" JSONB NOT NULL,
    "content_snapshot" JSONB NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'GENERATED',
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed_at" TIMESTAMP(6),
    "qr_code" VARCHAR(500),
    "verification_token" VARCHAR(100),
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "instan_dokumen_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "dokumen_definition"("id") ON UPDATE NO ACTION,
    CONSTRAINT "instan_dokumen_permintaan_id_fkey" FOREIGN KEY ("permintaan_id") REFERENCES "permintaan_layanan"("id") ON UPDATE NO ACTION,
    CONSTRAINT "instan_dokumen_template_version_id_fkey" FOREIGN KEY ("template_version_id") REFERENCES "template_version"("id") ON UPDATE NO ACTION
);

CREATE INDEX "instan_dokumen_dokumen_id_idx" ON "instan_dokumen"("dokumen_id");
CREATE INDEX "instan_dokumen_permintaan_id_idx" ON "instan_dokumen"("permintaan_id");
CREATE INDEX "instan_dokumen_template_version_id_idx" ON "instan_dokumen"("template_version_id");
CREATE INDEX "instan_dokumen_nomor_dokumen_idx" ON "instan_dokumen"("nomor_dokumen");
CREATE INDEX "instan_dokumen_verification_token_idx" ON "instan_dokumen"("verification_token");
CREATE UNIQUE INDEX "instan_dokumen_nomor_dokumen_key" ON "instan_dokumen"("nomor_dokumen");
CREATE UNIQUE INDEX "instan_dokumen_verification_token_key" ON "instan_dokumen"("verification_token");

-- 11. DokumenSignature (depends on instan_dokumen and penanda_tangan)
CREATE TABLE "dokumen_signature" (
    "id" BIGSERIAL PRIMARY KEY,
    "dokumen_id" BIGINT NOT NULL,
    "penandatangan_id" BIGINT NOT NULL,
    "tanda_tangan_url" VARCHAR(500),
    "tanda_tangan_type" "SignatureType" NOT NULL DEFAULT 'IMAGE',
    "signed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dokumen_signature_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "instan_dokumen"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT "dokumen_signature_penandatangan_id_fkey" FOREIGN KEY ("penandatangan_id") REFERENCES "penanda_tangan"("id") ON UPDATE NO ACTION
);

CREATE INDEX "dokumen_signature_dokumen_id_idx" ON "dokumen_signature"("dokumen_id");
CREATE INDEX "dokumen_signature_penandatangan_id_idx" ON "dokumen_signature"("penandatangan_id");
CREATE UNIQUE INDEX "dokumen_signature_dokumen_id_key" ON "dokumen_signature"("dokumen_id");

-- 12. VerifikasiDokumen (depends on instan_dokumen)
CREATE TABLE "verifikasi_dokumen" (
    "id" BIGSERIAL PRIMARY KEY,
    "dokumen_id" BIGINT NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "qr_code_url" VARCHAR(500),
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verified_at" TIMESTAMP(6),
    "verify_count" INTEGER NOT NULL DEFAULT 0,
    "last_verify_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "verifikasi_dokumen_dokumen_id_fkey" FOREIGN KEY ("dokumen_id") REFERENCES "instan_dokumen"("id") ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE INDEX "verifikasi_dokumen_token_idx" ON "verifikasi_dokumen"("token");
CREATE INDEX "verifikasi_dokumen_dokumen_id_idx" ON "verifikasi_dokumen"("dokumen_id");
CREATE UNIQUE INDEX "verifikasi_dokumen_token_key" ON "verifikasi_dokumen"("token");
CREATE UNIQUE INDEX "verifikasi_dokumen_dokumen_id_key" ON "verifikasi_dokumen"("dokumen_id");

-- ============================================================
-- Migration complete
-- ============================================================
