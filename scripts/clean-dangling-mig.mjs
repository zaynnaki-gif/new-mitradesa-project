import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$executeRawUnsafe(`
    DELETE FROM _prisma_migrations WHERE finished_at IS NULL;
  `);
  console.log('Deleted rows:', result);
}

main().finally(() => prisma.$disconnect());
