import { PrismaClient } from '@prisma/client';

async function renameAuditAction() {
  const prisma = new PrismaClient();

  try {
    console.log('Renaming auditaction to AuditAction...\n');

    // Check current enums
    const enums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;

    console.log('Current enums:');
    enums.forEach((e: any) => console.log(`  ${e.enum_name}`));

    // Rename auditaction to AuditAction
    if (enums.find(e => e.enum_name === 'auditaction')) {
      console.log('\nRenaming auditaction -> AuditAction...');
      await prisma.$executeRawUnsafe(`ALTER TYPE "auditaction" RENAME TO "AuditAction";`);
      console.log('  ✓ Renamed auditaction -> AuditAction');
    } else if (enums.find(e => e.enum_name === 'AuditAction')) {
      console.log('\nAuditAction already exists with correct name');
    }

    // Verify
    console.log('\nVerifying enums after rename:');
    const updatedEnums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;
    updatedEnums.forEach((e: any) => console.log(`  ${e.enum_name}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

renameAuditAction();
