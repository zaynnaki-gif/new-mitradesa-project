import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Adding desa_id column to mutasi_penduduk...');
  const result = await prisma.$executeRawUnsafe(`ALTER TABLE mutasi_penduduk ADD COLUMN IF NOT EXISTS desa_id BIGINT;`);
  console.log('Result:', result);
  await prisma.$disconnect();
}

run().catch(console.error);
