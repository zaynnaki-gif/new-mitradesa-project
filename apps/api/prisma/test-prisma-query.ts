import { PrismaClient } from '@prisma/client';

async function testPrismaQuery() {
  const prisma = new PrismaClient({
    log: ['query'],
  });

  try {
    console.log('Testing Prisma query on _prisma_migrations...\n');

    // Try to query using Prisma Client's $queryRaw
    const result = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        checksum,
        finished_at,
        migration_name,
        logs,
        rolled_back_at,
        started_at,
        applied_steps_count
      FROM "_prisma_migrations"
    `;

    console.log('Result:', JSON.stringify(result, null, 2));

  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaQuery();
