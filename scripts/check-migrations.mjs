import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.$queryRaw`
    SELECT id, migration_name, finished_at 
    FROM _prisma_migrations 
    ORDER BY finished_at ASC;
  `;
  console.log('Applied migrations in DB:', rows);
}

main().finally(() => prisma.$disconnect());
