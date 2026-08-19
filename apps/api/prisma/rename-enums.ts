import { PrismaClient } from '@prisma/client';

async function renameEnums() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking and renaming enums to match Prisma schema...\n');

    // List current enums
    const enums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;

    console.log('Current enums in database:');
    enums.forEach((e: any) => console.log(`  ${e.enum_name}`));
    console.log();

    // Mapping of lowercase to PascalCase
    const enumRenames: Record<string, string> = {
      'accountstatus': 'AccountStatus',
      'verificationstatus': 'VerificationStatus',
      'otpstatus': 'OtpStatus',
      'auditaction': 'AuditAction',
      'actortype': 'ActorType',
      'configtype': 'ConfigType'
    };

    // Rename each enum
    for (const [oldName, newName] of Object.entries(enumRenames)) {
      console.log(`Renaming ${oldName} to ${newName}...`);
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "${oldName}" RENAME TO "${newName}";`);
        console.log(`  ✓ Renamed ${oldName} to ${newName}`);
      } catch (err: any) {
        if (err.message?.includes('does not exist')) {
          console.log(`  - ${oldName} not found, skipping`);
        } else if (err.message?.includes('already exists')) {
          console.log(`  - ${newName} already exists, skipping`);
        } else {
          console.log(`  ✗ Error: ${err.message}`);
        }
      }
    }

    console.log('\nVerifying renamed enums...');
    const updatedEnums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;

    console.log('Updated enums in database:');
    updatedEnums.forEach((e: any) => console.log(`  ${e.enum_name}`));

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

renameEnums();
