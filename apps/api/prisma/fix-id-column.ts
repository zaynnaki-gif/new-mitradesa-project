import { PrismaClient } from '@prisma/client';

async function fixIdColumn() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking _prisma_migrations id column type...\n');

    // Get current column type
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = '_prisma_migrations'
      AND column_name = 'id';
    `;
    console.log('Current id column definition:');
    console.log(JSON.stringify(columns, null, 2));

    // Check if it's integer and we need to change to bigint
    if (columns.length > 0 && columns[0].data_type === 'integer') {
      console.log('\nChanging id column from INTEGER to BIGINT...');

      // Drop the sequence first
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "_prisma_migrations" ALTER COLUMN id TYPE BIGINT;
      `);
      console.log('Changed id column type to BIGINT!');

      // Verify
      const updatedColumns = await prisma.$queryRaw<any[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '_prisma_migrations'
        AND column_name = 'id';
      `;
      console.log('\nUpdated id column definition:');
      console.log(JSON.stringify(updatedColumns, null, 2));
    } else {
      console.log('id column is already BIGINT or not found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIdColumn();
