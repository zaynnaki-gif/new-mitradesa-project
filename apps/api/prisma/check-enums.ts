import { PrismaClient } from '@prisma/client';

async function checkEnums() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking PostgreSQL enums in database...\n');

    // Get all enums
    const enums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name, string_agg(enumlabel, ', ' ORDER BY enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;

    console.log('Enums in database:');
    if (enums.length === 0) {
      console.log('  No enums found!');
    } else {
      for (const e of enums) {
        console.log(`  ${e.enum_name}: ${e.enum_values}`);
      }
    }

    // Expected enums from schema
    const expectedEnums = [
      'AccountStatus',
      'VerificationStatus',
      'OtpStatus',
      'AuditAction',
      'ActorType',
      'ConfigType'
    ];

    console.log('\n--- Expected enums from schema ---');
    for (const name of expectedEnums) {
      const found = enums.find(e => e.enum_name === name);
      console.log(`  ${name}: ${found ? 'EXISTS' : 'MISSING'}`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEnums();
