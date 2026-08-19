import { PrismaClient } from '@prisma/client';

async function fixAuditLogColumns() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking and fixing audit_log column names...\n');

    // Check current columns
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'audit_log';
    `;

    const columnNames = columns.map(c => c.column_name);

    // Fix actor_type -> actorType
    if (columnNames.includes('actor_type') && !columnNames.includes('actorType')) {
      console.log('Renaming actor_type -> actorType...');
      await prisma.$executeRawUnsafe(`ALTER TABLE "audit_log" RENAME COLUMN "actor_type" TO "actorType";`);
      console.log('  ✓ Renamed actor_type -> actorType');
    }

    console.log('\nDone!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAuditLogColumns();
