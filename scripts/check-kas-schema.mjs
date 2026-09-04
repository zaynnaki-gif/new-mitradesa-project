import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'kas_umum';
  `;
  console.log('Columns in kas_umum:', cols);
}

main().finally(() => prisma.$disconnect());
