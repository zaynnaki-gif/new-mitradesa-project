import { PrismaClient } from '@prisma/client';

async function verifyMigrationTable() {
  const prisma = new PrismaClient();

  try {
    console.log('Verifying _prisma_migrations table...\n');

    // Verify schema
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '_prisma_migrations'
      ORDER BY ordinal_position;
    `;
    console.log('Table schema:');
    for (const col of columns) {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    }
    console.log();

    // Verify data - cast id to text to avoid BigInt serialization
    const migrations = await prisma.$queryRaw<any[]>`
      SELECT
        id::text as id,
        checksum,
        finished_at::text as finished_at,
        migration_name,
        logs,
        rolled_back_at::text as rolled_back_at,
        started_at::text as started_at,
        applied_steps_count
      FROM "_prisma_migrations";
    `;
    console.log('Migration records:');
    console.log(JSON.stringify(migrations, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigrationTable();
