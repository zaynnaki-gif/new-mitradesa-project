import { PrismaClient } from '@prisma/client';

async function fixEnumNames() {
  const prisma = new PrismaClient();

  try {
    console.log('Renaming PostgreSQL enums from lowercase to PascalCase...\n');
    console.log('This is required for Prisma to work correctly.\n');

    // Rename enums to match Prisma schema
    const renames = [
      { from: 'accountstatus', to: 'AccountStatus' },
      { from: 'verificationstatus', to: 'VerificationStatus' },
      { from: 'otpstatus', to: 'OtpStatus' },
      { from: 'actortype', to: 'ActorType' },
      { from: 'configtype', to: 'ConfigType' },
      // auditaction doesn't need renaming (mixed case already)
    ];

    for (const rename of renames) {
      console.log(`Renaming ${rename.from} -> ${rename.to}...`);
      try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "${rename.from}" RENAME TO "${rename.to}";`);
        console.log(`  ✓ Success`);
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          console.log(`  - Already exists as ${rename.to}`);
        } else if (err.message?.includes('does not exist')) {
          console.log(`  - ${rename.from} not found`);
        } else {
          console.log(`  ✗ Error: ${err.message}`);
        }
      }
    }

    // Verify
    console.log('\nVerifying enums after rename...');
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

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixEnumNames();
