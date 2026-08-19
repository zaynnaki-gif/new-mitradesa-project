import { PrismaClient } from '@prisma/client';

async function checkTableSchema() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking ref_status_perkawinan table schema...\n');

    // Get column definitions
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'ref_status_perkawinan'
      ORDER BY ordinal_position;
    `;

    console.log('Database schema for ref_status_perkawinan:');
    for (const col of columns) {
      console.log(`  ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
    }

    // Check what data Prisma Client expects
    console.log('\nAttempting to upsert a test record...');

    try {
      await prisma.refStatusPerkawinan.upsert({
        where: { kode: 'TEST' },
        update: {},
        create: { kode: 'TEST', nama: 'Test Value' }
      });
      console.log('Upsert succeeded!');
    } catch (err: any) {
      console.log('Upsert failed:', err.message);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableSchema();
