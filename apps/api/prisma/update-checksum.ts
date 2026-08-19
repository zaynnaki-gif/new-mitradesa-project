import { PrismaClient } from '@prisma/client';

async function updateChecksum() {
  const prisma = new PrismaClient();

  try {
    console.log('Updating migration record with proper checksum...\n');

    // Update the checksum to the actual MD5 of the migration file
    const checksum = '4a25a33035f1e63b0437a70ab931258d';

    await prisma.$executeRawUnsafe(`
      UPDATE "_prisma_migrations"
      SET checksum = $1
      WHERE migration_name = '20260811000000_add_phase4_reference_tables';
    `, checksum);

    console.log('Checksum updated!');

    // Verify
    const result = await prisma.$queryRaw<any[]>`
      SELECT migration_name, checksum, applied_steps_count
      FROM "_prisma_migrations";
    `;
    console.log('\nUpdated migration record:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateChecksum();
