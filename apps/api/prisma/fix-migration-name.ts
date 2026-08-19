import { PrismaClient } from '@prisma/client';

async function fixMigrationName() {
  const prisma = new PrismaClient();

  try {
    // Get all migrations in database
    const dbMigrations = await prisma.$queryRaw`
      SELECT id, migration_name, started_at, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY id;
    `;

    console.log('Current migrations in database:');
    console.log(JSON.stringify(dbMigrations, null, 2));
    console.log();

    // Correct migration name
    const correctName = '20260811000000_add_phase4_reference_tables';
    const corruptedName = '20260811000000_add_phase8n-4nREFERENCE_TABLES';

    // Check if there's a migration with the corrupted name
    const migrationWithCorruptedName = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations" WHERE migration_name LIKE '%phase%REFERENCE%';
    `;

    if (Array.isArray(migrationWithCorruptedName) && migrationWithCorruptedName.length > 0) {
      console.log('Found corrupted migration name. Attempting to fix...');
      console.log('From:', corruptedName);
      console.log('To:', correctName);

      // Update the migration name
      await prisma.$executeRawUnsafe(`
        UPDATE "_prisma_migrations"
        SET migration_name = '${correctName}'
        WHERE migration_name LIKE '%phase%REFERENCE%';
      `);
      console.log('Updated migration name!');

      // Verify
      const updatedMigration = await prisma.$queryRaw`
        SELECT id, migration_name, started_at, finished_at, applied_steps_count
        FROM "_prisma_migrations";
      `;
      console.log('\nUpdated migrations in database:');
      console.log(JSON.stringify(updatedMigration, null, 2));
    } else {
      console.log('No corrupted migration name found.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMigrationName();
