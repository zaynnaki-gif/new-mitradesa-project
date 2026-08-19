import { PrismaClient } from '@prisma/client';

async function fixColumnNames() {
  const prisma = new PrismaClient();

  try {
    console.log('Fixing column names to match Prisma schema...\n');

    // Rename role.code to role.role_code
    console.log('Checking role.code -> role.role_code...');
    const roleCodeExists = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'role' AND column_name = 'code';
    `;
    if (roleCodeExists.length > 0) {
      console.log('  Found role.code, renaming to role.role_code...');
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "role" RENAME COLUMN "code" TO "role_code";`);
        console.log('  ✓ Renamed role.code -> role.role_code');
      } catch (err: any) {
        console.log(`  ✗ Error: ${err.message}`);
      }
    }

    // Rename permission.code to permission.permission_code
    console.log('\nChecking permission.code -> permission.permission_code...');
    const permCodeExists = await prisma.$queryRaw<any[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'permission' AND column_name = 'code';
    `;
    if (permCodeExists.length > 0) {
      console.log('  Found permission.code, renaming to permission.permission_code...');
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "permission" RENAME COLUMN "code" TO "permission_code";`);
        console.log('  ✓ Renamed permission.code -> permission.permission_code');
      } catch (err: any) {
        console.log(`  ✗ Error: ${err.message}`);
      }
    }

    console.log('\nDone!');

  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixColumnNames();
