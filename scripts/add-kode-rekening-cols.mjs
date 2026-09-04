import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('Adding kode_rekening and apbdes_item_id to apbdes_item and kas_umum...');
  await prisma.$executeRawUnsafe(`
    ALTER TABLE apbdes_item ADD COLUMN IF NOT EXISTS kode_rekening VARCHAR(50);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE kas_umum ADD COLUMN IF NOT EXISTS kode_rekening VARCHAR(50);
  `);
  await prisma.$executeRawUnsafe(`
    ALTER TABLE kas_umum ADD COLUMN IF NOT EXISTS apbdes_item_id BIGINT;
  `);
  console.log('Columns added successfully.');
  await prisma.$disconnect();
}

run().catch(console.error);
