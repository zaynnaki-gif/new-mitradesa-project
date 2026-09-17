import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.account.findFirst({
    where: { username: 'admin' },
  });

  if (admin) {
    console.log('Admin user exists. Overwriting password to "admin"...');
    await prisma.account.update({
      where: { id: admin.id },
      data: { passwordHash: '$2b$10$zW0p6usTja3iF1/KxKu3tOwgs5saycHG0XkIOubfuvJV/.972DaGi' }
    });
    console.log('Admin password reset to "admin"');
  } else {
    console.log('Admin user does not exist. Creating it...');
    
    // Attempt to get roles
    const adminRole = await prisma.role.findFirst({ where: { code: 'SUPER_ADMIN' } });
    
    if (adminRole) {
      await prisma.account.create({
        data: {
          username: 'admin',
          email: 'admin@mitradesa.id',
          passwordHash: '$2b$10$zW0p6usTja3iF1/KxKu3tOwgs5saycHG0XkIOubfuvJV/.972DaGi',
          status: 'ACTIVE',
          accountRoles: {
            create: { roleId: adminRole.id }
          }
        },
      });
      console.log('Admin user created with role SUPER_ADMIN.');
    } else {
      console.log('Role SUPER_ADMIN does not exist, creating user without role connection...');
      await prisma.account.create({
        data: {
          username: 'admin',
          email: 'admin@mitradesa.id',
          passwordHash: '$2b$10$zW0p6usTja3iF1/KxKu3tOwgs5saycHG0XkIOubfuvJV/.972DaGi',
          status: 'ACTIVE'
        },
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
