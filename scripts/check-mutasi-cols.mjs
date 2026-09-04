import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Checking mutasi_penduduk columns in DB...');
  const cols = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'mutasi_penduduk'
  `);
  console.log('Columns:', cols);
  await prisma.$disconnect();
}

run().catch(console.error);
