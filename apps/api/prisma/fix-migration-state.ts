import { PrismaClient } from '@prisma/client';

async function fixMigrationState() {
  const prisma = new PrismaClient();

  try {
    console.log('=== Fixing Migration State ===\n');

    // Check current state
    const currentMigrations = await prisma.$queryRaw<any[]>`
      SELECT * FROM "_prisma_migrations";
    `;
    console.log('Current migrations:');
    console.log(JSON.stringify(currentMigrations, null, 2));
    console.log();

    // Delete the corrupted migration record
    console.log('Deleting corrupted migration record...');
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20260811000000_add_phase4_reference_tables';
    `);
    console.log('Deleted migration record.\n');

    // Verify deletion
    const remainingMigrations = await prisma.$queryRaw<any[]>`
      SELECT * FROM "_prisma_migrations";
    `;
    console.log('Remaining migrations after deletion:');
    console.log(JSON.stringify(remainingMigrations, null, 2));

    console.log('\n=== Migration record deleted ===');
    console.log('You can now run: npx prisma migrate deploy');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrationState();
