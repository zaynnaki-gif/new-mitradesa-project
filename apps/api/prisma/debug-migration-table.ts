import { PrismaClient } from '@prisma/client';

async function debugMigrationTable() {
  const prisma = new PrismaClient();

  try {
    // Get all columns with their data
    console.log('Checking raw data in _prisma_migrations...\n');

    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM "_prisma_migrations";
    `;

    console.log('Raw result:');
    console.log(JSON.stringify(result, (_, v) => typeof v === "bigint" ? v.toString() : v, 2));
    console.log();

    // Check each column individually
    console.log('Checking each column individually:');

    const idResult = await prisma.$queryRaw<any[]>`
      SELECT id::text FROM "_prisma_migrations";
    `;
    console.log('id:', idResult);

    const nameResult = await prisma.$queryRaw<any[]>`
      SELECT migration_name::text FROM "_prisma_migrations";
    `;
    console.log('migration_name:', nameResult);

    const checksumResult = await prisma.$queryRaw<any[]>`
      SELECT checksum::text FROM "_prisma_migrations";
    `;
    console.log('checksum:', checksumResult);

    const startedAtResult = await prisma.$queryRaw<any[]>`
      SELECT started_at::text FROM "_prisma_migrations";
    `;
    console.log('started_at:', startedAtResult);

    const finishedAtResult = await prisma.$queryRaw<any[]>`
      SELECT finished_at::text FROM "_prisma_migrations";
    `;
    console.log('finished_at:', finishedAtResult);

    const appliedStepsResult = await prisma.$queryRaw<any[]>`
      SELECT applied_steps_count::text FROM "_prisma_migrations";
    `;
    console.log('applied_steps_count:', appliedStepsResult);

    // Try the exact query Prisma uses
    console.log('\nTrying Prisma-style query...');
    const prismaStyleResult = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      FROM "_prisma_migrations";
    `;
    console.log('Prisma-style result:', prismaStyleResult);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMigrationTable();
