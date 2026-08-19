import { PrismaClient } from '@prisma/client';
import { load } from '@nodeplotlib/dotenv';

async function checkMigrationTable() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking _prisma_migrations table schema...\n');

    // Query the information schema to get column names
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = '_prisma_migrations'
      ORDER BY ordinal_position;
    `;

    console.log('Current columns in _prisma_migrations:');
    console.log(columns);
    console.log();

    // Expected columns for Prisma 5.x
    const expectedColumns = [
      'id',
      'checksum',
      'finished_at',
      'migration_name',
      'logs',
      'rolled_back_at',
      'started_at',
      'applied_steps_count'
    ];

    const columnNames = (columns as any[]).map(c => c.column_name);
    const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log('Missing columns:', missingColumns);
      console.log('\nAttempting to add missing columns...');

      // Add each missing column
      for (const col of missingColumns) {
        if (col === 'id') {
          // ID column - need special handling
          continue;
        } else if (col === 'started_at' || col === 'finished_at' || col === 'rolled_back_at') {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "${col}" TIMESTAMP(3);
          `);
          console.log(`  Added column: ${col}`);
        } else if (col === 'migration_name') {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "${col}" VARCHAR(255);
          `);
          console.log(`  Added column: ${col}`);
        } else if (col === 'checksum') {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "${col}" VARCHAR(255);
          `);
          console.log(`  Added column: ${col}`);
        } else if (col === 'logs') {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "${col}" TEXT;
          `);
          console.log(`  Added column: ${col}`);
        } else if (col === 'applied_steps_count') {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "_prisma_migrations" ADD COLUMN IF NOT EXISTS "${col}" INTEGER DEFAULT 0;
          `);
          console.log(`  Added column: ${col}`);
        }
      }

      console.log('\nRe-checking columns...');
      const updatedColumns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = '_prisma_migrations'
        ORDER BY ordinal_position;
      `;
      console.log('Updated columns:', updatedColumns);
    } else {
      console.log('All expected columns are present!');
    }

    // Also list existing migrations
    console.log('\nExisting migrations in _prisma_migrations:');
    const migrations = await prisma.$queryRaw`
      SELECT id, migration_name, started_at, finished_at, applied_steps_count
      FROM "_prisma_migrations";
    `;
    console.log(migrations);

  } catch (error) {
    console.error('Error:', error);
    // If table doesn't exist, try to create it
    if ((error as any).message?.includes('does not exist')) {
      console.log('\n_prisma_migrations table does not exist. Creating...');
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "_prisma_migrations" (
          "id" SERIAL PRIMARY KEY,
          "checksum" VARCHAR(255),
          "finished_at" TIMESTAMP(3),
          "migration_name" VARCHAR(255) NOT NULL,
          "logs" TEXT,
          "rolled_back_at" TIMESTAMP(3),
          "started_at" TIMESTAMP(3),
          "applied_steps_count" INTEGER DEFAULT 0
        );
      `);
      console.log('Created _prisma_migrations table!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkMigrationTable();
