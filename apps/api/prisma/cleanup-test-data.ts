import { PrismaClient } from '@prisma/client';

async function cleanupTestData() {
  const prisma = new PrismaClient();

  try {
    console.log('Cleaning up test data...\n');

    // Delete test accounts (those starting with 'testadmin')
    const testAccounts = await prisma.$queryRaw<any[]>`
      SELECT id FROM account WHERE username LIKE 'testadmin%';
    `;
    console.log(`Found ${testAccounts.length} test accounts`);

    for (const account of testAccounts) {
      await prisma.internalSession.deleteMany({ where: { accountId: BigInt(account.id) } });
      await prisma.accountRole.deleteMany({ where: { accountId: BigInt(account.id) } });
      await prisma.account.delete({ where: { id: BigInt(account.id) } });
      console.log(`  Deleted account ${account.id}`);
    }

    // Delete test penduduk (NIK starting with '327105')
    const testPenduduk = await prisma.$queryRaw<any[]>`
      SELECT id FROM penduduk WHERE nik LIKE '327105%';
    `;
    console.log(`Found ${testPenduduk.length} test penduduk`);

    for (const住户 of testPenduduk) {
      await prisma.anggotaKeluarga.deleteMany({ where: { pendudukId: BigInt(住户.id) } });
      await prisma.penduduk.delete({ where: { id: BigInt(住户.id) } });
      console.log(`  Deleted penduduk ${住户.id}`);
    }

    // Delete test keluarga (noKK starting with '327105')
    const testKeluarga = await prisma.$queryRaw<any[]>`
      SELECT id FROM keluarga WHERE no_kk LIKE '327105%';
    `;
    console.log(`Found ${testKeluarga.length} test keluarga`);

    for (const keluarga of testKeluarga) {
      await prisma.keluarga.delete({ where: { id: BigInt(keluarga.id) } });
      console.log(`  Deleted keluarga ${keluarga.id}`);
    }

    // Delete test perangkat desa
    const testPerangkat = await prisma.$queryRaw<any[]>`
      SELECT id FROM perangkat_desa WHERE penduduk_id IN (
        SELECT id FROM penduduk WHERE nik LIKE '327105%'
      );
    `;
    console.log(`Found ${testPerangkat.length} test perangkat desa`);

    for (const perangkat of testPerangkat) {
      await prisma.perangkatDesa.delete({ where: { id: BigInt(perangkat.id) } });
      console.log(`  Deleted perangkat ${perangkat.id}`);
    }

    console.log('\nCleanup complete!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData();
