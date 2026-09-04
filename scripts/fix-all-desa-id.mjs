import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const desaCount = await prisma.desa.count();
  if (desaCount !== 1) {
    throw new Error(`CRITICAL GUARD ABORT: Expected exactly 1 Desa instance in single-tenant deployment, found ${desaCount}. Manual resolution required.`);
  }

  const desa = await prisma.desa.findFirst();
  const desaId = desa.id;

  const tables = [
    'saran_aduan',
    'posyandu_kunjungan',
    'bumil',
    'buku_bank',
    'bansos',
    'blanko',
    'nomor_dokumen',
    'agenda',
    'surat_masuk',
    'potensi_desa',
    'apbdes',
    'kas_umum',
    'mutasi_penduduk',
    'umkm'
  ];

  console.log('--- Backfilling NULL desa_id ---');
  for (const table of tables) {
    try {
      const count = await prisma.$executeRawUnsafe(`
        UPDATE "${table}" SET desa_id = ${desaId} WHERE desa_id IS NULL;
      `);
      console.log(`Updated ${table}: ${count} rows backfilled to desa_id = ${desaId}`);
    } catch (err) {
      console.log(`Skip ${table}: ${err.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
