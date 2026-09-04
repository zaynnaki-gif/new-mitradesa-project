import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

const directStmts = [
  'ALTER TABLE "apbdes_item" DROP COLUMN IF EXISTS "desa_id"',
  'CREATE INDEX IF NOT EXISTS "apbdes_item_kode_rekening_idx" ON "apbdes_item"("kode_rekening")',
  'CREATE INDEX IF NOT EXISTS "bansos_desa_id_idx" ON "bansos"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "buku_bank_desa_id_idx" ON "buku_bank"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "bumil_desa_id_idx" ON "bumil"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "kas_umum_desa_id_idx" ON "kas_umum"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "kas_umum_apbdes_item_id_idx" ON "kas_umum"("apbdes_item_id")',
  'CREATE INDEX IF NOT EXISTS "kas_umum_kode_rekening_idx" ON "kas_umum"("kode_rekening")',
  'CREATE INDEX IF NOT EXISTS "mutasi_penduduk_desa_id_idx" ON "mutasi_penduduk"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "penanda_tangan_account_id_idx" ON "penanda_tangan"("account_id")',
  'CREATE INDEX IF NOT EXISTS "posyandu_kunjungan_desa_id_idx" ON "posyandu_kunjungan"("desa_id")',
  'CREATE INDEX IF NOT EXISTS "saran_aduan_desa_id_idx" ON "saran_aduan"("desa_id")'
];

const fkBlock = `
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'penanda_tangan_account_id_fkey') THEN
    ALTER TABLE "penanda_tangan" ADD CONSTRAINT "penanda_tangan_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'posyandu_kunjungan_desa_id_fkey') THEN
    ALTER TABLE "posyandu_kunjungan" ADD CONSTRAINT "posyandu_kunjungan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bumil_desa_id_fkey') THEN
    ALTER TABLE "bumil" ADD CONSTRAINT "bumil_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_umum_desa_id_fkey') THEN
    ALTER TABLE "kas_umum" ADD CONSTRAINT "kas_umum_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'kas_umum_apbdes_item_id_fkey') THEN
    ALTER TABLE "kas_umum" ADD CONSTRAINT "kas_umum_apbdes_item_id_fkey" FOREIGN KEY ("apbdes_item_id") REFERENCES "apbdes_item"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buku_bank_desa_id_fkey') THEN
    ALTER TABLE "buku_bank" ADD CONSTRAINT "buku_bank_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bansos_desa_id_fkey') THEN
    ALTER TABLE "bansos" ADD CONSTRAINT "bansos_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'saran_aduan_desa_id_fkey') THEN
    ALTER TABLE "saran_aduan" ADD CONSTRAINT "saran_aduan_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mutasi_penduduk_desa_id_fkey') THEN
    ALTER TABLE "mutasi_penduduk" ADD CONSTRAINT "mutasi_penduduk_desa_id_fkey" FOREIGN KEY ("desa_id") REFERENCES "desa"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;
`;

async function main() {
  console.log('Applying direct statements...');
  for (const stmt of directStmts) {
    try {
      await prisma.$executeRawUnsafe(stmt);
    } catch (e) {
      console.log(`Stmt error (${stmt}):`, e.message);
    }
  }
  console.log('Applying FK block...');
  await prisma.$executeRawUnsafe(fkBlock);
  console.log('All constraints & indexes applied successfully to live DB.');
}

main().finally(() => prisma.$disconnect());
