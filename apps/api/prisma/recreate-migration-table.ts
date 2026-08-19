import { PrismaClient } from '@prisma/client';

async function recreateMigrationTable() {
  const prisma = new PrismaClient();

  try {
    console.log('Recreating _prisma_migrations table with correct schema...\n');

    // Drop existing table
    console.log('Dropping existing _prisma_migrations table...');
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;`);
    console.log('Dropped.\n');

    // Create new table with correct schema
    console.log('Creating _prisma_migrations table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "_prisma_migrations" (
        "id" BIGSERIAL PRIMARY KEY,
        "checksum" VARCHAR(255),
        "finished_at" TIMESTAMP(3),
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP(3),
        "started_at" TIMESTAMP(3),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );
    `);
    console.log('Created new _prisma_migrations table.\n');

    // Verify schema
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '_prisma_migrations'
      ORDER BY ordinal_position;
    `;
    console.log('New table schema:');
    console.log(JSON.stringify(columns, null, 2));
    console.log();

    // Insert the migration record with correct checksum
    console.log('Inserting migration record...');
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        "checksum",
        "finished_at",
        "migration_name",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        '4a25a33035f1e63b0437a70ab931258d',
        NOW(),
        '20260811000000_add_phase4_reference_tables',
        NOW(),
        1
      );
    `);

    console.log('Migration record inserted.\n');

    // Verify data
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT * FROM "_prisma_migrations";
    `;
    console.log('Migration records:');
    console.log(JSON.stringify(migrations, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

recreateMigrationTable();
