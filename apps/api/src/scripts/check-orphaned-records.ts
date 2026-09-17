import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Checking for Orphaned Records ---');

  // 1. Check PermintaanLayanan where Layanan is soft-deleted
  const orphanedPermintaanLayanan = await prisma.permintaanLayanan.findMany({
    where: {
      layanan: {
        deletedAt: {
          not: null,
        },
      },
    },
    select: { id: true, nomorPermintaan: true, layananId: true },
  });
  console.log(`[PermintaanLayanan -> Layanan] Orphaned (soft-deleted parent) records found: ${orphanedPermintaanLayanan.length}`);
  if (orphanedPermintaanLayanan.length > 0) console.log(orphanedPermintaanLayanan);

  // 2. Check PermintaanLayanan where Penduduk is soft-deleted
  const orphanedPenduduk = await prisma.permintaanLayanan.findMany({
    where: {
      pendudukId: { not: null },
      penduduk: {
        deletedAt: {
          not: null,
        },
      },
    },
    select: { id: true, nomorPermintaan: true, pendudukId: true },
  });
  console.log(`[PermintaanLayanan -> Penduduk] Orphaned (soft-deleted parent) records found: ${orphanedPenduduk.length}`);
  if (orphanedPenduduk.length > 0) console.log(orphanedPenduduk);

  // 3. Check InstanDokumen where PermintaanLayanan is soft-deleted
  const orphanedInstanDokumen = await prisma.instanDokumen.findMany({
    where: {
      permintaanId: { not: null },
      permintaan: {
        deletedAt: {
          not: null,
        },
      },
    },
    select: { id: true, nomorDokumen: true, permintaanId: true },
  });
  console.log(`[InstanDokumen -> PermintaanLayanan] Orphaned (soft-deleted parent) records found: ${orphanedInstanDokumen.length}`);
  if (orphanedInstanDokumen.length > 0) console.log(orphanedInstanDokumen);

  console.log('--- Done ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
