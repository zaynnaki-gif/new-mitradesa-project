-- Migration: Add Lembaga model for organisasi kemasyarakatan
-- Created: 2026-08-21
-- Description: Creates lembaga table for BPD, PKK, KADER, RT, RW organizations

CREATE TABLE "lembaga" (
    "id" BIGSERIAL PRIMARY KEY,
    "desa_id" BIGINT NOT NULL,
    "jenis" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT,
    "penduduk_id" BIGINT,
    "gubug_id" BIGINT,
    "rw_id" BIGINT,
    "rt_id" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPMZ(6) NOT NULL DEFAULT NOW(),
    CONSTRAINT "lembaga_desa_id_foreign" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "lembaga_penduduk_id_foreign" FOREIGN KEY ("penduduk_id") REFERENCES "penduduk"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "lembaga_gubug_id_foreign" FOREIGN KEY ("gubug_id") REFERENCES "gubug"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "lembaga_rw_id_foreign" FOREIGN KEY ("rw_id") REFERENCES "rw"("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT "lembaga_rt_id_foreign" FOREIGN KEY ("rt_id") REFERENCES "rt"("id") ON DELETE SET NULL ON UPDATE NO ACTION
);

CREATE INDEX "lembaga_desa_id_idx" ON "lembaga"("desa_id");
CREATE INDEX "lembaga_jenis_idx" ON "lembaga"("jenis");
CREATE INDEX "lembaga_gubug_id_idx" ON "lembaga"("gubug_id");
CREATE INDEX "lembaga_rw_id_idx" ON "lembaga"("rw_id");
CREATE INDEX "lembaga_rt_id_idx" ON "lembaga"("rt_id");

-- Mark migration applied
INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    gen_random_uuid()::text,
    'manual_migration',
    NOW(),
    '20260821000001_add_lembaga',
    'Applied manually',
    NULL,
    NOW(),
    1
);
