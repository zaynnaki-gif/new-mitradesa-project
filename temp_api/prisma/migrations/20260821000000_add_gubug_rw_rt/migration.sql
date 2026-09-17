-- Migration: Add Gubug, Rw, Rt models for wilayah hierarchy
-- Created: 2026-08-21
-- Description: Creates Gubug (dusun), Rw, and Rt tables for hierarchical wilayah management

-- Create gubug table (renamed from dusun to avoid conflicts)
CREATE TABLE "gubug" (
    "id" BIGSERIAL PRIMARY KEY,
    "desa_id" BIGINT NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "gubug_desa_id_foreign" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "gubug_desa_id_kode_unique" UNIQUE ("desa_id", "kode")
);

CREATE INDEX "gubug_desa_id_idx" ON "gubug"("desa_id");

-- Create rw table
CREATE TABLE "rw" (
    "id" BIGSERIAL PRIMARY KEY,
    "gubug_id" BIGINT NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "nama" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "rw_gubug_id_foreign" FOREIGN KEY ("gubug_id") REFERENCES "gubug"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "rw_gubug_id_kode_unique" UNIQUE ("gubug_id", "kode")
);

CREATE INDEX "rw_gubug_id_idx" ON "rw"("gubug_id");

-- Create rt table (no nama field - only kode)
CREATE TABLE "rt" (
    "id" BIGSERIAL PRIMARY KEY,
    "rw_id" BIGINT NOT NULL,
    "kode" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "rt_rw_id_foreign" FOREIGN KEY ("rw_id") REFERENCES "rw"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "rt_rw_id_kode_unique" UNIQUE ("rw_id", "kode")
);

CREATE INDEX "rt_rw_id_idx" ON "rt"("rw_id");
