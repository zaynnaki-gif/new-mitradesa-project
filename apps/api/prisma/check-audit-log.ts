import { PrismaClient } from '@prisma/client';

async function checkAuditLogColumns() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking audit_log table columns...\n');

    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'audit_log'
      ORDER BY ordinal_position;
    `;

    console.log('Columns in audit_log:');
    columns.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

    // Check if actor_type exists
    const hasActorType = columns.find(c => c.column_name === 'actor_type');
    const hasActorTypeUpper = columns.find(c => c.column_name === 'actorType');

    console.log('\nactor_type exists:', !!hasActorType);
    console.log('actorType exists:', !!hasActorTypeUpper);

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogColumns();
