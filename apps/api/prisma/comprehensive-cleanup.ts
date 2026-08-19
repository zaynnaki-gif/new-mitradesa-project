import { PrismaClient } from '@prisma/client';

async function comprehensiveCleanup() {
  const prisma = new PrismaClient();

  try {
    console.log('Comprehensive cleanup of test data...\n');

    // 1. Clean up test accounts
    console.log('1. Cleaning up test accounts...');
    const testUsernames = ['testadmin', 'testadmin_perangkat', 'testadmin_keluarga'];

    for (const username of testUsernames) {
      const accounts = await prisma.$queryRaw<any[]>`
        SELECT id FROM account WHERE username LIKE ${username + '%'};
      `;

      for (const account of accounts) {
        try {
          await prisma.internalSession.deleteMany({ where: { accountId: BigInt(account.id) } });
          await prisma.accountRole.deleteMany({ where: { accountId: BigInt(account.id) } });
          await prisma.account.delete({ where: { id: BigInt(account.id) } });
          console.log(`  Deleted account: ${username} (id: ${account.id})`);
        } catch (err: any) {
          console.log(`  Error deleting ${username}: ${err.message}`);
        }
      }
    }

    // 2. Clean up test penduduk
    console.log('\n2. Cleaning up test penduduk...');
    const testNik = '327105%';
    const testPenduduks = await prisma.$queryRaw<any[]>`
      SELECT id FROM penduduk WHERE nik LIKE ${testNik};
    `;

    for (const住户 of testPenduduks) {
      try {
        await prisma.anggotaKeluarga.deleteMany({ where: { pendudukId: BigInt(住户.id) } });
        await prisma.penduduk.delete({ where: { id: BigInt(住户.id) } });
        console.log(`  Deleted penduduk id: ${住户.id}`);
      } catch (err: any) {
        console.log(`  Error: ${err.message}`);
      }
    }

    // 3. Clean up test keluarga
    console.log('\n3. Cleaning up test keluarga...');
    const testKeluarga = await prisma.$queryRaw<any[]>`
      SELECT id FROM keluarga WHERE no_kk LIKE ${testNik};
    `;

    for (const keluarga of testKeluarga) {
      try {
        await prisma.keluarga.delete({ where: { id: BigInt(keluarga.id) } });
        console.log(`  Deleted keluarga id: ${keluarga.id}`);
      } catch (err: any) {
        console.log(`  Error: ${err.message}`);
      }
    }

    // 4. Clean up test ADMIN role and permissions
    console.log('\n4. Cleaning up test roles and permissions...');

    // First delete role_permissions that reference the ADMIN role
    await prisma.$executeRawUnsafe(`
      DELETE FROM role_permission
      WHERE role_id IN (SELECT id FROM role WHERE name LIKE 'Admin%' OR name LIKE '%Test%');
    `);
    console.log('  Deleted role_permissions for test roles');

    // Delete test roles
    await prisma.$executeRawUnsafe(`
      DELETE FROM role WHERE name LIKE 'Admin%' OR name LIKE '%Test%';
    `);
    console.log('  Deleted test roles');

    // Clean up orphaned role_permissions (where role no longer exists)
    await prisma.$executeRawUnsafe(`
      DELETE FROM role_permission
      WHERE role_id NOT IN (SELECT id FROM role);
    `);
    console.log('  Cleaned orphaned role_permissions');

    // Clean up orphaned account_roles (where account no longer exists)
    await prisma.$executeRawUnsafe(`
      DELETE FROM account_role
      WHERE account_id NOT IN (SELECT id FROM account);
    `);
    console.log('  Cleaned orphaned account_roles');

    // Clean up orphaned internal_sessions (where account no longer exists)
    await prisma.$executeRawUnsafe(`
      DELETE FROM internal_session
      WHERE account_id NOT IN (SELECT id FROM account);
    `);
    console.log('  Cleaned orphaned internal_sessions');

    console.log('\n✅ Comprehensive cleanup complete!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveCleanup();
