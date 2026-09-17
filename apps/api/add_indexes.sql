CREATE INDEX IF NOT EXISTS "permintaan_layanan_desa_id_status_idx" ON "permintaan_layanan"("desa_id", "status");
CREATE INDEX IF NOT EXISTS "permintaan_layanan_desa_id_created_at_idx" ON "permintaan_layanan"("desa_id", "created_at");
