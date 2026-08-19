import { PrismaClient } from '@prisma/client';

async function createMissingEnums() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking for missing enums and creating if needed...\n');

    // Check what enums exist
    const enums = await prisma.$queryRaw<any[]>`
      SELECT typname as enum_name
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY typname;
    `;

    const existingNames = new Set(enums.map((e: any) => e.enum_name.toLowerCase()));
    console.log('Existing enum names:', Array.from(existingNames));

    // Create missing enums with correct names
    const enumsToCreate = [
      { name: 'AccountStatus', values: ['ACTIVE', 'INACTIVE'] },
      { name: 'VerificationStatus', values: ['PENDING', 'VERIFIED', 'EXPIRED', 'CANCELLED'] },
      { name: 'OtpStatus', values: ['ACTIVE', 'USED', 'EXPIRED'] },
      { name: 'ActorType', values: ['USER', 'SYSTEM', 'API'] },
      { name: 'ConfigType', values: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] }
    ];

    for (const enumDef of enumsToCreate) {
      const lowerName = enumDef.name.toLowerCase();
      if (existingNames.has(lowerName)) {
        console.log(`Enum ${enumDef.name} already exists (as ${lowerName}), skipping creation`);
      } else {
        console.log(`Creating enum ${enumDef.name}...`);
        try {
          const valuesStr = enumDef.values.map(v => `"${v}"`).join(', ');
          await prisma.$executeRawUnsafe(`CREATE TYPE "public"."${enumDef.name}" AS ENUM (${valuesStr});`);
          console.log(`  ✓ Created ${enumDef.name}`);
        } catch (err: any) {
          console.log(`  ✗ Error: ${err.message}`);
        }
      }
    }

    // Note: AuditAction needs special handling because it has many values
    console.log('\nChecking AuditAction...');
    if (!existingNames.has('auditaction')) {
      console.log('Creating AuditAction enum...');
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "public"."AuditAction" AS ENUM (
            'CREATE', 'UPDATE', 'DELETE', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT',
            'OTP_REQUESTED', 'OTP_VERIFIED', 'OTP_FAILED', 'SESSION_CREATED',
            'SESSION_EXPIRED', 'SESSION_REVOKED', 'ACCOUNT_DISABLED', 'ACCOUNT_ENABLED',
            'PASSWORD_CHANGED', 'REFERENCE_CREATED', 'REFERENCE_UPDATED', 'REFERENCE_DELETED',
            'REFERENCE_ACTIVATED', 'REFERENCE_DEACTIVATED', 'CONFIGURATION_CREATED',
            'CONFIGURATION_UPDATED', 'CONFIGURATION_DELETED'
          );
        `);
        console.log('  ✓ Created AuditAction');
      } catch (err: any) {
        console.log(`  ✗ Error: ${err.message}`);
      }
    } else {
      console.log('AuditAction already exists');
    }

    console.log('\nDone!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createMissingEnums();
