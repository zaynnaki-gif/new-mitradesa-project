import { PrismaClient } from '@prisma/client';

async function cleanupTestAccounts() {
  const prisma = new PrismaClient();

  try {
    console.log('Cleaning up all test accounts...\n');

    // Find and delete all test accounts
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

    // Clean up role permissions that reference deleted roles
    console.log('\nCleaning up orphaned role permissions...');
    await prisma.$executeRawUnsafe(`
      DELETE FROM role_permission
      WHERE role_id NOT IN (SELECT id FROM role);
    `);
    console.log('  Cleaned orphaned role permissions');

    // Clean up orphaned account roles
    await prisma.$executeRawUnsafe(`
      DELETE FROM account_role
      WHERE account_id NOT IN (SELECT id FROM account);
    `);
    console.log('  Cleaned orphaned account roles');

    console.log('\nCleanup complete!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestAccounts();
