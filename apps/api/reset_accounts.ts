import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all existing accounts...');
  
  // Need to delete dependencies first if there are cascades that Prisma doesn't handle,
  // but Prisma deleteMany usually handles relations if configured, or we can just delete accounts.
  // We'll delete AccountRole first just to be safe.
  await prisma.accountRole.deleteMany({});
  await prisma.internalSession.deleteMany({});
  
  const deleteResult = await prisma.account.deleteMany({});
  console.log(`Deleted ${deleteResult.count} accounts.`);
  
  // Check if SUPER_ADMIN role exists
  let superAdminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
  
  if (!superAdminRole) {
    console.log('Role SUPER_ADMIN does not exist, creating it...');
    superAdminRole = await prisma.role.create({
      data: {
        code: 'SUPER_ADMIN',
        name: 'Super Administrator',
        description: 'Super Administrator Role'
      }
    });
  }

  console.log('Creating superadmin account...');
  await prisma.account.create({
    data: {
      username: 'superadmin',
      email: 'superadmin@mitradesa.id',
      passwordHash: '$2b$10$SjwVOnG6XQe.UpLEDJZDE.1lwCuTznjzvvR0rvElOZMfEWq/OhRMi',
      status: 'ACTIVE',
      accountRoles: {
        create: { roleId: superAdminRole.id }
      }
    },
  });
  
  console.log('Superadmin account created successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
