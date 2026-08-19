import { PrismaClient } from '@prisma/client';

async function checkTableColumns() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking key table schemas...\n');

    // Check role table
    console.log('--- role table ---');
    const roleColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'role'
      ORDER BY ordinal_position;
    `;
    console.log('Columns:', roleColumns.map(c => c.column_name));

    // Check account table
    console.log('\n--- account table ---');
    const accountColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'account'
      ORDER BY ordinal_position;
    `;
    console.log('Columns:', accountColumns.map(c => c.column_name));

    // Check all tables
    console.log('\n--- All tables ---');
    const tables = await prisma.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    console.log('Tables:', tables.map(t => t.table_name));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableColumns();
