import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`ALTER TABLE kas_umum ADD COLUMN IF NOT EXISTS desa_id BIGINT;`);
  console.log('Successfully added desa_id to kas_umum');
}

main().finally(() => prisma.$disconnect());
